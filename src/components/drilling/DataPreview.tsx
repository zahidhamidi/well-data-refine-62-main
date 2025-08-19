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
    // Create mapped data structure
    const mappedData = data.data.map(row => {
      const newRow: any = {};
      mappedHeaders.forEach(header => {
        newRow[header.mapped] = row[header.original];
      });
      return newRow;
    });

    // Create LAS content
    const lasContent = generateLASContent(mappedData, mappedHeaders);
    
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

  const generateLASContent = (mappedData: any[], headers: any[]) => {
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
    mappedData.forEach(row => {
      content += headers.map(h => row[h.mapped] || '').join('\t') + '\n';
    });
    
    return content;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Data Preview & Export
        </h2>
        <p className="text-muted-foreground">
          Review the mapped data before exporting to LAS format
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-medium text-foreground mb-3 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Processing Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Original file:</span>
              <span className="font-medium">{data.filename}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total rows:</span>
              <span className="font-medium">{data.data.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mapped columns:</span>
              <span className="font-medium text-success">{mappedHeaders.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data completeness:</span>
              <span className="font-medium">{data.auditResults?.completeness}%</span>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-medium text-foreground mb-3">Column Mappings</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {mappedHeaders.map((header, index) => (
              <div key={index} className="text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{header.original}</span>
                  <span className="font-medium text-primary">{header.mapped}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-medium text-foreground mb-3">Export Options</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="headers"
                defaultChecked
                className="w-4 h-4 text-primary"
              />
              <label htmlFor="headers" className="text-sm text-foreground">
                Include headers
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="units"
                defaultChecked
                className="w-4 h-4 text-primary"
              />
              <label htmlFor="units" className="text-sm text-foreground">
                Include units
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="metadata"
                defaultChecked
                className="w-4 h-4 text-primary"
              />
              <label htmlFor="metadata" className="text-sm text-foreground">
                Include metadata
              </label>
            </div>
          </div>
        </div>
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
            <thead className="bg-table-header text-white sticky top-0">
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
                      {row[header.original] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={exportData}
          className="px-8 py-3 bg-success text-success-foreground rounded-md hover:bg-success/90 flex items-center space-x-2 font-medium"
        >
          <Download className="w-5 h-5" />
          <span>Export as LAS File</span>
        </button>
      </div>
    </div>
  );
};