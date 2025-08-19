import { useState } from "react";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { DrillingData } from "./DrillingInterface";

type TimestampFormatProps = {
  data: DrillingData;
  onFormatComplete: () => void;
};

export const TimestampFormat = ({ data, onFormatComplete }: TimestampFormatProps) => {
  const [selectedFormat, setSelectedFormat] = useState("dd/mm/yyyy HH:mm:ss");
  const [isFormatting, setIsFormatting] = useState(false);

  const formatOptions = [
    { label: "dd/mm/yyyy HH:mm:ss", value: "dd/mm/yyyy HH:mm:ss", example: "15/08/2024 14:30:00" },
    { label: "mm/dd/yyyy HH:mm:ss", value: "mm/dd/yyyy HH:mm:ss", example: "08/15/2024 14:30:00" },
    { label: "yyyy-mm-dd HH:mm:ss", value: "yyyy-mm-dd HH:mm:ss", example: "2024-08-15 14:30:00" },
    { label: "ISO 8601", value: "ISO", example: "2024-08-15T14:30:00Z" },
  ];

  const handleFormat = async () => {
    setIsFormatting(true);
    
    // Simulate formatting process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsFormatting(false);
    onFormatComplete();
  };

  // Find timestamp column
  const timestampColumn = data.headers.find(header => 
    header.toLowerCase().includes('timestamp') || 
    header.toLowerCase().includes('time') ||
    header.toLowerCase().includes('date')
  );

  const sampleTimestamps = data.data.slice(0, 5).map(row => row[timestampColumn || '']);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Timestamp Formatting
        </h2>
        <p className="text-muted-foreground">
          Standardize timestamp format to dd/mm/yyyy HH:mm:ss for consistent processing
        </p>
      </div>

      {timestampColumn && (
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-medium text-foreground mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Detected Timestamp Column: {timestampColumn}
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Sample Values:</h4>
              <div className="bg-muted rounded p-3 space-y-1">
                {sampleTimestamps.map((timestamp, index) => (
                  <div key={index} className="text-sm font-mono text-muted-foreground">
                    {timestamp}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Current Format:</span>
                <span className="font-medium bg-warning/10 text-warning px-2 py-1 rounded">
                  {data.auditResults?.timestampFormat || "Mixed/Unknown"}
                </span>
              </div>
              
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Target Format:</span>
                <span className="font-medium bg-success/10 text-success px-2 py-1 rounded">
                  dd/mm/yyyy HH:mm:ss
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-medium text-foreground mb-3 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Format Options
        </h3>
        
        <div className="grid gap-3">
          {formatOptions.map((option) => (
            <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="timestamp-format"
                value={option.value}
                checked={selectedFormat === option.value}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-4 h-4 text-primary"
              />
              <div className="flex-1">
                <div className="font-medium text-foreground">{option.label}</div>
                <div className="text-sm text-muted-foreground">Example: {option.example}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h4 className="font-medium text-primary mb-2">Formatting Preview</h4>
        <p className="text-sm text-muted-foreground mb-3">
          All timestamps will be converted to the standard format: <strong>dd/mm/yyyy HH:mm:ss</strong>
        </p>
        <div className="text-sm">
          <div className="text-muted-foreground">Example conversion:</div>
          <div className="font-mono mt-1">
            <span className="text-warning">01/01/2024 10:00:00</span> → <span className="text-success">01/01/2024 10:00:00</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleFormat}
          disabled={isFormatting}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isFormatting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Formatting Timestamps...</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              <span>Apply Timestamp Formatting</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};