// FILE PATH: components/ExpensesManagement.tsx
// Expenses Management with Select/Textarea components and improved mobile UX

'use client';
import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Trash2, X, Search, Calendar, FileText } from 'lucide-react';
import { expensesAPI } from '@/lib/supabase';
import { Button, Card, Input, Select, Textarea, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string | { id: string; name: string } | null;
  expense_date: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
};

const ExpensesManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<{ id: string; description: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter & Sort states
  const [filters, setFilters] = useState({
    categories: [] as string[],
    paymentMethods: [] as string[],
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: ''
  });
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    notes: ''
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      setLoading(true);
      setError(null);
      const data = await expensesAPI.getAll();
      setExpenses(data || []);
    } catch (err: any) {
      console.error('Error loading expenses:', err);
      setError(err.message || 'Failed to load expenses');
      toast.error('Failed to load', 'Could not load expenses. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setEditingExpense(null);
    setFormData({
      description: '',
      amount: 0,
      category: '',
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    
    const categoryValue = typeof expense.category === 'object' && expense.category !== null
      ? expense.category.id
      : expense.category || '';
    
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: categoryValue,
      expense_date: expense.expense_date,
      payment_method: expense.payment_method || 'Cash',
      notes: expense.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.description.trim()) {
        toast.warning('Description required', 'Please enter expense description.');
        return;
      }

      if (formData.amount <= 0) {
        toast.warning('Amount required', 'Please enter a valid amount.');
        return;
      }

      if (!formData.category.trim()) {
        toast.warning('Category required', 'Please select or enter a category.');
        return;
      }

      if (editingExpense) {
        await expensesAPI.update(editingExpense.id, formData as any);
        toast.success('Updated!', `Expense "${formData.description}" has been updated.`);
      } else {
        await expensesAPI.create(formData as any);
        toast.success('Created!', `Expense "${formData.description}" has been added.`);
      }

      await loadExpenses();
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
      await expensesAPI.delete(deletingExpense.id);
      await loadExpenses();
      toast.success('Deleted', `Expense "${deletingExpense.description}" has been removed.`);
      setShowDeleteConfirm(false);
      setDeletingExpense(null);
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      toast.error('Failed to delete', err.message || 'Could not delete expense.');
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const categoryStr = typeof expense.category === 'string' 
      ? expense.category 
      : (expense.category?.name || '');
    
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         categoryStr.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filters.categories.length === 0 || 
                           filters.categories.includes(categoryStr);
    
    const matchesPayment = filters.paymentMethods.length === 0 || 
                          filters.paymentMethods.includes(expense.payment_method || '');
    
    const matchesDateFrom = !filters.dateFrom || expense.expense_date >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || expense.expense_date <= filters.dateTo;
    
    const matchesAmountMin = !filters.amountMin || expense.amount >= parseFloat(filters.amountMin);
    const matchesAmountMax = !filters.amountMax || expense.amount <= parseFloat(filters.amountMax);

    return matchesSearch && matchesCategory && matchesPayment && 
           matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.expense_date).getTime();
      const dateB = new Date(b.expense_date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryGroups = {
    'Facilities': ['Rent', 'Electricity', 'Water', 'Internet', 'Phone', 'Cleaning', 'Security'],
    'Human Resources': ['Salaries', 'Wages', 'Employee Benefits', 'Training', 'Recruitment'],
    'Inventory & Supplies': ['Inventory Purchase', 'Raw Materials', 'Packaging', 'Office Supplies'],
    'Marketing & Sales': ['Advertising', 'Social Media', 'Promotions', 'Website', 'Print Materials'],
    'Transportation': ['Fuel', 'Vehicle Maintenance', 'Shipping', 'Delivery Charges', 'Freight'],
    'Maintenance & Repairs': ['Equipment Repair', 'Building Maintenance', 'Plumbing', 'Electrical Work'],
    'Financial & Legal': ['Bank Charges', 'Interest', 'Insurance', 'Taxes', 'License Fees', 'Legal Fees', 'Accounting'],
    'Professional Services': ['Consulting', 'IT Services', 'Audit Fees', 'Professional Memberships'],
    'Equipment & Assets': ['Equipment Purchase', 'Furniture', 'Tools', 'Computers', 'Software', 'Subscriptions'],
    'Travel & Entertainment': ['Travel', 'Accommodation', 'Meals', 'Client Entertainment', 'Team Events'],
    'Miscellaneous': ['Donations', 'Penalties', 'Losses', 'Miscellaneous', 'Other']
  };

  const paymentMethods = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque'];

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses Management</h2>
          <p className="text-gray-600 text-sm mt-1">Track and manage business expenses</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <DollarSign size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="font-bold text-red-800 mb-2">Failed to Load Expenses</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={loadExpenses} variant="primary">Try Again</Button>
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

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-9">
          <Card padding="md">
            <Input
              leftIcon={<Search size={18} />}
              rightIcon={searchTerm ? (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              ) : undefined}
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Card>
        </div>

        <div className="md:col-span-3">
          <Button
            onClick={() => setShowFilterModal(true)}
            variant="secondary"
            size="md"
            fullWidth
            className="h-full"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter & Sort
              {(filters.categories.length > 0 || filters.paymentMethods.length > 0 || 
                filters.dateFrom || filters.dateTo || filters.amountMin || filters.amountMax) && (
                <Badge variant="primary" size="sm">Active</Badge>
              )}
            </div>
          </Button>
        </div>
      </div>

      {/* Total Card */}
      {!loading && filteredExpenses.length > 0 && (
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalExpenses.toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-lg ${theme.classes.bgPrimaryLight}`}>
              <DollarSign size={24} className={theme.classes.textPrimary} />
            </div>
          </div>
        </Card>
      )}

      {/* Expenses List */}
      <Card padding="none">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" text="Loading expenses..." />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<DollarSign size={48} />}
              title={searchTerm ? "No expenses found" : "No expenses yet"}
              description={
                searchTerm
                  ? "Try adjusting your search or filters"
                  : "Get started by recording your first expense"
              }
              action={
                !searchTerm ? (
                  <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                    Add Your First Expense
                  </Button>
                ) : (
                  <Button onClick={() => { setSearchTerm(''); setFilters({ categories: [], paymentMethods: [], dateFrom: '', dateTo: '', amountMin: '', amountMax: '' }); }} variant="secondary">
                    Clear Filters
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredExpenses.map((expense) => {
              const categoryStr = typeof expense.category === 'string' 
                ? expense.category 
                : (expense.category?.name || 'Uncategorized');
              
              return (
                <div key={expense.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                        <Badge variant="neutral" size="sm">{categoryStr}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                        </div>
                        {expense.payment_method && (
                          <div className="flex items-center gap-1">
                            <DollarSign size={14} />
                            <span>{expense.payment_method}</span>
                          </div>
                        )}
                      </div>
                      {expense.notes && (
                        <p className="text-sm text-gray-500 mt-2">{expense.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">₹{expense.amount.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleEdit(expense)}
                        className={`${theme.classes.textPrimary} hover:${theme.classes.bgPrimaryLight} p-2 rounded-lg transition-colors`}
                        title="Edit expense"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(expense.id, expense.description)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Delete expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Stats */}
      {!loading && expenses.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredExpenses.length} of {expenses.length} expenses
        </div>
      )}

      {/* Filter & Sort Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Filter & Sort</h3>
                <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Sort Section */}
                <div className="pb-6 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Sort By</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Field"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                    >
                      <option value="date">Date</option>
                      <option value="amount">Amount</option>
                    </Select>
                    
                    <Select
                      label="Order"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    >
                      <option value="asc">Oldest / Low to High</option>
                      <option value="desc">Newest / High to Low</option>
                    </Select>
                  </div>
                </div>

                {/* Date Range */}
                <div className="pb-6 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Date Range</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="date"
                      label="From"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    />
                    <Input
                      type="date"
                      label="To"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    />
                  </div>
                </div>

                {/* Amount Range */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Amount Range</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.amountMin}
                      onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.amountMax}
                      onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setFilters({ categories: [], paymentMethods: [], dateFrom: '', dateTo: '', amountMin: '', amountMax: '' });
                    setSortBy('date');
                    setSortOrder('desc');
                  }}
                  variant="secondary"
                  fullWidth
                >
                  Clear All
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
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Description"
                  placeholder="Enter expense description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    leftIcon={<DollarSign size={18} />}
                    required
                  />

                  <Input
                    label="Date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    leftIcon={<Calendar size={18} />}
                    required
                  />

                  <Select
                    label="Category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select category</option>
                    {Object.entries(categoryGroups).map(([group, subcats]) => (
                      <optgroup key={group} label={group}>
                        {subcats.map(subcat => (
                          <option key={subcat} value={subcat}>{subcat}</option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>

                  <Select
                    label="Payment Method"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </Select>
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
                  {saving ? 'Saving...' : editingExpense ? 'Update' : 'Create'}
                </Button>
              </div>
            </Card>
          </div>
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
