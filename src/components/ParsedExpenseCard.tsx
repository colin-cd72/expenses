'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Expense, ExpenseCategory, ConfidenceLevel } from '@/lib/types';
import { Check, Edit2, X } from 'lucide-react';

interface ParsedExpenseCardProps {
  expense: Expense;
  receiptPreview: string;
  onSave: (expense: Expense) => void;
  onDiscard: () => void;
}

const categories: ExpenseCategory[] = ['Travel', 'Meals', 'Supplies', 'Mileage', 'Other'];

const confidenceColors: Record<ConfidenceLevel, string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-red-100 text-red-800',
};

export function ParsedExpenseCard({ expense, receiptPreview, onSave, onDiscard }: ParsedExpenseCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedExpense, setEditedExpense] = useState(expense);

  const handleSave = () => {
    onSave(editedExpense);
  };

  const handleFieldChange = (field: keyof Expense, value: string | number) => {
    setEditedExpense(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Receipt Preview */}
        <div className="aspect-square md:aspect-auto bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={receiptPreview}
            alt="Receipt"
            className="object-contain w-full h-full max-h-96"
          />
        </div>

        {/* Parsed Data */}
        <div className="p-4">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Parsed Receipt</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={confidenceColors[expense.confidence]}>
                  {expense.confidence} confidence
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            {/* Vendor */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Vendor</label>
              {isEditing ? (
                <Input
                  value={editedExpense.vendor}
                  onChange={(e) => handleFieldChange('vendor', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-lg font-semibold">{editedExpense.vendor}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editedExpense.date}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-lg">{editedExpense.date}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Amount</label>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.01"
                  value={editedExpense.amount}
                  onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              ) : (
                <p className="text-lg font-semibold">
                  ${editedExpense.amount.toFixed(2)} {editedExpense.currency}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              {isEditing ? (
                <Select
                  value={editedExpense.category}
                  onValueChange={(value) => handleFieldChange('category', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-lg">{editedExpense.category}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
              {isEditing ? (
                <Input
                  value={editedExpense.paymentMethod}
                  onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-lg">{editedExpense.paymentMethod}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Notes (optional)</label>
              <Input
                value={editedExpense.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Add notes..."
                className="mt-1"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Save Expense
              </Button>
              <Button variant="outline" onClick={onDiscard}>
                <X className="h-4 w-4 mr-2" />
                Discard
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
