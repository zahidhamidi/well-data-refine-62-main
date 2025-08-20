import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { DrillingData } from "./DrillingInterface";

type DataAuditProps = {
  data: DrillingData;
  onAuditComplete: (results: any) => void;
};

export const DataAudit = ({ data, onAuditComplete }: DataAuditProps) => {
  const [auditResults, setAuditResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [progress, setProgress] = useState(0);

  // --- Helpers ---
  const parseTimestamp = (ts: string) => {
    const [datePart, timePart] = ts.split(" ");
    if (!datePart || !timePart) return NaN;
    const [day, month, year] = datePart.split("/").map(Number);
    const [hours, minutes, seconds] = timePart.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
  };

  const formatInterval = (ms: number) => (ms / 1000) + " seconds";

  // --- Simplified Completeness ---
  // Instead of checking every cell, just detect fully-empty columns
  const calculateCompleteness = (rows: any[], headers: string[]) => {
    if (rows.length === 0) return 0;

    let nonEmptyColumns = 0;

    headers.forEach(h => {
      const hasData = rows.some(row => row[h] !== null && row[h] !== undefined && row[h] !== "");
      if (hasData) nonEmptyColumns++;
    });

    return (nonEmptyColumns / headers.length) * 100;
  };

  const calculateConformity = (rows: any[], timestampHeader: string | undefined) => {
    if (!timestampHeader) return true;
    const sampleRows = rows.slice(0, Math.min(200, rows.length));
    return sampleRows.every(row => !isNaN(parseTimestamp(row[timestampHeader])));
  };

  // --- Simplified Continuity ---
  // Only check a few sample rows for interval consistency
  const calculateContinuity = (rows: any[], timestampHeader: string | undefined) => {
    if (!timestampHeader || rows.length < 2) return { continuity: true, intervalMs: null };

    // Pick 5 sample points
    const sampleIndexes = [0, 1, Math.floor(rows.length / 2), Math.floor(rows.length / 2) + 1, rows.length - 1]
      .filter(i => i < rows.length);

    const times = sampleIndexes.map(i => parseTimestamp(rows[i][timestampHeader])).filter(t => !isNaN(t));
    if (times.length < 2) return { continuity: false, intervalMs: null };

    const intervalMs = times[1] - times[0];
    let continuity = true;

    for (let i = 1; i < times.length; i++) {
      if (times[i] - times[i - 1] !== intervalMs) {
        continuity = false;
        break;
      }
    }

    return { continuity, intervalMs };
  };

  // --- Audit ---
  useEffect(() => {
    const runAudit = async () => {
      setIsRunning(true);
      setProgress(0);

      const headers = data.headers;
      const rows = data.data;
      const timestampHeader = headers.find(h => h.toLowerCase().includes("time"));

      // 1️⃣ Completeness
      const completeness = calculateCompleteness(rows, headers);
      setProgress(33);
      await new Promise(r => setTimeout(r, 10)); // allow UI update

      // 2️⃣ Conformity
      const conformity = calculateConformity(rows, timestampHeader);
      setProgress(66);
      await new Promise(r => setTimeout(r, 10));

      // 3️⃣ Continuity
      const { continuity, intervalMs } = calculateContinuity(rows, timestampHeader);
      setProgress(100);

      // --- Results ---
      const results: any = {
        completeness,
        conformity,
        continuity,
        timestampFormat: timestampHeader ? "Detected" : "N/A",
        continuityInterval: continuity && intervalMs ? formatInterval(intervalMs) : null,
        issues: [] as any[]
      };

      if (completeness < 100)
        results.issues.push({
          type: "warning",
          message: `Missing or empty values detected (${(100 - completeness).toFixed(2)}%)`,
          severity: "medium"
        });

      if (!conformity)
        results.issues.push({
          type: "fail",
          message: "Some timestamps are invalid",
          severity: "high"
        });

      if (!continuity)
        results.issues.push({
          type: "warning",
          message: "Timestamps are not continuous",
          severity: "medium"
        });

      setAuditResults(results);
      setIsRunning(false);
    };

    runAudit();
  }, [data]);

  // --- Status Icon ---
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "fail":
        return <XCircle className="w-5 h-5 text-error" />;
      default:
        return null;
    }
  };

  const auditChecks = [
    {
      name: "Data Completeness",
      description: "Checking for missing or null values",
      status: isRunning
        ? "running"
        : auditResults?.completeness === 100
        ? "pass"
        : "warning",
      value: isRunning ? `${progress}%` : `${auditResults?.completeness.toFixed(2)}%`
    },
    {
      name: "Data Conformity",
      description: "Validating timestamp formats",
      status: isRunning
        ? "running"
        : auditResults?.conformity
        ? "pass"
        : "fail",
      value: isRunning ? `${progress}%` : auditResults?.conformity ? "Passed" : "Failed"
    },
    {
      name: "Timestamp Continuity",
      description: "Checking for consistent intervals",
      status: isRunning
        ? "running"
        : auditResults?.continuity
        ? "pass"
        : "warning",
      value: isRunning
        ? `${progress}%`
        : auditResults?.continuity
        ? auditResults?.continuityInterval
        : "Gaps detected"
    }
  ];

  // --- Render ---
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Data Quality Audit
        </h2>
        <p className="text-muted-foreground">
          Analyzing data completeness, conformity, and timestamp continuity
        </p>
      </div>

      <div className="grid gap-4">
        {auditChecks.map((check, index) => (
          <div key={index} className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col w-full">
                <div className="flex items-center space-x-3">
                  {!isRunning && getStatusIcon(check.status)}
                  <div>
                    <h3 className="font-medium text-foreground">{check.name}</h3>
                    <p className="text-sm text-muted-foreground">{check.description}</p>
                  </div>
                </div>
                {isRunning && (
                  <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="text-right ml-4">
                <span
                  className={`font-medium ${
                    check.status === "pass"
                      ? "text-success"
                      : check.status === "warning"
                      ? "text-warning"
                      : check.status === "fail"
                      ? "text-error"
                      : "text-muted-foreground"
                  }`}
                >
                  {check.value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {auditResults?.issues?.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <h4 className="font-medium text-warning mb-2">Issues Detected</h4>
          <ul className="space-y-1">
            {auditResults.issues.map((issue: any, index: number) => (
              <li key={index} className="text-sm text-warning">
                • {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

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
          <div>
            <span className="text-muted-foreground">Timestamp Format:</span>
            <span className="ml-2 font-medium">
              {auditResults?.timestampFormat || "Detecting..."}
            </span>
          </div>
        </div>
      </div>

      {!isRunning && auditResults && (
        <div className="flex justify-end mt-4">
          <button
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            onClick={() => onAuditComplete(auditResults)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
