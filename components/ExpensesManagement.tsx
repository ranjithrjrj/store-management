// FILE PATH: components/ExpensesManagement.tsx
// Modern Expenses Management with comprehensive filtering and stats

'use client';
import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Trash2, X, Search, Calendar, FileText, TrendingUp, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Textarea, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type Expense = {
  id: string;
  expense_number: string;
  category_id: string;
  category?: { id: string; name: string };
  expense_date: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  vendor_name?: string;
  description?: string;
  notes?: string;
  is_recurring?: boolean;
  recurrence_period?: string;
  next_due_date?: string;
  created_at: string;
};

type ExpenseCategory = {
  id: string;
  name: string;
};

const ExpensesManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<{ id: string; description: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    description: '',
    vendor_name: '',
    amount: 0,
    category_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });

  const paymentMethods = ['cash', 'card', 'upi', 'bank_transfer', 'cheque'];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load categories
      const { data: categoriesData, error: catError } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');

      if (catError) throw catError;
      setCategories(categoriesData || []);

      // Load expenses
      const { data: expensesData, error: expError } = await supabase
        .from('expenses')
        .select(`
          *,
          category:expense_categories(id, name)
        `)
        .order('expense_date', { ascending: false });

      if (expError) throw expError;
      setExpenses(expensesData || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      toast.error('Failed to load', 'Could not load expenses.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setEditingExpense(null);
    setFormData({
      description: '',
      vendor_name: '',
      amount: 0,
      category_id: '',
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      reference_number: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description || '',
      vendor_name: expense.vendor_name || '',
      amount: expense.amount,
      category_id: expense.category_id,
      expense_date: expense.expense_date,
      payment_method: expense.payment_method || 'cash',
      reference_number: expense.reference_number || '',
      notes: expense.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      if (!formData.description.trim()) {
        toast.warning('Description required', 'Please enter expense description.');
        return;
      }

      if (formData.amount <= 0) {
        toast.warning('Amount required', 'Please enter a valid amount.');
        return;
      }

      if (!formData.category_id) {
        toast.warning('Category required', 'Please select a category.');
        return;
      }

      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(formData)
          .eq('id', editingExpense.id);

        if (error) throw error;
        toast.success('Updated!', `Expense "${formData.description}" has been updated.`);
      } else {
        const expenseData = {
          ...formData,
          expense_number: `EXP-${Date.now()}`
        };

        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);

        if (error) throw error;
        toast.success('Created!', `Expense "${formData.description}" has been added.`);
      }

      await loadData();
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving expense:', err);
      toast.error('Failed to save', err.message || 'Could not save expense.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string, description: string) => {
    setDeletingExpense({ id, description });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', deletingExpense.id);

      if (error) throw error;
      await loadData();
      toast.success('Deleted', `Expense "${deletingExpense.description}" has been removed.`);
      setShowDeleteConfirm(false);
      setDeletingExpense(null);
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      toast.error('Failed to delete', err.message || 'Could not delete expense.');
    }
  };

  const filteredExpenses = expenses
    .filter(expense => {
      const categoryName = expense.category?.name || '';
      const matchesSearch = (expense.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (expense.vendor_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || expense.category_id === filterCategory;
      const matchesPayment = filterPaymentMethod === 'all' || expense.payment_method === filterPaymentMethod;
      
      const expenseDate = new Date(expense.expense_date);
      const matchesDateFrom = !filterDateFrom || expenseDate >= new Date(filterDateFrom);
      const matchesDateTo = !filterDateTo || expenseDate <= new Date(filterDateTo);

      return matchesSearch && matchesCategory && matchesPayment && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      if (sortBy === 'date') {
        aVal = new Date(a.expense_date).getTime();
        bVal = new Date(b.expense_date).getTime();
      } else if (sortBy === 'amount') {
        aVal = a.amount;
        bVal = b.amount;
      } else {
        aVal = a.category?.name || '';
        bVal = b.category?.name || '';
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const categoryTotals = filteredExpenses.reduce((acc, exp) => {
    const catName = exp.category?.name || 'Uncategorized';
    acc[catName] = (acc[catName] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses Management</h2>
          <p className="text-gray-600 text-sm mt-1">Track and manage business expenses</p>
        </div>
        <Card>
          <div className="py-12">
            <LoadingSpinner size="lg" text="Loading expenses..." />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses Management</h2>
          <p className="text-gray-600 text-sm mt-1">Track and manage business expenses</p>
        </div>
        <Button onClick={handleAddNew} variant="primary" size="md" icon={<Plus size={18} />}>
          Add Expense
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <DollarSign className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalExpenses.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <FileText className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{filteredExpenses.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Top Category</p>
              <p className="text-lg font-bold text-gray-900">{topCategory?.[0] || 'N/A'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by description or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
              rightIcon={searchTerm ? (
                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              ) : undefined}
            />
          </div>
          
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="md:w-48"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="category">Sort by Category</option>
          </Select>
          
          <Button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            variant="secondary"
            size="md"
          >
            {sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </Button>
          
          <Button
            onClick={() => setShowFilterModal(true)}
            variant="secondary"
            size="md"
            icon={<Filter size={18} />}
            className="relative"
          >
            Filters
            {(filterCategory !== 'all' || filterPaymentMethod !== 'all' || filterDateFrom || filterDateTo) && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {[filterCategory !== 'all', filterPaymentMethod !== 'all', filterDateFrom, filterDateTo].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>
      </Card>

      {/* Active Filters */}
      {(filterCategory !== 'all' || filterPaymentMethod !== 'all' || filterDateFrom || filterDateTo) && (
        <div className="flex flex-wrap gap-2">
          {filterCategory !== 'all' && (
            <Badge variant="primary">
              Category: {categories.find(c => c.id === filterCategory)?.name || filterCategory}
              <button onClick={() => setFilterCategory('all')} className="ml-2">×</button>
            </Badge>
          )}
          {filterPaymentMethod !== 'all' && (
            <Badge variant="primary">
              Payment: {filterPaymentMethod.replace('_', ' ')}
              <button onClick={() => setFilterPaymentMethod('all')} className="ml-2">×</button>
            </Badge>
          )}
          {filterDateFrom && (
            <Badge variant="primary">
              From: {new Date(filterDateFrom).toLocaleDateString()}
              <button onClick={() => setFilterDateFrom('')} className="ml-2">×</button>
            </Badge>
          )}
          {filterDateTo && (
            <Badge variant="primary">
              To: {new Date(filterDateTo).toLocaleDateString()}
              <button onClick={() => setFilterDateTo('')} className="ml-2">×</button>
            </Badge>
          )}
          <button 
            onClick={() => { setFilterCategory('all'); setFilterPaymentMethod('all'); setFilterDateFrom(''); setFilterDateTo(''); }}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Expenses List */}
      <Card padding="none">
        {filteredExpenses.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<DollarSign size={48} />}
              title={searchTerm || filterCategory !== 'all' ? "No expenses found" : "No expenses yet"}
              description={
                searchTerm || filterCategory !== 'all'
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first expense"
              }
              action={
                searchTerm || filterCategory !== 'all' ? (
                  <Button onClick={() => { setSearchTerm(''); setFilterCategory('all'); setFilterPaymentMethod('all'); }} variant="secondary">
                    Clear Filters
                  </Button>
                ) : (
                  <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                    Add Your First Expense
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(expense.expense_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{expense.description || expense.vendor_name || 'N/A'}</p>
                      {expense.vendor_name && expense.description && (
                        <p className="text-xs text-gray-500 mt-1">Vendor: {expense.vendor_name}</p>
                      )}
                      {expense.notes && (
                        <p className="text-xs text-gray-500 mt-1">{expense.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral" size="sm">{expense.category?.name || 'Uncategorized'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {(expense.payment_method || 'cash').replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ₹{expense.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className={`${theme.classes.textPrimary} hover:${theme.classes.bgPrimaryLight} p-2 rounded-lg transition-colors`}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(expense.id, expense.description)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Summary Footer */}
      {filteredExpenses.length > 0 && (
        <div className="text-sm text-gray-600 text-right">
          Showing {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} • Total: ₹{totalExpenses.toLocaleString('en-IN')}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600" disabled={saving}>
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Description"
                  placeholder="e.g., Office supplies purchase"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  leftIcon={<FileText size={18} />}
                />

                <Input
                  label="Vendor Name"
                  placeholder="e.g., ABC Suppliers"
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  leftIcon={<FileText size={18} />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                  leftIcon={<DollarSign size={18} />}
                />

                <Input
                  label="Date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  required
                  leftIcon={<Calendar size={18} />}
                />

                <Select
                  label="Category"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>

                <Select
                  label="Payment Method"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </Select>

                <Input
                  label="Reference Number"
                  placeholder="e.g., CHQ123, REF456"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  leftIcon={<FileText size={18} />}
                />
              </div>

              <Textarea
                label="Notes"
                placeholder="Additional notes (optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <Button onClick={() => setShowModal(false)} variant="secondary" fullWidth disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} variant="primary" fullWidth disabled={saving}>
                {saving ? 'Saving...' : editingExpense ? 'Update Expense' : 'Add Expense'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Filter Expenses</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <Select
                label="Category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>

              <Select
                label="Payment Method"
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
              >
                <option value="all">All Methods</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method.replace('_', ' ').toUpperCase()}</option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="From Date"
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
                <Input
                  label="To Date"
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                onClick={() => {
                  setFilterCategory('all');
                  setFilterPaymentMethod('all');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                variant="secondary"
                fullWidth
              >
                Clear Filters
              </Button>
              <Button
                onClick={() => setShowFilterModal(false)}
                variant="primary"
                fullWidth
              >
                Apply Filters
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingExpense(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense"
        message={deletingExpense ? `Are you sure you want to delete "${deletingExpense.description}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default ExpensesManagement;
