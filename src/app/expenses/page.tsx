'use client';

import { useEffect, useState, useMemo } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getExpenses, deleteExpense, saveExpense, getGroups, saveGroup, generateId } from '@/lib/store';
import { Expense, ExpenseCategory, ExpenseGroup } from '@/lib/types';
import { toast } from 'sonner';
import {
  Search,
  Grid3X3,
  List,
  Trash2,
  Edit2,
  Copy,
  Check,
  FolderPlus,
  X,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';

const categories: ExpenseCategory[] = ['Travel', 'Meals', 'Supplies', 'Mileage', 'Other'];

const categoryColors: Record<ExpenseCategory, string> = {
  Travel: 'bg-blue-100 text-blue-800',
  Meals: 'bg-green-100 text-green-800',
  Supplies: 'bg-purple-100 text-purple-800',
  Mileage: 'bg-orange-100 text-orange-800',
  Other: 'bg-gray-100 text-gray-800',
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<ExpenseGroup[]>([]);
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'vendor'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Edit modal state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New group modal state
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedForGroup, setSelectedForGroup] = useState<Set<string>>(new Set());

  // Copied state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setExpenses(getExpenses());
    setGroups(getGroups());
  }, []);

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.vendor.toLowerCase().includes(query) ||
        e.notes?.toLowerCase().includes(query) ||
        e.date.includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(e => e.category === categoryFilter);
    }

    // Group filter
    if (groupFilter !== 'all') {
      if (groupFilter === 'ungrouped') {
        result = result.filter(e => !e.groupId);
      } else {
        result = result.filter(e => e.groupId === groupFilter);
      }
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'vendor') {
        comparison = a.vendor.localeCompare(b.vendor);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [expenses, searchQuery, categoryFilter, groupFilter, sortBy, sortOrder]);

  const handleDelete = (id: string) => {
    deleteExpense(id);
    setExpenses(getExpenses());
    setDeletingId(null);
    toast.success('Expense deleted');
  };

  const handleSaveEdit = () => {
    if (editingExpense) {
      saveExpense(editingExpense);
      setExpenses(getExpenses());
      setEditingExpense(null);
      toast.success('Expense updated');
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copied to clipboard');
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;

    const group: ExpenseGroup = {
      id: generateId(),
      name: newGroupName.trim(),
      createdAt: new Date().toISOString(),
    };
    saveGroup(group);

    // Assign selected expenses to group
    selectedForGroup.forEach(expenseId => {
      const expense = expenses.find(e => e.id === expenseId);
      if (expense) {
        saveExpense({ ...expense, groupId: group.id });
      }
    });

    setGroups(getGroups());
    setExpenses(getExpenses());
    setShowNewGroup(false);
    setNewGroupName('');
    setSelectedForGroup(new Set());
    toast.success(`Created group: ${group.name}`);
  };

  const toggleSelectForGroup = (id: string) => {
    setSelectedForGroup(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground mt-1">
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
            {filteredExpenses.length > 0 && (
              <> totaling ${filteredExpenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedForGroup.size > 0 && (
            <Button onClick={() => setShowNewGroup(true)} variant="outline">
              <FolderPlus className="h-4 w-4 mr-2" />
              Group ({selectedForGroup.size})
            </Button>
          )}
          <Link href="/upload">
            <Button>Add Expense</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                <SelectItem value="ungrouped">Ungrouped</SelectItem>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={view === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Display */}
      {filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No expenses found</p>
            <Link href="/upload">
              <Button className="mt-4">Upload Your First Receipt</Button>
            </Link>
          </CardContent>
        </Card>
      ) : view === 'table' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    if (sortBy === 'date') setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('date'); setSortOrder('desc'); }
                  }}
                >
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    if (sortBy === 'vendor') setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('vendor'); setSortOrder('asc'); }
                  }}
                >
                  Vendor {sortBy === 'vendor' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => {
                    if (sortBy === 'amount') setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('amount'); setSortOrder('desc'); }
                  }}
                >
                  Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map(expense => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedForGroup.has(expense.id)}
                      onChange={() => toggleSelectForGroup(expense.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell className="font-medium">{expense.vendor}</TableCell>
                  <TableCell>
                    <Badge className={categoryColors[expense.category]}>
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${expense.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(
                          `${expense.date}\t${expense.vendor}\t${expense.category}\t$${expense.amount.toFixed(2)}`,
                          expense.id
                        )}
                      >
                        {copiedField === expense.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingExpense(expense)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(expense.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExpenses.map(expense => (
            <Card key={expense.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedForGroup.has(expense.id)}
                      onChange={() => toggleSelectForGroup(expense.id)}
                      className="rounded"
                    />
                    <CardTitle className="text-lg">{expense.vendor}</CardTitle>
                  </div>
                  <Badge className={categoryColors[expense.category]}>
                    {expense.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{expense.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">${expense.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span>{expense.paymentMethod}</span>
                </div>
                {expense.notes && (
                  <p className="text-sm text-muted-foreground pt-2 border-t">
                    {expense.notes}
                  </p>
                )}
                <div className="flex gap-1 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCopy(
                      `${expense.date}\t${expense.vendor}\t${expense.category}\t$${expense.amount.toFixed(2)}`,
                      expense.id
                    )}
                  >
                    {copiedField === expense.id ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingExpense(expense)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingId(expense.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Make changes to the expense details</DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Vendor</label>
                <Input
                  value={editingExpense.vendor}
                  onChange={(e) => setEditingExpense({ ...editingExpense, vendor: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={editingExpense.date}
                  onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={editingExpense.category}
                  onValueChange={(value) => setEditingExpense({ ...editingExpense, category: value as ExpenseCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  value={editingExpense.notes || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExpense(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingId && handleDelete(deletingId)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Group Dialog */}
      <Dialog open={showNewGroup} onOpenChange={setShowNewGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Expense Group</DialogTitle>
            <DialogDescription>
              Group {selectedForGroup.size} selected expense{selectedForGroup.size !== 1 ? 's' : ''} together
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Group Name</label>
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g., Q1 2024 Travel, Client Visit"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGroup(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
