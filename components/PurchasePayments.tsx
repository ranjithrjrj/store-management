// FILE PATH: components/PurchasePayments.tsx
// Purchase Payments Management - Record and track vendor payments

'use client';
import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, X, Eye, Edit2, Trash2, Calendar, FileText, CreditCard, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type Payment = {
  id: string;
  payment_number: string;
  purchase_invoice_id: string;
  purchase_invoice?: {
    invoice_number: string;
    total_amount: number;
    vendor?: { name: string };
  };
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
};

type PurchaseRecord = {
  id: string;
  invoice_number: string;
  vendor_id: string;
  vendor?: { name: string };
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  payment_status: string;
  invoice_date: string;
};

const PurchasePayments = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState('payment_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<{ id: string; payment_number: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add payment flow
  const [searchBy, setSearchBy] = useState<'invoice' | 'vendor'>('invoice');
  const [vendors, setVendors] = useState<any[]>([]);
  const [unpaidRecords, setUnpaidRecords] = useState<PurchaseRecord[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<PurchaseRecord | null>(null);
  const [recordItems, setRecordItems] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    loadPayments();
    loadVendors();
  }, []);

  async function loadPayments() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('purchase_payments')
        .select(`
          *,
          purchase_invoice:purchase_invoices(
            invoice_number,
            total_amount,
            vendor:vendors(name)
          )
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err: any) {
      console.error('Error loading payments:', err);
      toast.error('Failed to load', 'Could not load payments.');
    } finally {
      setLoading(false);
    }
  }

  async function loadVendors() {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (err: any) {
      console.error('Error loading vendors:', err);
    }
  }

  async function loadUnpaidRecords(vendorId?: string) {
    try {
      setLoadingRecords(true);
      
      let query = supabase
        .from('purchase_invoices')
        .select(`
          *,
          vendor:vendors(name)
        `)
        .in('payment_status', ['pending', 'partial'])
        .order('invoice_date', { ascending: false });

      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }

      const { data: records, error } = await query;
      if (error) throw error;

      // Calculate paid and pending amounts for each record
      const recordsWithAmounts = await Promise.all(
        (records || []).map(async (record) => {
          const { data: payments } = await supabase
            .from('purchase_payments')
            .select('amount')
            .eq('purchase_invoice_id', record.id);

          const paid_amount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
          const pending_amount = record.total_amount - paid_amount;

          return {
            ...record,
            paid_amount,
            pending_amount
          };
        })
      );

      setUnpaidRecords(recordsWithAmounts);
    } catch (err: any) {
      console.error('Error loading records:', err);
      toast.error('Failed to load', 'Could not load purchase records.');
    } finally {
      setLoadingRecords(false);
    }
  }

  async function loadRecordItems(recordId: string) {
    try {
      setLoadingItems(true);
      
      const { data, error } = await supabase
        .from('purchase_invoice_items')
        .select(`
          *,
          item:items(name, unit:units(abbreviation))
        `)
        .eq('purchase_invoice_id', recordId);

      if (error) throw error;
      setRecordItems(data || []);
    } catch (err: any) {
      console.error('Error loading items:', err);
    } finally {
      setLoadingItems(false);
    }
  }

  const handleAddPayment = () => {
    setShowAddModal(true);
    setSearchBy('invoice');
    setSelectedVendor('');
    setSelectedRecord(null);
    setUnpaidRecords([]);
    setRecordItems([]);
    setPaymentForm({
      payment_date: new Date().toISOString().split('T')[0],
      amount: 0,
      payment_method: 'cash',
      reference_number: '',
      notes: ''
    });
    loadUnpaidRecords();
  };

  const handleSearchByChange = (type: 'invoice' | 'vendor') => {
    setSearchBy(type);
    setSelectedVendor('');
    setSelectedRecord(null);
    setUnpaidRecords([]);
    setRecordItems([]);
    
    if (type === 'invoice') {
      loadUnpaidRecords();
    }
  };

  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendor(vendorId);
    setSelectedRecord(null);
    setRecordItems([]);
    loadUnpaidRecords(vendorId);
  };

  const handleRecordSelect = async (record: PurchaseRecord) => {
    setSelectedRecord(record);
    setPaymentForm({ ...paymentForm, amount: record.pending_amount });
    await loadRecordItems(record.id);
  };

  const handleSubmitPayment = () => {
    if (!selectedRecord) {
      toast.warning('Select invoice', 'Please select an invoice first.');
      return;
    }
    if (paymentForm.amount <= 0) {
      toast.warning('Invalid amount', 'Payment amount must be greater than 0.');
      return;
    }
    if (paymentForm.amount > selectedRecord.pending_amount) {
      toast.warning('Amount exceeds pending', 'Payment amount cannot exceed pending amount.');
      return;
    }
    setShowPaymentConfirm(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedRecord) return;

    try {
      setSaving(true);
      setShowPaymentConfirm(false);

      const paymentNumber = `PAY-${Date.now()}`;

      // Insert payment
      const { error: paymentError } = await supabase
        .from('purchase_payments')
        .insert({
          payment_number: paymentNumber,
          purchase_invoice_id: selectedRecord.id,
          payment_date: paymentForm.payment_date,
          amount: paymentForm.amount,
          payment_method: paymentForm.payment_method,
          reference_number: paymentForm.reference_number || null,
          notes: paymentForm.notes || null
        });

      if (paymentError) throw paymentError;

      // Calculate new payment status
      const newPaidAmount = selectedRecord.paid_amount + paymentForm.amount;
      const newPendingAmount = selectedRecord.total_amount - newPaidAmount;
      const newStatus = newPendingAmount <= 0 ? 'paid' : newPendingAmount < selectedRecord.total_amount ? 'partial' : 'pending';

      // Update purchase record payment status
      const { error: updateError } = await supabase
        .from('purchase_invoices')
        .update({ payment_status: newStatus })
        .eq('id', selectedRecord.id);

      if (updateError) throw updateError;

      toast.success('Payment recorded!', `Payment ${paymentNumber} has been saved.`);
      await loadPayments();
      setShowAddModal(false);
      setSelectedRecord(null);
    } catch (err: any) {
      console.error('Error recording payment:', err);
      toast.error('Failed to save', err.message || 'Could not record payment.');
    } finally {
      setSaving(false);
    }
  };

  const handleView = (payment: Payment) => {
    setViewingPayment(payment);
    setShowViewModal(true);
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setPaymentForm({
      payment_date: payment.payment_date,
      amount: payment.amount,
      payment_method: payment.payment_method,
      reference_number: payment.reference_number || '',
      notes: payment.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('purchase_payments')
        .update({
          payment_date: paymentForm.payment_date,
          amount: paymentForm.amount,
          payment_method: paymentForm.payment_method,
          reference_number: paymentForm.reference_number || null,
          notes: paymentForm.notes || null
        })
        .eq('id', editingPayment.id);

      if (error) throw error;

      toast.success('Updated!', 'Payment has been updated.');
      await loadPayments();
      setShowEditModal(false);
      setEditingPayment(null);
    } catch (err: any) {
      console.error('Error updating payment:', err);
      toast.error('Failed to update', err.message || 'Could not update payment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (payment: Payment) => {
    setDeletingPayment({ id: payment.id, payment_number: payment.payment_number });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPayment) return;

    try {
      const { error } = await supabase
        .from('purchase_payments')
        .delete()
        .eq('id', deletingPayment.id);

      if (error) throw error;

      toast.success('Deleted!', `Payment ${deletingPayment.payment_number} has been deleted.`);
      await loadPayments();
    } catch (err: any) {
      console.error('Error deleting payment:', err);
      toast.error('Failed to delete', err.message || 'Could not delete payment.');
    } finally {
      setShowDeleteConfirm(false);
      setDeletingPayment(null);
    }
  };

  const filteredPayments = payments
    .filter(payment => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        payment.payment_number.toLowerCase().includes(searchLower) ||
        payment.purchase_invoice?.invoice_number.toLowerCase().includes(searchLower) ||
        payment.purchase_invoice?.vendor?.name.toLowerCase().includes(searchLower);
      
      // Payment method filter
      const matchesMethod = filterMethod === 'all' || payment.payment_method === filterMethod;
      
      // Date range filter
      const paymentDate = new Date(payment.payment_date);
      const matchesDateFrom = !filterDateFrom || paymentDate >= new Date(filterDateFrom);
      const matchesDateTo = !filterDateTo || paymentDate <= new Date(filterDateTo);
      
      return matchesSearch && matchesMethod && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'payment_date':
          aVal = new Date(a.payment_date).getTime();
          bVal = new Date(b.payment_date).getTime();
          break;
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'payment_number':
          aVal = a.payment_number;
          bVal = b.payment_number;
          break;
        case 'vendor':
          aVal = a.purchase_invoice?.vendor?.name || '';
          bVal = b.purchase_invoice?.vendor?.name || '';
          break;
        default:
          aVal = new Date(a.payment_date).getTime();
          bVal = new Date(b.payment_date).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600 font-medium">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <DollarSign className="text-emerald-700" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Purchase Payments</h1>
                <p className="text-slate-600 text-sm mt-0.5">Record and track vendor payments</p>
              </div>
            </div>
            <Button
              onClick={handleAddPayment}
              variant="primary"
              icon={<Plus size={20} />}
              className="shadow-sm"
            >
              Add Payment
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card padding="md">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by payment number, invoice, or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={18} />}
                rightIcon={searchTerm ? (
                  <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
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
              <option value="payment_date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="payment_number">Sort by Payment #</option>
              <option value="vendor">Sort by Vendor</option>
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
              className="relative"
            >
              🔍 Filters
              {(filterMethod !== 'all' || filterDateFrom || filterDateTo) && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {[filterMethod !== 'all', filterDateFrom, filterDateTo].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>
        </Card>

        {/* Active Filters Display */}
        {(filterMethod !== 'all' || filterDateFrom || filterDateTo) && (
          <div className="flex flex-wrap gap-2 px-2">
            {filterMethod !== 'all' && (
              <Badge variant="primary">
                Method: {filterMethod} 
                <button onClick={() => setFilterMethod('all')} className="ml-2">×</button>
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
              onClick={() => { setFilterMethod('all'); setFilterDateFrom(''); setFilterDateTo(''); }}
              className="text-sm text-slate-600 hover:text-slate-900 underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <Card>
            <EmptyState
              icon={<DollarSign size={64} />}
              title={searchTerm ? "No payments found" : "No payments yet"}
              description={
                searchTerm
                  ? "Try adjusting your search"
                  : "Payments will appear here once you record them"
              }
              action={
                !searchTerm ? (
                  <Button onClick={handleAddPayment} variant="primary" icon={<Plus size={18} />}>
                    Record First Payment
                  </Button>
                ) : null
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <Card key={payment.id} hover padding="lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <CreditCard className="text-emerald-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{payment.payment_number}</h3>
                        <p className="text-sm text-slate-600">
                          Invoice: {payment.purchase_invoice?.invoice_number}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 font-medium">Vendor</p>
                        <p className="text-slate-900 font-semibold">{payment.purchase_invoice?.vendor?.name}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Date</p>
                        <p className="text-slate-900 font-semibold">{new Date(payment.payment_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Amount</p>
                        <p className="text-emerald-600 font-bold text-lg">₹{payment.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Method</p>
                        <Badge variant="neutral" size="sm">{payment.payment_method}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(payment)}
                      className="p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      title="View"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(payment)}
                      className="p-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(payment)}
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

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <Plus className="text-emerald-700" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Record Payment</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={24} className="text-slate-600" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Search By */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Search By</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSearchByChange('invoice')}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                        searchBy === 'invoice'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <FileText size={18} className="inline mr-2" />
                      Invoice Number
                    </button>
                    <button
                      onClick={() => handleSearchByChange('vendor')}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                        searchBy === 'vendor'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <DollarSign size={18} className="inline mr-2" />
                      Vendor Name
                    </button>
                  </div>
                </div>

                {/* Vendor Selection (if searchBy === 'vendor') */}
                {searchBy === 'vendor' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Vendor</label>
                    <Select
                      value={selectedVendor}
                      onChange={(e) => handleVendorSelect(e.target.value)}
                    >
                      <option value="">Choose a vendor</option>
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                      ))}
                    </Select>
                  </div>
                )}

                {/* Invoice Selection */}
                {((searchBy === 'invoice' && unpaidRecords.length > 0) || 
                  (searchBy === 'vendor' && selectedVendor && unpaidRecords.length > 0)) && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Invoice</label>
                    {loadingRecords ? (
                      <div className="text-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {unpaidRecords.map(record => (
                          <button
                            key={record.id}
                            onClick={() => handleRecordSelect(record)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                              selectedRecord?.id === record.id
                                ? 'border-emerald-600 bg-emerald-50'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-slate-900">{record.invoice_number}</p>
                                <p className="text-sm text-slate-600">{record.vendor?.name}</p>
                              </div>
                              <Badge variant={record.payment_status === 'pending' ? 'warning' : 'neutral'} size="sm">
                                {record.payment_status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <p className="text-slate-500">Total</p>
                                <p className="font-semibold text-slate-900">₹{record.total_amount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Paid</p>
                                <p className="font-semibold text-emerald-600">₹{record.paid_amount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Pending</p>
                                <p className="font-semibold text-red-600">₹{record.pending_amount.toLocaleString()}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Invoice Details */}
                {selectedRecord && (
                  <>
                    <div className="bg-slate-50 rounded-xl p-5">
                      <h4 className="font-bold text-slate-900 mb-4">Invoice Items</h4>
                      {loadingItems ? (
                        <LoadingSpinner />
                      ) : (
                        <div className="space-y-2">
                          {recordItems.map((item, idx) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-slate-700">
                                {idx + 1}. {item.item?.name} × {item.quantity}
                              </span>
                              <span className="font-semibold text-slate-900">₹{item.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Payment Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Payment Date"
                        type="date"
                        value={paymentForm.payment_date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                        required
                        leftIcon={<Calendar size={18} />}
                      />

                      <Input
                        label="Payment Amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={paymentForm.amount || ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                        required
                        leftIcon={<DollarSign size={18} />}
                        helperText={`Max: ₹${selectedRecord.pending_amount.toLocaleString()}`}
                      />

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                        <Select
                          value={paymentForm.payment_method}
                          onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="upi">UPI</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cheque">Cheque</option>
                        </Select>
                      </div>

                      <Input
                        label="Reference Number"
                        placeholder="Transaction/Cheque number (optional)"
                        value={paymentForm.reference_number}
                        onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                      />
                    </div>

                    <Input
                      label="Notes"
                      placeholder="Additional notes (optional)"
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    />
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={() => setShowAddModal(false)} variant="secondary" fullWidth>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitPayment} 
                  variant="primary" 
                  fullWidth 
                  disabled={!selectedRecord || paymentForm.amount <= 0}
                >
                  Record Payment
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Payment Confirmation Dialog */}
      {showPaymentConfirm && selectedRecord && (
        <ConfirmDialog
          isOpen={showPaymentConfirm}
          onClose={() => setShowPaymentConfirm(false)}
          onConfirm={handleConfirmPayment}
          title="Confirm Payment"
          message={`
Record payment of ₹${paymentForm.amount.toLocaleString()} against invoice ${selectedRecord.invoice_number}?

Total: ₹${selectedRecord.total_amount.toLocaleString()}
Paid: ₹${selectedRecord.paid_amount.toLocaleString()}
This Payment: ₹${paymentForm.amount.toLocaleString()}
Remaining: ₹${(selectedRecord.pending_amount - paymentForm.amount).toLocaleString()}
          `}
          confirmText="Confirm Payment"
          cancelText="Cancel"
          variant="primary"
        />
      )}

      {/* View Modal */}
      {showViewModal && viewingPayment && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Payment Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Payment Number</p>
                    <p className="font-semibold text-slate-900">{viewingPayment.payment_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Date</p>
                    <p className="font-semibold text-slate-900">{new Date(viewingPayment.payment_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Invoice</p>
                    <p className="font-semibold text-slate-900">{viewingPayment.purchase_invoice?.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Vendor</p>
                    <p className="font-semibold text-slate-900">{viewingPayment.purchase_invoice?.vendor?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Amount</p>
                    <p className="font-bold text-emerald-600 text-lg">₹{viewingPayment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Method</p>
                    <p className="font-semibold text-slate-900">{viewingPayment.payment_method}</p>
                  </div>
                  {viewingPayment.reference_number && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500">Reference</p>
                      <p className="font-semibold text-slate-900">{viewingPayment.reference_number}</p>
                    </div>
                  )}
                  {viewingPayment.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500">Notes</p>
                      <p className="text-slate-900">{viewingPayment.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={() => setShowViewModal(false)} variant="secondary" fullWidth>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingPayment && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Edit Payment</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Payment Date"
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    required
                  />

                  <Input
                    label="Amount"
                    type="number"
                    step="0.01"
                    value={paymentForm.amount || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                    required
                  />

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                    <Select
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </Select>
                  </div>

                  <Input
                    label="Reference Number"
                    placeholder="Optional"
                    value={paymentForm.reference_number}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                  />
                </div>

                <Input
                  label="Notes"
                  placeholder="Optional"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={() => setShowEditModal(false)} variant="secondary" fullWidth>
                  Cancel
                </Button>
                <Button onClick={handleUpdatePayment} variant="primary" fullWidth loading={saving}>
                  Update Payment
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingPayment && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeletingPayment(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Payment"
          message={`Are you sure you want to delete payment "${deletingPayment.payment_number}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Filter Payments</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Payment Method Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                <Select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                >
                  <option value="all">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setFilterMethod('all');
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
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PurchasePayments;
