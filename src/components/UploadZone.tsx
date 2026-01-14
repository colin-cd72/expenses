'use client';

import { useCallback, useState } from 'react';
import { Upload, Camera, X, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'uploading' | 'parsing' | 'done' | 'error';
  error?: string;
}

interface UploadZoneProps {
  onFilesUploaded: (files: File[]) => void;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (id: string) => void;
}

export function UploadZone({ onFilesUploaded, uploadedFiles, onRemoveFile }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/') || file.type === 'application/pdf'
    );

    if (files.length > 0) {
      onFilesUploaded(files);
    }
  }, [onFilesUploaded]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesUploaded(files);
    }
    e.target.value = '';
  }, [onFilesUploaded]);

  const handleCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesUploaded(files);
    }
    e.target.value = '';
  }, [onFilesUploaded]);

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        )}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Drop receipts here</h3>
        <p className="text-muted-foreground mb-4">
          or click to browse (JPG, PNG, PDF, HEIC)
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <label>
            <input
              type="file"
              accept="image/*,.pdf,.heic"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button type="button" variant="outline" className="cursor-pointer" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Browse Files
              </span>
            </Button>
          </label>

          <label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            <Button type="button" variant="outline" className="cursor-pointer" asChild>
              <span>
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadedFiles.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="overflow-hidden">
              <div className="relative aspect-square bg-muted">
                {uploadedFile.file.type.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={uploadedFile.preview}
                    alt="Receipt preview"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-2xl font-bold text-muted-foreground">PDF</span>
                  </div>
                )}

                {/* Status Overlay */}
                <div className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  uploadedFile.status === 'done' && 'bg-green-500/20',
                  uploadedFile.status === 'error' && 'bg-red-500/20',
                  (uploadedFile.status === 'uploading' || uploadedFile.status === 'parsing') && 'bg-black/50'
                )}>
                  {uploadedFile.status === 'uploading' && (
                    <div className="text-white text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  )}
                  {uploadedFile.status === 'parsing' && (
                    <div className="text-white text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      <span className="text-sm">Parsing...</span>
                    </div>
                  )}
                  {uploadedFile.status === 'done' && (
                    <Check className="h-8 w-8 text-green-600" />
                  )}
                  {uploadedFile.status === 'error' && (
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => onRemoveFile(uploadedFile.id)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <CardContent className="p-2">
                <p className="text-xs truncate text-muted-foreground">
                  {uploadedFile.file.name}
                </p>
                {uploadedFile.error && (
                  <p className="text-xs text-red-500 mt-1">{uploadedFile.error}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
