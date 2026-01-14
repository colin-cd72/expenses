'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getExpenses } from '@/lib/store';
import { Expense, ExpenseCategory } from '@/lib/types';
import { Upload, Receipt, FileText, DollarSign, Calendar, TrendingUp } from 'lucide-react';

const categoryColors: Record<ExpenseCategory, string> = {
  Travel: 'bg-blue-100 text-blue-800',
  Meals: 'bg-green-100 text-green-800',
  Supplies: 'bg-purple-100 text-purple-800',
  Mileage: 'bg-orange-100 text-orange-800',
  Other: 'bg-gray-100 text-gray-800',
};

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setExpenses(getExpenses());
  }, []);

  if (!mounted) {
    return null;
  }

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonth = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() &&
           expenseDate.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonth.reduce((sum, e) => sum + e.amount, 0);

  const categoryBreakdown = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Upload receipts, track expenses, and export for Workday
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/upload">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Upload Receipts</CardTitle>
                <CardDescription>Drag & drop or use camera</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/expenses">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">View Expenses</CardTitle>
                <CardDescription>{expenses.length} total expenses</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Export Reports</CardTitle>
                <CardDescription>CSV, print, or copy</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} receipts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${thisMonthTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {thisMonth.length} receipts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Category
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {Object.keys(categoryBreakdown).length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0]?.[1]?.toFixed(2) || '0.00'}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">N/A</div>
                <p className="text-xs text-muted-foreground">No expenses yet</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Your latest uploaded receipts</CardDescription>
        </CardHeader>
        <CardContent>
          {recentExpenses.length > 0 ? (
            <div className="space-y-4">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{expense.vendor}</p>
                      <p className="text-sm text-muted-foreground">{expense.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={categoryColors[expense.category]}>
                      {expense.category}
                    </Badge>
                    <span className="font-semibold">
                      ${expense.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
              <Link href="/expenses">
                <Button variant="outline" className="w-full mt-2">
                  View All Expenses
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No expenses yet</p>
              <Link href="/upload">
                <Button className="mt-4">Upload Your First Receipt</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
