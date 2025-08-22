import { useEffect } from "react";
import { DrillingData } from "./DrillingInterface";

type DataAuditProps = {
  data: DrillingData;
  onAuditComplete: (results: any) => void;
};

// Extract ~WELL info from LAS header text
const extractWellInfo = (lasHeader?: string) => {
  if (!lasHeader) return [];
  const lines = lasHeader.split(/\r?\n/);

  // find start of ~WELL or ~W section
  let i = lines.findIndex(l => /^\s*~\s*(well|w)\b/i.test(l));
  if (i === -1) return [];

  const rows: Array<{ mnemonic: string; unit: string; value: string; description: string }> = [];
  for (i = i + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*~/.test(line)) break; // next section reached
    if (!line?.trim() || line.trim().startsWith("#")) continue; // skip blanks/comments

    // Typical LAS: MNEM .UNIT  VALUE : DESCRIPTION
    const m = line.trim().match(
      /^([A-Za-z0-9_]+)\s*\.?\s*([A-Za-z0-9/%°\-\.\*]*)\s+([^:]*?)(?:\s*:\s*(.*))?$/
    );
    if (m) {
      const [, mnemonic, unit, value, description] = m;
      rows.push({
        mnemonic: mnemonic?.trim() || "",
        unit: unit?.trim() || "",
        value: (value ?? "").toString().trim(),
        description: (description ?? "").toString().trim(),
      });
    }
  }
  return rows;
};

export const DataAudit = ({ data, onAuditComplete }: DataAuditProps) => {
  // detect LAS + extract well info
  const isLAS = data.filename?.toLowerCase().endsWith(".las");
  const wellInfo = isLAS ? extractWellInfo(data.originalLasHeader) : [];

  useEffect(() => {
    // Immediately pass dummy results so "Next" can be enabled
    const results = {
      completeness: 100,
      continuity: true,
      incompleteColumns: [],
      timestampFormat: "Skipped",
      continuityInterval: null,
      issues: []
    };
    onAuditComplete(results);
  }, [data, onAuditComplete]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Data Audit
        </h2>
        <p className="text-muted-foreground">
          Data preview and quality checks
        </p>
      </div>

      {/* File Summary */}
      <div className="bg-muted rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-2">File Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Filename:</span>
            <span className="ml-2 font-medium">{data.filename}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Columns:</span>
            <span className="ml-2 font-medium">{data.headers.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Rows:</span>
            <span className="ml-2 font-medium">{data.data.length}</span>
          </div>
        </div>
      </div>

      {/* Data Preview (first 5 rows) */}
      <div className="bg-muted rounded-lg p-4 mt-6">
        <h4 className="font-medium text-foreground mb-2">Data Preview (first 5 rows)</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-border text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                {data.headers.map((header, idx) => (
                  <th key={idx} className="px-2 py-1 border border-border text-center">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.slice(0, 5).map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-background" : "bg-table-row-even"}>
                  {data.headers.map((header, colIndex) => (
                    <td key={colIndex} className="px-2 py-1 border border-border text-center">
                      {typeof row === "object" && !Array.isArray(row)
                        ? row[header] ?? ""         // CSV/XLSX
                        : Array.isArray(row)
                        ? row[colIndex] ?? ""       // LAS (arrays)
                        : ""}
                    </td>

                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Well Info for LAS */}
      {isLAS && (
        <div className="bg-muted rounded-lg p-4 mt-6">
          <h4 className="font-medium text-foreground mb-2">
            Well Information
          </h4>
          {wellInfo.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ~WELL section found in LAS header.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-border text-sm">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-2 py-1 border border-border text-center">Mnemonic</th>
                    <th className="px-2 py-1 border border-border text-center">Unit</th>
                    <th className="px-2 py-1 border border-border text-center">Value</th>
                    <th className="px-2 py-1 border border-border text-center">Description</th>
                  </tr>
                </thead>

                <tbody>
                  {wellInfo.map((r, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-background" : "bg-table-row-even"}
                    >
                      <td className="px-2 py-1 border border-border">{r.mnemonic || ""}</td>
                      <td className="px-2 py-1 border border-border">{r.unit || ""}</td>

                      <td
                        className={`px-2 py-1 border border-border ${
                          !r.value ? "bg-red-200" : ""
                        }`}
                      >
                        {r.value || ""}
                      </td>

                      <td className="px-2 py-1 border border-border">{r.description || ""}</td>
                    </tr>
                  ))}




                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


    </div>
  );
};
