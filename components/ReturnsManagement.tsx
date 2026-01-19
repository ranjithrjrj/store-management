// FILE PATH: components/ReturnsManagement.tsx
// Returns Management with filters, sorting, time display and theme support

'use client';
import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Search, Calendar, DollarSign, Edit2, Trash2, X, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type SalesReturn = {
  id: string;
  return_number: string;
  invoice_id?: string;
  invoice_number?: string;
  customer_name?: string;
  return_date: string;
  return_amount: number;
  refund_method: string;
  refund_status: 'pending' | 'completed' | 'rejected';
  reason?: string;
  notes?: string;
  created_at: string;
};

const ReturnsManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingReturn, setEditingReturn] = useState<SalesReturn | null>(null);
  const [deletingReturn, setDeletingReturn] = useState<{ id: string; return_number: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Filter and sort states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    refundMethod: 'all',
    customerName: ''
  });
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [formData, setFormData] = useState({
    invoice_id: '',
    return_date: new Date().toISOString().split('T')[0],
    return_amount: 0,
    refund_method: 'cash',
    refund_status: 'pending' as 'pending' | 'completed' | 'rejected',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: invoicesData } = await supabase
        .from('sales_invoices')
        .select('id, invoice_number, customer_name, total_amount, invoice_date')
        .gte('invoice_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('invoice_date', { ascending: false });
      
      const { data: returnsData } = await supabase
        .from('sales_returns')
        .select('*')
        .order('created_at', { ascending: false });
      
      setInvoices(invoicesData || []);
      setReturns(returnsData || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      toast.error('Failed to load', 'Could not load returns data.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setEditingReturn(null);
    setFormData({
      invoice_id: '',
      return_date: new Date().toISOString().split('T')[0],
      return_amount: 0,
      refund_method: 'cash',
      refund_status: 'pending',
      reason: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (returnRecord: SalesReturn) => {
    setEditingReturn(returnRecord);
    setFormData({
      invoice_id: returnRecord.invoice_id || '',
      return_date: returnRecord.return_date,
      return_amount: returnRecord.return_amount,
      refund_method: returnRecord.refund_method,
      refund_status: returnRecord.refund_status,
      reason: returnRecord.reason || '',
      notes: returnRecord.notes || ''
    });
    setShowModal(true);
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setFormData({
        ...formData,
        invoice_id: invoiceId,
        return_amount: invoice.total_amount
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      if (!formData.invoice_id) {
        toast.warning('Invoice required', 'Please select an invoice.');
        return;
      }

      if (formData.return_amount <= 0) {
        toast.warning('Amount required', 'Please enter a valid return amount.');
        return;
      }

      const selectedInvoice = invoices.find(inv => inv.id === formData.invoice_id);
      const returnNumber = editingReturn 
        ? editingReturn.return_number 
        : `RET-${Date.now()}`;

      const returnData = {
        return_number: returnNumber,
        invoice_id: formData.invoice_id,
        invoice_number: selectedInvoice?.invoice_number,
        customer_name: selectedInvoice?.customer_name,
        return_date: formData.return_date,
        return_amount: formData.return_amount,
        refund_method: formData.refund_method,
        refund_status: formData.refund_status,
        reason: formData.reason,
        notes: formData.notes
      };

      if (editingReturn) {
        const { error } = await supabase
          .from('sales_returns')
          .update(returnData)
          .eq('id', editingReturn.id);

        if (error) throw error;
        toast.success('Updated!', `Return ${returnNumber} has been updated.`);
      } else {
        const { error } = await supabase
          .from('sales_returns')
          .insert(returnData);

        if (error) throw error;
        toast.success('Created!', `Return ${returnNumber} has been recorded.`);
      }

      await loadData();
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving return:', err);
      toast.error('Failed to save', err.message || 'Could not save return.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string, return_number: string) => {
    setDeletingReturn({ id, return_number });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReturn) return;

    try {
      const { error } = await supabase
        .from('sales_returns')
        .delete()
        .eq('id', deletingReturn.id);

      if (error) throw error;

      await loadData();
      toast.success('Deleted', `Return ${deletingReturn.return_number} has been removed.`);
      setShowDeleteConfirm(false);
      setDeletingReturn(null);
    } catch (err: any) {
      console.error('Error deleting return:', err);
      toast.error('Failed to delete', err.message || 'Could not delete return.');
    }
  };

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = ret.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ret.invoice_number && ret.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ret.customer_name && ret.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || ret.refund_status === filterStatus;
    
    // Apply advanced filters
    if (filters.startDate && ret.return_date < filters.startDate) return false;
    if (filters.endDate && ret.return_date > filters.endDate) return false;
    if (filters.minAmount && ret.return_amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && ret.return_amount > parseFloat(filters.maxAmount)) return false;
    if (filters.refundMethod !== 'all' && ret.refund_method !== filters.refundMethod) return false;
    if (filters.customerName && ret.customer_name && !ret.customer_name.toLowerCase().includes(filters.customerName.toLowerCase())) return false;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.return_date).getTime();
      const dateB = new Date(b.return_date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      return sortOrder === 'desc' ? b.return_amount - a.return_amount : a.return_amount - b.return_amount;
    }
  });

  const totalReturns = filteredReturns.reduce((sum, ret) => sum + ret.return_amount, 0);
  const pendingCount = returns.filter(r => r.refund_status === 'pending').length;
  const completedCount = returns.filter(r => r.refund_status === 'completed').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600 font-medium">Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 ${theme.classes.bgPrimaryLight} rounded-xl`}>
                <RotateCcw className={theme.classes.textPrimary} size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Returns & Refunds</h1>
                <p className="text-slate-600 text-sm mt-0.5">Manage sales returns and refunds</p>
              </div>
            </div>
            <Button onClick={handleAddNew} variant="primary" icon={<Plus size={20} />}>
              Record Return
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`${theme.classes.bgPrimaryLight} rounded-xl p-4`}>
              <p className={`text-sm ${theme.classes.textPrimary} font-medium`}>Total Returns</p>
              <p className={`text-2xl font-bold ${theme.classes.textPrimary} mt-1`}>₹{totalReturns.toLocaleString()}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm text-amber-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-green-600 font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{completedCount}</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <Card padding="md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              placeholder="Search by return number, invoice, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
              rightIcon={searchTerm ? (
                <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              ) : undefined}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => setShowFilterModal(true)}
                variant="secondary"
                icon={<Filter size={18} />}
                className="flex-1"
              >
                Filters
              </Button>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  setSortBy(sort as 'date' | 'amount');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="flex-1"
              >
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="amount-desc">Amount (High to Low)</option>
                <option value="amount-asc">Amount (Low to High)</option>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                filterStatus === 'all'
                  ? `${theme.classes.bgPrimary} text-white shadow-md`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                filterStatus === 'completed'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                filterStatus === 'rejected'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Rejected
            </button>
          </div>
        </Card>

        {/* Returns List */}
        {filteredReturns.length === 0 ? (
          <Card>
            <EmptyState
              icon={<RotateCcw size={64} />}
              title={searchTerm ? "No returns found" : "No returns yet"}
              description={
                searchTerm
                  ? "Try adjusting your search terms"
                  : "Returns will appear here when recorded"
              }
              action={
                !searchTerm && (
                  <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                    Record First Return
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReturns.map((returnRecord) => (
              <Card key={returnRecord.id} hover padding="lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg`}>
                        <RotateCcw className={theme.classes.textPrimary} size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{returnRecord.return_number}</h3>
                        {returnRecord.customer_name && (
                          <p className="text-sm text-slate-600">{returnRecord.customer_name}</p>
                        )}
                      </div>
                      <Badge
                        variant={
                          returnRecord.refund_status === 'completed' ? 'success' :
                          returnRecord.refund_status === 'pending' ? 'warning' : 'danger'
                        }
                        size="sm"
                      >
                        {returnRecord.refund_status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 font-medium">Date & Time</p>
                        <p className="text-slate-900 font-semibold">{new Date(returnRecord.return_date).toLocaleDateString()}</p>
                        <p className="text-slate-600 text-xs">{new Date(returnRecord.created_at).toLocaleTimeString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Amount</p>
                        <p className={`${theme.classes.textPrimary} font-bold text-lg`}>₹{returnRecord.return_amount.toLocaleString()}</p>
                      </div>
                      {returnRecord.invoice_number && (
                        <div>
                          <p className="text-slate-500 font-medium">Invoice</p>
                          <p className="text-slate-900 font-semibold">{returnRecord.invoice_number}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-slate-500 font-medium">Method</p>
                        <Badge variant="neutral" size="sm">{returnRecord.refund_method}</Badge>
                      </div>
                    </div>

                    {returnRecord.reason && (
                      <div className="mt-3 text-sm">
                        <p className="text-slate-500 font-medium">Reason:</p>
                        <p className="text-slate-700 italic">{returnRecord.reason}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(returnRecord)}
                      className={`p-2.5 rounded-lg ${theme.classes.bgPrimaryLight} ${theme.classes.textPrimary} hover:opacity-80 transition-colors`}
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(returnRecord.id, returnRecord.return_number)}
                      className="p-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 ${theme.classes.bgPrimaryLight} rounded-xl`}>
                    <Filter className={theme.classes.textPrimary} size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Filter Returns</h3>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Min Amount"
                    type="number"
                    placeholder="0"
                    value={filters.minAmount}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                  />
                  <Input
                    label="Max Amount"
                    type="number"
                    placeholder="No limit"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Refund Method</label>
                  <Select
                    value={filters.refundMethod}
                    onChange={(e) => setFilters({ ...filters, refundMethod: e.target.value })}
                  >
                    <option value="all">All Methods</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </Select>
                </div>

                <Input
                  label="Customer Name"
                  placeholder="Filter by customer name"
                  value={filters.customerName}
                  onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => {
                    setFilters({
                      startDate: '',
                      endDate: '',
                      minAmount: '',
                      maxAmount: '',
                      refundMethod: 'all',
                      customerName: ''
                    });
                  }}
                  variant="secondary"
                  fullWidth
                >
                  Clear Filters
                </Button>
                <Button onClick={() => setShowFilterModal(false)} variant="primary" fullWidth>
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
                <h3 className="text-xl font-bold text-slate-900">
                  {editingReturn ? 'Edit Return' : 'Record New Return'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Invoice <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.invoice_id}
                    onChange={(e) => handleInvoiceSelect(e.target.value)}
                    disabled={!!editingReturn}
                  >
                    <option value="">Select invoice</option>
                    {invoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} - {inv.customer_name} - ₹{inv.total_amount}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Return Date"
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                    required
                    leftIcon={<Calendar size={18} />}
                  />

                  <Input
                    label="Return Amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.return_amount || ''}
                    onChange={(e) => setFormData({ ...formData, return_amount: parseFloat(e.target.value) || 0 })}
                    required
                    leftIcon={<DollarSign size={18} />}
                  />

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Refund Method</label>
                    <Select
                      value={formData.refund_method}
                      onChange={(e) => setFormData({ ...formData, refund_method: e.target.value })}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Refund Status</label>
                    <Select
                      value={formData.refund_status}
                      onChange={(e) => setFormData({ ...formData, refund_status: e.target.value as any })}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </Select>
                  </div>
                </div>

                <Input
                  label="Reason"
                  placeholder="Reason for return"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-opacity-20 transition-all"
                    placeholder="Additional notes (optional)"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={() => setShowModal(false)} variant="secondary" fullWidth disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} variant="primary" fullWidth loading={saving}>
                  {editingReturn ? 'Update Return' : 'Record Return'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingReturn && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeletingReturn(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Return"
          message={`Are you sure you want to delete return "${deletingReturn.return_number}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}
    </div>
  );
};

export default ReturnsManagement;
