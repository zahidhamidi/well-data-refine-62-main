// timestampWorker.ts
// Worker expects message: { rows, headers, selectedColumns, inputFormat, startWellTime }
// It returns progress messages and final: { type: 'done', progress: 100, rows, headers }

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

function parseExcelSerial(serial: number): Date {
  return new Date(new Date("1899-12-30T00:00:00Z").getTime() + serial * 86400000);
}

function parseTimePart(value: any) {
  if (value == null || value === "") return { h: 0, m: 0, s: 0 };
  const s = String(value).trim();

  if (/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(s)) {
    const [hh, mm, ss] = s.split(":").map((x) => parseInt(x, 10) || 0);
    return { h: hh, m: mm, s: ss };
  }

  const asNum = Number(s);
  if (!Number.isNaN(asNum)) {
    if (asNum > 0 && asNum < 1) {
      const totalSeconds = Math.round(asNum * 86400);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const sec = totalSeconds % 60;
      return { h, m, s: sec };
    }

    if (asNum >= 0 && asNum < 86400) {
      const h = Math.floor(asNum / 3600);
      const m = Math.floor((asNum % 3600) / 60);
      const sec = Math.floor(asNum % 60);
      return { h, m, s: sec };
    }
  }

  return { h: 0, m: 0, s: 0 };
}

