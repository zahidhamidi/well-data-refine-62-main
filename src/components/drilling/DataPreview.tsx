import { useState } from "react";
import { Download, Eye } from "lucide-react";
import { DrillingData } from "./DrillingInterface";

type DataPreviewProps = {
  data: DrillingData;
  onExport: () => void;
};

export const DataPreview = ({ data, onExport }: DataPreviewProps) => {
  const [dataset, setDataset] = useState<"raw" | "formatted" | "mapped">("mapped");
  const [viewMode, setViewMode] = useState<"preview" | "full">("preview");

  // Decide which dataset to show
  const currentData =
    dataset === "raw" ? data.rawData || [] :
    dataset === "formatted" ? data.formattedData || [] :
    data.mappedData || data.data || [];

  const mappedHeaders =
    data.mappedColumns?.filter(col => col.mapped).map(col => ({
      original: col.original,
      mapped: col.mapped,
      unit: col.mappedUnit
    })) || [];

  const previewData = currentData.slice(0, 10);
  const displayData = viewMode === "preview" ? previewData : currentData;

  // CSV + LAS export remain same — use currentData
  const exportData = () => {
    const lasContent = generateLASContent(currentData, mappedHeaders);
    const blob = new Blob([lasContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.filename.split(".")[0]}_${dataset}.las`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onExport();
  };

  const generateLASContent = (rows: any[], headers: any[]) => {
    let content = "";

    // Use original LAS header if available
    if (data.originalLasHeader) {
      content = data.originalLasHeader + "\n";
    } else {
      content += `~Version Information\n`;
      content += `VERS.   2.0 : CWLS log ASCII Standard -VERSION 2.0\n`;
      content += `WRAP.    NO : One line per depth step\n`;
      content += `~Curve Information\n`;
      headers.forEach(h => {
        content += `${h.mapped}.${h.unit} : ${h.mapped}\n`;
      });
      content += `~ASCII\n`;
    }

    rows.forEach(row => {
      content += headers.map(h => row[h.mapped] ?? "").join("\t") + "\n";
    });

    return content;
  };

  return (
    <div className="space-y-6">


      <div className="bg-card border rounded-lg">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <h3 className="font-medium text-foreground flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            {dataset.charAt(0).toUpperCase() + dataset.slice(1)} Data Preview
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === "preview"
                  ? "bg-primary text-white"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              Preview (10 rows)
            </button>
            <button
              onClick={() => setViewMode("full")}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === "full"
                  ? "bg-primary text-white"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              Full ({currentData.length} rows)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-gray-800 text-white sticky top-0">
              <tr>
                {mappedHeaders.map((header, i) => (
                  <th key={i} className="px-4 py-3 text-left font-medium">
                    {header.mapped}
                    <div className="text-xs font-normal opacity-75">({header.unit})</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`${rowIndex % 2 === 0 ? "bg-background" : "bg-table-row-even"} hover:bg-table-row-hover`}
                >
                  {mappedHeaders.map((header, colIndex) => (
                    <td key={colIndex} className="px-4 py-2 text-sm">
                      {row[header.mapped] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={exportData}
          className="px-8 py-3 bg-success text-white rounded-md hover:bg-success/90 flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>LAS Export</span>
        </button>
        <button
          onClick={() => {
            const headers = mappedHeaders.map(h => h.mapped);
            const units = mappedHeaders.map(h => h.unit);
            const csvRows: string[] = [];
            csvRows.push(headers.join(","));
            csvRows.push(units.join(","));
            currentData.forEach(row => {
              const values = mappedHeaders.map(h => row[h.mapped] ?? "");
              csvRows.push(values.join(","));
            });
            const csvContent = csvRows.join("\n");
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data.filename.split(".")[0]}_${dataset}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="px-8 py-3 bg-primary text-white rounded-md hover:bg-primary-hover flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>CSV Export</span>
        </button>
      </div>
    </div>
  );
};
