import React, { useEffect, useRef, useState } from "react";
import { Calendar, Clock, ArrowRight, Info} from "lucide-react";
import { DrillingData } from "./DrillingInterface";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { parse, format, fromUnixTime, isMatch } from "date-fns";

function mergeDateTime(dateRaw: string, timeRaw: string): string {
    const dateNum = Number(dateRaw);
    const base = new Date("1899-12-30T00:00:00Z"); // Excel 1900 system base
    const dateObj = new Date(base.getTime() + dateNum * 86400000);

    if (timeRaw) {
      const [hh, mm, ss] = timeRaw.split(":").map(Number);
      dateObj.setHours(hh || 0, mm || 0, ss || 0, 0);
    }

    // format always dd/MM/yyyy HH:mm:ss
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(dateObj.getDate())}/${pad(dateObj.getMonth() + 1)}/${dateObj.getFullYear()} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
  }


type TimestampFormatProps = {
  data: DrillingData;
  onFormatComplete: (newData: DrillingData) => void;
};

export const TimestampFormat = ({ data, savedState, onSaveState, onFormatComplete }: TimestampFormatProps) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(savedState?.selectedColumns || []);
  const [inputFormat, setInputFormat] = useState<string | null>(savedState?.inputFormat || null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattedDataPreview, setFormattedDataPreview] = useState<{ column: string; original: string; formatted: string }[]>([]);
  const [progress, setProgress] = useState(0);
  const [formattedTable, setFormattedTable] = useState<{ headers: string[]; data: any[] } | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // when local state changes, push it up
  useEffect(() => {
    onSaveState({ selectedColumns, inputFormat });
  }, [selectedColumns, inputFormat]);

  const formatOptions = [
    { label: "dd/MM/yyyy HH:mm:ss", value: "dd/MM/yyyy HH:mm:ss", description: "Day/Month/Year 24-hour time", example: "06/06/2024 13:45:30" },
    { label: "MM/dd/yyyy HH:mm:ss", value: "MM/dd/yyyy HH:mm:ss", description: "Month/Day/Year 24-hour time", example: "06/07/2024 13:45:30" },
    { label: "yyyy-MM-dd HH:mm:ss", value: "yyyy-MM-dd HH:mm:ss", description: "ISO-like Year-Month-Day 24-hour time", example: "2024-06-06 13:45:30" },
    { label: "ISO 8601", value: "yyyy-MM-dd'T'HH:mm:ss'Z'", description: "Full ISO 8601 format", example: "2024-06-06T13:45:30Z" },
    { label: "yyyy/MM/dd HH:mm:ss", value: "yyyy/MM/dd HH:mm:ss", description: "Year/Month/Day 24-hour time", example: "2024/06/06 13:45:30" },
    { label: "dd-MM-yyyy HH:mm:ss", value: "dd-MM-yyyy HH:mm:ss", description: "Day-Month-Year 24-hour time", example: "06-12-2024 13:45:30" },
    { label: "dd-MM-yyyy HH:mm:ss", value: "MM-dd-yyyy HH:mm:ss", description: "Month-Day-Year 24-hour time", example: "12-06-2024 13:45:30" },
    { label: "UNIX Time (Seconds)", value: "unix-s", description: "Seconds since 1970-01-01", example: "1717680000 → 06/06/2024 00:00:00" },
    { label: "Elapsed Time (Seconds)", value: "elapsed-s", description: "Seconds offset from start well time", example: "3600 → +1 hour" },
    { label: "Elapsed Time (Minutes)", value: "elapsed-m", description: "Minutes offset from start well time", example: "60 → +1 hour" },
    { label: "TIME_1900 (Days since 1900)", value: "time-1900-d", description: "Excel-style days since 1900 (whole days)", example: "45460 → 06/06/2024" },
    { label: "Elapsed Time from Midnight (Seconds)", value: "emdt-s", description: "Seconds since today’s midnight", example: "45000 → 12:30:00" },
    { label: "Excel Serial DateTime (since 1900)", value: "excel-1900", description: "Excel serial with fractions of a day", example: "45460.059 → 06/06/2024 01:25:00" },
  ];


  // Detect format (same as you had)
  const detectFormat = (sampleValue: string): string | null => {
    if (!sampleValue || sampleValue.trim() === "") return null;

    const numericValue = parseFloat(sampleValue);

    // First handle numeric-based formats
    if (!isNaN(numericValue)) {
      if (sampleValue.includes(".")) {
        // fractional numbers → Excel style
        if (numericValue > 30000 && numericValue < 60000) return "excel-1900";
      }
      if (numericValue > 1000000000) return "unix-s";
      if (numericValue > 40000) return "time-1900-d";
      if (numericValue < 86400 && numericValue >= 0) return "emdt-s";
      if (numericValue < 100000 && numericValue > 0) return "elapsed-s";
    }

    // Try string-based formats from formatOptions
    for (const option of formatOptions) {
      try {
        const parsedDate = parse(sampleValue, option.value, new Date());
        if (!isNaN(parsedDate.getTime())) {
          return option.value;
        }
      } catch {
        continue;
      }
    }

    return null;
  };


  // Preview generation (uses same safe-access logic you already used)
  const updatePreview = (columns: string[], formatValue: string) => {
    const preview = columns.flatMap(column => {
      const columnIndex = data.headers.indexOf(column);
      if (columnIndex === -1) return [];

      const sampleTimestamps = data.data.slice(0, 2).map(row => {
        if (typeof row === "object" && !Array.isArray(row)) {
          return row[column] ?? "";
        } else if (Array.isArray(row)) {
          return row[columnIndex] ?? "";
        }
        return "";
      });

      return sampleTimestamps.map(ts => {
        // Always keep the untouched value for Original
        const rawOriginal = ts ?? "";

        let formattedTs: string = "Invalid Format";

        if (rawOriginal === "") {
          return { column, original: "No data available", formatted: "N/A" };
        }

        try {
          let parsedDate: Date;
          const numericValue = parseFloat(rawOriginal as any);
          switch (formatValue) {
            case "unix-s":
              parsedDate = fromUnixTime(numericValue);
              break;
            case "elapsed-s":
              parsedDate = new Date(data.originalLasHeader?.startWellTime || new Date());
              parsedDate.setSeconds(parsedDate.getSeconds() + numericValue);
              break;
            case "elapsed-m":
              parsedDate = new Date(data.originalLasHeader?.startWellTime || new Date());
              parsedDate.setMinutes(parsedDate.getMinutes() + numericValue);
              break;
            case "time-1900-d":
              const msSince1900 = numericValue * 24 * 60 * 60 * 1000;
              parsedDate = new Date(new Date("1900-01-01T00:00:00Z").getTime() + msSince1900);
              break;
            case "emdt-s":
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              parsedDate = new Date(today.getTime() + numericValue * 1000);
              break;
            case "excel-1900":
              const msSince1900Excel = numericValue * 24 * 60 * 60 * 1000;
              // Excel wrongly counts 1900 as leap year → adjust if needed
              const excelEpoch = new Date("1899-12-30T00:00:00Z"); 
              parsedDate = new Date(excelEpoch.getTime() + msSince1900Excel);
              break;

            default:
              parsedDate = parse(String(rawOriginal), formatValue, new Date());
              break;
          }
          if (!isNaN(parsedDate.getTime())) {
            formattedTs = format(parsedDate, "dd/MM/yyyy HH:mm:ss");
          }
        } catch (e) {
          // leave as "Invalid Format"
        }

        // 🔑 Use rawOriginal untouched for Original
        return { column, original: String(rawOriginal), formatted: formattedTs };
      });
    });


      setFormattedDataPreview(preview);
    };

  // Column change handler (auto-detect first selected column format)
  const handleColumnChange = (values: string[]) => {
    setSelectedColumns(values);
    setInputFormat(null);
    setFormattedTable(null); // clear previous formatted result when selection changes
    if (values.length > 0) {
      const firstSelectedColumn = values[0];
      const columnIndex = data.headers.indexOf(firstSelectedColumn);
      if (columnIndex !== -1 && data.data.length > 0) {
        const sampleRow = data.data[0];
        const sampleValue = (typeof sampleRow === "object" && !Array.isArray(sampleRow))
          ? sampleRow[firstSelectedColumn] ?? ""
          : Array.isArray(sampleRow)
          ? sampleRow[columnIndex] ?? ""
          : "";
        const suggestedFormat = detectFormat(String(sampleValue));
        if (suggestedFormat) {
          setInputFormat(suggestedFormat);
        }
      }
    }
  };

  const handleInputFormatChange = (value: string) => {
    setInputFormat(value);
  };

  // clean up worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);


  useEffect(() => {
    if (selectedColumns.length > 0 && inputFormat) {
      updatePreview(selectedColumns, inputFormat);
    } else {
      setFormattedDataPreview([]);
    }
  }, [selectedColumns, inputFormat, data]);

  const handleFormat = () => {
    if (selectedColumns.length === 0 || !inputFormat) {
      alert("Please select at least one timestamp column and its original format.");
      return;
    }

    setIsFormatting(true);
    setProgress(0);
    setFormattedTable(null);

    // Create worker using import.meta.url (works in Vite / modern bundlers)
    try {
      const worker = new Worker(new URL("../../workers/timestampWorker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;

      worker.onmessage = (ev: MessageEvent) => {
        const { type, progress: p, rows, headers } = ev.data as any;
        if (type === "progress") {
          setProgress(p);
        } else if (type === "done") {
        setProgress(100);

        // Always ensure headers are a safe array
        const safeHeaders = Array.isArray(headers) && headers.length > 0
          ? headers
          : Array.isArray(data.headers)
          ? data.headers
          : [];

        // Always ensure rows are a safe array
        const safeRows = Array.isArray(rows) ? rows : [];

        // ⬇️ FIX HERE: normalize rows into objects
        const updatedRows = safeRows.map((row) => {
          if (Array.isArray(row)) {
            const obj: Record<string, any> = {};
            safeHeaders.forEach((h, i) => {
              obj[h] = row[i];
            });
            return obj;
          }
          return row; // already an object
        });

        setFormattedTable({ headers: safeHeaders, data: updatedRows });

        setIsFormatting(false);

        // Build a fully safe DrillingData object
        const postFormattedTable: DrillingData = {
          filename: data.filename || "",
          headers: safeHeaders,
          data: updatedRows,   // ✅ always object rows
          units: Array.isArray(data.units) ? data.units : [],
          customerName: data.customerName || "",
          wellName: data.wellName || "",
          dataType: data.dataType || "time",
          originalLasHeader: data.originalLasHeader,
          auditResults: data.auditResults
            ? { ...data.auditResults, timestampFormat: "dd/MM/yyyy HH:mm:ss" }
            : { completeness: 0, conformity: false, continuity: false, timestampFormat: "dd/MM/yyyy HH:mm:ss" },
        };

        console.log("✅ Sending postFormattedTable to DrillingInterface:", postFormattedTable);

        // Don’t overwrite parent data, just keep local formattedTable
        onFormatComplete?.({
          ...data,
          headers: safeHeaders,
          data: updatedRows,
        });



        worker.terminate();
        workerRef.current = null;
      }

      };

      worker.onerror = (err) => {
        console.error("Worker error:", err);
        alert("Timestamp worker encountered an error. See console.");
        setIsFormatting(false);
        worker.terminate();
        workerRef.current = null;
      };

      worker.postMessage({
        rows: data.data,
        headers: data.headers,
        selectedColumns,
        inputFormat,
        startWellTime: data.originalLasHeader?.startWellTime,
      });
    } catch (err) {
      console.error("Failed to create worker:", err);
      alert("Failed to start worker. Make sure your bundler supports web workers via `new Worker(new URL(...))` (Vite recommended).");
      setIsFormatting(false);
    }
  };

  return (
    <div className="space-y-6">


      {/* controls */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-medium text-foreground mb-2 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Select Timestamp Column(s)
            </h3>
            <MultiSelect
              options={data.headers.map(header => ({ label: header, value: header }))}
              selectedValues={selectedColumns}
              onSelect={handleColumnChange}
              placeholder="Choose column(s)..."
            />
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-2 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Select Original Format
              <button
                type="button"
                onClick={() => setShowInfo(true)}
                className="ml-2 text-muted-foreground hover:text-foreground"
              >
                <Info className="w-4 h-4" />
              </button>
            </h3>
            <Select onValueChange={handleInputFormatChange} value={inputFormat || ''} disabled={selectedColumns.length === 0}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose the original format..." />
              </SelectTrigger>
              <SelectContent>
                {formatOptions
                  .slice() // make a copy so we don’t mutate original
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* preview + action */}
      {selectedColumns.length > 0 && inputFormat && (
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center space-x-4 text-sm mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Selected Column(s):</span>
              <span className="font-medium bg-secondary/10 text-secondary-foreground px-2 py-1 rounded">
                {selectedColumns.join(', ')}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Target Format:</span>
              <span className="font-medium bg-primary/10 text-primary-foreground px-2 py-1 rounded">
                dd/MM/yyyy HH:mm:ss
              </span>
            </div>
          </div>

          <h4 className="font-medium text-foreground mb-2">Formatting Preview</h4>
          <div className="bg-muted rounded p-3 space-y-1 text-sm font-mono">
            <div className="grid grid-cols-3 gap-2 text-muted-foreground">
              <div>Column</div>
              <div>Original</div>
              <div>Formatted</div>
            </div>
            {selectedColumns.length > 1 ? (
              // merge DATE + TIME into one preview row
              (() => {
                const dateCol = selectedColumns[0];
                const timeCol = selectedColumns[1];

                const dateIndex = data.headers.indexOf(dateCol);
                const timeIndex = data.headers.indexOf(timeCol);

                // just preview the first 2 rows
                return data.data.slice(0, 2).map((row, idx) => {
                  const dateRaw = Array.isArray(row) ? row[dateIndex] : (row as any)[dateCol];
                  const timeRaw = Array.isArray(row) ? row[timeIndex] : (row as any)[timeCol];
                  const merged = mergeDateTime(String(dateRaw ?? ""), String(timeRaw ?? ""));

                  return (
                    <div key={idx} className="grid grid-cols-3 gap-2">
                      <div className="text-secondary-foreground">{`${dateCol}+${timeCol}`}</div>
                      <div className="text-muted-foreground">
                        {String(dateRaw ?? "")} {String(timeRaw ?? "")}
                      </div>
                      <div className="text-success">{merged}</div>
                    </div>
                  );
                });
              })()
            ) : (
              // default: one row per column
              formattedDataPreview.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-2">
                  <div className="text-secondary-foreground">{item.column}</div>
                  <div className="text-muted-foreground">{item.original || "No data available"}</div>
                  <div className="text-success">{item.formatted}</div>
                </div>
              ))
            )}

          </div>
        </div>
      )}

      {/* action + progress */}
      <div className="flex justify-center flex-col items-center">
        <Button
          onClick={handleFormat}
          disabled={isFormatting || selectedColumns.length === 0 || !inputFormat}
          className="px-6 py-2"
        >
          {isFormatting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Formatting Timestamps...</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 mr-2" />
              <span>Apply Timestamp Formatting</span>
            </>
          )}
        </Button>

        {isFormatting && (
          <div className="w-full max-w-sm mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-1">{progress}% Complete</p>
          </div>
        )}
      </div>

      {/* BEFORE / AFTER tables */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <div>
          <h3 className="font-medium mb-2">Original Data (first 5 rows)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-border text-sm">
              <thead className="bg-blue-600 text-white sticky top-0">
                <tr>
                  {data.headers.map((header, idx) => (
                    <th key={idx} className="px-2 py-1 border border-border text-center">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.slice(0, 5).map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-background" : "bg-table-row-even"}>
                    {data.headers.map((header, cIdx) => (
                      <td key={cIdx} className="px-2 py-1 border border-border text-center">
                        {typeof row === "object" && !Array.isArray(row) ? (row[header] ?? "") : (Array.isArray(row) ? (row[cIdx] ?? "") : "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Formatted Data (first 5 rows)</h3>
          <div className="overflow-x-auto">
            {formattedTable ? (
              <table className="min-w-full border border-border text-sm">
                <thead className="bg-green-600 text-white sticky top-0">
                  <tr>
                    {formattedTable.headers.map((h, i) => (
                      <th key={i} className="px-2 py-1 border border-border text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formattedTable.data.slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-background" : "bg-table-row-even"}>
                      {formattedTable.headers.map((h, cIdx) => (
                        <td key={cIdx} className="px-2 py-1 border border-border text-center">
                          {typeof row === "object" && !Array.isArray(row) ? row[h] ?? "" : ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted-foreground">Run formatting to see results.</p>
            )}
          </div>
        </div>
        {showInfo && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6">
              <h2 className="text-xl font-bold mb-4">Timestamp Format Help</h2>

              <table className="min-w-full border border-gray-300 text-sm mb-4">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-1 text-left">Format</th>
                    <th className="border px-3 py-1 text-left">Description</th>
                    <th className="border px-3 py-1 text-left">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {formatOptions
                    .slice()
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map((opt) => (
                      <tr key={opt.value}>
                        <td className="border px-3 py-1">{opt.label}</td>
                        <td className="border px-3 py-1">{opt.description}</td>
                        <td className="border px-3 py-1">{opt.example}</td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowInfo(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};
