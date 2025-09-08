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


  mappedColumns?: Array<{

    original: string;
    mapped: string;
    originalUnit: string;
    mappedUnit: string;
  }>;
};





const steps = [
  { id: 0, title: "File Upload" },
  { id: 1, title: "Data Audit" },
  { id: 2, title: "Timestamp Format" },
  { id: 3, title: "Column Mapping" },
  { id: 4, title: "Preview & Export" },
];

export const DrillingInterface = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<DrillingData | null>(null);
  const [channelBank, setChannelBank] = useState<ChannelBankItem[]>([]);
  const [timestampState, setTimestampState] = useState<any>(null);
  const [mappingState, setMappingState] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [wellName, setWellName] = useState('');
  const [dataType, setDataType] = useState<'depth' | 'time'>('depth');
  const [dataOrigin, setDataOrigin] = useState<'ML' | 'GS'>('ML');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);



  const handleNext = () => {
    if (currentStep < 4)  {
      setCurrentStep(currentStep + 1);
    }
    // do nothing if currentStep === 3
  };


  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 0) {
      navigate("/ChannelMapping");
    }
  };


  const updateData = (newData: Partial<DrillingData>) => {
    setData(prev => {
      // If there was already data, merge it with the new data
      if (prev) {
        return { ...prev, ...newData };
      }

      // If there was no previous data, initialize a new DrillingData object
      return {
        filename: "",
        headers: [],
        data: [],
        units: [],
        ...newData, // Overwrite with whatever is passed in
      } as DrillingData;
    });
  };



  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <header className="mb-8 flex items-center justify-between bg-blue-900 text-white px-6 py-4 shadow">
          {/* Left side: icon + text */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setTimeout(() => navigate("/"), 500);
              }}
              className="text-white hover:text-gray-200 mt-1"
            >
              <House className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                EDGE Drilling Channel Mapping Tool
              </h1>
              
            </div>
          </div>

          {/* Right side: Channel Bank button */}
          <Button
            onClick={() => navigate("/channel-bank")}
            className="flex items-center gap-2 px-3 py-1 border border-white text-white hover:bg-blue-600"
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
              customerName={customerName}
              setCustomerName={setCustomerName}
              wellName={wellName}
              setWellName={setWellName}
              dataType={dataType}
              setDataType={setDataType}
              dataOrigin={dataOrigin}
              setDataOrigin={setDataOrigin}
              file={uploadedFile}
              setFile={setUploadedFile}
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


          
          {currentStep === 2 && data?.dataType === "time" && (
            <TimestampFormat
              data={data}
              savedState={timestampState}             // pass saved state
              onSaveState={setTimestampState}         // let child update parent
              onFormatComplete={(postFormattedTable) => {
                updateData(postFormattedTable);
              }}
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
              savedState={mappingState}              // pass saved state
              onSaveState={setMappingState}          // let child update parent
              onMappingComplete={(mappedColumns, mappedData) => {
                updateData({ mappedColumns, data: mappedData });
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