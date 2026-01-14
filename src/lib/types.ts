export type ExpenseCategory = 'Travel' | 'Meals' | 'Supplies' | 'Mileage' | 'Other';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface Expense {
  id: string;
  receiptUrl: string;
  date: string; // YYYY-MM-DD
  vendor: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paymentMethod: string;
  notes?: string;
  projectCode?: string;
  groupId?: string;
  createdAt: string;
  confidence: ConfidenceLevel;
}

export interface ExpenseGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface ParsedReceiptData {
  date: string;
  vendor: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paymentMethod: string;
  confidence: ConfidenceLevel;
}
