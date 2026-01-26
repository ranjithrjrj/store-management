// FILE PATH: components/PurchaseRecordsManagement.tsx
// Purchase Records Management - View and Manage Purchase Invoices - COMPLETE REDESIGN

'use client';
import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, X, Trash2, Calendar, FileText, 
  Package, TrendingUp, Filter, ChevronRight, Clock, 
  CheckCircle, AlertCircle, DollarSign
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type PurchaseRecord = {
  id: string;
  invoice_number: string;
  vendor_id: string;
  vendor?: { name: string };
  invoice_date: string;
  received_date: string;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  payment_status: string;
  notes?: string;
  po_reference?: string;
  additional_charges: number;
  discount_amount: number;
  is_unregistered_vendor: boolean;
  unregistered_vendor_name?: string;
  created_at: string;
};

type PurchaseRecordItem = {
  id: string;
  item_id: string;
  item_name?: string;
  batch_number?: string;
  expiry_date?: string;
  quantity: number;
  rate: number;
  gst_rate: number;
  amount: number;
};

const PurchaseRecordsManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [view, setView] = useState<'list' | 'details'>('list');
  const [records, setRecords] = useState<PurchaseRecord[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [sortBy, setSortBy] = useState('invoice_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<PurchaseRecord | null>(null);
  const [recordItems, setRecordItems] = useState<PurchaseRecordItem[]>([]);
  const [deletingRecord, setDeletingRecord] = useState<{ id: string; invoice_number: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      const { data: recordsData, error: recordsError } = await supabase
        .from('purchase_invoices')
        .select(`
          *,
          vendor:vendors(name)
        `)
        .order('invoice_date', { ascending: false });

      if (recordsError) throw recordsError;

      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('id, name')
        .order('name');

      setRecords(recordsData || []);
      setVendors(vendorsData || []);
    } catch (err: any) {
      console.error('Error loading records:', err);
      toast.error('Failed to load', 'Could not load purchase records.');
    } finally {
      setLoading(false);
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
      
      const itemsWithNames = data?.map(item => ({
        ...item,
        item_name: item.item?.name || 'Unknown Item'
      })) || [];
      
      setRecordItems(itemsWithNames);
    } catch (err: any) {
      console.error('Error loading items:', err);
      toast.error('Failed to load', 'Could not load record items.');
    } finally {
      setLoadingItems(false);
    }
  }

  const handleView = async (record: PurchaseRecord) => {
    setViewingRecord(record);
    setView('details');
    await loadRecordItems(record.id);
  };

  const handleDelete = async () => {
    if (!deletingRecord) return;

    try {
      const { error } = await supabase
        .from('purchase_invoices')
        .delete()
        .eq('id', deletingRecord.id);

      if (error) throw error;

      toast.success('Deleted!', `Invoice ${deletingRecord.invoice_number} has been deleted.`);
      await loadData();
      
      if (view === 'details') {
        setView('list');
      }
    } catch (err: any) {
      console.error('Error deleting record:', err);
      toast.error('Failed to delete', err.message || 'Could not delete record.');
    } finally {
      setDeletingRecord(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: { icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-300', label: 'Paid' },
      pending: { icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-300', label: 'Pending' },
      partial: { icon: AlertCircle, color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Partial' }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${badge.color} text-xs font-semibold`}>
        <Icon size={12} />
        {badge.label}
      </div>
    );
  };

  const filteredRecords = records
    .filter(record => {
      const vendorName = record.is_unregistered_vendor 
        ? record.unregistered_vendor_name 
        : record.vendor?.name;

      const matchesSearch = 
        record.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.po_reference?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || record.payment_status === filterStatus;
      const matchesVendor = filterVendor === 'all' || record.vendor_id === filterVendor;
      const matchesDateFrom = !filterDateFrom || record.invoice_date >= filterDateFrom;
      const matchesDateTo = !filterDateTo || record.invoice_date <= filterDateTo;
      const matchesAmountMin = !filterAmountMin || record.total_amount >= parseFloat(filterAmountMin);
      const matchesAmountMax = !filterAmountMax || record.total_amount <= parseFloat(filterAmountMax);
      
      return matchesSearch && matchesStatus && matchesVendor && 
             matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'invoice_date':
          aVal = new Date(a.invoice_date).getTime();
          bVal = new Date(b.invoice_date).getTime();
          break;
        case 'total_amount':
          aVal = a.total_amount;
          bVal = b.total_amount;
          break;
        case 'invoice_number':
          aVal = a.invoice_number;
          bVal = b.invoice_number;
          break;
        case 'vendor':
          aVal = a.vendor?.name || a.unregistered_vendor_name || '';
          bVal = b.vendor?.name || b.unregistered_vendor_name || '';
          break;
        default:
          aVal = new Date(a.invoice_date).getTime();
          bVal = new Date(b.invoice_date).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const stats = {
    total: records.length,
    paid: records.filter(r => r.payment_status === 'paid').length,
    pending: records.filter(r => r.payment_status === 'pending').length,
    partial: records.filter(r => r.payment_status === 'partial').length,
    totalAmount: records.reduce((sum, r) => sum + r.total_amount, 0),
    totalPending: records.reduce((sum, r) => sum + (r.pending_amount || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-slate-600 mt-4 font-medium">Loading records...</p>
        </div>
      </div>
    );
  }

  // LIST VIEW
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* HERO - Teal theme */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-4 py-6 md:px-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <ShoppingBag className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Purchase Records</h1>
                <p className="text-teal-100 text-sm md:text-base">View and manage invoices</p>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-teal-100 text-xs font-medium">Total</p>
                <p className="text-white text-xl font-bold mt-0.5">{stats.total}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-teal-100 text-xs font-medium">Paid</p>
                <p className="text-white text-xl font-bold mt-0.5">{stats.paid}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-teal-100 text-xs font-medium">Pending</p>
                <p className="text-white text-xl font-bold mt-0.5">{stats.pending}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-teal-100 text-xs font-medium">Total ₹</p>
                <p className="text-white text-xl font-bold mt-0.5">{(stats.totalAmount / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-6 space-y-4">
          
          {/* Search, Sort & Filter */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search invoice, vendor, or PO..."
                  className="w-full pl-10 pr-10 py-2.5 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                )}
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2.5 border-2 border-slate-300 rounded-xl text-slate-900 text-sm bg-white">
                <option value="invoice_date">Date</option>
                <option value="total_amount">Amount</option>
                <option value="invoice_number">Invoice #</option>
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

          {/* Records List */}
          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No records found</h3>
              <p className="text-sm text-slate-600">{searchTerm ? "Try adjusting filters" : "Purchase invoices will appear here"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <button key={record.id} onClick={() => handleView(record)} className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all active:scale-[0.99] text-left">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{record.invoice_number}</h3>
                      <p className="text-sm text-slate-600">{record.is_unregistered_vendor ? record.unregistered_vendor_name : record.vendor?.name}</p>
                      {record.po_reference && <p className="text-xs text-teal-600 mt-0.5">From: {record.po_reference}</p>}
                    </div>
                    {getStatusBadge(record.payment_status)}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1"><Calendar size={14} />{new Date(record.invoice_date).toLocaleDateString()}</div>
                      {record.pending_amount > 0 && <div className="flex items-center gap-1 text-red-600"><DollarSign size={14} />₹{record.pending_amount.toFixed(0)}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-teal-700">₹{record.total_amount.toFixed(0)}</span>
                      <ChevronRight size={18} className="text-slate-400" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="h-20 md:h-4" />
        </div>

        {/* Filter Sheet */}
        {showFilterSheet && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={() => setShowFilterSheet(false)} />
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[70] max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-teal-600 to-teal-700 rounded-t-3xl">
                <h2 className="text-xl font-bold text-white">Filter Records</h2>
                <button onClick={() => setShowFilterSheet(false)} className="p-2 hover:bg-white/20 rounded-lg"><X size={24} className="text-white" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Status</h3>
                  {['all', 'paid', 'pending', 'partial'].map(status => (
                    <button key={status} onClick={() => setFilterStatus(status)} className={`w-full p-3 rounded-xl border-2 mb-2 text-left ${filterStatus === status ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}`}>
                      <p className="font-semibold text-slate-900 capitalize">{status === 'all' ? 'All Records' : status}</p>
                      <p className="text-xs text-slate-600">{status === 'all' ? stats.total : stats[status as keyof typeof stats]} {status === 'all' ? 'total' : 'records'}</p>
                    </button>
                  ))}
                </div>
                <div className="pt-3 border-t">
                  <label className="text-sm font-bold text-slate-900 mb-2 block">Vendor</label>
                  <select value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)} className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg text-slate-900">
                    <option value="all">All Vendors</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="pt-3 border-t">
                  <label className="text-sm font-bold text-slate-900 mb-2 block">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs text-slate-600 mb-1 block">From</label><input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-full px-2 py-2 border-2 border-slate-300 rounded-lg text-slate-900 text-sm" /></div>
                    <div><label className="text-xs text-slate-600 mb-1 block">To</label><input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-full px-2 py-2 border-2 border-slate-300 rounded-lg text-slate-900 text-sm" /></div>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <label className="text-sm font-bold text-slate-900 mb-2 block">Amount (₹)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs text-slate-600 mb-1 block">Min</label><input type="number" value={filterAmountMin} onChange={(e) => setFilterAmountMin(e.target.value)} placeholder="0" className="w-full px-2 py-2 border-2 border-slate-300 rounded-lg text-slate-900 text-sm" /></div>
                    <div><label className="text-xs text-slate-600 mb-1 block">Max</label><input type="number" value={filterAmountMax} onChange={(e) => setFilterAmountMax(e.target.value)} placeholder="Any" className="w-full px-2 py-2 border-2 border-slate-300 rounded-lg text-slate-900 text-sm" /></div>
                  </div>
                </div>
                <button onClick={() => { setFilterStatus('all'); setFilterVendor('all'); setFilterDateFrom(''); setFilterDateTo(''); setFilterAmountMin(''); setFilterAmountMax(''); setShowFilterSheet(false); }} className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium mt-2">Clear Filters</button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // DETAILS VIEW
  if (view === 'details' && viewingRecord) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-4 py-6 md:px-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => setView('list')} className="p-2 bg-white/20 rounded-xl backdrop-blur-sm hover:bg-white/30"><X className="text-white" size={24} /></button>
              <div className="flex items-center gap-3 flex-1">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><FileText className="text-white" size={28} /></div>
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-bold text-white">{viewingRecord.invoice_number}</h1>
                  <p className="text-teal-100 text-sm">{viewingRecord.is_unregistered_vendor ? viewingRecord.unregistered_vendor_name : viewingRecord.vendor?.name}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              {getStatusBadge(viewingRecord.payment_status)}
              <div className="text-right"><p className="text-teal-100 text-xs">Total</p><p className="text-white text-2xl font-bold">₹{viewingRecord.total_amount.toFixed(0)}</p></div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-6 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Calendar size={18} className="text-teal-600" />Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Invoice Date</span><span className="font-medium text-slate-900">{new Date(viewingRecord.invoice_date).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Received</span><span className="font-medium text-slate-900">{new Date(viewingRecord.received_date).toLocaleDateString()}</span></div>
              {viewingRecord.po_reference && <div className="flex justify-between"><span className="text-slate-600">From PO</span><span className="font-medium text-teal-700">{viewingRecord.po_reference}</span></div>}
              {viewingRecord.notes && <div className="pt-2 border-t"><p className="text-slate-600 mb-1">Notes</p><p className="text-slate-900">{viewingRecord.notes}</p></div>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b"><h3 className="font-bold text-slate-900 flex items-center gap-2"><Package size={18} className="text-teal-600" />Items ({recordItems.length})</h3></div>
            <div className="p-4 space-y-3">
              {loadingItems ? <div className="text-center py-8"><LoadingSpinner /></div> : recordItems.map((item) => (
                <div key={item.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{item.item_name}</p>
                      <p className="text-xs text-slate-600 mt-0.5">Qty: {item.quantity} • ₹{item.rate} • GST {item.gst_rate}%</p>
                      {item.batch_number && <p className="text-xs text-slate-500">Batch: {item.batch_number}</p>}
                      {item.expiry_date && <p className="text-xs text-slate-500">Exp: {new Date(item.expiry_date).toLocaleDateString()}</p>}
                    </div>
                    <p className="text-base font-bold text-teal-700">₹{item.amount.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><TrendingUp size={18} className="text-teal-600" />Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-semibold text-slate-900">₹{viewingRecord.subtotal.toFixed(2)}</span></div>
              {viewingRecord.cgst_amount > 0 && <><div className="flex justify-between"><span className="text-slate-600">CGST</span><span>₹{viewingRecord.cgst_amount.toFixed(2)}</span></div><div className="flex justify-between"><span className="text-slate-600">SGST</span><span>₹{viewingRecord.sgst_amount.toFixed(2)}</span></div></>}
              {viewingRecord.igst_amount > 0 && <div className="flex justify-between"><span className="text-slate-600">IGST</span><span>₹{viewingRecord.igst_amount.toFixed(2)}</span></div>}
              {viewingRecord.additional_charges > 0 && <div className="flex justify-between"><span className="text-slate-600">Charges</span><span>₹{viewingRecord.additional_charges.toFixed(2)}</span></div>}
              {viewingRecord.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{viewingRecord.discount_amount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-base font-bold pt-2 border-t-2"><span className="text-slate-900">Total</span><span className="text-teal-700">₹{viewingRecord.total_amount.toFixed(2)}</span></div>
              {viewingRecord.pending_amount > 0 && <div className="flex justify-between text-base font-bold pt-2 border-t"><span className="text-red-700">Pending</span><span className="text-red-700">₹{viewingRecord.pending_amount.toFixed(2)}</span></div>}
            </div>
          </div>

          <button onClick={() => setDeletingRecord({ id: viewingRecord.id, invoice_number: viewingRecord.invoice_number })} className="w-full bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2"><Trash2 size={20} />Delete</button>
          <div className="h-4 md:hidden" />
        </div>

        <ConfirmDialog isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onConfirm={handleDelete} title="Delete Invoice" message={`Delete "${deletingRecord?.invoice_number}"? Cannot be undone.`} confirmText="Delete" cancelText="Cancel" variant="danger" />
      </div>
    );
  }

  return null;
};

export default PurchaseRecordsManagement;
