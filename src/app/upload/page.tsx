'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UploadZone } from '@/components/UploadZone';
import { ParsedExpenseCard } from '@/components/ParsedExpenseCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { saveExpense, generateId } from '@/lib/store';
import { Expense, ParsedReceiptData } from '@/lib/types';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'uploading' | 'parsing' | 'done' | 'error';
  error?: string;
}

interface ParsedExpense {
  expense: Expense;
  preview: string;
  fileId: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpense[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  const parseReceipt = async (file: File, fileId: string, preview: string) => {
    try {
      // Update status to parsing
      setUploadedFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, status: 'parsing' as const } : f)
      );

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse receipt');
      }

      const result = await response.json();
      const data: ParsedReceiptData = result.data;

      // Create expense object
      const expense: Expense = {
        id: generateId(),
        receiptUrl: preview, // Using local preview for now
        date: data.date,
        vendor: data.vendor,
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        paymentMethod: data.paymentMethod,
        confidence: data.confidence,
        createdAt: new Date().toISOString(),
      };

      // Add to parsed expenses
      setParsedExpenses(prev => [...prev, { expense, preview, fileId }]);

      // Update file status
      setUploadedFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, status: 'done' as const } : f)
      );

      toast.success(`Parsed: ${expense.vendor} - $${expense.amount.toFixed(2)}`);
    } catch (error) {
      console.error('Parse error:', error);
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Parse failed' }
            : f
        )
      );
      toast.error(`Failed to parse receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFilesUploaded = useCallback((files: File[]) => {
    files.forEach(file => {
      const id = generateId();
      const preview = URL.createObjectURL(file);

      const uploadedFile: UploadedFile = {
        id,
        file,
        preview,
        status: 'uploading',
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);

      // Start parsing immediately
      parseReceipt(file, id, preview);
    });
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
    setParsedExpenses(prev => prev.filter(p => p.fileId !== id));
  }, []);

  const handleSaveExpense = useCallback((expense: Expense, fileId: string) => {
    saveExpense(expense);
    setParsedExpenses(prev => prev.filter(p => p.fileId !== fileId));
    setSavedCount(prev => prev + 1);
    toast.success(`Saved: ${expense.vendor}`);
  }, []);

  const handleDiscardExpense = useCallback((fileId: string) => {
    setParsedExpenses(prev => prev.filter(p => p.fileId !== fileId));
    handleRemoveFile(fileId);
  }, [handleRemoveFile]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Upload Receipts</h1>
        <p className="text-muted-foreground mt-1">
          Upload receipt images and let AI extract the expense data
        </p>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
          <CardDescription>
            Drag and drop receipt images, or use your camera to capture them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadZone
            onFilesUploaded={handleFilesUploaded}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        </CardContent>
      </Card>

      {/* Parsed Expenses */}
      {parsedExpenses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Review Parsed Expenses</h2>
          {parsedExpenses.map(({ expense, preview, fileId }) => (
            <ParsedExpenseCard
              key={fileId}
              expense={expense}
              receiptPreview={preview}
              onSave={(exp) => handleSaveExpense(exp, fileId)}
              onDiscard={() => handleDiscardExpense(fileId)}
            />
          ))}
        </div>
      )}

      {/* Success Summary */}
      {savedCount > 0 && parsedExpenses.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">
                  {savedCount} expense{savedCount > 1 ? 's' : ''} saved successfully!
                </p>
                <p className="text-sm text-green-600">
                  Upload more receipts or view your expenses
                </p>
              </div>
            </div>
            <Button onClick={() => router.push('/expenses')}>
              View Expenses
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
