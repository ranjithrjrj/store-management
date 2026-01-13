// FILE PATH: components/ReturnsManagement.tsx
// UPDATED VERSION - Uses real database data

'use client';
import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Search, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
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

      // Load recent invoices (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: invoicesData } = await supabase
        .from('sales_invoices')
        .select('id, invoice_number, customer_name, total_amount, invoice_date')
        .gte('invoice_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('invoice_date', { ascending: false });
      
      // Load returns
      const { data: returnsData } = await supabase
        .from('sales_returns')
        .select('*')
        .order('return_date', { ascending: false });
      
      setInvoices(invoicesData || []);
      setReturns(returnsData || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
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

  const handleInvoiceSelect = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setFormData({
        ...formData,
        invoice_id: invoiceId,
        return_amount: invoice.total_amount // Default to full amount
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.return_amount || formData.return_amount <= 0) {
        alert('Please enter return amount');
        return;
      }

      const returnNumber = `RET-${Date.now()}`;
      const invoice = invoices.find(inv => inv.id === formData.invoice_id);

      const returnData = {
        return_number: returnNumber,
        invoice_id: formData.invoice_id || null,
        invoice_number: invoice?.invoice_number || null,
        customer_name: invoice?.customer_name || null,
        return_date: formData.return_date,
        return_amount: formData.return_amount,
        refund_method: formData.refund_method,
        refund_status: formData.refund_status,
        reason: formData.reason || null,
        notes: formData.notes || null
      };

      const { error: returnError } = await supabase
        .from('sales_returns')
        .insert(returnData);

      if (returnError) throw returnError;

      alert(`Return ${returnNumber} recorded successfully!`);
      await loadData();
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving return:', err);
      alert('Failed to save return: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: 'pending' | 'completed' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('sales_returns')
        .update({ refund_status: status })
        .eq('id', id);

      if (error) throw error;

      await loadData();
      alert('Status updated successfully!');
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('Failed to update status: ' + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Calendar, label: 'Pending' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' }
    };
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        <Icon size={12} />
        {badge.label}
      </span>
    );
  };

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = 
      ret.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ret.invoice_number && ret.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ret.customer_name && ret.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || ret.refund_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPending = returns.filter(r => r.refund_status === 'pending').reduce((sum, r) => sum + r.return_amount, 0);
  const totalCompleted = returns.filter(r => r.refund_status === 'completed').reduce((sum, r) => sum + r.return_amount, 0);

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Returns & Refunds</h2>
          <p className="text-gray-600 text-sm mt-1">Manage sales returns and refunds</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-bold text-red-800 mb-2">Failed to Load Returns</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Returns & Refunds</h2>
          <p className="text-gray-600 text-sm mt-1">Manage sales returns and refunds</p>
        </div>
        <button
          onClick={handleAddNew}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 disabled:bg-gray-400"
        >
          <Plus size={18} />
          Record Return
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Returns</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{returns.length}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <RotateCcw size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-yellow-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Refunds</p>
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-yellow-700">₹{totalPending.toLocaleString('en-IN')}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed Refunds</p>
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-green-700">₹{totalCompleted.toLocaleString('en-IN')}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search returns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading returns...</p>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="p-8 text-center">
            {searchTerm || filterStatus !== 'all' ? (
              <>
                <p className="text-gray-600">No returns found</p>
                <button
                  onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <RotateCcw size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No returns recorded yet</p>
                <button
                  onClick={handleAddNew}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Record Your First Return
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{ret.return_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                      {ret.invoice_number || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                      {ret.customer_name || 'Walk-in'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(ret.return_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-600">
                      ₹{ret.return_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(ret.refund_status)}</td>
                    <td className="px-4 py-3">
                      {ret.refund_status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateStatus(ret.id, 'completed')}
                            className="text-green-600 hover:bg-green-50 p-1 rounded text-xs"
                            title="Mark as Completed"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => updateStatus(ret.id, 'rejected')}
                            className="text-red-600 hover:bg-red-50 p-1 rounded text-xs"
                            title="Mark as Rejected"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Return Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Record Return</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={saving}
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Original Invoice (Optional)
                  </label>
                  <select
                    value={formData.invoice_id}
                    onChange={(e) => handleInvoiceSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select invoice or leave blank</option>
                    {invoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} - {inv.customer_name || 'Walk-in'} - ₹{inv.total_amount}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.return_amount}
                    onChange={(e) => setFormData({ ...formData, return_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refund Method</label>
                  <select
                    value={formData.refund_method}
                    onChange={(e) => setFormData({ ...formData, refund_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="credit_note">Credit Note</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Reason for return"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={saving || !formData.return_amount}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
                >
                  {saving ? 'Recording...' : 'Record Return'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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

export default ReturnsManagement;