const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

function parseToDate(raw: any, format: string, startWellTime?: any): Date | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const str = String(raw).trim();
  const numeric = Number(str);

  if (!Number.isNaN(numeric)) {
    switch (format) {
      case "unix-s":
        return new Date(numeric * 1000);
      case "elapsed-s": {
        const base = startWellTime ? new Date(startWellTime) : new Date();
        return new Date(base.getTime() + numeric * 1000);
      }
      case "elapsed-m": {
        const base = startWellTime ? new Date(startWellTime) : new Date();
        return new Date(base.getTime() + numeric * 60000);
      }
      case "time-1900-d": {
        const ms = numeric * 86400000;
        return new Date(new Date("1900-01-01T00:00:00Z").getTime() + ms);
      }
      case "excel-1900": {
        const ms = numeric * 86400000;
        return new Date(new Date("1899-12-30T00:00:00Z").getTime() + ms);
      }
      case "emdt-s": {
        const midnight = new Date();
        midnight.setHours(0, 0, 0, 0);
        return new Date(midnight.getTime() + numeric * 1000);
      }
    }
  }

  // fallback parse
  const parsed = Date.parse(str);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

self.onmessage = (e: MessageEvent) => {
  const { rows, headers, selectedColumns, inputFormat, startWellTime } = e.data;

  const selectedIdx = selectedColumns.map((c: string) => headers.indexOf(c)).filter((i) => i >= 0);
  const outRows: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    // Always create a fresh copy so we don’t mutate original dataset
    const row = Array.isArray(rows[i])
      ? rows[i].map((cell: any) => (cell !== undefined ? String(cell) : ""))
      : headers.map((h: string) => (rows[i] && rows[i][h] !== undefined ? String(rows[i][h]) : ""));


    for (const colIdx of selectedIdx) {
      const raw = row[colIdx];
      const d = parseToDate(raw, inputFormat, startWellTime);
      if (d && !isNaN(d.getTime())) {
        row[colIdx] = fmt(d); // ✅ overwrite with formatted string
      }
    }

    outRows.push(row);

    if (i % 100 === 0) {
      (self as any).postMessage({ type: "progress", progress: Math.round((i / rows.length) * 100) });
    }
  }

  (self as any).postMessage({ type: "done", progress: 100, rows: outRows, headers });
};
