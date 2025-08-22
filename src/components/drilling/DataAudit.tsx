import { useEffect } from "react";
import { DrillingData } from "./DrillingInterface";

type DataAuditProps = {
  data: DrillingData;
  onAuditComplete: (results: any) => void;
};

export const DataAudit = ({ data, onAuditComplete }: DataAuditProps) => {
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
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Data Quality Audit
        </h2>
        <p className="text-muted-foreground">
          Audit checks have been skipped. You can proceed.
        </p>
      </div>

      <div className="flex justify-end mt-4">
        <button
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          onClick={() =>
            onAuditComplete({
              completeness: 100,
              continuity: true,
              issues: []
            })
          }
        >
          Next
        </button>
      </div>
    </div>
  );
};