function parseByFormatString(str: string, format: string): Date | null {
  if (!str) return null;
  str = String(str).trim();
  if (!format) {
    const parsed = Date.parse(str);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  }

  if (format.includes("T") || format.includes("Z") || format.startsWith("yyyy-")) {
    const parsed = Date.parse(str);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  }

  const [fmtDatePart = "", fmtTimePart = ""] = format.split(" ");
  const [strDatePart = "", strTimePart = ""] = str.split(" ");

  const dateSep = fmtDatePart.includes("/") ? "/" : fmtDatePart.includes("-") ? "-" : "/";
  const fmtDateTokens = fmtDatePart.split(dateSep).filter(Boolean);
  const strDateTokens = strDatePart.split(dateSep).filter(Boolean);

  if (fmtDateTokens.length === strDateTokens.length && fmtDateTokens.length > 0) {
    let day = 1,
      month = 1,
      year = 1970;
    for (let i = 0; i < fmtDateTokens.length; i++) {
      const tk = fmtDateTokens[i];
      const val = parseInt(strDateTokens[i], 10);
      if (Number.isNaN(val)) return null;
      if (tk.includes("d")) day = val;
      else if (tk.includes("M")) month = val;
      else if (tk.includes("y")) year = val;
    }

    let hh = 0,
      mm = 0,
      ss = 0;
    if (fmtTimePart && strTimePart) {
      const tParts = strTimePart.split(":");
      hh = parseInt(tParts[0] || "0", 10) || 0;
      mm = parseInt(tParts[1] || "0", 10) || 0;
      ss = parseInt(tParts[2] || "0", 10) || 0;
    }

    if (year < 100) {
      year += year >= 70 ? 1900 : 2000;
    }

    const dt = new Date(year, month - 1, day, hh, mm, ss, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const parsed = Date.parse(str);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function parseToDate(raw: any, format: string | undefined, startWellTime?: any): Date | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const s = String(raw).trim();
  const numeric = Number(s);

  if (!Number.isNaN(numeric)) {
    if (Number.isInteger(numeric) && numeric > 30000) {
      return parseExcelSerial(numeric);
    }

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
        return new Date(new Date("1900-01-01T00:00:00Z").getTime() + numeric * 86400000);
      }
      case "excel-1900": {
        return parseExcelSerial(numeric);
      }
      case "emdt-s": {
        const midnight = new Date();
        midnight.setHours(0, 0, 0, 0);
        return new Date(midnight.getTime() + numeric * 1000);
      }
      default:
        if (numeric >= 0 && numeric < 86400) {
          const base = startWellTime ? new Date(startWellTime) : new Date();
          return new Date(base.getTime() + numeric * 1000);
        }
        return null;
    }
  }

  if (/^\d{1,2}:\d{2}:\d{2}$/.test(s) && (!format || format.indexOf("dd") === -1)) {
    const [h, m, sec] = s.split(":").map((x) => parseInt(x, 10) || 0);
    const today = new Date();
    today.setHours(h, m, sec, 0);
    return today;
  }

  const byFormat = format ? parseByFormatString(s, format) : null;
  if (byFormat) return byFormat;

  const parsed = Date.parse(s);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

self.onmessage = function (ev: MessageEvent) {
  try {
    const { rows, headers, selectedColumns, inputFormat, startWellTime } = ev.data || {};
    if (!rows || !headers || !Array.isArray(headers)) {
      throw new Error("Worker received invalid message shape. Expected { rows, headers, selectedColumns, inputFormat, startWellTime }");
    }

    const outHeaders = [...headers];
    const outRows: any[] = [];
    const selectedIdx = (Array.isArray(selectedColumns) ? selectedColumns : [])
      .map((c: string) => headers.indexOf(c))
      .filter((i) => i >= 0);

    const rowsAreArray = rows.length > 0 && Array.isArray(rows[0]);

    if (selectedIdx.length >= 2) {
      const dateIdx = selectedIdx[0];
      const timeIdx = selectedIdx[1];

      for (let i = 0; i < rows.length; i++) {
        const rawRow = rows[i];
        let workingArray: any[] = [];
        let workingObj: Record<string, any> | null = null;

        if (rowsAreArray) {
          workingArray = Array.isArray(rawRow) ? rawRow.map((c) => (c === undefined ? "" : c)) : headers.map((h) => (rawRow && rawRow[h] !== undefined ? rawRow[h] : ""));
        } else {
          workingObj = rawRow && typeof rawRow === "object" ? { ...rawRow } : {};
          workingArray = headers.map((h) => (rawRow && rawRow[h] !== undefined ? rawRow[h] : ""));
        }

        const dateRaw = workingArray[dateIdx];
        const timeRaw = workingArray[timeIdx];

        const datePart = parseToDate(dateRaw, inputFormat, startWellTime);
        const { h, m, s } = parseTimePart(timeRaw);

        if (datePart) {
          datePart.setHours(h, m, s, 0);
          const formatted = fmt(datePart);

          if (rowsAreArray) {
            workingArray[dateIdx] = formatted;
          } else {
            workingObj![headers[dateIdx]] = formatted;
          }
        }

        outRows.push(rowsAreArray ? workingArray : workingObj);
        if (i % 100 === 0) {
          (self as any).postMessage({ type: "progress", progress: Math.round((i / rows.length) * 100) });
        }
      }
    } else {
      for (let i = 0; i < rows.length; i++) {
        const rawRow = rows[i];
        let workingArray: any[] = [];
        let workingObj: Record<string, any> | null = null;

        if (rowsAreArray) {
          workingArray = Array.isArray(rawRow) ? rawRow.map((c) => (c === undefined ? "" : c)) : headers.map((h) => (rawRow && rawRow[h] !== undefined ? rawRow[h] : ""));
        } else {
          workingObj = rawRow && typeof rawRow === "object" ? { ...rawRow } : {};
          workingArray = headers.map((h) => (rawRow && rawRow[h] !== undefined ? rawRow[h] : ""));
        }

        for (const colIdx of selectedIdx) {
          const raw = workingArray[colIdx];
          const d = parseToDate(raw, inputFormat, startWellTime);
          if (d && !isNaN(d.getTime())) {
            const formatted = fmt(d);
            if (rowsAreArray) workingArray[colIdx] = formatted;
            else workingObj![headers[colIdx]] = formatted;
          }
        }

        outRows.push(rowsAreArray ? workingArray : workingObj);

        if (i % 100 === 0) {
          (self as any).postMessage({ type: "progress", progress: Math.round((i / rows.length) * 100) });
        }
      }
    }

    (self as any).postMessage({ type: "done", progress: 100, rows: outRows, headers: outHeaders });
  } catch (err) {
    (self as any).postMessage({ type: "error", error: String(err && (err as Error).stack ? (err as Error).stack : err) });
    console.error("timestampWorker error:", err);
    throw err;
  }
};
