// FILE PATH: components/CreditsManagement.tsx
// Credits & Credit Notes Management - Track credit sales and credit notes from returns

'use client';
import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Search, X, Eye, AlertCircle, DollarSign, User, Filter, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type CreditInvoice = {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  invoice_date: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  payment_status: string;
  created_at: string;
};

type CreditNote = {
  id: string;
  credit_note_number: string;
  return_id: string;
  original_invoice_id?: string;
  customer_id?: string;
  customer_name?: string;
  issue_date: string;
  amount: number;
  used_amount: number;
  balance_amount: number;
  expiry_date?: string;
  status: string;
  notes?: string;
  created_at: string;
};

type CreditPayment = {
  id: string;
  payment_number: string;
  invoice_id: string;
  invoice?: {
    invoice_number: string;
    customer_name: string;
  };
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
};

const CreditsManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState<'invoices' | 'credit-notes'>('invoices');
  const [creditInvoices, setCreditInvoices] = useState<CreditInvoice[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<CreditInvoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<CreditInvoice | null>(null);
  const [viewingCreditNote, setViewingCreditNote] = useState<CreditNote | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [invoicePayments, setInvoicePayments] = useState<CreditPayment[]>([]);
  const [creditNoteUsage, setCreditNoteUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter and sort states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    paymentMethod: 'all',
    customerName: ''
  });
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    await Promise.all([
      loadCreditInvoices(),
      loadCreditNotes()
    ]);
  }

  async function loadCreditInvoices() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*')
        .in('payment_status', ['credit', 'partial'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate paid and pending amounts for each invoice
      const invoicesWithAmounts = await Promise.all(
        (data || []).map(async (invoice) => {
          const { data: payments } = await supabase
            .from('credit_payments')
            .select('amount')
            .eq('invoice_id', invoice.id);

          const paid_amount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
          const pending_amount = invoice.total_amount - paid_amount;

          return {
            ...invoice,
            paid_amount,
            pending_amount
          };
        })
      );

      setCreditInvoices(invoicesWithAmounts);
    } catch (err: any) {
      console.error('Error loading credit invoices:', err);
      toast.error('Failed to load', 'Could not load credit invoices.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCreditNotes() {
    try {
      const { data, error } = await supabase
        .from('credit_notes')
        .select(`
          *,
          customer:customers(name)
        `)
        .order('issue_date', { ascending: false });

      if (error) throw error;

      const notesWithCustomer = (data || []).map(note => ({
        ...note,
        customer_name: note.customer?.name || 'Unknown'
      }));

      setCreditNotes(notesWithCustomer);
    } catch (err: any) {
      console.error('Error loading credit notes:', err);
      toast.error('Failed to load', 'Could not load credit notes.');
    }
  }

  async function loadInvoiceDetails(invoiceId: string) {
    try {
      setLoadingDetails(true);
      
      const [itemsData, paymentsData] = await Promise.all([
        supabase
          .from('sales_invoice_items')
          .select(`
            *,
            item:items(name)
          `)
          .eq('invoice_id', invoiceId),
        supabase
          .from('credit_payments')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('payment_date', { ascending: false })
      ]);

      setInvoiceItems(itemsData.data || []);
      setInvoicePayments(paymentsData.data || []);
    } catch (err: any) {
      console.error('Error loading invoice details:', err);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function loadCreditNoteUsage(creditNoteId: string) {
    try {
      setLoadingDetails(true);
      
      const { data, error } = await supabase
        .from('credit_note_usage')
        .select(`
          *,
          invoice:sales_invoices(invoice_number, customer_name)
        `)
        .eq('credit_note_id', creditNoteId)
        .order('usage_date', { ascending: false });

      if (error) throw error;
      setCreditNoteUsage(data || []);
    } catch (err: any) {
      console.error('Error loading credit note usage:', err);
    } finally {
      setLoadingDetails(false);
    }
  }

  const handleRecordPayment = (invoice: CreditInvoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      payment_date: new Date().toISOString().split('T')[0],
      amount: invoice.pending_amount,
      payment_method: 'cash',
      reference_number: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = () => {
    if (!selectedInvoice) return;
    if (paymentForm.amount <= 0) {
      toast.warning('Invalid amount', 'Payment amount must be greater than 0.');
      return;
    }
    if (paymentForm.amount > selectedInvoice.pending_amount) {
      toast.warning('Amount exceeds pending', 'Payment amount cannot exceed pending amount.');
      return;
    }
    setShowPaymentConfirm(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;

    try {
      setSaving(true);
      setShowPaymentConfirm(false);

      const paymentNumber = `CP-${Date.now()}`;

      // Insert payment to credit_payments
      const { error: paymentError } = await supabase
        .from('credit_payments')
        .insert({
          payment_number: paymentNumber,
          invoice_id: selectedInvoice.id,
          payment_date: paymentForm.payment_date,
          amount: paymentForm.amount,
          payment_method: paymentForm.payment_method,
          reference_number: paymentForm.reference_number || null,
          notes: paymentForm.notes || null
        });

      if (paymentError) throw paymentError;

      // Also record in sales_payments for unified tracking
      const { error: salesPaymentError } = await supabase
        .from('sales_payments')
        .insert({
          payment_number: paymentNumber,
          invoice_id: selectedInvoice.id,
          payment_date: paymentForm.payment_date,
          amount: paymentForm.amount,
          payment_method: paymentForm.payment_method,
          reference_number: paymentForm.reference_number || null,
          notes: paymentForm.notes || null
        });

      if (salesPaymentError) {
        console.error('Error recording to sales_payments:', salesPaymentError);
      }

      // Calculate new payment status
      const newPaidAmount = selectedInvoice.paid_amount + paymentForm.amount;
      const newPendingAmount = selectedInvoice.total_amount - newPaidAmount;
      const newStatus = newPendingAmount <= 0 ? 'paid' : 'partial';

      // Update invoice payment status
      const { error: updateError } = await supabase
        .from('sales_invoices')
        .update({ payment_status: newStatus })
        .eq('id', selectedInvoice.id);

      if (updateError) throw updateError;

      toast.success('Payment recorded!', `Payment ${paymentNumber} has been saved.`);
      await loadCreditInvoices();
      setShowPaymentModal(false);
      setSelectedInvoice(null);
    } catch (err: any) {
      console.error('Error recording payment:', err);
      toast.error('Failed to save', err.message || 'Could not record payment.');
    } finally {
      setSaving(false);
    }
  };

  const handleViewInvoice = async (invoice: CreditInvoice) => {
    setViewingInvoice(invoice);
    setViewingCreditNote(null);
    setShowViewModal(true);
    await loadInvoiceDetails(invoice.id);
  };

  const handleViewCreditNote = async (creditNote: CreditNote) => {
    setViewingCreditNote(creditNote);
    setViewingInvoice(null);
    setShowViewModal(true);
    await loadCreditNoteUsage(creditNote.id);
  };

  const filteredInvoices = creditInvoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || invoice.payment_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const filteredCreditNotes = creditNotes.filter(note => {
    const matchesSearch = 
      note.credit_note_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.customer_name && note.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || note.status === filterStatus;

    // Apply advanced filters
    if (filters.startDate && note.issue_date < filters.startDate) return false;
    if (filters.endDate && note.issue_date > filters.endDate) return false;
    if (filters.minAmount && note.balance_amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && note.balance_amount > parseFloat(filters.maxAmount)) return false;
    if (filters.customerName && note.customer_name && !note.customer_name.toLowerCase().includes(filters.customerName.toLowerCase())) return false;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.issue_date).getTime();
      const dateB = new Date(b.issue_date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      return sortOrder === 'desc' ? b.balance_amount - a.balance_amount : a.balance_amount - b.balance_amount;
    }
  });

  const totalCredit = creditInvoices.reduce((sum, inv) => sum + inv.pending_amount, 0);
  const totalPaid = creditInvoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const totalCreditNoteBalance = creditNotes
    .filter(n => n.status === 'active')
    .reduce((sum, n) => sum + n.balance_amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600 font-medium">Loading credits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 ${theme.classes.bgPrimaryLight} rounded-xl`}>
              <CreditCard className={theme.classes.textPrimary} size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Credits & Credit Notes</h1>
              <p className="text-slate-600 text-sm mt-0.5">Manage credit sales and track credit notes from returns</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`${theme.classes.bgPrimaryLight} rounded-xl p-4`}>
              <p className={`text-sm ${theme.classes.textPrimary} font-medium`}>Credit Sales Outstanding</p>
              <p className={`text-2xl font-bold ${theme.classes.textPrimary} mt-1`}>₹{totalCredit.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-green-600 font-medium">Payments Received</p>
              <p className="text-2xl font-bold text-green-700 mt-1">₹{totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-600 font-medium">Credit Note Balance</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">₹{totalCreditNoteBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Card padding="md">
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'invoices'
                  ? `${theme.classes.bgPrimary} text-white shadow-md`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Credit Invoices ({creditInvoices.length})
            </button>
            <button
              onClick={() => setActiveTab('credit-notes')}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'credit-notes'
                  ? `${theme.classes.bgPrimary} text-white shadow-md`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Credit Notes ({creditNotes.length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search by number or customer..."
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
              {activeTab === 'invoices' ? (
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1"
                >
                  <option value="all">All Status</option>
                  <option value="credit">Credit (Unpaid)</option>
                  <option value="partial">Partial Payment</option>
                </Select>
              ) : (
                <>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex-1"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="used">Fully Used</option>
                  </Select>
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
                    <option value="amount-desc">Balance (High to Low)</option>
                    <option value="amount-asc">Balance (Low to High)</option>
                  </Select>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Credit Invoices Tab */}
        {activeTab === 'invoices' && (
          <>
            {filteredInvoices.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<CreditCard size={64} />}
                  title={searchTerm || filterStatus !== 'all' ? "No invoices found" : "No credit invoices"}
                  description={
                    searchTerm || filterStatus !== 'all'
                      ? "Try adjusting your search or filters"
                      : "Credit sales will appear here"
                  }
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => (
                  <Card key={invoice.id} hover padding="lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg`}>
                            <CreditCard className={theme.classes.textPrimary} size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{invoice.invoice_number}</h3>
                            <p className="text-sm text-slate-600">{invoice.customer_name}</p>
                          </div>
                          <Badge variant={invoice.payment_status === 'credit' ? 'danger' : 'warning'} size="sm">
                            {invoice.payment_status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 font-medium">Date & Time</p>
                            <p className="text-slate-900 font-semibold">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                            <p className="text-slate-600 text-xs">{new Date(invoice.created_at).toLocaleTimeString()}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-medium">Total</p>
                            <p className="text-slate-900 font-bold">₹{invoice.total_amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-medium">Paid</p>
                            <p className="text-green-600 font-bold">₹{invoice.paid_amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-medium">Pending</p>
                            <p className={`${theme.classes.textPrimary} font-bold text-lg`}>₹{invoice.pending_amount.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {invoice.pending_amount > 0 && (
                          <Button
                            onClick={() => handleRecordPayment(invoice)}
                            variant="primary"
                            size="sm"
                            icon={<Plus size={16} />}
                          >
                            Record Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Credit Notes Tab */}
        {activeTab === 'credit-notes' && (
          <>
            {filteredCreditNotes.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<DollarSign size={64} />}
                  title={searchTerm ? "No credit notes found" : "No credit notes"}
                  description={
                    searchTerm
                      ? "Try adjusting your search"
                      : "Credit notes from returns will appear here"
                  }
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredCreditNotes.map((note) => {
                  const isExpired = note.expiry_date && new Date(note.expiry_date) < new Date();
                  const isFullyUsed = note.balance_amount <= 0;

                  return (
                    <Card key={note.id} hover padding="lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 ${isExpired || isFullyUsed ? 'bg-slate-100' : 'bg-blue-50'} rounded-lg`}>
                              <DollarSign className={isExpired || isFullyUsed ? 'text-slate-400' : 'text-blue-600'} size={20} />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900">{note.credit_note_number}</h3>
                              {note.customer_name && (
                                <p className="text-sm text-slate-600">{note.customer_name}</p>
                              )}
                            </div>
                            <Badge
                              variant={
                                isFullyUsed ? 'neutral' :
                                isExpired ? 'danger' : 'success'
                              }
                              size="sm"
                            >
                              {isFullyUsed ? 'Fully Used' : isExpired ? 'Expired' : note.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500 font-medium">Issue Date</p>
                              <p className="text-slate-900 font-semibold">{new Date(note.issue_date).toLocaleDateString()}</p>
                              <p className="text-slate-600 text-xs">{new Date(note.created_at).toLocaleTimeString()}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-medium">Original Amount</p>
                              <p className="text-slate-900 font-bold">₹{note.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-medium">Used</p>
                              <p className="text-red-600 font-bold">₹{note.used_amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-medium">Balance</p>
                              <p className="text-blue-600 font-bold text-lg">₹{note.balance_amount.toLocaleString()}</p>
                            </div>
                            {note.expiry_date && (
                              <div>
                                <p className="text-slate-500 font-medium">Expires</p>
                                <p className={`font-semibold ${isExpired ? 'text-red-600' : 'text-slate-900'}`}>
                                  {new Date(note.expiry_date).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewCreditNote(note)}
                            className="p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            title="View Usage History"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Record Payment</h3>
                  <p className="text-sm text-slate-600 mt-1">{selectedInvoice.invoice_number} - {selectedInvoice.customer_name}</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl p-5">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-slate-600">Total Amount</p>
                      <p className="text-xl font-bold text-slate-900">₹{selectedInvoice.total_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Already Paid</p>
                      <p className="text-xl font-bold text-green-600">₹{selectedInvoice.paid_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Pending</p>
                      <p className={`text-xl font-bold ${theme.classes.textPrimary}`}>₹{selectedInvoice.pending_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Payment Date"
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    required
                  />

                  <Input
                    label="Payment Amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentForm.amount || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                    required
                    helperText={`Max: ₹${selectedInvoice.pending_amount.toLocaleString()}`}
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
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={() => setShowPaymentModal(false)} variant="secondary" fullWidth>
                  Cancel
                </Button>
                <Button onClick={handleSubmitPayment} variant="primary" fullWidth disabled={paymentForm.amount <= 0}>
                  Record Payment
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Payment Confirmation */}
      {showPaymentConfirm && selectedInvoice && (
        <ConfirmDialog
          isOpen={showPaymentConfirm}
          onClose={() => setShowPaymentConfirm(false)}
          onConfirm={handleConfirmPayment}
          title="Confirm Payment"
          message={`
Record payment of ₹${paymentForm.amount.toLocaleString()} for invoice ${selectedInvoice.invoice_number}?

Total: ₹${selectedInvoice.total_amount.toLocaleString()}
Already Paid: ₹${selectedInvoice.paid_amount.toLocaleString()}
This Payment: ₹${paymentForm.amount.toLocaleString()}
Remaining: ₹${(selectedInvoice.pending_amount - paymentForm.amount).toLocaleString()}
          `}
          confirmText="Confirm Payment"
          cancelText="Cancel"
          variant="primary"
        />
      )}

      {/* View Invoice Modal */}
      {showViewModal && viewingInvoice && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{viewingInvoice.invoice_number}</h3>
                  <p className="text-slate-600">{viewingInvoice.customer_name}</p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={24} />
                </button>
              </div>

              {loadingDetails ? (
                <div className="text-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Items */}
                  <div>
                    <h4 className="font-bold text-slate-900 mb-4">Invoice Items</h4>
                    <div className="space-y-2">
                      {invoiceItems.map((item, idx) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-slate-900">{item.item?.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600">{item.quantity} × ₹{item.rate.toFixed(2)}</p>
                            <p className="font-bold text-slate-900">₹{item.total_amount.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment History */}
                  <div>
                    <h4 className="font-bold text-slate-900 mb-4">Payment History</h4>
                    {invoicePayments.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">No payments recorded yet</p>
                    ) : (
                      <div className="space-y-2">
                        {invoicePayments.map((payment) => (
                          <div key={payment.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <div>
                              <p className="font-semibold text-slate-900">{payment.payment_number}</p>
                              <p className="text-sm text-slate-600">
                                {new Date(payment.payment_date).toLocaleDateString()} - {payment.payment_method}
                              </p>
                            </div>
                            <p className="font-bold text-green-600">₹{payment.amount.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="bg-slate-50 rounded-xl p-5">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-700">Total Amount</span>
                        <span className="font-semibold">₹{viewingInvoice.total_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-700">Paid Amount</span>
                        <span className="font-semibold text-green-600">₹{viewingInvoice.paid_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t-2 border-slate-300">
                        <span className="font-bold text-lg">Pending Amount</span>
                        <span className={`font-bold text-2xl ${theme.classes.textPrimary}`}>₹{viewingInvoice.pending_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <Button onClick={() => setShowViewModal(false)} variant="secondary" fullWidth>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* View Credit Note Modal */}
      {showViewModal && viewingCreditNote && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{viewingCreditNote.credit_note_number}</h3>
                  <p className="text-slate-600">{viewingCreditNote.customer_name}</p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={24} />
                </button>
              </div>

              {loadingDetails ? (
                <div className="text-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Credit Note Details */}
                  <div className="bg-slate-50 rounded-xl p-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Issue Date</p>
                        <p className="font-semibold text-slate-900">{new Date(viewingCreditNote.issue_date).toLocaleDateString()}</p>
                      </div>
                      {viewingCreditNote.expiry_date && (
                        <div>
                          <p className="text-sm text-slate-600">Expiry Date</p>
                          <p className="font-semibold text-slate-900">{new Date(viewingCreditNote.expiry_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-slate-600">Original Amount</p>
                        <p className="font-bold text-slate-900">₹{viewingCreditNote.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Status</p>
                        <Badge variant={viewingCreditNote.status === 'active' ? 'success' : 'neutral'} size="sm">
                          {viewingCreditNote.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Usage History */}
                  <div>
                    <h4 className="font-bold text-slate-900 mb-4">Usage History</h4>
                    {creditNoteUsage.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">Not used yet</p>
                    ) : (
                      <div className="space-y-2">
                        {creditNoteUsage.map((usage) => (
                          <div key={usage.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <div>
                              <p className="font-semibold text-slate-900">{usage.invoice?.invoice_number}</p>
                              <p className="text-sm text-slate-600">
                                {new Date(usage.usage_date).toLocaleDateString()} - {usage.invoice?.customer_name}
                              </p>
                            </div>
                            <p className="font-bold text-blue-600">-₹{usage.amount_used.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Balance Summary */}
                  <div className="bg-slate-50 rounded-xl p-5">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-700">Original Amount</span>
                        <span className="font-semibold">₹{viewingCreditNote.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-700">Used Amount</span>
                        <span className="font-semibold text-red-600">-₹{viewingCreditNote.used_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t-2 border-slate-300">
                        <span className="font-bold text-lg">Balance Available</span>
                        <span className="font-bold text-2xl text-blue-600">₹{viewingCreditNote.balance_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <Button onClick={() => setShowViewModal(false)} variant="secondary" fullWidth>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

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
                  <h3 className="text-xl font-bold text-slate-900">Filter Credit Notes</h3>
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
                    label="Min Balance"
                    type="number"
                    placeholder="0"
                    value={filters.minAmount}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                  />
                  <Input
                    label="Max Balance"
                    type="number"
                    placeholder="No limit"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                  />
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
                      paymentMethod: 'all',
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
    </div>
  );
};

export default CreditsManagement;
