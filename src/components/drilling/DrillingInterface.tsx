import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { StepProgress } from "./StepProgress";
import { FileUpload } from "./FileUpload";
import { DataAudit } from "./DataAudit";
import { TimestampFormat } from "./TimestampFormat";
import { ColumnMapping } from "./ColumnMapping";
import { DataPreview } from "./DataPreview";
import { ChannelBankItem, defaultChannels } from "./ChannelBank";
import { ArrowLeft, Upload, BarChart3, Settings,House,Download, CheckCircle, AlertCircle, XCircle, ChevronLeft } from "lucide-react";

export type DrillingData = {
  filename: string;
  headers: string[];
  data: any[];
  units: string[];
  customerName?: string;
  wellName?: string;
  dataType?: 'depth' | 'time';
  originalLasHeader?: string;
  auditResults?: {
    completeness: number;
    conformity: boolean;
    continuity: boolean;
    timestampFormat?: string;
  };
  mappedColumns?: Array<{
    original: string;
    mapped: string;
    originalUnit: string;
    mappedUnit: string;
  }>;
};





const steps = [
  { id: 0, title: "File Upload", description: "Upload LAS, XLSX, or CSV file" },
  { id: 1, title: "Data Audit", description: "Quality and conformity check" },
  { id: 2, title: "Timestamp Format", description: "Standardize timestamp format" },
  { id: 3, title: "Column Mapping", description: "Map channels to standard names" },
  { id: 4, title: "Preview & Export", description: "Review and export mapped data" },
];

export const DrillingInterface = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<DrillingData | null>(null);
  const [channelBank, setChannelBank] = useState<ChannelBankItem[]>([]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 0) {
      navigate("/ChannelMapping");
    }
  };


  const updateData = (newData: Partial<DrillingData>) => {
    setData(prev => prev ? { ...prev, ...newData } : null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <header className="mb-8 flex items-center justify-between">
          {/* Left side: icon + text */}
          <div className="flex items-start gap-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setTimeout(() => navigate("/"), 500);
              }}
              className="text-muted-foreground hover:text-foreground mt-1"
            >
              <House className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                EDGE Channel Mapping Tool
              </h1>
              
            </div>
          </div>

          {/* Right side: Channel Bank button */}
          <Button
            onClick={() => navigate("/channel-bank")}
            className="flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Channel Bank
          </Button>
        </header>


        <div className="mb-8">
          <StepProgress steps={steps} currentStep={currentStep} />
        </div>

        <div className="bg-card rounded-lg border p-6">
          {currentStep === 0 && (
            <FileUpload 
              onFileProcessed={(fileData) => {
                setData(fileData);
              }}
            />
          )}
          
          {currentStep === 1 && data && (
            <DataAudit
              data={data}
              onAuditComplete={(auditResults) => {
                // Store the audit results but DO NOT move to next step automatically
                updateData({ auditResults });
              }}
            />
          )}
          
          {currentStep === 2 && data && data.dataType === 'time' && (
            <TimestampFormat 
              data={data}
              onFormatComplete={() => handleNext()}
            />
          )}

          {currentStep === 2 && data && data.dataType === 'depth' && (
            <div className="text-center py-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Timestamp Formatting Skipped
              </h2>
              <p className="text-muted-foreground mb-4">
                Depth-based data selected. Timestamp formatting step is not required.
              </p>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover"
              >
                Continue to Column Mapping
              </button>
            </div>
          )}
          
          {currentStep === 3 && data && (
            <ColumnMapping 
              data={data}
              channelBank={defaultChannels}
              onMappingComplete={(mappedColumns) => {
                updateData({ mappedColumns });
                handleNext();
              }}
            />
          )}
          
          {currentStep === 4 && data && (
            <DataPreview 
              data={data}
              onExport={() => {
                // Export functionality
                console.log("Exporting data...", data);
              }}
            />
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80"
          >
            Previous
          </button>
          
          {currentStep < 4 && (
            <button
              onClick={handleNext}
              disabled={!data}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};