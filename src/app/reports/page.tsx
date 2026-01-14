'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { getExpenses, getGroups } from '@/lib/store';
import { Expense, ExpenseCategory, ExpenseGroup } from '@/lib/types';
import { toast } from 'sonner';
import {
  Download,
  Copy,
  Check,
  Printer,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';

const categoryColors: Record<ExpenseCategory, string> = {
  Travel: 'bg-blue-100 text-blue-800',
  Meals: 'bg-green-100 text-green-800',
  Supplies: 'bg-purple-100 text-purple-800',
  Mileage: 'bg-orange-100 text-orange-800',
  Other: 'bg-gray-100 text-gray-800',
};

export default function ReportsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<ExpenseGroup[]>([]);
  const [mounted, setMounted] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setExpenses(getExpenses());
    setGroups(getGroups());

    // Default date range: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Date filter
    if (dateFrom) {
      result = result.filter(e => e.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(e => e.date <= dateTo);
    }

    // Group filter
    if (groupFilter !== 'all') {
      if (groupFilter === 'ungrouped') {
        result = result.filter(e => !e.groupId);
      } else {
        result = result.filter(e => e.groupId === groupFilter);
      }
    }

    // Sort by date
    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return result;
  }, [expenses, dateFrom, dateTo, groupFilter]);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, { count: number; amount: number }> = {};
    filteredExpenses.forEach(e => {
      if (!totals[e.category]) {
        totals[e.category] = { count: 0, amount: 0 };
      }
      totals[e.category].count++;
      totals[e.category].amount += e.amount;
    });
    return totals;
  }, [filteredExpenses]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copied to clipboard');
  };

  const handleCopyAll = () => {
    const text = filteredExpenses
      .map(e => `${e.date}\t${e.vendor}\t${e.category}\t$${e.amount.toFixed(2)}\t${e.paymentMethod}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success('All expenses copied to clipboard');
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Vendor', 'Category', 'Amount', 'Currency', 'Payment Method', 'Notes'];
    const rows = filteredExpenses.map(e => [
      e.date,
      e.vendor,
      e.category,
      e.amount.toFixed(2),
      e.currency,
      e.paymentMethod,
      e.notes || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Export and copy expense data for Workday
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopyAll}>
            <Copy className="h-4 w-4 mr-2" />
            Copy All
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Group</label>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Expenses</SelectItem>
                  <SelectItem value="ungrouped">Ungrouped</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No expenses in this date range</p>
            <Link href="/upload">
              <Button className="mt-4">Upload Receipts</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredExpenses.length} item{filteredExpenses.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            {Object.entries(categoryTotals).slice(0, 3).map(([category, data]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${data.amount.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.count} item{data.count !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Printable Report */}
          <div ref={printRef} className="print:p-8">
            <Card className="print:border-0 print:shadow-none">
              <CardHeader className="print:pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Expense Report</CardTitle>
                    <CardDescription>
                      {dateFrom} to {dateTo}
                    </CardDescription>
                  </div>
                  <div className="text-right print:block hidden">
                    <p className="font-semibold">Total: ${totalAmount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {filteredExpenses.length} expenses
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="table" className="print:hidden">
                  <TabsList>
                    <TabsTrigger value="table">Table View</TabsTrigger>
                    <TabsTrigger value="cards">Copy Cards</TabsTrigger>
                  </TabsList>

                  <TabsContent value="table" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="print:hidden"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExpenses.map(expense => (
                          <TableRow key={expense.id}>
                            <TableCell>{expense.date}</TableCell>
                            <TableCell className="font-medium">{expense.vendor}</TableCell>
                            <TableCell>
                              <Badge className={categoryColors[expense.category]}>
                                {expense.category}
                              </Badge>
                            </TableCell>
                            <TableCell>{expense.paymentMethod}</TableCell>
                            <TableCell className="text-right font-semibold">
                              ${expense.amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="print:hidden">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(
                                  `${expense.date}\t${expense.vendor}\t${expense.category}\t$${expense.amount.toFixed(2)}`,
                                  expense.id
                                )}
                              >
                                {copiedField === expense.id ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold">
                          <TableCell colSpan={4}>Total</TableCell>
                          <TableCell className="text-right">
                            ${totalAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="print:hidden"></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="cards" className="mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Click any field to copy it to your clipboard for easy pasting into Workday
                    </p>
                    <div className="space-y-4">
                      {filteredExpenses.map(expense => (
                        <Card key={expense.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              <CopyableField
                                label="Date"
                                value={expense.date}
                                onCopy={handleCopy}
                                copiedField={copiedField}
                              />
                              <CopyableField
                                label="Vendor"
                                value={expense.vendor}
                                onCopy={handleCopy}
                                copiedField={copiedField}
                              />
                              <CopyableField
                                label="Category"
                                value={expense.category}
                                onCopy={handleCopy}
                                copiedField={copiedField}
                              />
                              <CopyableField
                                label="Amount"
                                value={`$${expense.amount.toFixed(2)}`}
                                onCopy={handleCopy}
                                copiedField={copiedField}
                              />
                              <CopyableField
                                label="Payment"
                                value={expense.paymentMethod}
                                onCopy={handleCopy}
                                copiedField={copiedField}
                              />
                            </div>
                            {expense.notes && (
                              <div className="mt-2 pt-2 border-t">
                                <CopyableField
                                  label="Notes"
                                  value={expense.notes}
                                  onCopy={handleCopy}
                                  copiedField={copiedField}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Print-only table */}
                <div className="hidden print:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map(expense => (
                        <TableRow key={expense.id}>
                          <TableCell>{expense.date}</TableCell>
                          <TableCell>{expense.vendor}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell>{expense.paymentMethod}</TableCell>
                          <TableCell className="text-right">
                            ${expense.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold">
                        <TableCell colSpan={4}>Total</TableCell>
                        <TableCell className="text-right">
                          ${totalAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoryTotals).map(([category, data]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={categoryColors[category as ExpenseCategory]}>
                        {category}
                      </Badge>
                      <span className="text-muted-foreground">
                        {data.count} expense{data.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="font-semibold">${data.amount.toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between font-bold">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          nav, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Copyable Field Component
function CopyableField({
  label,
  value,
  onCopy,
  copiedField,
}: {
  label: string;
  value: string;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
}) {
  const fieldId = `${label}-${value}`;
  const isCopied = copiedField === fieldId;

  return (
    <button
      onClick={() => onCopy(value, fieldId)}
      className="text-left p-2 rounded-md hover:bg-muted transition-colors group w-full"
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium flex items-center gap-2">
        {value}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
          {isCopied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </span>
      </p>
    </button>
  );
}
