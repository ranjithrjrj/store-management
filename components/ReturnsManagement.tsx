// FILE PATH: components/ReturnsManagement.tsx
// Complete Returns Management with item restocking and credit notes

'use client';
import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Search, Calendar, DollarSign, Edit2, Trash2, X, Filter, Package, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type ReturnItem = {
  id: string;
  item_id: string;
  item_name: string;
  original_quantity: number;
  return_quantity: number;
  rate: number;
  gst_rate: number;
  discount_percent: number;
  amount: number;
};

type SalesReturn = {
  id: string;
  return_number: string;
  original_invoice_id?: string;
  original_invoice_number?: string;
  customer_name?: string;
  return_date: string;
  total_amount: number;
  refund_method: string;
  refund_status: 'pending' | 'completed' | 'rejected';
  is_restockable: boolean;
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
  const [showProcessConfirm, setShowProcessConfirm] = useState(false);
  const [editingReturn, setEditingReturn] = useState<SalesReturn | null>(null);
  const [deletingReturn, setDeletingReturn] = useState<{ id: string; return_number: string } | null>(null);
  const [processingReturn, setProcessingReturn] = useState<SalesReturn | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingInvoiceItems, setLoadingInvoiceItems] = useState(false);
  
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
    original_invoice_id: '',
    return_date: new Date().toISOString().split('T')[0],
    refund_method: 'cash',
    is_restockable: true,
    notes: ''
  });

  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);

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
        .select('id, invoice_number, customer_name, customer_id, place_of_supply, total_amount, invoice_date, cgst_amount, sgst_amount, igst_amount')
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
      original_invoice_id: '',
      return_date: new Date().toISOString().split('T')[0],
      refund_method: 'cash',
      is_restockable: true,
      notes: ''
    });
    setReturnItems([]);
    setInvoiceItems([]);
    setShowModal(true);
  };

  const handleEdit = async (returnRecord: SalesReturn) => {
    setEditingReturn(returnRecord);
    setFormData({
      original_invoice_id: returnRecord.original_invoice_id || '',
      return_date: returnRecord.return_date,
      refund_method: returnRecord.refund_method,
      is_restockable: returnRecord.is_restockable,
      notes: returnRecord.notes || ''
    });

    // Load the invoice items if invoice is selected
    if (returnRecord.original_invoice_id) {
      try {
        setLoadingInvoiceItems(true);
        
        const { data: items } = await supabase
          .from('sales_invoice_items')
          .select('*, item:items(name)')
          .eq('invoice_id', returnRecord.original_invoice_id);

        setInvoiceItems(items || []);

        // Load existing return items
        const { data: existingReturnItems } = await supabase
          .from('sales_return_items')
          .select('*')
          .eq('return_id', returnRecord.id);

        // Prefill with existing return quantities
        const prefilledItems = (items || []).map(item => {
          const existingReturn = existingReturnItems?.find(ri => ri.item_id === item.item_id);
          return {
            id: item.id,
            item_id: item.item_id,
            item_name: item.item?.name || 'Unknown',
            original_quantity: item.quantity,
            return_quantity: existingReturn?.quantity || 0,
            rate: item.rate,
            gst_rate: item.gst_rate,
            discount_percent: item.discount_percent || 0,
            amount: existingReturn?.amount || 0
          };
        });
        
        setReturnItems(prefilledItems);
      } catch (err: any) {
        console.error('Error loading return items:', err);
        toast.error('Failed to load', 'Could not load return items.');
      } finally {
        setLoadingInvoiceItems(false);
      }
    }

    setShowModal(true);
  };

  const handleInvoiceSelect = async (invoiceId: string) => {
    if (!invoiceId) {
      setInvoiceItems([]);
      setReturnItems([]);
      return;
    }

    try {
      setLoadingInvoiceItems(true);
      
      const { data: items, error } = await supabase
        .from('sales_invoice_items')
        .select(`
          *,
          item:items(name, unit:units(abbreviation))
        `)
        .eq('invoice_id', invoiceId);

      if (error) throw error;

      setInvoiceItems(items || []);
      
      // Pre-populate return items with zero quantities
      const prefilledItems: ReturnItem[] = (items || []).map(item => ({
        id: item.id,
        item_id: item.item_id,
        item_name: item.item?.name || 'Unknown',
        original_quantity: item.quantity,
        return_quantity: 0,
        rate: item.rate,
        gst_rate: item.gst_rate,
        discount_percent: item.discount_percent || 0,
        amount: 0
      }));
      
      setReturnItems(prefilledItems);
      setFormData({ ...formData, original_invoice_id: invoiceId });
    } catch (err: any) {
      console.error('Error loading invoice items:', err);
      toast.error('Failed to load', 'Could not load invoice items.');
    } finally {
      setLoadingInvoiceItems(false);
    }
  };

  const updateReturnItem = (id: string, quantity: number) => {
    setReturnItems(returnItems.map(item => {
      if (item.id !== id) return item;
      
      if (quantity > item.original_quantity) {
        toast.warning('Invalid quantity', `Cannot return more than ${item.original_quantity} units.`);
        return item;
      }

      const subtotal = quantity * item.rate;
      const discountAmount = (subtotal * item.discount_percent) / 100;
      const amount = subtotal - discountAmount;

      return { ...item, return_quantity: quantity, amount };
    }));
  };

  const calculateTotals = () => {
    const subtotal = returnItems.reduce((sum, item) => sum + (item.return_quantity * item.rate), 0);
    const discountAmount = returnItems.reduce((sum, item) => {
      const itemSubtotal = item.return_quantity * item.rate;
      return sum + ((itemSubtotal * item.discount_percent) / 100);
    }, 0);
    const taxableAmount = subtotal - discountAmount;

    const selectedInvoice = invoices.find(inv => inv.id === formData.original_invoice_id);
    const isIntrastate = selectedInvoice?.place_of_supply === 'Tamil Nadu';

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    returnItems.forEach(item => {
      if (item.return_quantity > 0) {
        const itemTaxable = item.amount;
        const taxAmount = (itemTaxable * item.gst_rate) / 100;
        
        if (isIntrastate) {
          cgst += taxAmount / 2;
          sgst += taxAmount / 2;
        } else {
          igst += taxAmount;
        }
      }
    });

    const total = taxableAmount + cgst + sgst + igst;

    return { subtotal, discountAmount, taxableAmount, cgst, sgst, igst, total };
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      const itemsToReturn = returnItems.filter(item => item.return_quantity > 0);
      
      if (itemsToReturn.length === 0) {
        toast.warning('No items selected', 'Please add at least one item to return.');
        return;
      }

      const selectedInvoice = invoices.find(inv => inv.id === formData.original_invoice_id);
      const totals = calculateTotals();

      if (editingReturn) {
        // UPDATE existing return
        const returnData = {
          return_date: formData.return_date,
          subtotal: totals.subtotal,
          discount_amount: totals.discountAmount,
          cgst_amount: totals.cgst,
          sgst_amount: totals.sgst,
          igst_amount: totals.igst,
          total_amount: totals.total,
          refund_method: formData.refund_method,
          is_restockable: formData.is_restockable,
          notes: formData.notes
        };

        const { error: returnError } = await supabase
          .from('sales_returns')
          .update(returnData)
          .eq('id', editingReturn.id);

        if (returnError) throw returnError;

        // Delete existing return items
        const { error: deleteError } = await supabase
          .from('sales_return_items')
          .delete()
          .eq('return_id', editingReturn.id);

        if (deleteError) throw deleteError;

        // Insert updated return items
        const isIntrastate = selectedInvoice?.place_of_supply === 'Tamil Nadu';
        const returnItemsData = itemsToReturn.map(item => {
          const itemSubtotal = item.return_quantity * item.rate;
          const discountAmt = (itemSubtotal * item.discount_percent) / 100;
          const taxableAmt = itemSubtotal - discountAmt;
          const gstAmount = (taxableAmt * item.gst_rate) / 100;

          return {
            return_id: editingReturn.id,
            item_id: item.item_id,
            quantity: item.return_quantity,
            rate: item.rate,
            discount_percent: item.discount_percent,
            discount_amount: discountAmt,
            taxable_amount: taxableAmt,
            gst_rate: item.gst_rate,
            cgst_amount: isIntrastate ? gstAmount / 2 : 0,
            sgst_amount: isIntrastate ? gstAmount / 2 : 0,
            igst_amount: !isIntrastate ? gstAmount : 0,
            total_amount: item.amount,
            is_restocked: false
          };
        });

        const { error: itemsError } = await supabase
          .from('sales_return_items')
          .insert(returnItemsData);

        if (itemsError) throw itemsError;

        toast.success('Return updated!', `Return ${editingReturn.return_number} has been updated.`);
      } else {
        // CREATE new return
        const returnNumber = `RET-${Date.now()}`;

        const returnData = {
          return_number: returnNumber,
          original_invoice_id: formData.original_invoice_id,
          original_invoice_number: selectedInvoice?.invoice_number,
          customer_id: selectedInvoice?.customer_id,
          customer_name: selectedInvoice?.customer_name,
          return_date: formData.return_date,
          subtotal: totals.subtotal,
          discount_amount: totals.discountAmount,
          cgst_amount: totals.cgst,
          sgst_amount: totals.sgst,
          igst_amount: totals.igst,
          total_amount: totals.total,
          refund_method: formData.refund_method,
          refund_status: 'pending',
          is_restockable: formData.is_restockable,
          notes: formData.notes
        };

        const { data: returnRecord, error: returnError } = await supabase
          .from('sales_returns')
          .insert(returnData)
          .select()
          .single();

        if (returnError) throw returnError;

        // Insert return items
        const isIntrastate = selectedInvoice?.place_of_supply === 'Tamil Nadu';
        const returnItemsData = itemsToReturn.map(item => {
          const itemSubtotal = item.return_quantity * item.rate;
          const discountAmt = (itemSubtotal * item.discount_percent) / 100;
          const taxableAmt = itemSubtotal - discountAmt;
          const gstAmount = (taxableAmt * item.gst_rate) / 100;

          return {
            return_id: returnRecord.id,
            item_id: item.item_id,
            quantity: item.return_quantity,
            rate: item.rate,
            discount_percent: item.discount_percent,
            discount_amount: discountAmt,
            taxable_amount: taxableAmt,
            gst_rate: item.gst_rate,
            cgst_amount: isIntrastate ? gstAmount / 2 : 0,
            sgst_amount: isIntrastate ? gstAmount / 2 : 0,
            igst_amount: !isIntrastate ? gstAmount : 0,
            total_amount: item.amount,
            is_restocked: false
          };
        });

        const { error: itemsError } = await supabase
          .from('sales_return_items')
          .insert(returnItemsData);

        if (itemsError) throw itemsError;

        toast.success('Return created!', `Return ${returnNumber} has been recorded. Process it to complete refund and restock.`);
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

  const handleProcessClick = (returnRecord: SalesReturn) => {
    if (returnRecord.refund_status !== 'pending') {
      toast.warning('Already processed', 'This return has already been processed.');
      return;
    }
    setProcessingReturn(returnRecord);
    setShowProcessConfirm(true);
  };

  const handleProcessConfirm = async () => {
    if (!processingReturn) return;

    try {
      setSaving(true);

      // Get return items
      const { data: returnItems, error: itemsError } = await supabase
        .from('sales_return_items')
        .select('*')
        .eq('return_id', processingReturn.id);

      if (itemsError) throw itemsError;

      // 1. Update return status to completed
      const { error: updateError } = await supabase
        .from('sales_returns')
        .update({ 
          refund_status: 'completed',
          refund_date: new Date().toISOString().split('T')[0],
          refund_amount: processingReturn.total_amount
        })
        .eq('id', processingReturn.id);

      if (updateError) throw updateError;

      // 2. Restock items if restockable
      if (processingReturn.is_restockable) {
        for (const item of returnItems || []) {
          // Create new inventory batch with status='returned'
          const { error: batchError } = await supabase
            .from('inventory_batches')
            .insert({
              item_id: item.item_id,
              quantity: item.quantity,
              purchase_rate: item.rate,
              batch_number: `RET-${processingReturn.return_number}`,
              status: 'returned',
              notes: `Returned from ${processingReturn.original_invoice_number}`
            });

          if (batchError) {
            console.error('Error restocking item:', batchError);
            // Continue with other items even if one fails
          }

          // Mark item as restocked
          await supabase
            .from('sales_return_items')
            .update({ 
              is_restocked: true,
              restocked_at: new Date().toISOString()
            })
            .eq('id', item.id);
        }
      }

      // 3. Create negative payment entry
      const paymentNumber = `REF-${Date.now()}`;
      const { error: paymentError } = await supabase
        .from('sales_payments')
        .insert({
          payment_number: paymentNumber,
          invoice_id: processingReturn.original_invoice_id,
          payment_date: processingReturn.return_date,
          amount: -processingReturn.total_amount, // Negative for refund
          payment_method: processingReturn.refund_method,
          notes: `Refund for return ${processingReturn.return_number}`
        });

      if (paymentError) {
        console.error('Error recording refund payment:', paymentError);
      }

      // 4. Create credit note
      const creditNoteNumber = `CN-${Date.now()}`;
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6); // 6 months validity

      const { error: creditNoteError } = await supabase
        .from('credit_notes')
        .insert({
          credit_note_number: creditNoteNumber,
          return_id: processingReturn.id,
          original_invoice_id: processingReturn.original_invoice_id,
          customer_id: (await supabase
            .from('sales_invoices')
            .select('customer_id')
            .eq('id', processingReturn.original_invoice_id)
            .single()).data?.customer_id,
          issue_date: new Date().toISOString().split('T')[0],
          amount: processingReturn.total_amount,
          used_amount: 0,
          balance_amount: processingReturn.total_amount,
          expiry_date: expiryDate.toISOString().split('T')[0],
          status: 'active',
          notes: `Credit note for return ${processingReturn.return_number}`
        });

      if (creditNoteError) {
        console.error('Error creating credit note:', creditNoteError);
      }

      // 5. Update invoice returned_amount
      const { data: currentInvoice } = await supabase
        .from('sales_invoices')
        .select('returned_amount')
        .eq('id', processingReturn.original_invoice_id)
        .single();

      const newReturnedAmount = (currentInvoice?.returned_amount || 0) + processingReturn.total_amount;

      await supabase
        .from('sales_invoices')
        .update({ returned_amount: newReturnedAmount })
        .eq('id', processingReturn.original_invoice_id);

      toast.success('Return processed!', `Items restocked, credit note ${creditNoteNumber} created, and refund recorded.`);
      await loadData();
      setShowProcessConfirm(false);
      setProcessingReturn(null);
    } catch (err: any) {
      console.error('Error processing return:', err);
      toast.error('Failed to process', err.message || 'Could not process return.');
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
      (ret.original_invoice_number && ret.original_invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ret.customer_name && ret.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || ret.refund_status === filterStatus;
    
    // Apply advanced filters
    if (filters.startDate && ret.return_date < filters.startDate) return false;
    if (filters.endDate && ret.return_date > filters.endDate) return false;
    if (filters.minAmount && ret.total_amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && ret.total_amount > parseFloat(filters.maxAmount)) return false;
    if (filters.refundMethod !== 'all' && ret.refund_method !== filters.refundMethod) return false;
    if (filters.customerName && ret.customer_name && !ret.customer_name.toLowerCase().includes(filters.customerName.toLowerCase())) return false;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.return_date).getTime();
      const dateB = new Date(b.return_date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      return sortOrder === 'desc' ? b.total_amount - a.total_amount : a.total_amount - b.total_amount;
    }
  });

  const totalReturns = filteredReturns.reduce((sum, ret) => sum + ret.total_amount, 0);
  const pendingCount = returns.filter(r => r.refund_status === 'pending').length;
  const completedCount = returns.filter(r => r.refund_status === 'completed').length;

  const totals = calculateTotals();

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
                <p className="text-slate-600 text-sm mt-0.5">Manage sales returns, refunds, and credit notes</p>
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
                      {returnRecord.is_restockable && returnRecord.refund_status === 'pending' && (
                        <Badge variant="primary" size="sm">
                          <Package size={12} className="mr-1" />
                          Restockable
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 font-medium">Date & Time</p>
                        <p className="text-slate-900 font-semibold">{new Date(returnRecord.return_date).toLocaleDateString()}</p>
                        <p className="text-slate-600 text-xs">{new Date(returnRecord.created_at).toLocaleTimeString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Amount</p>
                        <p className={`${theme.classes.textPrimary} font-bold text-lg`}>₹{returnRecord.total_amount.toLocaleString()}</p>
                      </div>
                      {returnRecord.original_invoice_number && (
                        <div>
                          <p className="text-slate-500 font-medium">Invoice</p>
                          <p className="text-slate-900 font-semibold">{returnRecord.original_invoice_number}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-slate-500 font-medium">Method</p>
                        <Badge variant="neutral" size="sm">{returnRecord.refund_method}</Badge>
                      </div>
                    </div>

                    {returnRecord.notes && (
                      <div className="mt-3 text-sm">
                        <p className="text-slate-500 font-medium">Notes:</p>
                        <p className="text-slate-700 italic">{returnRecord.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {returnRecord.refund_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleEdit(returnRecord)}
                          className="p-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <Button
                          onClick={() => handleProcessClick(returnRecord)}
                          variant="primary"
                          size="sm"
                          icon={<Package size={16} />}
                        >
                          Process
                        </Button>
                      </>
                    )}
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

      {/* Filter Modal - same as before */}
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

      {/* Add Return Modal - CONTINUED IN NEXT MESSAGE */}

      {/* Add Return Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingReturn ? `Edit Return - ${editingReturn.return_number}` : 'Record New Return'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Invoice Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Invoice <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.original_invoice_id}
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

                {/* Items to Return */}
                {formData.original_invoice_id && (
                  <div>
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Package size={20} />
                      Items to Return
                    </h4>
                    
                    {loadingInvoiceItems ? (
                      <div className="text-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {returnItems.map((item) => (
                          <div key={item.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h5 className="font-semibold text-slate-900">{item.item_name}</h5>
                                <p className="text-sm text-slate-600">
                                  Original: {item.original_quantity} units @ ₹{item.rate}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-xs text-slate-600 mb-1">Return Qty</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={item.original_quantity}
                                  value={item.return_quantity || ''}
                                  onChange={(e) => updateReturnItem(item.id, parseFloat(e.target.value) || 0)}
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-600 mb-1">Rate</label>
                                <input
                                  type="text"
                                  value={`₹${item.rate}`}
                                  readOnly
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-100 text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-600 mb-1">GST %</label>
                                <input
                                  type="text"
                                  value={`${item.gst_rate}%`}
                                  readOnly
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-100 text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-600 mb-1">Amount</label>
                                <input
                                  type="text"
                                  value={`₹${item.amount.toFixed(2)}`}
                                  readOnly
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-100 text-slate-900 font-semibold"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Return Summary */}
                {returnItems.some(item => item.return_quantity > 0) && (
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h4 className="font-bold text-slate-900 mb-4">Return Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-700">Subtotal</span>
                        <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
                      </div>
                      {totals.discountAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Discount</span>
                          <span className="font-semibold text-red-600">-₹{totals.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {totals.cgst > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-700">CGST</span>
                            <span className="font-semibold">₹{totals.cgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">SGST</span>
                            <span className="font-semibold">₹{totals.sgst.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      {totals.igst > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">IGST</span>
                          <span className="font-semibold">₹{totals.igst.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-3 border-t-2 border-slate-300">
                        <span className="font-bold text-lg">Total Refund</span>
                        <span className={`font-bold text-2xl ${theme.classes.textPrimary}`}>₹{totals.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Return Date"
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                    leftIcon={<Calendar size={18} />}
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
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_restockable"
                    checked={formData.is_restockable}
                    onChange={(e) => setFormData({ ...formData, is_restockable: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <label htmlFor="is_restockable" className="text-sm font-medium text-slate-700">
                    Items are in good condition and can be restocked
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400"
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

      {/* Process Confirmation */}
      {showProcessConfirm && processingReturn && (
        <ConfirmDialog
          isOpen={showProcessConfirm}
          onClose={() => {
            setShowProcessConfirm(false);
            setProcessingReturn(null);
          }}
          onConfirm={handleProcessConfirm}
          title="Process Return"
          message={`Process return "${processingReturn.return_number}" for ₹${processingReturn.total_amount.toLocaleString()}?

This will:
${processingReturn.is_restockable ? '✓ Restock items to inventory\n' : '✗ Items marked as non-restockable\n'}✓ Create credit note for customer
✓ Record refund payment
✓ Update original invoice

This action cannot be undone.`}
          confirmText="Process Return"
          cancelText="Cancel"
          variant="primary"
        />
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
