// FILE PATH: components/ReturnsManagement.tsx
// Returns Management with new UI components and theme support

'use client';
import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Search, Calendar, DollarSign, CheckCircle, XCircle, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
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
  const [editingReturn, setEditingReturn] = useState<SalesReturn | null>(null);
  const [deletingReturn, setDeletingReturn] = useState<{ id: string; return_number: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
      setError(null);

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
        .order('return_date', { ascending: false });
      
      setInvoices(invoicesData || []);
      setReturns(returnsData || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
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
    
    return matchesSearch && matchesStatus;
  });

  const totalReturns = filteredReturns.reduce((sum, ret) => sum + ret.return_amount, 0);
  const pendingCount = returns.filter(r => r.refund_status === 'pending').length;
  const completedCount = returns.filter(r => r.refund_status === 'completed').length;

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Returns Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage sales returns and refunds</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <RotateCcw size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="font-bold text-red-800 mb-2">Failed to Load Returns</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={loadData} variant="primary">Try Again</Button>
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
          <h2 className="text-2xl font-bold text-gray-900">Returns Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage sales returns and refunds</p>
        </div>
        <Button onClick={handleAddNew} variant="primary" size="md" icon={<Plus size={18} />}>
          Record Return
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Returns</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalReturns.toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-lg ${theme.classes.bgPrimaryLight}`}>
              <RotateCcw size={24} className={theme.classes.textPrimary} />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-amber-900">{pendingCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-100">
              <XCircle size={24} className="text-amber-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-900">{completedCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8">
          <Card padding="md">
            <Input
              leftIcon={<Search size={18} />}
              placeholder="Search by return number, invoice, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Card>
        </div>
        
        <div className="md:col-span-4">
          <div className="flex gap-2 h-full">
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? `${theme.classes.bgPrimary} text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Returns List */}
      <Card padding="none">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" text="Loading returns..." />
          </div>
        ) : filteredReturns.length === 0 ? (
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
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReturns.map((returnRecord) => (
              <div key={returnRecord.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg flex-shrink-0`}>
                      <RotateCcw size={20} className={theme.classes.textPrimary} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{returnRecord.return_number}</h3>
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
                      <div className="text-sm text-gray-600 space-y-1">
                        {returnRecord.invoice_number && (
                          <p>Invoice: {returnRecord.invoice_number}</p>
                        )}
                        {returnRecord.customer_name && (
                          <p>Customer: {returnRecord.customer_name}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>{new Date(returnRecord.return_date).toLocaleDateString()}</span>
                        </div>
                        {returnRecord.reason && (
                          <p className="text-gray-500 italic">Reason: {returnRecord.reason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">₹{returnRecord.return_amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{returnRecord.refund_method}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(returnRecord)}
                        className={`${theme.classes.textPrimary} hover:${theme.classes.bgPrimaryLight} p-2 rounded-lg transition-colors`}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(returnRecord.id, returnRecord.return_number)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Stats */}
      {!loading && returns.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredReturns.length} of {returns.length} returns
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingReturn ? 'Edit Return' : 'Record New Return'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.invoice_id}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
                  disabled={!!editingReturn}
                >
                  <option value="">Select invoice</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.customer_name} - ₹{inv.total_amount}
                    </option>
                  ))}
                </select>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refund Method</label>
                  <select
                    value={formData.refund_method}
                    onChange={(e) => setFormData({ ...formData, refund_method: e.target.value })}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refund Status</label>
                  <select
                    value={formData.refund_status}
                    onChange={(e) => setFormData({ ...formData, refund_status: e.target.value as any })}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <Input
                label="Reason"
                placeholder="Reason for return"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
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