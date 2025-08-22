import { useState, useEffect } from "react";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { DrillingData } from "./DrillingInterface";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parse, format, fromUnixTime } from "date-fns";
import { MultiSelect } from "@/components/ui/MultiSelect";

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

  const formatOptions = [
    { label: "dd/MM/yyyy HH:mm:ss", value: "dd/MM/yyyy HH:mm:ss", example: "15/08/2024 14:30:00" },
    { label: "MM/dd/yyyy HH:mm:ss", value: "MM/dd/yyyy HH:mm:ss", example: "08/15/2024 14:30:00" },
    { label: "yyyy-MM-dd HH:mm:ss", value: "yyyy-MM-dd HH:mm:ss", example: "2024-08-15 14:30:00" },
    { label: "ISO 8601", value: "yyyy-MM-dd'T'HH:mm:ss'Z'", example: "2024-08-15T14:30:00Z" },
    { label: "yyyy/MM/dd HH:mm:ss", value: "yyyy/MM/dd HH:mm:ss", example: "2024/08/15 14:30:00" },
    { label: "dd-MM-yyyy HH:mm:ss", value: "dd-MM-yyyy HH:mm:ss", example: "15-08-2024 14:30:00" },
    { label: "UNIX Time (Seconds)", value: "unix-s", example: "1672531200" },
    { label: "Elapsed Time (Seconds)", value: "elapsed-s", example: "3600" },
    { label: "Elapsed Time (Minutes)", value: "elapsed-m", example: "60" },
    { label: "TIME_1900 (Days since 1900)", value: "time-1900-d", example: "44059" },
    { label: "Elapsed Time from Midnight (Seconds)", value: "emdt-s", example: "50400" },
  ];

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
        let originalValue = ts || "";
        let formattedTs: string = "Invalid Format";

        if (originalValue === "") {
          return { column, original: "No data available", formatted: "N/A" };
        }

        try {
          let parsedDate: Date;
          const numericValue = parseFloat(originalValue);
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
              parsedDate = parse(originalValue, formatValue, new Date());
              break;
          }
          if (!isNaN(parsedDate.getTime())) {
            formattedTs = format(parsedDate, "dd/MM/yyyy HH:mm:ss");
          }
        } catch (e) {
          // keep "Invalid Format"
        }

        return { column, original: originalValue, formatted: formattedTs };
      });
    });

    setFormattedDataPreview(preview);
  };


  const processBatch = (rows: any[], start: number, batchSize: number, updatedData: DrillingData) => {
    const end = Math.min(start + batchSize, rows.length);
    for (let i = start; i < end; i++) {
      const newRow = [...rows[i]];
      selectedColumns.forEach(column => {
        const columnIndex = updatedData.headers.indexOf(column);
        if (columnIndex !== -1) {
          const originalValue = rows[i][columnIndex];
          try {
            let parsedDate: Date;
            const numericValue = parseFloat(originalValue);
            switch (inputFormat) {
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
                const daysSince1900 = numericValue;
                const msSince1900 = daysSince1900 * 24 * 60 * 60 * 1000;
                const referenceDate1900 = new Date("1900-01-01T00:00:00Z");
                parsedDate = new Date(referenceDate1900.getTime() + msSince1900);
                break;
              case "emdt-s":
                const secondsSinceMidnight = numericValue;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                parsedDate = new Date(today.getTime() + secondsSinceMidnight * 1000);
                break;
            default:
                parsedDate = parse(originalValue, inputFormat!, new Date());
                break;
            }
            if (!isNaN(parsedDate.getTime())) {
              newRow[columnIndex] = format(parsedDate, "dd/MM/yyyy HH:mm:ss");
            } else {
              newRow[columnIndex] = originalValue;
            }
          } catch (e) {
            newRow[columnIndex] = originalValue;
          }
        }
      });
      updatedData.data[i] = newRow;
    }
    setProgress(Math.round(((end) / rows.length) * 100));
    if (end < rows.length) {
      setTimeout(() => processBatch(rows, end, batchSize, updatedData), 0);
    } else {
      updatedData.auditResults = updatedData.auditResults 
        ? { ...updatedData.auditResults, timestampFormat: "dd/MM/yyyy HH:mm:ss" }
        : { completeness: 0, conformity: false, continuity: false, timestampFormat: "dd/MM/yyyy HH:mm:ss" };
      setIsFormatting(false);
      onFormatComplete(updatedData);
    }
  };

  const handleFormat = () => {
    if (selectedColumns.length === 0 || !inputFormat) {
      alert("Please select at least one timestamp column and its original format.");
      return;
    }
    setIsFormatting(true);
    setProgress(0);
    const updatedData = { ...data, data: [...data.data.map(row => [...row])] };
    const batchSize = 1000;
    processBatch(data.data, 0, batchSize, updatedData);
  };

  const handleColumnChange = (values: string[]) => {
    setSelectedColumns(values);
    setInputFormat(null);
    if (values.length > 0) {
      const firstSelectedColumn = values[0];
      const columnIndex = data.headers.indexOf(firstSelectedColumn);
      if (columnIndex !== -1 && data.data.length > 0) {
        const sampleValue = data.data[0][columnIndex];
        const suggestedFormat = detectFormat(sampleValue);
        if (suggestedFormat) {
          setInputFormat(suggestedFormat);
        }
      }
    }
  };

  const handleInputFormatChange = (value: string) => {
    setInputFormat(value);
  };

  useEffect(() => {
    if (selectedColumns.length > 0 && inputFormat) {
      updatePreview(selectedColumns, inputFormat);
    } else {
      setFormattedDataPreview([]);
    }
  }, [selectedColumns, inputFormat, data]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Timestamp Formatting
        </h2>
        <p className="text-muted-foreground">
          Select timestamp columns and their current format to standardize them to <strong>dd/MM/yyyy HH:mm:ss</strong>.
        </p>
      </div>
      <div className="bg-card border rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-2">
          Initial Data Preview
        </h4>
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full border border-border text-sm">
            <thead className="bg-blue-600 text-white sticky top-0">
              <tr>
                {data.headers.map((header, idx) => (
                  <th key={idx} className="px-2 py-1 border border-border text-center">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.slice(0, 2).map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-background" : "bg-table-row-even"}>
                  {data.headers.map((header, colIndex) => (
                    <td key={colIndex} className="px-2 py-1 border border-border text-center">
                      {typeof row === "object" && !Array.isArray(row)
                        ? row[header] ?? "" 
                        : Array.isArray(row)
                        ? row[colIndex] ?? "" 
                        : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
    </div>
  );
};