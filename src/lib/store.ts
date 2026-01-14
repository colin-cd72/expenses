import { Expense, ExpenseGroup } from './types';

const EXPENSES_KEY = 'expenses';
const GROUPS_KEY = 'expense_groups';

export function getExpenses(): Expense[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(EXPENSES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveExpense(expense: Expense): void {
  const expenses = getExpenses();
  const index = expenses.findIndex(e => e.id === expense.id);
  if (index >= 0) {
    expenses[index] = expense;
  } else {
    expenses.push(expense);
  }
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function deleteExpense(id: string): void {
  const expenses = getExpenses().filter(e => e.id !== id);
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function getGroups(): ExpenseGroup[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(GROUPS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveGroup(group: ExpenseGroup): void {
  const groups = getGroups();
  const index = groups.findIndex(g => g.id === group.id);
  if (index >= 0) {
    groups[index] = group;
  } else {
    groups.push(group);
  }
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

export function deleteGroup(id: string): void {
  const groups = getGroups().filter(g => g.id !== id);
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
