// FILE PATH: components/PurchaseOrders.tsx
// Mobile-Native Purchase Orders - Beautiful, Consistent, App-Like

'use client';
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Edit2, Trash2, X, Search, Package, 
  Eye, Filter, Calendar, FileText, TrendingUp, Check,
  ChevronRight, AlertCircle, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import SearchableSelect from './SearchableSelect';

type POItem = {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  rate: number;
  gst_rate: number;
  amount: number;
  received_quantity: number;
};

type PurchaseOrder = {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor?: { name: string; state_code: string };
  po_date: string;
  expected_delivery_date?: string;
  status: 'pending' | 'partial' | 'received' | 'cancelled';
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
};

type Props = {
  onNavigate: (page: string) => void;
};

const PurchaseOrders = ({ onNavigate }: Props) => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [view, setView] = useState<'list' | 'create' | 'view'>('list');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [poItems, setPOItems] = useState<POItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingPO, setDeletingPO] = useState<{ id: string; po_number: string } | null>(null);
  
  const [formData, setFormData] = useState({
    vendor_id: '',
    po_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: ''
  });

  const [items, setItems] = useState<POItem[]>([]);
  const [isIntrastate, setIsIntrastate] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      const { data: itemsData } = await supabase
        .from('items')
        .select('id, name, wholesale_price, gst_rate')
        .eq('is_active', true)
        .order('name');
      
      const { data: ordersData } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          vendor:vendors(name, state_code)
        `)
        .order('po_date', { ascending: false });
      
      setVendors(vendorsData || []);
      setAvailableItems(itemsData || []);
      setOrders(ordersData || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      toast.error('Failed to load', 'Could not load purchase orders.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setFormData({
      vendor_id: '',
      po_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      notes: ''
    });
    setItems([]);
    setView('create');
  };

  const handleView = async (po: PurchaseOrder) => {
    try {
      setSelectedPO(po);
      
      const { data: items } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('po_id', po.id);

      if (items) {
        const loadedItems: POItem[] = items.map(item => ({
          id: item.id,
          item_id: item.item_id,
          item_name: availableItems.find(i => i.id === item.item_id)?.name || '',
          quantity: item.quantity,
          rate: item.rate,
          gst_rate: item.gst_rate,
          amount: item.amount,
          received_quantity: item.received_quantity || 0
        }));
        setPOItems(loadedItems);
      }
      
      setView('view');
    } catch (err: any) {
      console.error('Error loading PO details:', err);
      toast.error('Failed to load', 'Could not load PO details.');
    }
  };

  const handleReceiveGoods = () => {
    if (selectedPO) {
      sessionStorage.setItem('receivePO', JSON.stringify({ po_id: selectedPO.id }));
      onNavigate('purchase-invoices');
    }
  };

  const handleDelete = async () => {
    if (!deletingPO) return;
    
    try {
      await supabase.from('purchase_order_items').delete().eq('po_id', deletingPO.id);
      await supabase.from('purchase_orders').delete().eq('id', deletingPO.id);
      
      setOrders(orders.filter(o => o.id !== deletingPO.id));
      toast.success('Deleted!', `PO ${deletingPO.po_number} has been deleted.`);
      setDeletingPO(null);
      
      if (view === 'view') {
        setView('list');
      }
    } catch (err: any) {
      console.error('Error deleting PO:', err);
      toast.error('Failed to delete', err.message);
    }
  };

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setFormData({ ...formData, vendor_id: vendorId });
      setIsIntrastate(vendor.state_code === '33');
    }
  };

  const addNewItem = () => {
    const newId = Date.now().toString() + Math.random();
    setItems([...items, {
      id: newId,
      item_id: '',
      item_name: '',
      quantity: 1,
      rate: 0,
      gst_rate: 18,
      amount: 0,
      received_quantity: 0
    }]);
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        if (field === 'item_id') {
          const selectedItem = availableItems.find(i => i.id === value);
          if (selectedItem) {
            updated.item_name = selectedItem.name;
            updated.rate = selectedItem.wholesale_price;
            updated.gst_rate = selectedItem.gst_rate;
          }
        }
        
        const taxableAmount = updated.quantity * updated.rate;
        const gstAmount = (taxableAmount * updated.gst_rate) / 100;
        updated.amount = taxableAmount + gstAmount;
        
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const totalGst = items.reduce((sum, item) => {
      const taxableAmount = item.quantity * item.rate;
      return sum + (taxableAmount * item.gst_rate / 100);
    }, 0);

    const total = subtotal + totalGst;

    if (isIntrastate) {
      return {
        subtotal,
        cgst: totalGst / 2,
        sgst: totalGst / 2,
        igst: 0,
        total
      };
    } else {
      return {
        subtotal,
        cgst: 0,
        sgst: 0,
        igst: totalGst,
        total
      };
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      if (!formData.vendor_id) {
        toast.warning('Select vendor', 'Please select a vendor');
        return;
      }

      if (items.length === 0) {
        toast.warning('Add items', 'Please add at least one item');
        return;
      }

      const totals = calculateTotals();
      const poNumber = `PO-${Date.now()}`;

      const poData = {
        po_number: poNumber,
        vendor_id: formData.vendor_id,
        po_date: formData.po_date,
        expected_delivery_date: formData.expected_delivery_date || null,
        status: 'pending',
        subtotal: totals.subtotal,
        cgst_amount: totals.cgst,
        sgst_amount: totals.sgst,
        igst_amount: totals.igst,
        total_amount: totals.total,
        notes: formData.notes || null
      };

      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert(poData)
        .select()
        .single();

      if (poError) throw poError;

      const poItems = items.map(item => ({
        po_id: po.id,
        item_id: item.item_id,
        quantity: item.quantity,
        rate: item.rate,
        gst_rate: item.gst_rate,
        amount: item.amount,
        received_quantity: 0
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(poItems);

      if (itemsError) throw itemsError;

      toast.success('Created!', `Purchase order ${poNumber} has been created.`);
      
      await loadData();
      setView('list');
      setFormData({
        vendor_id: '',
        po_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        notes: ''
      });
      setItems([]);

    } catch (err: any) {
      console.error('Error saving PO:', err);
      toast.error('Failed to save', err.message || 'Could not save purchase order.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-300', label: 'Pending' },
      partial: { icon: AlertCircle, color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Partial' },
      received: { icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-300', label: 'Received' },
      cancelled: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-300', label: 'Cancelled' }
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    partial: orders.filter(o => o.status === 'partial').length,
    received: orders.filter(o => o.status === 'received').length
  };

  const totals = items.length > 0 ? calculateTotals() : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-slate-600 mt-4 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  // LIST VIEW
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* HERO SECTION */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 px-4 py-6 md:px-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <ShoppingCart className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Purchase Orders</h1>
                <p className="text-purple-100 text-sm md:text-base">Manage vendor orders</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-purple-100 text-xs font-medium">Total</p>
                <p className="text-white text-xl font-bold mt-0.5">{stats.total}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-purple-100 text-xs font-medium">Pending</p>
                <p className="text-white text-xl font-bold mt-0.5">{stats.pending}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-purple-100 text-xs font-medium">Partial</p>
                <p className="text-white text-xl font-bold mt-0.5">{stats.partial}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-purple-100 text-xs font-medium">Done</p>
                <p className="text-white text-xl font-bold mt-0.5">{stats.received}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-6 space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search PO number or vendor..."
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900 text-sm"
                />
              </div>
              <button
                onClick={() => setShowFilterSheet(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-xl flex items-center gap-2 text-slate-700 font-medium transition-colors"
              >
                <Filter size={18} />
                <span className="hidden sm:inline text-sm">Filter</span>
              </button>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
              <EmptyState
                icon={ShoppingCart}
                title="No purchase orders"
                description={searchTerm || filterStatus !== 'all' 
                  ? "No orders match your search" 
                  : "Create your first purchase order"}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleView(order)}
                  className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all active:scale-[0.99] text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{order.po_number}</h3>
                      <p className="text-sm text-slate-600">{order.vendor?.name}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(order.po_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package size={14} />
                        {order.expected_delivery_date 
                          ? new Date(order.expected_delivery_date).toLocaleDateString()
                          : 'No date'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-purple-700">₹{order.total_amount.toFixed(0)}</span>
                      <ChevronRight size={18} className="text-slate-400" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Bottom Padding for Mobile Nav */}
          <div className="h-4 md:hidden" />
        </div>

        {/* Floating Add Button */}
        <button
          onClick={handleAddNew}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all z-30"
        >
          <Plus size={28} />
        </button>

        {/* Filter Bottom Sheet */}
        {showFilterSheet && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setShowFilterSheet(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[70] max-h-[60vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-3xl">
                <h2 className="text-xl font-bold text-white">Filter Orders</h2>
                <button
                  onClick={() => setShowFilterSheet(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <button
                  onClick={() => { setFilterStatus('all'); setShowFilterSheet(false); }}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    filterStatus === 'all'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold text-slate-900">All Orders</p>
                  <p className="text-xs text-slate-600 mt-0.5">{stats.total} total</p>
                </button>

                <button
                  onClick={() => { setFilterStatus('pending'); setShowFilterSheet(false); }}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    filterStatus === 'pending'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold text-slate-900">Pending</p>
                  <p className="text-xs text-slate-600 mt-0.5">{stats.pending} orders</p>
                </button>

                <button
                  onClick={() => { setFilterStatus('partial'); setShowFilterSheet(false); }}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    filterStatus === 'partial'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold text-slate-900">Partially Received</p>
                  <p className="text-xs text-slate-600 mt-0.5">{stats.partial} orders</p>
                </button>

                <button
                  onClick={() => { setFilterStatus('received'); setShowFilterSheet(false); }}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    filterStatus === 'received'
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold text-slate-900">Fully Received</p>
                  <p className="text-xs text-slate-600 mt-0.5">{stats.received} orders</p>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // CREATE VIEW
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* HERO SECTION */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 px-4 py-6 md:px-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setView('list')}
                className="p-2 bg-white/20 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                <X className="text-white" size={24} />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Plus className="text-white" size={28} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">New Purchase Order</h1>
                  <p className="text-purple-100 text-sm md:text-base">Create vendor order</p>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            {totals && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <p className="text-purple-100 text-xs font-medium">Items</p>
                  <p className="text-white text-xl font-bold mt-0.5">{items.length}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <p className="text-purple-100 text-xs font-medium">Total Amount</p>
                  <p className="text-white text-xl font-bold mt-0.5">₹{totals.total.toFixed(0)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-6 space-y-4">
          
          {/* Vendor & Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 space-y-4">
              {/* Vendor */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Vendor <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={vendors.map(v => ({
                    value: v.id,
                    label: v.name,
                    sublabel: v.phone || v.email || undefined
                  }))}
                  value={formData.vendor_id}
                  onChange={(value) => handleVendorChange(value)}
                  placeholder="Select vendor"
                />
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">PO Date</label>
                  <input
                    type="date"
                    value={formData.po_date}
                    onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Expected Delivery</label>
                  <input
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-900 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="text-purple-600" size={20} />
                <h3 className="font-bold text-slate-900">Items ({items.length})</h3>
              </div>
              <button
                onClick={addNewItem}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-sm active:scale-95 transition-all shadow-sm"
              >
                <Plus size={18} />
                Add
              </button>
            </div>

            <div className="p-4 space-y-3">
              {items.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package size={32} className="text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">No items added</p>
                  <p className="text-sm text-slate-500 mb-4">Add items to purchase order</p>
                  <button
                    onClick={addNewItem}
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium active:scale-95 transition-all"
                  >
                    Add First Item
                  </button>
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={item.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-600">Item #{index + 1}</span>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Product</label>
                        <SearchableSelect
                          options={availableItems.map(i => ({
                            value: i.id,
                            label: i.name,
                            sublabel: `₹${i.wholesale_price} • GST ${i.gst_rate}%`
                          }))}
                          value={item.item_id}
                          onChange={(value) => updateItem(item.id, 'item_id', value)}
                          placeholder="Select product"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-900 text-sm"
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Rate (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-900 text-sm"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-300 flex justify-between items-center">
                        <span className="text-xs text-slate-600">GST: {item.gst_rate}%</span>
                        <div className="text-right">
                          <p className="text-xs text-slate-600">Amount</p>
                          <p className="text-lg font-bold text-purple-700">₹{item.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Totals Summary */}
          {totals && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-white" size={20} />
                  <h3 className="font-bold text-white">Summary</h3>
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{totals.subtotal.toFixed(2)}</span>
                </div>
                {isIntrastate ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">CGST</span>
                      <span className="text-slate-900">₹{totals.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">SGST</span>
                      <span className="text-slate-900">₹{totals.sgst.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">IGST</span>
                    <span className="text-slate-900">₹{totals.igst.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-slate-300">
                  <span className="text-slate-900">Total</span>
                  <span className="text-purple-700">₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <label className="block text-sm font-bold text-slate-900 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900 text-sm resize-none"
              placeholder="Additional notes..."
            />
          </div>

          {/* Save Button */}
          <div className="sticky bottom-20 md:relative md:bottom-0">
            <button
              onClick={handleSubmit}
              disabled={saving || items.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating PO...
                </>
              ) : (
                <>
                  <Check size={24} />
                  Create Purchase Order
                </>
              )}
            </button>
          </div>

          <div className="h-4 md:hidden" />
        </div>
      </div>
    );
  }

  // VIEW DETAILS
  if (view === 'view' && selectedPO) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* HERO SECTION */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 px-4 py-6 md:px-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setView('list')}
                className="p-2 bg-white/20 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                <X className="text-white" size={24} />
              </button>
              <div className="flex items-center gap-3 flex-1">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <FileText className="text-white" size={28} />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-bold text-white">{selectedPO.po_number}</h1>
                  <p className="text-purple-100 text-sm">{selectedPO.vendor?.name}</p>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-between items-center">
              {getStatusBadge(selectedPO.status)}
              <div className="text-right">
                <p className="text-purple-100 text-xs">Total Amount</p>
                <p className="text-white text-2xl font-bold">₹{selectedPO.total_amount.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-6 space-y-4">
          
          {/* PO Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar size={18} className="text-purple-600" />
              Order Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">PO Date</span>
                <span className="font-medium text-slate-900">{new Date(selectedPO.po_date).toLocaleDateString()}</span>
              </div>
              {selectedPO.expected_delivery_date && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Expected Delivery</span>
                  <span className="font-medium text-slate-900">{new Date(selectedPO.expected_delivery_date).toLocaleDateString()}</span>
                </div>
              )}
              {selectedPO.notes && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-slate-600 mb-1">Notes</p>
                  <p className="text-slate-900">{selectedPO.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Package size={18} className="text-purple-600" />
                Items ({poItems.length})
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {poItems.map((item, index) => (
                <div key={item.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{item.item_name}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Qty: {item.quantity} • Rate: ₹{item.rate} • GST: {item.gst_rate}%
                      </p>
                    </div>
                    <p className="text-base font-bold text-purple-700">₹{item.amount.toFixed(0)}</p>
                  </div>
                  {item.received_quantity > 0 && (
                    <div className="pt-2 border-t border-slate-300 flex items-center gap-2 text-xs">
                      <div className="flex-1 bg-green-100 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(item.received_quantity / item.quantity) * 100}%` }}
                        />
                      </div>
                      <span className="text-green-700 font-medium">
                        {item.received_quantity}/{item.quantity} received
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tax Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-600" />
              Tax Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">₹{selectedPO.subtotal.toFixed(2)}</span>
              </div>
              {selectedPO.cgst_amount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-600">CGST</span>
                    <span className="text-slate-900">₹{selectedPO.cgst_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">SGST</span>
                    <span className="text-slate-900">₹{selectedPO.sgst_amount.toFixed(2)}</span>
                  </div>
                </>
              )}
              {selectedPO.igst_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">IGST</span>
                  <span className="text-slate-900">₹{selectedPO.igst_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t-2 border-slate-300">
                <span className="text-slate-900">Total</span>
                <span className="text-purple-700">₹{selectedPO.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {selectedPO.status !== 'received' && selectedPO.status !== 'cancelled' && (
            <div className="space-y-3">
              <button
                onClick={handleReceiveGoods}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <Package size={24} />
                Receive Goods
              </button>
            </div>
          )}

          <button
            onClick={() => setDeletingPO({ id: selectedPO.id, po_number: selectedPO.po_number })}
            className="w-full bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-700 font-bold py-3 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={20} />
            Delete Order
          </button>

          <div className="h-4 md:hidden" />
        </div>
      </div>
    );
  }

  return null;
};

export default PurchaseOrders;
