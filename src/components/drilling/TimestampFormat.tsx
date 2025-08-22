import React, { useEffect, useRef, useState } from "react";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { DrillingData } from "./DrillingInterface";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { parse, format, fromUnixTime } from "date-fns";

type TimestampFormatProps = {
  data: DrillingData;
  onFormatComplete: (newData: DrillingData) => void;
};

export const TimestampFormat = ({ data, onFormatComplete }: TimestampFormatProps) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [inputFormat, setInputFormat] = useState<string | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattedDataPreview, setFormattedDataPreview] = useState<{ column: string; original: string; formatted: string }[]>([]);
  const [progress, setProgress] = useState(0);
  const [formattedTable, setFormattedTable] = useState<{ headers: string[]; data: any[] } | null>(null);

  const workerRef = useRef<Worker | null>(null);

  const formatOptions = [
    { label: "dd/MM/yyyy HH:mm:ss", value: "dd/MM/yyyy HH:mm:ss" },
    { label: "MM/dd/yyyy HH:mm:ss", value: "MM/dd/yyyy HH:mm:ss" },
    { label: "yyyy-MM-dd HH:mm:ss", value: "yyyy-MM-dd HH:mm:ss" },
    { label: "ISO 8601", value: "yyyy-MM-dd'T'HH:mm:ss'Z'" },
    { label: "yyyy/MM/dd HH:mm:ss", value: "yyyy/MM/dd HH:mm:ss" },
    { label: "dd-MM-yyyy HH:mm:ss", value: "dd-MM-yyyy HH:mm:ss" },
    { label: "UNIX Time (Seconds)", value: "unix-s" },
    { label: "Elapsed Time (Seconds)", value: "elapsed-s" },
    { label: "Elapsed Time (Minutes)", value: "elapsed-m" },
    { label: "TIME_1900 (Days since 1900)", value: "time-1900-d" },
    { label: "Elapsed Time from Midnight (Seconds)", value: "emdt-s" },
  ];

  // Detect format (same as you had)
  const detectFormat = (sampleValue: string): string | null => {
    const numericValue = parseFloat(sampleValue);
    if (!isNaN(numericValue)) {
      if (numericValue > 1000000000) return "unix-s";
      if (numericValue < 100000 && numericValue > 0) return "elapsed-s";
      if (numericValue > 40000) return "time-1900-d";
      if (numericValue > 0 && numericValue < 86400) return "emdt-s";
    }
    const stringFormats = formatOptions.filter(opt => !opt.value.includes("-"));
    for (const option of stringFormats) {
      try {
        const parsedDate = parse(sampleValue, option.value, new Date());
        if (!isNaN(parsedDate.getTime())) {
          return option.value;
        }
      } catch (e) {
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
        let originalValue = ts ?? "";
        let formattedTs: string = "Invalid Format";

        if (originalValue === "") {
          return { column, original: "No data available", formatted: "N/A" };
        }

        try {
          let parsedDate: Date;
          const numericValue = parseFloat(originalValue as any);
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
            default:
              parsedDate = parse(String(originalValue), formatValue, new Date());
              break;
          }
          if (!isNaN(parsedDate.getTime())) {
            formattedTs = format(parsedDate, "dd/MM/yyyy HH:mm:ss");
          }
        } catch (e) {
          // keep "Invalid Format"
        }

        return { column, original: String(originalValue), formatted: formattedTs };
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
          setFormattedTable({ headers: headers ?? data.headers, data: rows });
          setIsFormatting(false);

          // Build a DrillingData-like payload if you want to pass back to parent
          const updatedData: DrillingData = {
            ...data,
            data: rows,
            headers: headers ?? data.headers,
            auditResults: data.auditResults
              ? { ...data.auditResults, timestampFormat: "dd/MM/yyyy HH:mm:ss" }
              : { completeness: 0, conformity: false, continuity: false, timestampFormat: "dd/MM/yyyy HH:mm:ss" },
          };
          onFormatComplete(updatedData);

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
      {/* header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Timestamp Formatting</h2>
        <p className="text-muted-foreground">
          Select timestamp columns and their current format to standardize them to <strong>dd/MM/yyyy HH:mm:ss</strong>.
        </p>
      </div>

      {/* controls */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
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
            </h3>
            <Select onValueChange={handleInputFormatChange} value={inputFormat || ''} disabled={selectedColumns.length === 0}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose the original format..." />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => (
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
            {formattedDataPreview.map((item, index) => (
              <div key={index} className="grid grid-cols-3 gap-2">
                <div className="text-secondary-foreground">{item.column}</div>
                <div className="text-muted-foreground">{item.original || "No data available"}</div>
                <div className="text-success">{item.formatted}</div>
              </div>
            ))}
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
                          {row[cIdx] ?? ""}
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
      </div>
    </div>
  );
};
