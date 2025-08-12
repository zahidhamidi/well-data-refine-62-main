import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  className?: string;
  initialFile?: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  acceptedFileTypes = ['.xlsx', '.csv', '.las'],
  maxFileSize = 50 * 1024 * 1024, // 50MB
  className,
  initialFile
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(initialFile || null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file size
      if (file.size > maxFileSize) {
        setError(`File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`);
        return;
      }

      // Validate file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFileTypes.includes(fileExtension)) {
        setError(`File type not supported. Please upload: ${acceptedFileTypes.join(', ')}`);
        return;
      }

      setUploadedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect, acceptedFileTypes, maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/octet-stream': ['.las']
    },
    multiple: false
  });

  const removeFile = () => {
    setUploadedFile(null);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('w-full', className)}>
      {!uploadedFile ? (
        <Card>
          <CardContent className="p-0">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              )}
            >
              <input {...getInputProps()} />
              <Upload className={cn(
                'mx-auto h-12 w-12 mb-4',
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              )} />
              
              {isDragActive ? (
                <p className="text-lg font-medium text-primary">
                  Drop the file here
                </p>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2">
                    Upload drilling data file
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your file here, or click to browse
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {acceptedFileTypes.map((type) => (
                      <span 
                        key={type}
                        className="px-2 py-1 bg-secondary text-secondary-foreground text-sm rounded"
                      >
                        {type.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Maximum file size: {Math.round(maxFileSize / (1024 * 1024))}MB
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FileUpload;