// FILE PATH: components/ExpensesManagement.tsx
// Beautiful Modern Expenses Management - Teal & Gold Theme with Table Layout

'use client';
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, Edit2, Trash2, X, Search, Calendar, 
  FileText, TrendingUp, Filter, ChevronDown, Receipt
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Input, Textarea, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
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
  const [showSortDropdown, setShowSortDropdown] = useState(false);
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

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      const { data: categoriesData, error: catError } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');

      if (catError) throw catError;
      setCategories(categoriesData || []);

      const { data: expensesData, error: expError } = await supabase
        .from('expenses')
        .select('*, category:expense_categories(id, name)')
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
      
      if (!formData.amount || formData.amount <= 0) {
        toast.warning('Amount required', 'Please enter a valid amount.');
        return;
      }

      const expenseData = {
        ...formData,
        expense_number: editingExpense?.expense_number || `EXP-${Date.now()}`
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id);

        if (error) throw error;
        toast.success('Updated!', `Expense has been updated.`);
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);

        if (error) throw error;
        toast.success('Created!', `Expense has been added.`);
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
      const { error } = await supabase.from('expenses').delete().eq('id', deletingExpense.id);
      if (error) throw error;
      await loadData();
      toast.success('Deleted', 'Expense has been removed.');
      setShowDeleteConfirm(false);
      setDeletingExpense(null);
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      toast.error('Failed to delete', err.message || 'Could not delete expense.');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterPaymentMethod('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors: any = {
      cash: 'success',
      card: 'primary',
      upi: 'info',
      bank_transfer: 'warning',
      cheque: 'neutral'
    };
    return <Badge variant={colors[method] || 'neutral'} size="sm">{method.toUpperCase()}</Badge>;
  };

  const filteredExpenses = expenses
    .filter(expense => {
      const matchesSearch = 
        (expense.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.vendor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || expense.category_id === filterCategory;
      const matchesPayment = filterPaymentMethod === 'all' || expense.payment_method === filterPaymentMethod;
      
      const expenseDate = new Date(expense.expense_date);
      const matchesDateFrom = !filterDateFrom || expenseDate >= new Date(filterDateFrom);
      const matchesDateTo = !filterDateTo || expenseDate <= new Date(filterDateTo);

      return matchesSearch && matchesCategory && matchesPayment && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      
      if (sortBy === 'date') {
        aVal = new Date(a.expense_date).getTime();
        bVal = new Date(b.expense_date).getTime();
      } else if (sortBy === 'amount') {
        aVal = a.amount;
        bVal = b.amount;
      } else if (sortBy === 'category') {
        aVal = a.category?.name || '';
        bVal = b.category?.name || '';
      } else {
        aVal = a.expense_number;
        bVal = b.expense_number;
      }

      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  const stats = {
    totalExpenses: filteredExpenses.length,
    totalAmount: filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
    topCategory: categories.length > 0 
      ? categories.reduce((prev, curr) => {
          const prevCount = filteredExpenses.filter(e => e.category_id === prev.id).length;
          const currCount = filteredExpenses.filter(e => e.category_id === curr.id).length;
          return currCount > prevCount ? curr : prev;
        }, categories[0])
      : null,
    thisMonth: filteredExpenses.filter(e => {
      const expDate = new Date(e.expense_date);
      const now = new Date();
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + e.amount, 0)
  };

  const hasActiveFilters = 
    filterCategory !== 'all' || 
    filterPaymentMethod !== 'all' || 
    filterDateFrom !== '' || 
    filterDateTo !== '' || 
    searchTerm !== '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl mb-4">
            <LoadingSpinner size="lg" />
          </div>
          <p className="text-slate-700 font-medium">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md">
                <Receipt className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Expenses</h1>
                <p className="text-slate-600 mt-1">Track and manage all expenses</p>
              </div>
            </div>
            <Button 
              onClick={handleAddNew} 
              variant="primary" 
              size="md" 
              icon={<Plus size={20} />}
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md"
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md border border-teal-100 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-teal-100 rounded-lg">
                <FileText className="text-teal-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.totalExpenses}</span>
            </div>
            <p className="text-sm text-slate-600">Total Entries</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-amber-100 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="text-amber-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">₹{(stats.totalAmount / 1000).toFixed(0)}K</span>
            </div>
            <p className="text-sm text-slate-600">Total Amount</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="text-blue-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">₹{(stats.thisMonth / 1000).toFixed(0)}K</span>
            </div>
            <p className="text-sm text-slate-600">This Month</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={20} />
              </div>
              <span className="text-lg font-bold text-slate-900 truncate">{stats.topCategory?.name || 'N/A'}</span>
            </div>
            <p className="text-sm text-slate-600">Top Category</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Button */}
            <Button
              onClick={() => setShowFilterModal(true)}
              variant="secondary"
              size="md"
              icon={<Filter size={18} />}
              className="relative"
            >
              Filters
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                  {[filterCategory !== 'all', filterPaymentMethod !== 'all', filterDateFrom !== '', filterDateTo !== ''].filter(Boolean).length}
                </span>
              )}
            </Button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                onClick={handleClearFilters}
                variant="secondary"
                size="md"
              >
                Clear All
              </Button>
            )}

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-medium text-slate-700">
                  Sort: {sortBy === 'date' ? 'Date' : sortBy === 'amount' ? 'Amount' : sortBy === 'category' ? 'Category' : 'Expense #'}
                </span>
                <ChevronDown size={16} className="text-slate-500" />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                  <button
                    onClick={() => { setSortBy('date'); setSortOrder('desc'); setShowSortDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Date (Newest First)</span>
                    {sortBy === 'date' && sortOrder === 'desc' && <span className="text-teal-600">✓</span>}
                  </button>
                  <button
                    onClick={() => { setSortBy('date'); setSortOrder('asc'); setShowSortDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Date (Oldest First)</span>
                    {sortBy === 'date' && sortOrder === 'asc' && <span className="text-teal-600">✓</span>}
                  </button>
                  <div className="border-t border-slate-200 my-1"></div>
                  <button
                    onClick={() => { setSortBy('amount'); setSortOrder('desc'); setShowSortDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Amount (High to Low)</span>
                    {sortBy === 'amount' && sortOrder === 'desc' && <span className="text-teal-600">✓</span>}
                  </button>
                  <button
                    onClick={() => { setSortBy('amount'); setSortOrder('asc'); setShowSortDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Amount (Low to High)</span>
                    {sortBy === 'amount' && sortOrder === 'asc' && <span className="text-teal-600">✓</span>}
                  </button>
                  <div className="border-t border-slate-200 my-1"></div>
                  <button
                    onClick={() => { setSortBy('category'); setSortOrder('asc'); setShowSortDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Category (A-Z)</span>
                    {sortBy === 'category' && sortOrder === 'asc' && <span className="text-teal-600">✓</span>}
                  </button>
                  <button
                    onClick={() => { setSortBy('category'); setSortOrder('desc'); setShowSortDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Category (Z-A)</span>
                    {sortBy === 'category' && sortOrder === 'desc' && <span className="text-teal-600">✓</span>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200">
              {filterCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                  Category: {categories.find(c => c.id === filterCategory)?.name}
                  <button onClick={() => setFilterCategory('all')} className="hover:text-teal-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              {filterPaymentMethod !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                  Payment: {filterPaymentMethod}
                  <button onClick={() => setFilterPaymentMethod('all')} className="hover:text-amber-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              {filterDateFrom && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  From: {new Date(filterDateFrom).toLocaleDateString('en-IN')}
                  <button onClick={() => setFilterDateFrom('')} className="hover:text-blue-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              {filterDateTo && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  To: {new Date(filterDateTo).toLocaleDateString('en-IN')}
                  <button onClick={() => setFilterDateTo('')} className="hover:text-blue-900">
                    <X size={14} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {filteredExpenses.length === 0 ? (
            <div className="p-12">
              <EmptyState 
                icon={<Receipt size={64} className="text-slate-300" />}
                title={hasActiveFilters ? "No expenses found" : "No expenses yet"}
                description={hasActiveFilters ? "Try adjusting your filters" : "Add your first expense to get started"}
                action={
                  hasActiveFilters ? (
                    <Button onClick={handleClearFilters} variant="secondary">Clear Filters</Button>
                  ) : (
                    <Button onClick={handleAddNew} variant="primary" icon={<Plus size={20} />}>Add First Expense</Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-teal-50 to-amber-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Expense #</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map((expense) => (
                      <tr 
                        key={expense.id}
                        className="hover:bg-teal-50/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-slate-600">{expense.expense_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Calendar size={14} className="text-slate-400" />
                            {new Date(expense.expense_date).toLocaleDateString('en-IN')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">{expense.description || expense.vendor_name || 'N/A'}</p>
                            {expense.notes && (
                              <p className="text-xs text-slate-500 mt-1">{expense.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                            {expense.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-700">{expense.vendor_name || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          {expense.payment_method && getPaymentMethodBadge(expense.payment_method)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900">₹{expense.amount.toLocaleString('en-IN')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(expense.id, expense.description || 'this expense')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
                  <span className="text-slate-600">
                    Showing <span className="font-semibold text-slate-900">{filteredExpenses.length}</span> of <span className="font-semibold text-slate-900">{expenses.length}</span> expenses
                  </span>
                  <span className="text-slate-600">
                    Total: <span className="font-bold text-teal-700">₹{stats.totalAmount.toLocaleString('en-IN')}</span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Filter Expenses</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-white hover:bg-white/20 p-1 rounded transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                <select
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="all">All Methods</option>
                  {paymentMethods.map(pm => (
                    <option key={pm.value} value={pm.value}>{pm.label}</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">From Date</label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">To Date</label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 rounded-b-2xl flex gap-3">
              <Button onClick={handleClearFilters} variant="secondary" fullWidth>
                Clear
              </Button>
              <Button
                onClick={() => setShowFilterModal(false)}
                variant="primary"
                fullWidth
                className="bg-gradient-to-r from-teal-600 to-teal-700"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-6 rounded-t-2xl flex items-center justify-between z-10">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                {editingExpense ? <Edit2 size={24} /> : <Plus size={24} />}
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button onClick={() => setShowModal(false)} disabled={saving} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="What was this expense for?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Vendor Name</label>
                  <input
                    type="text"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., Amazon"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method *</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  >
                    {paymentMethods.map(pm => (
                      <option key={pm.value} value={pm.value}>{pm.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Expense Date *</label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Reference Number</label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Invoice/Receipt #"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    rows={3}
                    placeholder="Additional details..."
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 px-8 py-4 rounded-b-2xl flex gap-3 border-t border-slate-200">
              <Button onClick={() => setShowModal(false)} variant="secondary" fullWidth disabled={saving}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                variant="primary" 
                fullWidth 
                disabled={saving}
                className="bg-gradient-to-r from-teal-600 to-teal-700"
              >
                {saving ? 'Saving...' : editingExpense ? 'Update Expense' : 'Add Expense'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={showDeleteConfirm} 
        onClose={() => { setShowDeleteConfirm(false); setDeletingExpense(null); }} 
        onConfirm={handleDeleteConfirm} 
        title="Delete Expense" 
        message={deletingExpense ? `Are you sure you want to delete "${deletingExpense.description}"? This cannot be undone.` : ''} 
        confirmText="Delete" 
        cancelText="Cancel" 
        variant="danger" 
      />
    </div>
  );
};

export default ExpensesManagement;
