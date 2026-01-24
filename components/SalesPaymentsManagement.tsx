// FILE PATH: components/SalesPaymentsManagement.tsx
// Sales & Payments Management - View invoices with returns and all payment tracking

'use client';
import React, { useState, useEffect } from 'react';
import { FileText, Search, X, Eye, Trash2, Printer, ShoppingCart, DollarSign, Filter } from 'lucide-react';
import { printInvoice } from '@/lib/thermalPrinter';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type SalesInvoice = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_gstin?: string;
  place_of_supply?: string;
  invoice_date: string;
  subtotal: number;
  discount_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  round_off: number;
  total_amount: number;
  returned_amount: number;
  payment_method: string;
  payment_status: string;
  is_printed: boolean;
  notes?: string;
  created_at: string;
};

type Payment = {
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

const SalesPaymentsManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<SalesInvoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [invoicePayments, setInvoicePayments] = useState<Payment[]>([]);
  const [deletingInvoice, setDeletingInvoice] = useState<{ id: string; invoice_number: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [printingInvoice, setPrintingInvoice] = useState<SalesInvoice | null>(null);
  const [printSettings, setPrintSettings] = useState({
    width: '80mm' as '58mm' | '80mm',
    method: 'iframe' as 'browser' | 'iframe' | 'bluetooth' | 'preview'
  });
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [printing, setPrinting] = useState(false);

  // Filter and sort states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    paymentMethod: 'all',
    paymentStatus: 'all',
    customerName: ''
  });
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      await Promise.all([
        loadInvoices(),
        loadPayments(),
        loadStoreSettings()
      ]);
    } catch (err: any) {
      console.error('Error loading data:', err);
      toast.error('Failed to load', 'Could not load data.');
    } finally {
      setLoading(false);
    }
  }

  async function loadStoreSettings() {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1);
      
      setStoreSettings(data?.[0] || null);
    } catch (err) {
      console.error('Error loading store settings:', err);
    }
  }

  async function loadInvoices() {
    try {
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err: any) {
      console.error('Error loading invoices:', err);
    }
  }

  async function loadPayments() {
    try {
      const { data, error } = await supabase
        .from('sales_payments')
        .select(`
          *,
          invoice:sales_invoices(invoice_number, customer_name)
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err: any) {
      console.error('Error loading payments:', err);
    }
  }

  async function loadInvoiceDetails(invoiceId: string) {
    try {
      setLoadingItems(true);
      
      const [itemsData, paymentsData] = await Promise.all([
        supabase
          .from('sales_invoice_items')
          .select(`
            *,
            item:items(name)
          `)
          .eq('invoice_id', invoiceId),
        supabase
          .from('sales_payments')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('payment_date', { ascending: false })
      ]);

      setInvoiceItems(itemsData.data || []);
      setInvoicePayments(paymentsData.data || []);
    } catch (err: any) {
      console.error('Error loading invoice details:', err);
    } finally {
      setLoadingItems(false);
    }
  }

  const handleViewInvoice = async (invoice: SalesInvoice) => {
    setViewingInvoice(invoice);
    setShowViewModal(true);
    await loadInvoiceDetails(invoice.id);
  };

  const handlePrintClick = (invoice: SalesInvoice) => {
    setPrintingInvoice(invoice);
    setShowPrintSettings(true);
  };

  const handlePrint = async () => {
    if (!printingInvoice || !storeSettings) return;

    try {
      setPrinting(true);

      const { data: itemsData } = await supabase
        .from('sales_invoice_items')
        .select(`
          *,
          item:items(name, unit:units(abbreviation))
        `)
        .eq('invoice_id', printingInvoice.id);

      await printInvoice(
        storeSettings,
        {
          invoice_number: printingInvoice.invoice_number,
          invoice_date: printingInvoice.invoice_date,
          customer_name: printingInvoice.customer_name,
          customer_phone: printingInvoice.customer_phone,
          customer_gstin: printingInvoice.customer_gstin,
          items: itemsData || [],
          subtotal: printingInvoice.subtotal,
          discount_amount: printingInvoice.discount_amount,
          cgst_amount: printingInvoice.cgst_amount,
          sgst_amount: printingInvoice.sgst_amount,
          igst_amount: printingInvoice.igst_amount,
          round_off: printingInvoice.round_off,
          total_amount: printingInvoice.total_amount,
          payment_method: printingInvoice.payment_method
        },
        {
          width: printSettings.width,
          method: printSettings.method
        }
      );

      toast.success('Printing!', `Invoice ${printingInvoice.invoice_number} sent to printer.`);
      setShowPrintSettings(false);
      setPrintingInvoice(null);
    } catch (err: any) {
      console.error('Error printing:', err);
      toast.error('Print failed', err.message || 'Could not print invoice.');
    } finally {
      setPrinting(false);
    }
  };

  const handleDeleteClick = (invoice: SalesInvoice) => {
    setDeletingInvoice({ id: invoice.id, invoice_number: invoice.invoice_number });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingInvoice) return;

    try {
      const { error } = await supabase
        .from('sales_invoices')
        .delete()
        .eq('id', deletingInvoice.id);

      if (error) throw error;

      toast.success('Deleted!', `Invoice ${deletingInvoice.invoice_number} has been deleted.`);
      await loadInvoices();
    } catch (err: any) {
      console.error('Error deleting invoice:', err);
      toast.error('Failed to delete', err.message || 'Could not delete invoice.');
    } finally {
      setShowDeleteConfirm(false);
      setDeletingInvoice(null);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply advanced filters
    if (filters.startDate && invoice.invoice_date < filters.startDate) return false;
    if (filters.endDate && invoice.invoice_date > filters.endDate) return false;
    if (filters.minAmount && invoice.total_amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && invoice.total_amount > parseFloat(filters.maxAmount)) return false;
    if (filters.paymentMethod !== 'all' && invoice.payment_method !== filters.paymentMethod) return false;
    if (filters.paymentStatus !== 'all' && invoice.payment_status !== filters.paymentStatus) return false;
    if (filters.customerName && !invoice.customer_name.toLowerCase().includes(filters.customerName.toLowerCase())) return false;

    return matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.invoice_date).getTime();
      const dateB = new Date(b.invoice_date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      return sortOrder === 'desc' ? b.total_amount - a.total_amount : a.total_amount - b.total_amount;
    }
  });

  const filteredPayments = payments.filter(payment => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      payment.payment_number.toLowerCase().includes(searchLower) ||
      payment.invoice?.invoice_number.toLowerCase().includes(searchLower) ||
      payment.invoice?.customer_name.toLowerCase().includes(searchLower);

    // Apply filters for payments
    if (filters.startDate && payment.payment_date < filters.startDate) return false;
    if (filters.endDate && payment.payment_date > filters.endDate) return false;
    if (filters.minAmount && Math.abs(payment.amount) < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && Math.abs(payment.amount) > parseFloat(filters.maxAmount)) return false;
    if (filters.paymentMethod !== 'all' && payment.payment_method !== filters.paymentMethod) return false;

    return matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.payment_date).getTime();
      const dateB = new Date(b.payment_date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      return sortOrder === 'desc' ? Math.abs(b.amount) - Math.abs(a.amount) : Math.abs(a.amount) - Math.abs(b.amount);
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600 font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 ${theme.classes.bgPrimaryLight} rounded-xl`}>
              <ShoppingCart className={theme.classes.textPrimary} size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Sales & Payments</h1>
              <p className="text-slate-600 text-sm mt-0.5">View invoices with returns and track all payments</p>
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
              Sales Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'payments'
                  ? `${theme.classes.bgPrimary} text-white shadow-md`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Payments ({payments.length})
            </button>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search by invoice number or customer..."
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
        </Card>

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <>
            {filteredInvoices.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<FileText size={64} />}
                  title={searchTerm ? "No invoices found" : "No invoices yet"}
                  description={
                    searchTerm
                      ? "Try adjusting your search"
                      : "Sales invoices will appear here"
                  }
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => {
                  const netAmount = invoice.total_amount - (invoice.returned_amount || 0);
                  const hasReturns = (invoice.returned_amount || 0) > 0;

                  return (
                    <Card key={invoice.id} hover padding="lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg`}>
                              <FileText className={theme.classes.textPrimary} size={20} />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900">{invoice.invoice_number}</h3>
                              <p className="text-sm text-slate-600">{invoice.customer_name}</p>
                            </div>
                            <Badge 
                              variant={invoice.payment_status === 'paid' ? 'success' : invoice.payment_status === 'credit' ? 'danger' : 'warning'} 
                              size="sm"
                            >
                              {invoice.payment_status}
                            </Badge>
                            {hasReturns && (
                              <Badge variant="warning" size="sm">
                                Has Returns
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500 font-medium">Date & Time</p>
                              <p className="text-slate-900 font-semibold">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                              <p className="text-slate-600 text-xs">{new Date(invoice.created_at).toLocaleTimeString()}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-medium">Total Amount</p>
                              <p className="text-slate-900 font-bold">₹{invoice.total_amount.toLocaleString()}</p>
                            </div>
                            {hasReturns && (
                              <div>
                                <p className="text-slate-500 font-medium">Returned</p>
                                <p className="text-red-600 font-bold">-₹{(invoice.returned_amount || 0).toLocaleString()}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-slate-500 font-medium">Net Amount</p>
                              <p className={`${theme.classes.textPrimary} font-bold text-lg`}>₹{netAmount.toLocaleString()}</p>
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
                          <button
                            onClick={() => handlePrintClick(invoice)}
                            className={`p-2.5 rounded-lg ${theme.classes.bgPrimaryLight} ${theme.classes.textPrimary} hover:opacity-80 transition-colors`}
                            title="Reprint"
                          >
                            <Printer size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(invoice)}
                            className="p-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
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

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <>
            {filteredPayments.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<DollarSign size={64} />}
                  title={searchTerm ? "No payments found" : "No payment history"}
                  description={
                    searchTerm
                      ? "Try adjusting your search"
                      : "Payment records will appear here"
                  }
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((payment) => {
                  const isRefund = payment.amount < 0;

                  return (
                    <Card key={payment.id} hover padding="lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 ${isRefund ? 'bg-red-50' : 'bg-green-50'} rounded-lg`}>
                              <DollarSign className={isRefund ? 'text-red-600' : 'text-green-600'} size={20} />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900">{payment.payment_number}</h3>
                              <p className="text-sm text-slate-600">
                                {payment.invoice?.customer_name} - {payment.invoice?.invoice_number}
                              </p>
                            </div>
                            {isRefund && (
                              <Badge variant="danger" size="sm">Refund</Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500 font-medium">Date & Time</p>
                              <p className="text-slate-900 font-semibold">{new Date(payment.payment_date).toLocaleDateString()}</p>
                              <p className="text-slate-600 text-xs">{new Date(payment.created_at).toLocaleTimeString()}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-medium">Amount</p>
                              <p className={`${isRefund ? 'text-red-600' : 'text-green-600'} font-bold text-lg`}>
                                {isRefund ? '-' : ''}₹{Math.abs(payment.amount).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-medium">Method</p>
                              <Badge variant="neutral" size="sm">{payment.payment_method}</Badge>
                            </div>
                            {payment.reference_number && (
                              <div>
                                <p className="text-slate-500 font-medium">Reference</p>
                                <p className="text-slate-900 font-semibold">{payment.reference_number}</p>
                              </div>
                            )}
                          </div>
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
                  <h3 className="text-xl font-bold text-slate-900">Filter {activeTab === 'invoices' ? 'Invoices' : 'Payments'}</h3>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                    <Select
                      value={filters.paymentMethod}
                      onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                    >
                      <option value="all">All Methods</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="credit">Credit</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </Select>
                  </div>

                  {activeTab === 'invoices' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Status</label>
                      <Select
                        value={filters.paymentStatus}
                        onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                      >
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="credit">Credit</option>
                        <option value="partial">Partial</option>
                        <option value="pending">Pending</option>
                      </Select>
                    </div>
                  )}
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
                      paymentStatus: 'all',
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

              {loadingItems ? (
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
                          <div key={payment.id} className={`flex justify-between items-center p-3 ${payment.amount < 0 ? 'bg-red-50' : 'bg-green-50'} rounded-lg`}>
                            <div>
                              <p className="font-semibold text-slate-900">{payment.payment_number}</p>
                              <p className="text-sm text-slate-600">
                                {new Date(payment.payment_date).toLocaleDateString()} - {payment.payment_method}
                              </p>
                            </div>
                            <p className={`font-bold ${payment.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {payment.amount < 0 ? '-' : ''}₹{Math.abs(payment.amount).toLocaleString()}
                            </p>
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
                      {(viewingInvoice.returned_amount || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Returned Amount</span>
                          <span className="font-semibold text-red-600">-₹{(viewingInvoice.returned_amount || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-3 border-t-2 border-slate-300">
                        <span className="font-bold text-lg">Net Amount</span>
                        <span className={`font-bold text-2xl ${theme.classes.textPrimary}`}>
                          ₹{(viewingInvoice.total_amount - (viewingInvoice.returned_amount || 0)).toFixed(2)}
                        </span>
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

      {/* Print Settings Modal */}
      {showPrintSettings && printingInvoice && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Print Settings</h3>
                <button
                  onClick={() => setShowPrintSettings(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Paper Width</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPrintSettings({ ...printSettings, width: '58mm' })}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium ${
                        printSettings.width === '58mm'
                          ? `${theme.classes.bgPrimary} text-white`
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      58mm
                    </button>
                    <button
                      onClick={() => setPrintSettings({ ...printSettings, width: '80mm' })}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium ${
                        printSettings.width === '80mm'
                          ? `${theme.classes.bgPrimary} text-white`
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      80mm
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Print Method</label>
                  <Select
                    value={printSettings.method}
                    onChange={(e) => setPrintSettings({ ...printSettings, method: e.target.value as any })}
                  >
                    <option value="iframe">iFrame (Recommended)</option>
                    <option value="browser">Browser Print Dialog</option>
                    <option value="bluetooth">Bluetooth Printer</option>
                    <option value="preview">Preview Only</option>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={() => setShowPrintSettings(false)} variant="secondary" fullWidth>
                  Cancel
                </Button>
                <Button onClick={handlePrint} variant="primary" fullWidth loading={printing}>
                  Print Invoice
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingInvoice && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeletingInvoice(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Invoice"
          message={`Are you sure you want to delete invoice "${deletingInvoice.invoice_number}"? This will permanently remove the invoice. For customer returns, please use the Returns page instead. This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}
    </div>
  );
};

export default SalesPaymentsManagement;
