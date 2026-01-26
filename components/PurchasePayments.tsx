// FILE PATH: components/PurchasePayments.tsx
// Purchase Payments Management - COMPLETE REDESIGN with Teal Theme

'use client';
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, X, Trash2, Calendar, FileText, 
  CreditCard, Filter, ChevronRight, Package, TrendingUp, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import SearchableSelect from './SearchableSelect';

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
  
  const [view, setView] = useState<'list' | 'add' | 'details'>('list');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState('payment_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<{ id: string; payment_number: string } | null>(null);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add payment flow
  const [searchBy, setSearchBy] = useState<'invoice' | 'vendor'>('invoice');
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

      setUnpaidRecords(records || []);
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
          item:items(name)
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
    setView('add');
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

  const handleSubmitPayment = async () => {
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

    try {
      setSaving(true);

      const paymentNumber = `PAY-${Date.now()}`;

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

      const newPaidAmount = selectedRecord.paid_amount + paymentForm.amount;
      const newPendingAmount = selectedRecord.total_amount - newPaidAmount;
      const newStatus = newPendingAmount <= 0 ? 'paid' : 'partial';

      const { error: updateError } = await supabase
        .from('purchase_invoices')
        .update({ 
          paid_amount: newPaidAmount,
          pending_amount: newPendingAmount,
          payment_status: newStatus 
        })
        .eq('id', selectedRecord.id);

      if (updateError) throw updateError;

      toast.success('Payment recorded!', `Payment ${paymentNumber} has been saved.`);
      await loadPayments();
      setView('list');
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
    setView('details');
  };

  const handleDelete = async () => {
    if (!deletingPayment) return;

    try {
      // Get payment details before deleting
      const payment = payments.find(p => p.id === deletingPayment.id);
      if (!payment) {
        toast.error('Error', 'Payment not found');
        return;
      }

      const paymentAmount = payment.amount;
      const invoiceId = payment.purchase_invoice_id;

      // Delete payment
      const { error } = await supabase
        .from('purchase_payments')
        .delete()
        .eq('id', deletingPayment.id);

      if (error) throw error;

      // Recalculate invoice amounts
      if (invoiceId) {
        const { data: invoice } = await supabase
          .from('purchase_invoices')
          .select('total_amount, paid_amount')
          .eq('id', invoiceId)
          .single();

        if (invoice) {
          const newPaidAmount = (invoice.paid_amount || 0) - paymentAmount;
          const newPendingAmount = invoice.total_amount - newPaidAmount;
          const newStatus = newPendingAmount <= 0 ? 'paid' : 
                           newPendingAmount < invoice.total_amount ? 'partial' : 'pending';

          await supabase
            .from('purchase_invoices')
            .update({
              paid_amount: newPaidAmount,
              pending_amount: newPendingAmount,
              payment_status: newStatus
            })
            .eq('id', invoiceId);
        }
      }

      toast.success('Deleted!', `Payment ${deletingPayment.payment_number} deleted and invoice updated.`);
      await loadPayments();
      
      if (view === 'details') {
        setView('list');
      }
    } catch (err: any) {
      console.error('Error deleting payment:', err);
      toast.error('Failed to delete', err.message || 'Could not delete payment.');
    } finally {
      setDeletingPayment(null);
    }
  };

  const filteredPayments = payments
    .filter(payment => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        payment.payment_number.toLowerCase().includes(searchLower) ||
        payment.purchase_invoice?.invoice_number.toLowerCase().includes(searchLower) ||
        payment.purchase_invoice?.vendor?.name.toLowerCase().includes(searchLower);
      
      const matchesMethod = filterMethod === 'all' || payment.payment_method === filterMethod;
      
      const paymentDate = new Date(payment.payment_date);
      const matchesDateFrom = !filterDateFrom || paymentDate >= new Date(filterDateFrom);
      const matchesDateTo = !filterDateTo || paymentDate <= new Date(filterDateTo);
      
      return matchesSearch && matchesMethod && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      
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

  const stats = {
    total: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    thisMonth: payments.filter(p => new Date(p.payment_date).getMonth() === new Date().getMonth()).length,
    thisMonthAmount: payments.filter(p => new Date(p.payment_date).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + p.amount, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-slate-600 mt-4 font-medium">Loading payments...</p>
        </div>
      </div>
    );
  }

  // LIST VIEW
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* HERO */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-4 py-6 md:px-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <CreditCard className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Purchase Payments</h1>
                <p className="text-teal-100 text-sm md:text-base">Record and track payments</p>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-teal-100 text-xs font-medium">Total Payments</p>
                <p className="text-white text-xl font-bold mt-0.5">{stats.total}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-teal-100 text-xs font-medium">Total Paid</p>
                <p className="text-white text-xl font-bold mt-0.5">₹{stats.totalAmount.toFixed(0)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-teal-100 text-xs font-medium">This Month</p>
                <p className="text-white text-xl font-bold mt-0.5">{stats.thisMonth}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-teal-100 text-xs font-medium">Month Total</p>
                <p className="text-white text-xl font-bold mt-0.5">₹{stats.thisMonthAmount.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-6 space-y-4">
          
          {/* Search & Filter */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search payment, invoice, or vendor..."
                  className="w-full pl-10 pr-10 py-2.5 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                )}
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2.5 border-2 border-slate-300 rounded-xl text-slate-900 text-sm bg-white">
                <option value="payment_date">Date</option>
                <option value="amount">Amount</option>
                <option value="payment_number">Payment #</option>
                <option value="vendor">Vendor</option>
              </select>
              <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="px-3 py-2.5 border-2 border-slate-300 rounded-xl text-slate-700 text-sm font-medium">
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
              <button onClick={() => setShowFilterSheet(true)} className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center gap-2 font-medium shadow-sm">
                <Filter size={18} />
                <span className="hidden sm:inline text-sm">Filter</span>
              </button>
            </div>
          </div>

          {/* Payments List */}
          {filteredPayments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No payments found</h3>
              <p className="text-sm text-slate-600">{searchTerm ? "Try adjusting filters" : "Payments will appear here"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((payment) => (
                <button key={payment.id} onClick={() => handleView(payment)} className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all active:scale-[0.99] text-left">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{payment.payment_number}</h3>
                      <p className="text-sm text-slate-600">{payment.purchase_invoice?.vendor?.name}</p>
                      <p className="text-xs text-teal-600 mt-0.5">Invoice: {payment.purchase_invoice?.invoice_number}</p>
                    </div>
                    <div className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold">{payment.payment_method.toUpperCase()}</div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <Calendar size={14} />
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-teal-700">₹{payment.amount.toFixed(0)}</span>
                      <ChevronRight size={18} className="text-slate-400" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="h-4 md:h-4" />

          {/* Add Payment Button - Normal placement */}
          <button onClick={handleAddPayment} className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            <Plus size={24} />
            Record Payment
          </button>

          <div className="h-20 md:h-4" />
        </div>

        {/* Filter Sheet */}
        {showFilterSheet && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={() => setShowFilterSheet(false)} />
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[70] max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-teal-600 to-teal-700 rounded-t-3xl">
                <h2 className="text-xl font-bold text-white">Filter Payments</h2>
                <button onClick={() => setShowFilterSheet(false)} className="p-2 hover:bg-white/20 rounded-lg"><X size={24} className="text-white" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-900 mb-2 block">Payment Method</label>
                  <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg text-slate-900">
                    <option value="all">All Methods</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div className="pt-3 border-t">
                  <label className="text-sm font-bold text-slate-900 mb-2 block">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs text-slate-600 mb-1 block">From</label><input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-full px-2 py-2 border-2 border-slate-300 rounded-lg text-slate-900 text-sm" /></div>
                    <div><label className="text-xs text-slate-600 mb-1 block">To</label><input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-full px-2 py-2 border-2 border-slate-300 rounded-lg text-slate-900 text-sm" /></div>
                  </div>
                </div>
                <button onClick={() => { setFilterMethod('all'); setFilterDateFrom(''); setFilterDateTo(''); setShowFilterSheet(false); }} className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium mt-2">Clear Filters</button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ADD PAYMENT VIEW
  if (view === 'add') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-4 py-6 md:px-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setView('list')} className="p-2 bg-white/20 rounded-xl backdrop-blur-sm hover:bg-white/30"><X className="text-white" size={24} /></button>
              <div className="flex items-center gap-3 flex-1">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><Plus className="text-white" size={28} /></div>
                <div><h1 className="text-xl md:text-2xl font-bold text-white">Record Payment</h1><p className="text-teal-100 text-sm">Add new payment</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-6 space-y-4">
          
          {/* Search By */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <label className="block text-sm font-bold text-slate-900 mb-2">Search By</label>
            <div className="flex gap-3">
              <button onClick={() => handleSearchByChange('invoice')} className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${searchBy === 'invoice' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <FileText size={18} className="inline mr-2" />Invoice Number
              </button>
              <button onClick={() => handleSearchByChange('vendor')} className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${searchBy === 'vendor' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <CreditCard size={18} className="inline mr-2" />Vendor Name
              </button>
            </div>
          </div>

          {/* Vendor Selection */}
          {searchBy === 'vendor' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <label className="block text-sm font-bold text-slate-900 mb-2">Select Vendor</label>
              <SearchableSelect
                options={vendors.map(v => ({ value: v.id, label: v.name }))}
                value={selectedVendor}
                onChange={handleVendorSelect}
                placeholder="Choose vendor"
              />
            </div>
          )}

          {/* Invoice Selection */}
          {((searchBy === 'invoice' && unpaidRecords.length > 0) || (searchBy === 'vendor' && selectedVendor && unpaidRecords.length > 0)) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b"><h3 className="font-bold text-slate-900">Select Invoice ({unpaidRecords.length})</h3></div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {loadingRecords ? <div className="text-center py-8"><LoadingSpinner /></div> : unpaidRecords.map(record => (
                  <button key={record.id} onClick={() => handleRecordSelect(record)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedRecord?.id === record.id ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">{record.invoice_number}</p>
                        <p className="text-sm text-slate-600">{record.vendor?.name}</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${record.payment_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{record.payment_status}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><p className="text-slate-500">Total</p><p className="font-semibold">₹{record.total_amount.toFixed(0)}</p></div>
                      <div><p className="text-slate-500">Paid</p><p className="font-semibold text-green-600">₹{record.paid_amount.toFixed(0)}</p></div>
                      <div><p className="text-slate-500">Pending</p><p className="font-semibold text-red-600">₹{record.pending_amount.toFixed(0)}</p></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Invoice Items */}
          {selectedRecord && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b"><h3 className="font-bold text-slate-900 flex items-center gap-2"><Package size={18} className="text-teal-600" />Invoice Items</h3></div>
                <div className="p-4 space-y-2">
                  {loadingItems ? <LoadingSpinner /> : recordItems.map((item, idx) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-700">{idx + 1}. {item.item?.name} × {item.quantity}</span>
                      <span className="font-semibold text-slate-900">₹{item.amount.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Form */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Date</label>
                    <input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Amount (₹)</label>
                    <input type="number" step="0.01" value={paymentForm.amount || ''} onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm" />
                    <p className="text-xs text-slate-500 mt-1">Max: ₹{selectedRecord.pending_amount.toFixed(0)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Method</label>
                    <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })} className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm">
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Reference Number</label>
                    <input type="text" value={paymentForm.reference_number} onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })} placeholder="Transaction ID (optional)" className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes</label>
                  <textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} rows={2} placeholder="Additional notes (optional)" className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm resize-none" />
                </div>
              </div>

              {/* Submit Button - Normal placement with confirmation */}
              <button 
                onClick={() => setShowPaymentConfirm(true)} 
                disabled={saving || paymentForm.amount <= 0} 
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {saving ? <><LoadingSpinner size="sm" />Recording...</> : <><Check size={24} />Record Payment</>}
              </button>
            </>
          )}

          <div className="h-20 md:hidden" />
        </div>

        {/* Record Payment Confirmation Dialog */}
        {selectedRecord && (
          <ConfirmDialog
            isOpen={showPaymentConfirm}
            onClose={() => setShowPaymentConfirm(false)}
            onConfirm={() => { setShowPaymentConfirm(false); handleSubmitPayment(); }}
            title="Record Payment"
            message={`Record payment of ₹${paymentForm.amount.toFixed(0)} for invoice ${selectedRecord.invoice_number}?

Invoice Details:
• Total: ₹${selectedRecord.total_amount.toFixed(0)}
• Already Paid: ₹${selectedRecord.paid_amount.toFixed(0)}
• This Payment: ₹${paymentForm.amount.toFixed(0)}
• Remaining: ₹${(selectedRecord.pending_amount - paymentForm.amount).toFixed(0)}

Payment Method: ${paymentForm.payment_method.toUpperCase()}${paymentForm.reference_number ? `\nReference: ${paymentForm.reference_number}` : ''}`}
            confirmText="Record Payment"
            cancelText="Review"
            variant="primary"
          />
        )}
      </div>
    );
  }

  // DETAILS VIEW
  if (view === 'details' && viewingPayment) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-4 py-6 md:px-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => setView('list')} className="p-2 bg-white/20 rounded-xl backdrop-blur-sm hover:bg-white/30"><X className="text-white" size={24} /></button>
              <div className="flex items-center gap-3 flex-1">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><CreditCard className="text-white" size={28} /></div>
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-bold text-white">{viewingPayment.payment_number}</h1>
                  <p className="text-teal-100 text-sm">{viewingPayment.purchase_invoice?.vendor?.name}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-semibold text-white">{viewingPayment.payment_method.toUpperCase()}</div>
              <div className="text-right"><p className="text-teal-100 text-xs">Amount</p><p className="text-white text-2xl font-bold">₹{viewingPayment.amount.toFixed(0)}</p></div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-6 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><FileText size={18} className="text-teal-600" />Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Payment Date</span><span className="font-medium text-slate-900">{new Date(viewingPayment.payment_date).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Invoice</span><span className="font-medium text-teal-700">{viewingPayment.purchase_invoice?.invoice_number}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Vendor</span><span className="font-medium text-slate-900">{viewingPayment.purchase_invoice?.vendor?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Method</span><span className="font-medium text-slate-900">{viewingPayment.payment_method}</span></div>
              {viewingPayment.reference_number && <div className="flex justify-between"><span className="text-slate-600">Reference</span><span className="font-medium text-slate-900">{viewingPayment.reference_number}</span></div>}
              {viewingPayment.notes && <div className="pt-2 border-t"><p className="text-slate-600 mb-1">Notes</p><p className="text-slate-900">{viewingPayment.notes}</p></div>}
            </div>
          </div>

          <button onClick={() => setDeletingPayment({ id: viewingPayment.id, payment_number: viewingPayment.payment_number })} className="w-full bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2"><Trash2 size={20} />Delete Payment</button>
          <div className="h-4 md:hidden" />
        </div>

        <ConfirmDialog isOpen={!!deletingPayment} onClose={() => setDeletingPayment(null)} onConfirm={handleDelete} title="Delete Payment" message={`Delete payment "${deletingPayment?.payment_number}"? Cannot be undone.`} confirmText="Delete" cancelText="Cancel" variant="danger" />
      </div>
    );
  }

  return null;
};

export default PurchasePayments;
