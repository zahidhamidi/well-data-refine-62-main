import { useState, useCallback } from "react";
import { Upload, File, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DrillingData } from "./DrillingInterface";

type FileUploadProps = {
  onFileProcessed: (data: DrillingData & { customerName: string; wellName: string; dataType: 'depth' | 'time' }) => void;
};

export const FileUpload = ({ onFileProcessed }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [wellName, setWellName] = useState('');
  const [dataType, setDataType] = useState<'depth' | 'time'>('depth');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = async (file: File) => {
    if (!customerName || !wellName) {
      alert('Please enter customer name and well name before uploading a file.');
      return;
    }
    
    setProcessing(true);
    
    try {
      let originalLasHeader = '';
      if (file.name.toLowerCase().endsWith('.las')) {
        const text = await file.text();
        const lines = text.split('\n');
        const dataIndex = lines.findIndex(line => line.trim().startsWith('~A'));
        originalLasHeader = dataIndex > 0 ? lines.slice(0, dataIndex + 1).join('\n') : '';
      }
      
      // Simulate file processing
      setTimeout(() => {
        const processedData: DrillingData & { customerName: string; wellName: string; dataType: 'depth' | 'time' } = {
          filename: file.name,
          headers: ["DEPTH", "GAMMA_RAY", "RESISTIVITY", "POROSITY", "TIMESTAMP"],
          data: [
            { DEPTH: 1000, GAMMA_RAY: 45.2, RESISTIVITY: 120.5, POROSITY: 0.15, TIMESTAMP: "01/01/2024 10:00:00" },
            { DEPTH: 1001, GAMMA_RAY: 47.1, RESISTIVITY: 118.3, POROSITY: 0.16, TIMESTAMP: "01/01/2024 10:01:00" },
            { DEPTH: 1002, GAMMA_RAY: 43.8, RESISTIVITY: 125.7, POROSITY: 0.14, TIMESTAMP: "01/01/2024 10:02:00" },
          ],
          units: ["ft", "API", "ohm.m", "fraction", "datetime"],
          customerName,
          wellName,
          dataType,
          originalLasHeader
        };
        
        setProcessing(false);
        onFileProcessed(processedData);
      }, 2000);
    } catch (error) {
      setProcessing(false);
      alert('Error processing file. Please try again.');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const uploadedFile = files[0];
      const validTypes = ['.las', '.xlsx', '.csv'];
      const fileExtension = uploadedFile.name.toLowerCase().substring(uploadedFile.name.lastIndexOf('.'));
      
      if (validTypes.includes(fileExtension)) {
        setFile(uploadedFile);
        processFile(uploadedFile);
      } else {
        alert('Please upload a valid LAS, XLSX, or CSV file');
      }
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFile(files[0]);
      processFile(files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Upload Drilling Data File
        </h2>
        <p className="text-muted-foreground">
          Enter project details and upload your LAS, XLSX, or CSV file containing drilling sensor data
        </p>
      </div>

      {/* Customer and Well Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name *</Label>
          <Input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wellName">Well Name *</Label>
          <Input
            id="wellName"
            value={wellName}
            onChange={(e) => setWellName(e.target.value)}
            placeholder="Enter well name"
            required
          />
        </div>
      </div>

      {/* Data Type Selection */}
      <div className="space-y-2">
        <Label>Data Type</Label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="dataType"
              value="depth"
              checked={dataType === 'depth'}
              onChange={(e) => setDataType(e.target.value as 'depth' | 'time')}
              className="w-4 h-4 text-primary"
            />
            <span className="text-sm text-foreground">Depth-based</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="dataType"
              value="time"
              checked={dataType === 'time'}
              onChange={(e) => setDataType(e.target.value as 'depth' | 'time')}
              className="w-4 h-4 text-primary"
            />
            <span className="text-sm text-foreground">Time-based</span>
          </label>
        </div>
      </div>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 transition-colors
          ${dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
          }
          ${!customerName || !wellName ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".las,.xlsx,.csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={processing || !customerName || !wellName}
        />
        
        <div className="text-center">
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            {!customerName || !wellName 
              ? 'Please enter customer and well information first'
              : dragActive 
                ? 'Drop your file here' 
                : 'Choose file or drag and drop'
            }
          </p>
          <p className="text-sm text-muted-foreground">
            Supported formats: LAS, XLSX, CSV (Max size: 100MB)
          </p>
        </div>
      </div>

      {file && (
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {!processing && (
              <button
                onClick={removeFile}
                className="p-1 hover:bg-background rounded"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
          
          {processing && (
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-background rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full animate-pulse w-1/2"></div>
                </div>
                <span className="text-sm text-muted-foreground">Processing...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};