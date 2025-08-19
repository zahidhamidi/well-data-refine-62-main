import { useState, useCallback } from "react";
import { Upload, File, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DrillingData } from "./DrillingInterface";
import * as XLSX from "xlsx";
import Papa from "papaparse";

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

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  // Process uploaded file
  const processFile = async (file: File) => {
    if (!customerName || !wellName) {
      alert('Please enter customer name and well name before uploading a file.');
      return;
    }

    setProcessing(true);

    try {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      let headers: string[] = [];
      let data: any[] = [];
      let originalLasHeader = '';

      // LAS file parsing
      if (fileExtension === 'las') {
        const text = await file.text();
        const lines = text.split('\n');
        const dataIndex = lines.findIndex(line => line.trim().startsWith('~A'));
        originalLasHeader = dataIndex > 0 ? lines.slice(0, dataIndex + 1).join('\n') : '';

        if (dataIndex >= 0) {
          headers = lines[dataIndex].trim().split(/\s+/);
          const dataLines = lines.slice(dataIndex + 1);
          data = dataLines.map(line => {
            const values = line.trim().split(/\s+/);
            const obj: any = {};
            headers.forEach((h, i) => obj[h] = values[i]);
            return obj;
          });
        }
      } 
      // CSV file parsing
      else if (fileExtension === 'csv') {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        headers = result.meta.fields || [];
        data = result.data as any[];
      } 
      // XLSX file parsing
      else if (fileExtension === 'xlsx') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        headers = Object.keys(data[0] || {});
      } 
      else {
        alert('Unsupported file format. Please upload LAS, CSV, or XLSX.');
        setProcessing(false);
        return;
      }

      // Build final data object
      const processedData: DrillingData & {
        customerName: string;
        wellName: string;
        dataType: 'depth' | 'time';
      } = {
        filename: file.name,
        headers,
        data,
        units: Array(headers.length).fill(''), // leave blank; user can map later
        customerName,
        wellName,
        dataType,
        originalLasHeader
      };

      setProcessing(false);
      onFileProcessed(processedData);

    } catch (error) {
      console.error(error);
      setProcessing(false);
      alert('Error processing file. Please try again.');
    }
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setFile(files[0]);
      processFile(files[0]);
    }
  }, [customerName, wellName, dataType]);

  // Handle manual file selection
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

  // Add state for Data Origin
  const [dataOrigin, setDataOrigin] = useState<'ML' | 'GS'>('ML');

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

      {/* Data Type and Data Origin in one row */}
      <div className="flex space-x-12"> {/* use flex to align horizontally and give spacing */}

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

          {/* Data Origin */}
          <div className="space-y-2">
            <Label>Data Origin</Label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="dataOrigin"
                  value="ML"
                  checked={dataOrigin === 'ML'}
                  onChange={(e) => setDataOrigin(e.target.value as 'ML' | 'GS')}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm text-foreground">ML</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="dataOrigin"
                  value="GS"
                  checked={dataOrigin === 'GS'}
                  onChange={(e) => setDataOrigin(e.target.value as 'ML' | 'GS')}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm text-foreground">GS</span>
              </label>
            </div>
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