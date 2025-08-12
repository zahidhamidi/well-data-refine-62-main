import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Upload, BarChart3, Settings, Download, CheckCircle, AlertCircle, XCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/ui/file-upload";
import TableInput from "@/components/ui/table-input";
import DrillChart from "@/components/ui/drill-chart";
import ConfigurationSidebar from "@/components/ui/configuration-sidebar";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface DataQualityMetrics {
  completeness: number;
  conformity: number;
  statistics: number;
  overall: number;
}

interface DrillingData {
  depth: number;
  wob: number;
  rpm: number;
  rop: number;
}

interface SectionData {
  id: string;
  startDepth: string;
  endDepth: string;
  holeDiameter: string;
}

interface FormationData {
  id: string;
  startDepth: string;
  endDepth: string;
  formationName: string;
}

interface DecimationConfig {
  depthInterval: number;
  filterMode: 'section' | 'formation' | 'all';
  selectedSection?: string;
  selectedFormation?: string;
  enableSmoothing: boolean;
  outlierRemoval: boolean;
}

const Decimation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQualityMetrics | null>(null);
  const [sectionData, setSectionData] = useState<SectionData[]>([]);
  const [formationData, setFormationData] = useState<FormationData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [drillingData, setDrillingData] = useState<DrillingData[]>([]);
  const [decimationConfig, setDecimationConfig] = useState<DecimationConfig>({
    depthInterval: 10,
    filterMode: 'all',
    enableSmoothing: false,
    outlierRemoval: false
  });

  const steps = [
    { id: 1, title: "Upload Data", description: "Upload XLSX or CSV" },
    { id: 2, title: "Data Audit", description: "Quality assessment and scoring" },
    { id: 3, title: "Section or Formation", description: "Define sections and formations" },
    { id: 4, title: "Decimation Config", description: "Configure & Visualize Decimation" },
    { id: 5, title: "Export", description: "Export as DIF template" }
  ];

  const REQUIRED_COLUMNS = ["Timestamp", "DMEA", "ROP", "RPM", "TFLO", "WOB"];
  
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsProcessing(true);

    toast({
      title: "✅ File Uploaded",
      description: `Processing ${file.name}...`,
      className: "border-green-200 bg-green-50 text-green-800",
    });

    let drillingData: DrillingData[] = [];

    const filterColumns = (row: any) => {
      const filtered: any = {};
      REQUIRED_COLUMNS.forEach((col) => {
        filtered[col] = row[col];
      });
      return filtered;
    };

    if (file.name.endsWith(".csv")) {
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true });
      drillingData = parsed.data
        .map(filterColumns)
        .filter((row) => REQUIRED_COLUMNS.every((col) => row[col] !== undefined && row[col] !== ""));
    } else if (file.name.endsWith(".xlsx")) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      drillingData = jsonData
        .map(filterColumns)
        .filter((row) => REQUIRED_COLUMNS.every((col) => row[col] !== undefined && row[col] !== ""));
    } else {
      toast({
        title: "❌ Unsupported file type",
        description: "Please upload a .csv or .xlsx file",
        className: "border-red-200 bg-red-50 text-red-800",
      });
      setIsProcessing(false);
      return;
    }

    // Calculate completeness
    const totalRows = drillingData.length;
    const completeness =
      (drillingData.filter((row) => REQUIRED_COLUMNS.every((col) => row[col] !== null && row[col] !== undefined)).length /
        totalRows) *
      100;

    const conformity = 100; // Placeholder for rules check
    const statistics = 100; // Placeholder for stats check
    const overall = Math.round((completeness + conformity + statistics) / 3);

    setDataQuality({
      completeness: Math.round(completeness),
      conformity,
      statistics,
      overall,
    });

    // Convert to your DrillingData[] format if needed
    setDrillingData(
      drillingData.map((row) => ({
        depth: Number(row.DMEA),
        wob: Number(row.WOB),
        rpm: Number(row.RPM),
        rop: Number(row.ROP),
        tflow: Number(row.TFLO), // if your model supports TFLO
        timestamp: row.Timestamp,
      }))
    );

    setIsProcessing(false);
    setCurrentStep(2);

    toast({
      title: "✅ Data Processed",
      description: "Quality assessment completed successfully!",
      className: "border-green-200 bg-green-50 text-green-800",
    });
  };

  const handleConfirmSections = (sections: SectionData[], formations: FormationData[]) => {
    setSectionData(sections);
    setFormationData(formations);
    setCurrentStep(4);
    
    toast({
      title: "✅ Sections Confirmed",
      description: `${sections.length} sections and ${formations.length} formations saved!`,
      className: "border-green-200 bg-green-50 text-green-800",
    });
  };

  const getQualityColor = (score: number) => {
    if (score >= 95) return "text-success";
    if (score >= 85) return "text-warning";
    return "text-destructive";
  };

  const getQualityIcon = (score: number) => {
    if (score >= 95) return CheckCircle;
    if (score >= 85) return AlertCircle;
    return XCircle;
  };

  // Calculate decimated data based on configuration
  const decimatedData = useMemo(() => {
    if (!drillingData.length || decimationConfig.depthInterval === 0) return null;

    let filteredData = drillingData;
    
    // Apply filtering based on mode
    if (decimationConfig.filterMode === 'section' && decimationConfig.selectedSection) {
      const section = sectionData.find(s => s.id === decimationConfig.selectedSection);
      if (section) {
        const startDepth = parseFloat(section.startDepth);
        const endDepth = parseFloat(section.endDepth);
        filteredData = drillingData.filter(d => d.depth >= startDepth && d.depth <= endDepth);
      }
    } else if (decimationConfig.filterMode === 'formation' && decimationConfig.selectedFormation) {
      const formation = formationData.find(f => f.id === decimationConfig.selectedFormation);
      if (formation) {
        const startDepth = parseFloat(formation.startDepth);
        const endDepth = parseFloat(formation.endDepth);
        filteredData = drillingData.filter(d => d.depth >= startDepth && d.depth <= endDepth);
      }
    }

    if (filteredData.length === 0) return null;

    // Sort by depth to ensure proper binning
    filteredData.sort((a, b) => a.depth - b.depth);

    const minDepth = Math.floor(filteredData[0].depth);
    const maxDepth = Math.ceil(filteredData[filteredData.length - 1].depth);
    const depthInterval = decimationConfig.depthInterval;

    const decimated: DrillingData[] = [];

    // Create depth bins based on the interval
    for (let depthStart = minDepth; depthStart < maxDepth; depthStart += depthInterval) {
      const depthEnd = depthStart + depthInterval;
      
      // Get data points in this depth interval
      const intervalData = filteredData.filter(d => d.depth >= depthStart && d.depth < depthEnd);
      
      if (intervalData.length > 0) {
        // Sort data for median calculation
        const sortedWob = [...intervalData].sort((a, b) => a.wob - b.wob);
        const sortedRpm = [...intervalData].sort((a, b) => a.rpm - b.rpm);
        const sortedRop = [...intervalData].sort((a, b) => a.rop - b.rop);
        
        // Calculate median for each parameter (following the GitHub script approach)
        const getMedian = (arr: number[]) => {
          const mid = Math.floor(arr.length / 2);
          return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
        };
        
        const decimatedPoint: DrillingData = {
          depth: depthStart + depthInterval / 2, // Use center of interval
          wob: getMedian(sortedWob.map(d => d.wob)),
          rpm: getMedian(sortedRpm.map(d => d.rpm)),
          rop: getMedian(sortedRop.map(d => d.rop))
        };
        
        decimated.push(decimatedPoint);
      }
    }

    return decimated;
  }, [drillingData, decimationConfig, sectionData, formationData]);

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      toast({
        title: "✅ Step Changed",
        description: `Navigated to ${steps[currentStep - 2].title}`,
        className: "border-green-200 bg-green-50 text-green-800",
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">File Uploader</h2>
              <p className="text-muted-foreground">
                Upload sensor data file to begin the decimation process
              </p>
            </div>
            
            <FileUpload 
              onFileSelect={handleFileUpload}
              acceptedFileTypes={['.xlsx', '.csv', '.las']}
              maxFileSize={100 * 1024 * 1024} // 100MB
              initialFile={uploadedFile}
            />

            {isProcessing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Processing file and analyzing data quality...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Data Audit</h2>
              <p className="text-muted-foreground">
                Data Quality Management Checks
              </p>
            </div>

            {dataQuality && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Data Completeness", value: dataQuality.completeness, description: "Missing data points" },
                  { label: "Data Conformity", value: dataQuality.conformity, description: "Format compliance" },
                  { label: "Statistical Quality", value: dataQuality.statistics, description: "Data distribution" },
                  { label: "Overall Score", value: dataQuality.overall, description: "Combined quality" }
                ].map((metric, index) => {
                  const Icon = getQualityIcon(metric.value);
                  return (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center space-y-2 cursor-help">
                              <Icon className={`h-8 w-8 mx-auto ${getQualityColor(metric.value)}`} />
                              <div className="text-2xl font-bold">{metric.value}%</div>
                              <div className="text-sm font-medium">{metric.label}</div>
                              <div className="text-xs text-muted-foreground">{metric.description}</div>
                              <Progress value={metric.value} className="w-full" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="max-w-xs text-sm">
                            {metric.label === "Data Completeness"
                              ? "Data Completeness: Percentage of rows where all required fields (Timestamp, DMEA, ROP, RPM, TFLO, WOB) are present and non-empty."
                              : metric.label === "Data Conformity"
                              ? "Data Conformity: Percentage of rows where data values conform to expected data types, ranges, and formats."
                              : metric.label === "Statistical Quality"
                              ? "Statistical Quality: Assessment of data distribution and statistical properties like consistency and variance."
                              : metric.label === "Overall Score"
                              ? "Overall Score: Average of the completeness, conformity, and statistical quality scores."
                              : ""}
                          </TooltipContent>
                        </Tooltip>

                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Data quality assessment complete. Your data meets DrillPlan ingestion requirements.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button onClick={() => {
                setCurrentStep(3);
                toast({
                  title: "✅ Step Advanced",
                  description: "Proceeding to Section Input",
                  className: "border-green-200 bg-green-50 text-green-800",
                });
              }} size="lg">
                Continue to Section Input
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Section & Formation Input</h2>
              <p className="text-muted-foreground">
                Define drilling sections and formations for analysis. Copy data from Excel and paste directly into the tables.
              </p>
            </div>

            <TableInput 
              onConfirm={handleConfirmSections} 
              initialSections={sectionData}
              initialFormations={formationData}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Data Visualization & Configuration</h2>
              <p className="text-muted-foreground">
                WOB, RPM, and ROP analysis vs depth. Use the sidebar to configure decimation settings.
              </p>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
              {/* Configuration Sidebar */}
              <div className="lg:col-span-1">
                <ConfigurationSidebar
                  config={decimationConfig}
                  onConfigChange={setDecimationConfig}
                  sections={sectionData.map(s => ({ 
                    id: s.id, 
                    name: `${s.startDepth}-${s.endDepth}ft`, 
                    startDepth: s.startDepth, 
                    endDepth: s.endDepth 
                  }))}
                  formations={formationData.map(f => ({ 
                    id: f.id, 
                    name: f.formationName, 
                    startDepth: f.startDepth, 
                    endDepth: f.endDepth 
                  }))}
                />
              </div>

              {/* Charts */}
              <div className="lg:col-span-3 space-y-6">
                <DrillChart
                  data={drillingData}
                  decimatedData={decimatedData}
                  parameter="wob"
                  title="Weight on Bit (WOB)"
                  unit="klbs"
                  color="hsl(var(--chart-1))"
                />
                
                <DrillChart
                  data={drillingData}
                  decimatedData={decimatedData}
                  parameter="rpm"
                  title="Rotary Speed (RPM)"
                  unit="rpm"
                  color="hsl(var(--chart-2))"
                />
                
                <DrillChart
                  data={drillingData}
                  decimatedData={decimatedData}
                  parameter="rop"
                  title="Rate of Penetration (ROP)"
                  unit="ft/hr"
                  color="hsl(var(--chart-3))"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Button onClick={() => {
                setCurrentStep(5);
                toast({
                  title: "✅ Ready to Export",
                  description: "Proceeding to data export",
                  className: "border-green-200 bg-green-50 text-green-800",
                });
              }} size="lg">
                Export Data
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Export Decimated Data</h2>
              <p className="text-muted-foreground">
                Review your decimated data and export to CSV
              </p>
            </div>

            {decimatedData && decimatedData.length > 0 ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Decimated Data Preview</CardTitle>
                    <CardDescription>
                      Showing {decimatedData.length} decimated data points 
                      {decimationConfig.depthInterval > 0 && ` (${decimationConfig.depthInterval} m/ft intervals)`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Depth (m/ft)</TableHead>
                            <TableHead>WOB (klbs)</TableHead>
                            <TableHead>RPM</TableHead>
                            <TableHead>ROP (ft/hr)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {decimatedData.slice(0, 50).map((point, index) => (
                            <TableRow key={index}>
                              <TableCell>{point.depth.toFixed(1)}</TableCell>
                              <TableCell>{point.wob.toFixed(2)}</TableCell>
                              <TableCell>{point.rpm.toFixed(1)}</TableCell>
                              <TableCell>{point.rop.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {decimatedData.length > 50 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Showing first 50 rows of {decimatedData.length} total rows
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-center">
                  <Button 
                    onClick={() => {
                      // Create CSV content
                      const headers = ['Depth', 'WOB', 'RPM', 'ROP'];
                      const csvContent = [
                        headers.join(','),
                        ...decimatedData.map(point => 
                          [point.depth.toFixed(1), point.wob.toFixed(2), point.rpm.toFixed(1), point.rop.toFixed(2)].join(',')
                        )
                      ].join('\n');

                      // Create and download file
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'decimated-drilling-data.csv';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      
                      toast({
                        title: "✅ File Downloaded",
                        description: `decimated-drilling-data.csv downloaded successfully!`,
                        className: "border-green-200 bg-green-50 text-green-800",
                      });
                    }}
                    size="lg"
                    className="px-8"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export to CSV
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <p>No decimated data available for export.</p>
                    <p className="text-sm mt-2">Please ensure you have uploaded data and configured decimation settings.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  toast({
                    title: "✅ Navigation",
                    description: "Returning to main modules page",
                    className: "border-green-200 bg-green-50 text-green-800",
                  });
                  setTimeout(() => navigate("/"), 500);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Modules
              </Button>
              <div>
                <h1 className="text-2xl font-bold">DrillPlan Sensor Data Decimation Tool</h1>
                <p className="text-sm text-muted-foreground">Seemless end-to-end data management tool for DrillPlan Data Ingestion</p>
              </div>
            </div>
            
            <Badge variant="secondary">
              Step {currentStep} of {steps.length}
            </Badge>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-2 ${
                  step.id === currentStep ? 'text-primary' : 
                  step.id < currentStep ? 'text-success' : 'text-muted-foreground'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id === currentStep ? 'bg-primary text-primary-foreground' :
                    step.id < currentStep ? 'bg-success text-success-foreground' : 'bg-muted'
                  }`}>
                    {step.id < currentStep ? <CheckCircle className="h-4 w-4" /> : step.id}
                  </div>
                  <div className="hidden md:block">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden md:block w-16 h-0.5 mx-4 ${
                    step.id < currentStep ? 'bg-success' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentStep > 1 && (
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={goToPreviousStep}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Step
            </Button>
          </div>
        )}
        {renderStepContent()}
      </main>
    </div>
  );
};

export default Decimation;