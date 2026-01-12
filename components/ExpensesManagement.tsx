// FILE PATH: components/ExpensesManagement.tsx

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Search, DollarSign, Calendar, TrendingDown, FileText, Filter } from 'lucide-react';

type ExpenseCategory = {
  id: string;
  name: string;
  description?: string;
  icon: string;
};

type Expense = {
  id: string;
  expense_number: string;
  category_id: string;
  category_name: string;
  expense_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  vendor_name?: string;
  description?: string;
  is_recurring: boolean;
};

const ExpensesManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    category_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: 'cash',
    reference_number: '',
    vendor_name: '',
    description: '',
    is_recurring: false,
    recurrence_period: 'monthly'
  });

  // Mock data
  const mockCategories: ExpenseCategory[] = [
    { id: '1', name: 'Rent', description: 'Shop/warehouse rent', icon: 'building' },
    { id: '2', name: 'Electricity', description: 'Electricity bills', icon: 'zap' },
    { id: '3', name: 'Salaries', description: 'Employee salaries', icon: 'users' },
    { id: '4', name: 'Transport', description: 'Delivery costs', icon: 'truck' },
    { id: '5', name: 'Maintenance', description: 'Repairs', icon: 'wrench' },
    { id: '6', name: 'Marketing', description: 'Advertising', icon: 'megaphone' },
    { id: '7', name: 'Miscellaneous', description: 'Other expenses', icon: 'more-horizontal' }
  ];

  const mockExpenses: Expense[] = [
    {
      id: '1',
      expense_number: 'EXP-202601-001',
      category_id: '1',
      category_name: 'Rent',
      expense_date: '2026-01-01',
      amount: 15000,
      payment_method: 'bank_transfer',
      vendor_name: 'Building Owner',
      description: 'January shop rent',
      is_recurring: true
    },
    {
      id: '2',
      expense_number: 'EXP-202601-002',
      category_id: '2',
      category_name: 'Electricity',
      expense_date: '2026-01-05',
      amount: 2800,
      payment_method: 'cash',
      vendor_name: 'TNEB',
      description: 'Electricity bill - December',
      is_recurring: false
    },
    {
      id: '3',
      expense_number: 'EXP-202601-003',
      category_id: '3',
      category_name: 'Salaries',
      expense_date: '2026-01-10',
      amount: 25000,
      payment_method: 'bank_transfer',
      description: 'Staff salaries - January',
      is_recurring: true
    },
    {
      id: '4',
      expense_number: 'EXP-202601-004',
      category_id: '4',
      category_name: 'Transport',
      expense_date: '2026-01-08',
      amount: 850,
      payment_method: 'cash',
      description: 'Delivery charges',
      is_recurring: false
    }
  ];

  const [expenses, setExpenses] = useState(mockExpenses);

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'upi', label: 'UPI' },
    { value: 'card', label: 'Card' },
    { value: 'cheque', label: 'Cheque' }
  ];

  const handleAddNew = () => {
    setEditingExpense(null);
    setFormData({
      category_id: '',
      expense_date: new Date().toISOString().split('T')[0],
      amount: 0,
      payment_method: 'cash',
      reference_number: '',
      vendor_name: '',
      description: '',
      is_recurring: false,
      recurrence_period: 'monthly'
    });
    setShowAddModal(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      category_id: expense.category_id,
      expense_date: expense.expense_date,
      amount: expense.amount,
      payment_method: expense.payment_method,
      reference_number: expense.reference_number || '',
      vendor_name: expense.vendor_name || '',
      description: expense.description || '',
      is_recurring: expense.is_recurring,
      recurrence_period: 'monthly'
    });
    setShowAddModal(true);
  };

  const handleSubmit = () => {
    // Save to Supabase
    console.log('Saving expense:', formData);
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.expense_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category_id === categoryFilter;
    const matchesDate = expense.expense_date >= dateRange.from && expense.expense_date <= dateRange.to;
    return matchesSearch && matchesCategory && matchesDate;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryTotals = filteredExpenses.reduce((acc, e) => {
    acc[e.category_name] = (acc[e.category_name] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses Management</h2>
          <p className="text-gray-600 text-sm mt-1">Track and manage business expenses</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">₹{totalExpenses.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expense Count</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{filteredExpenses.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Expense</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{filteredExpenses.length > 0 ? Math.round(totalExpenses / filteredExpenses.length).toLocaleString('en-IN') : 0}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border-0 focus:ring-0 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {mockCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Category Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(categoryTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600">{category}</p>
                  <p className="text-lg font-bold text-gray-900">₹{amount.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-500">
                    {((amount / totalExpenses) * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Expenses List - Mobile Cards */}
      <div className="grid grid-cols-1 lg:hidden gap-4">
        {filteredExpenses.map((expense) => (
          <div key={expense.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{expense.expense_number}</h3>
                <p className="text-sm text-gray-600">{expense.category_name}</p>
                {expense.vendor_name && (
                  <p className="text-sm text-gray-500">{expense.vendor_name}</p>
                )}
              </div>
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                {expense.is_recurring ? 'Recurring' : 'One-time'}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">{new Date(expense.expense_date).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-red-600">₹{expense.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment:</span>
                <span className="text-gray-900 capitalize">{expense.payment_method.replace('_', ' ')}</span>
              </div>
              {expense.description && (
                <div>
                  <span className="text-gray-600">Note:</span>
                  <p className="text-gray-900 text-xs mt-1">{expense.description}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => handleEdit(expense)}
                className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Edit2 size={14} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(expense.id)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Expenses Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expense #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 text-sm">{expense.expense_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(expense.expense_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense.category_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{expense.vendor_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{expense.payment_method.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-sm font-bold text-red-600">₹{expense.amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${
                      expense.is_recurring ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {expense.is_recurring ? 'Recurring' : 'One-time'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
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
      </div>

      {filteredExpenses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No expenses found for the selected filters.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {mockCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expense Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                  <input
                    type="text"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cheque/Transaction ID"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">This is a recurring expense</span>
                </label>

                {formData.is_recurring && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence Period</label>
                    <select
                      value={formData.recurrence_period}
                      onChange={(e) => setFormData({ ...formData, recurrence_period: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesManagement;