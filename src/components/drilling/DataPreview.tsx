import { useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import { DrillingData } from "./DrillingInterface";

type DataPreviewProps = {
  data: DrillingData;
  onExport: () => void;
};

export const DataPreview = ({ data, onExport }: DataPreviewProps) => {
  const [viewMode, setViewMode] = useState<'preview' | 'full'>('preview');

  const mappedHeaders = data.mappedColumns?.filter(col => col.mapped).map(col => ({
    original: col.original,
    mapped: col.mapped,
    unit: col.mappedUnit
  })) || [];

  const previewData = data.data.slice(0, 10);
  const displayData = viewMode === 'preview' ? previewData : data.data;

  const exportData = () => {
    // Create LAS content directly from data.data
    const lasContent = generateLASContent(data.data, mappedHeaders);

    // Download file
    const blob = new Blob([lasContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.filename.split('.')[0]}_mapped.las`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onExport();
  };

  const generateLASContent = (rows: any[], headers: any[]) => {
    let content = '';

    // Use original LAS header if available
    if (data.originalLasHeader) {
      content = data.originalLasHeader + '\n';

      // Update well information in header if provided
      if (data.customerName || data.wellName) {
        const lines = content.split('\n');
        const wellInfoIndex = lines.findIndex(line => line.includes('~Well Information'));
        if (wellInfoIndex > -1) {
          if (data.wellName) {
            lines.splice(wellInfoIndex + 1, 0, `WELL.${data.wellName} : ${data.wellName}`);
          }
          if (data.customerName) {
            lines.splice(wellInfoIndex + 1, 0, `COMP.${data.customerName} : ${data.customerName}`);
          }
        }
        content = lines.join('\n');
      }
    } else {
      // Generate basic LAS header
      content += `~Version Information\n`;
      content += `VERS.   2.0 : CWLS log ASCII Standard -VERSION 2.0\n`;
      content += `WRAP.    NO : One line per depth step\n`;
      content += `~Well Information\n`;
      if (data.wellName) content += `WELL.${data.wellName} : ${data.wellName}\n`;
      if (data.customerName) content += `COMP.${data.customerName} : ${data.customerName}\n`;
      content += `DATE.${new Date().toISOString().split('T')[0]} : LOG DATE\n`;
      content += `~Curve Information\n`;
      headers.forEach(h => {
        content += `${h.mapped}.${h.unit} : ${h.mapped}\n`;
      });
      content += `~Parameter Information\n`;
      content += `~Other Information\n`;
      content += `Generated from: ${data.filename}\n`;
      content += `Processing date: ${new Date().toISOString()}\n`;
      content += `~ASCII\n`;
    }

    // Data section
    rows.forEach(row => {
      content += headers.map(h => row[h.mapped] ?? '').join('\t') + '\n';
    });

    return content;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">


      </div>



      <div className="bg-card border rounded-lg">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Data Preview
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'preview' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Preview (10 rows)
              </button>
              <button
                onClick={() => setViewMode('full')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'full' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Full Data ({data.data.length} rows)
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-gray-800 text-white sticky top-0">
              <tr>
                {mappedHeaders.map((header, index) => (
                  <th key={index} className="px-4 py-3 text-left font-medium">
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
                  className={`${
                    rowIndex % 2 === 0 ? 'bg-background' : 'bg-table-row-even'
                  } hover:bg-table-row-hover transition-colors`}
                >
                  {mappedHeaders.map((header, colIndex) => (
                    <td key={colIndex} className="px-4 py-2 text-sm">
                      {row[header.mapped] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        {/* Export LAS */}
        <button
          onClick={exportData}
          className="px-8 py-3 bg-success text-success-foreground rounded-md hover:bg-success/90 flex items-center space-x-2 font-medium"
        >
          <Download className="w-5 h-5" />
          <span>LAS Export</span>
        </button>

        {/* Export CSV */}
        <button
          onClick={() => {
            const headers = mappedHeaders.map(h => h.mapped);
            const units = mappedHeaders.map(h => h.unit);

            // Build CSV rows
            const csvRows: string[] = [];
            csvRows.push(headers.join(","));   // row 1: mapped names
            csvRows.push(units.join(","));     // row 2: mapped units

            data.data.forEach(row => {
              const values = mappedHeaders.map(h => row[h.mapped] ?? "");
              csvRows.push(values.join(","));
            });

            const csvContent = csvRows.join("\n");

            // Trigger download
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data.filename.split('.')[0]}_mapped.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover flex items-center space-x-2 font-medium"
        >
          <Download className="w-5 h-5" />
          <span>CSV Export</span>
        </button>
      </div>

    </div>
  );
};
