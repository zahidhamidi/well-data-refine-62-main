import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import { DrillingData } from "./DrillingInterface";

type DataAuditProps = {
  data: DrillingData;
  onAuditComplete: (results: any) => void;
};

export const DataAudit = ({ data, onAuditComplete }: DataAuditProps) => {
  const [auditResults, setAuditResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    // Simulate audit process
    const runAudit = async () => {
      setIsRunning(true);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const results = {
        completeness: 98.5,
        conformity: true,
        continuity: true,
        timestampFormat: "dd/mm/yyyy HH:mm:ss",
        issues: [
          {
            type: "warning",
            message: "2 missing values detected in POROSITY column",
            severity: "medium"
          }
        ]
      };
      
      setAuditResults(results);
      setIsRunning(false);
      onAuditComplete(results);
    };

    runAudit();
  }, [data, onAuditComplete]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "fail":
        return <XCircle className="w-5 h-5 text-error" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground animate-spin" />;
    }
  };

  const auditChecks = [
    {
      name: "Data Completeness",
      description: "Checking for missing or null values",
      status: isRunning ? "running" : (auditResults?.completeness > 95 ? "pass" : "warning"),
      value: isRunning ? "Scanning..." : `${auditResults?.completeness}%`
    },
    {
      name: "Data Conformity",
      description: "Validating data types and formats",
      status: isRunning ? "running" : (auditResults?.conformity ? "pass" : "fail"),
      value: isRunning ? "Validating..." : (auditResults?.conformity ? "Passed" : "Failed")
    },
    {
      name: "Timestamp Continuity",
      description: "Checking for gaps in timestamp sequence",
      status: isRunning ? "running" : (auditResults?.continuity ? "pass" : "warning"),
      value: isRunning ? "Analyzing..." : (auditResults?.continuity ? "Continuous" : "Gaps detected")
    }
  ];

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
              <div className="flex items-center space-x-3">
                {getStatusIcon(check.status)}
                <div>
                  <h3 className="font-medium text-foreground">{check.name}</h3>
                  <p className="text-sm text-muted-foreground">{check.description}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-medium ${
                  check.status === "pass" ? "text-success" : 
                  check.status === "warning" ? "text-warning" : 
                  check.status === "fail" ? "text-error" : "text-muted-foreground"
                }`}>
                  {check.value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {auditResults && auditResults.issues?.length > 0 && (
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
    </div>
  );
};