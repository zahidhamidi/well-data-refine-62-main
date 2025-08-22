/// <reference lib="webworker" />
import { parse, format } from "date-fns";

type WorkerMessage = {
  rows: any[];
  headers: string[];
  selectedColumns: string[];
  inputFormat: string;
  startWellTime?: string | Date;
};

const OUTPUT_FORMAT = "dd/MM/yyyy HH:mm:ss";

function toNumber(value: any) {
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function convertTimestamp(value: any, formatType: string, startWellTime?: string | Date) {
  if (value === null || value === undefined || value === "") return value === "" ? "" : value;

  try {
    let date: Date | null = null;
    const numeric = toNumber(value);

    switch (formatType) {
      case "unix-s":
        if (numeric === null) return String(value);
        date = new Date(numeric * 1000);
        break;
      case "elapsed-s":
        if (numeric === null || !startWellTime) return String(value);
        date = new Date(new Date(startWellTime).getTime() + numeric * 1000);
        break;
      case "elapsed-m":
        if (numeric === null || !startWellTime) return String(value);
        date = new Date(new Date(startWellTime).getTime() + numeric * 60 * 1000);
        break;
      case "time-1900-d":
        if (numeric === null) return String(value);
        date = new Date(1900, 0, 1);
        date.setDate(date.getDate() + numeric);
        break;
      case "emdt-s":
        if (numeric === null || !startWellTime) return String(value);
        // elapsed from midnight -> use startWellTime as reference if provided, otherwise today
        const base = startWellTime ? new Date(startWellTime) : new Date();
        base.setHours(0, 0, 0, 0);
        date = new Date(base.getTime() + numeric * 1000);
        break;
      case "dd/MM/yyyy HH:mm:ss":
        date = parse(String(value), "dd/MM/yyyy HH:mm:ss", new Date());
        break;
      default:
        // unknown format: return original
        return String(value);
    }

    if (date && !isNaN(date.getTime())) {
      return format(date, OUTPUT_FORMAT);
    }
    return String(value);
  } catch {
    return String(value);
  }
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { rows, headers, selectedColumns, inputFormat, startWellTime } = e.data;
  const total = rows.length;
  const updatedRows: any[] = [];

  for (let i = 0; i < total; i++) {
    const row = rows[i];
    // Build a new row-array (fast predictable layout)
    const newRow: any[] = new Array(headers.length);

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const header = headers[colIndex];

      // prefer object key if row is object, otherwise assume array index
      const raw = (row && typeof row === "object" && !Array.isArray(row)) ? (row[header]) : (Array.isArray(row) ? row[colIndex] : undefined);

      if (selectedColumns.includes(header)) {
        newRow[colIndex] = convertTimestamp(raw, inputFormat, startWellTime);
      } else {
        newRow[colIndex] = raw === undefined ? "" : raw;
      }
    }

    updatedRows.push(newRow);

    // post progress every 500 rows (tweak as needed)
    if ((i % 500) === 0) {
      self.postMessage({ type: "progress", progress: Math.round((i / total) * 100) });
    }
  }

  self.postMessage({ type: "done", rows: updatedRows, headers });
};
