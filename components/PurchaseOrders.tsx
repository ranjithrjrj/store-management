// FILE PATH: components/PurchaseOrders.tsx
// Beautiful Modern Purchase Orders Management - Teal & Gold Theme

'use client';
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Edit2, Trash2, X, Search, Package, 
  Eye, Filter, ChevronDown, Calendar, FileText, TrendingUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

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
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState('date');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [deletingPO, setDeletingPO] = useState<{ id: string; po_number: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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
    setEditingPO(null);
    setViewOnly(false);
    setFormData({
      vendor_id: '',
      po_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      notes: ''
    });
    setItems([]);
    setShowModal(true);
  };

  const handleView = async (po: PurchaseOrder) => {
    try {
      setEditingPO(po);
      setViewOnly(true);
      setFormData({
        vendor_id: po.vendor_id,
        po_date: po.po_date,
        expected_delivery_date: po.expected_delivery_date || '',
        notes: po.notes || ''
      });

      const { data: poItems } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('po_id', po.id);

      if (poItems) {
        const loadedItems: POItem[] = poItems.map(item => ({
          id: item.id,
          item_id: item.item_id,
          item_name: availableItems.find(i => i.id === item.item_id)?.name || '',
          quantity: item.quantity,
          rate: item.rate,
          gst_rate: item.gst_rate,
          amount: item.amount,
          received_quantity: item.received_quantity
        }));
        setItems(loadedItems);
      }

      const vendor = vendors.find(v => v.id === po.vendor_id);
      if (vendor) {
        setIsIntrastate(vendor.state_code === '33');
      }

      setShowModal(true);
    } catch (err: any) {
      console.error('Error loading PO:', err);
      toast.error('Failed to load', 'Could not load purchase order.');
    }
  };

  const handleEditClick = (po: PurchaseOrder) => {
    setEditingPO(po);
    setShowEditConfirm(true);
  };

  const handleEditConfirm = async () => {
    setShowEditConfirm(false);
    if (!editingPO) return;

    try {
      setViewOnly(false);
      setFormData({
        vendor_id: editingPO.vendor_id,
        po_date: editingPO.po_date,
        expected_delivery_date: editingPO.expected_delivery_date || '',
        notes: editingPO.notes || ''
      });

      const { data: poItems } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('po_id', editingPO.id);

      if (poItems) {
        const loadedItems: POItem[] = poItems.map(item => ({
          id: item.id,
          item_id: item.item_id,
          item_name: availableItems.find(i => i.id === item.item_id)?.name || '',
          quantity: item.quantity,
          rate: item.rate,
          gst_rate: item.gst_rate,
          amount: item.amount,
          received_quantity: item.received_quantity
        }));
        setItems(loadedItems);
      }

      const vendor = vendors.find(v => v.id === editingPO.vendor_id);
      if (vendor) {
        setIsIntrastate(vendor.state_code === '33');
      }

      setShowModal(true);
    } catch (err: any) {
      console.error('Error loading PO:', err);
      toast.error('Failed to load', 'Could not load purchase order.');
    }
  };

  const handleReceiveGoods = (po: PurchaseOrder) => {
    const vendor = vendors.find(v => v.id === po.vendor_id);
    
    sessionStorage.setItem('receivePO', JSON.stringify({
      po_id: po.id,
      po_number: po.po_number,
      vendor_id: po.vendor_id,
      vendor_state_code: vendor?.state_code || '33',
      po_date: po.po_date
    }));
    
    toast.success('Opening receiving form...', `Loading PO ${po.po_number}`);
    onNavigate('purchase-invoices');
  };

  const addItem = () => {
    const newItem: POItem = {
      id: Date.now().toString(),
      item_id: '',
      item_name: '',
      quantity: 1,
      rate: 0,
      gst_rate: 0,
      amount: 0,
      received_quantity: 0
    };
    setItems([...items, newItem]);
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

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setFormData({ ...formData, vendor_id: vendorId });
      setIsIntrastate(vendor.state_code === '33');
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      if (!formData.vendor_id || items.length === 0) {
        toast.warning('Missing information', 'Please select vendor and add items');
        return;
      }

      const totals = calculateTotals();

      if (editingPO) {
        const poData = {
          vendor_id: formData.vendor_id,
          po_date: formData.po_date,
          expected_delivery_date: formData.expected_delivery_date || null,
          subtotal: totals.subtotal,
          cgst_amount: totals.cgst,
          sgst_amount: totals.sgst,
          igst_amount: totals.igst,
          total_amount: totals.total,
          notes: formData.notes || null
        };

        const { error: poError } = await supabase
          .from('purchase_orders')
          .update(poData)
          .eq('id', editingPO.id);

        if (poError) throw poError;

        await supabase
          .from('purchase_order_items')
          .delete()
          .eq('po_id', editingPO.id);

        const poItems = items.map(item => ({
          po_id: editingPO.id,
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

        toast.success('Updated!', `Purchase Order ${editingPO.po_number} has been updated.`);
      } else {
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

        toast.success('Created!', `Purchase Order ${poNumber} has been created.`);
      }

      await loadData();
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving PO:', err);
      toast.error('Failed to save', err.message || 'Could not save purchase order.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string, poNumber: string) => {
    setDeletingPO({ id, po_number: poNumber });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPO) return;

    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', deletingPO.id);

      if (error) throw error;
      await loadData();
      toast.success('Deleted', `PO ${deletingPO.po_number} has been deleted.`);
      setShowDeleteConfirm(false);
      setDeletingPO(null);
    } catch (err: any) {
      console.error('Error deleting PO:', err);
      toast.error('Failed to delete', err.message || 'Could not delete purchase order.');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'warning' as const, label: 'Pending' },
      partial: { variant: 'primary' as const, label: 'Partial' },
      received: { variant: 'success' as const, label: 'Received' },
      cancelled: { variant: 'danger' as const, label: 'Cancelled' }
    };
    const config = statusMap[status as keyof typeof statusMap] || { variant: 'neutral' as const, label: status };
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.po_date).getTime() - new Date(a.po_date).getTime();
      } else if (sortBy === 'amount') {
        return b.total_amount - a.total_amount;
      }
      return 0;
    });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    partial: orders.filter(o => o.status === 'partial').length,
    received: orders.filter(o => o.status === 'received').length,
    totalValue: orders.reduce((sum, o) => sum + o.total_amount, 0)
  };

  const hasActiveFilters = filterStatus !== 'all' || searchTerm !== '';
  const totals = items.length > 0 ? calculateTotals() : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl mb-4">
            <LoadingSpinner size="lg" />
          </div>
          <p className="text-slate-700 font-medium">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md">
                <ShoppingCart className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Purchase Orders</h1>
                <p className="text-slate-600 mt-1">Manage purchase orders from vendors</p>
              </div>
            </div>
            <Button
              onClick={handleAddNew}
              variant="primary"
              size="md"
              icon={<Plus size={20} />}
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md"
            >
              Create PO
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-md border border-teal-100 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-teal-100 rounded-lg">
                <FileText className="text-teal-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            </div>
            <p className="text-sm text-slate-600">Total POs</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-amber-100 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="text-amber-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.pending}</span>
            </div>
            <p className="text-sm text-slate-600">Pending</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="text-blue-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.partial}</span>
            </div>
            <p className="text-sm text-slate-600">Partial</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-green-100 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="text-green-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.received}</span>
            </div>
            <p className="text-sm text-slate-600">Received</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">₹{(stats.totalValue / 1000).toFixed(0)}K</span>
            </div>
            <p className="text-sm text-slate-600">Total Value</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by PO number or vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            <Button
              onClick={() => setShowFilterModal(true)}
              variant="secondary"
              size="md"
              icon={<Filter size={18} />}
              className="relative"
            >
              Filters
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                  {[filterStatus !== 'all'].filter(Boolean).length}
                </span>
              )}
            </Button>

            {hasActiveFilters && (
              <Button onClick={handleClearFilters} variant="secondary" size="md">Clear All</Button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-medium text-slate-700">
                  Sort: {sortBy === 'date' ? 'Date' : 'Amount'}
                </span>
                <ChevronDown size={16} className="text-slate-500" />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                  <button onClick={() => { setSortBy('date'); setShowSortDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between">
                    <span>Date (Newest First)</span>
                    {sortBy === 'date' && <span className="text-teal-600">✓</span>}
                  </button>
                  <button onClick={() => { setSortBy('amount'); setShowSortDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between">
                    <span>Amount (High to Low)</span>
                    {sortBy === 'amount' && <span className="text-teal-600">✓</span>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200">
              {filterStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                  Status: {filterStatus}
                  <button onClick={() => setFilterStatus('all')} className="hover:text-teal-900"><X size={14} /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<ShoppingCart size={64} className="text-slate-300" />}
                title={hasActiveFilters ? "No orders found" : "No purchase orders yet"}
                description={hasActiveFilters ? "Try adjusting your filters" : "Create your first purchase order to get started"}
                action={
                  hasActiveFilters ? (
                    <Button onClick={handleClearFilters} variant="secondary">Clear Filters</Button>
                  ) : (
                    <Button onClick={handleAddNew} variant="primary" icon={<Plus size={20} />}>Create First PO</Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-teal-50 to-amber-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">PO Number</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Expected</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-teal-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{order.po_number}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-700">{order.vendor?.name || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-700">{new Date(order.po_date).toLocaleDateString('en-IN')}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-700">
                            {order.expected_delivery_date 
                              ? new Date(order.expected_delivery_date).toLocaleDateString('en-IN')
                              : '-'
                            }
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">₹{order.total_amount.toLocaleString('en-IN')}</p>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {/* View button for received POs */}
                            {order.status === 'received' ? (
                              <button
                                onClick={() => handleView(order)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View"
                              >
                                <Eye size={18} />
                              </button>
                            ) : (
                              <>
                                {/* Receive Goods button for pending/partial */}
                                {(order.status === 'pending' || order.status === 'partial') && (
                                  <button
                                    onClick={() => handleReceiveGoods(order)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Receive Goods"
                                  >
                                    <Package size={18} />
                                  </button>
                                )}
                                
                                {/* Edit button for pending/partial */}
                                <button
                                  onClick={() => handleEditClick(order)}
                                  className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 size={18} />
                                </button>
                              </>
                            )}
                            
                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteClick(order.id, order.po_number)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
                  <span className="text-slate-600">
                    Showing <span className="font-semibold text-slate-900">{filteredOrders.length}</span> of <span className="font-semibold text-slate-900">{orders.length}</span> orders
                  </span>
                  <span className="text-slate-600">
                    Total Value: <span className="font-semibold text-slate-900">₹{stats.totalValue.toLocaleString('en-IN')}</span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Filter Purchase Orders</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-white hover:bg-white/20 p-1 rounded transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 rounded-b-2xl flex gap-3">
              <Button onClick={() => setFilterStatus('all')} variant="secondary" fullWidth>Clear</Button>
              <Button onClick={() => setShowFilterModal(false)} variant="primary" fullWidth className="bg-gradient-to-r from-teal-600 to-teal-700">Apply Filters</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showEditConfirm}
        onClose={() => { setShowEditConfirm(false); setEditingPO(null); }}
        onConfirm={handleEditConfirm}
        title="Edit Purchase Order"
        message={editingPO ? `Do you want to edit PO ${editingPO.po_number}?` : ''}
        confirmText="Edit"
        cancelText="Cancel"
        variant="primary"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeletingPO(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase Order"
        message={deletingPO ? `Are you sure you want to delete PO ${deletingPO.po_number}? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Create/Edit/View PO Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full">
              <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-6 rounded-t-2xl flex justify-between items-center z-10">
                <h3 className="text-2xl font-bold text-white">
                  {viewOnly ? `View Purchase Order ${editingPO?.po_number}` : (editingPO ? `Edit Purchase Order ${editingPO.po_number}` : 'Create Purchase Order')}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Vendor Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Vendor *</label>
                    <select
                      value={formData.vendor_id}
                      onChange={(e) => handleVendorChange(e.target.value)}
                      disabled={viewOnly}
                      className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">Select vendor</option>
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">PO Date</label>
                    <input
                      type="date"
                      value={formData.po_date}
                      onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
                      disabled={viewOnly}
                      className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Expected Delivery</label>
                    <input
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                      disabled={viewOnly}
                      className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-slate-900 text-lg">Items</h4>
                    {!viewOnly && (
                      <button
                        onClick={addItem}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 text-sm flex items-center gap-2 shadow-md"
                      >
                        <Plus size={16} />
                        Add Item
                      </button>
                    )}
                  </div>

                  {items.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
                      <p className="text-slate-500">No items added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={item.id} className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-bold text-slate-900">Item #{index + 1}</span>
                            {!viewOnly && (
                              <button 
                                onClick={() => removeItem(item.id)} 
                                className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="col-span-2 relative">
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Item Name</label>
                              <input
                                type="text"
                                value={item.item_name}
                                onChange={(e) => {
                                  const searchTerm = e.target.value;
                                  setItems(items.map(i => i.id === item.id ? {...i, item_name: searchTerm} : i));
                                }}
                                onFocus={(e) => {
                                  if (!viewOnly) {
                                    const dropdown = document.getElementById(`dropdown-${item.id}`);
                                    if (dropdown) dropdown.style.display = 'block';
                                  }
                                }}
                                onBlur={(e) => {
                                  setTimeout(() => {
                                    const dropdown = document.getElementById(`dropdown-${item.id}`);
                                    if (dropdown) dropdown.style.display = 'none';
                                  }, 200);
                                }}
                                disabled={viewOnly}
                                placeholder="Type to search..."
                                className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
                              />
                              {!viewOnly && (
                                <div
                                  id={`dropdown-${item.id}`}
                                  className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-300 rounded-lg shadow-2xl max-h-60 overflow-y-auto hidden"
                                  style={{ display: 'none' }}
                                >
                                  {availableItems
                                    .filter(i => i.name.toLowerCase().includes(item.item_name.toLowerCase()))
                                    .slice(0, 50)
                                    .map(availItem => (
                                      <div
                                        key={availItem.id}
                                        onClick={() => {
                                          updateItem(item.id, 'item_id', availItem.id);
                                          const dropdown = document.getElementById(`dropdown-${item.id}`);
                                          if (dropdown) dropdown.style.display = 'none';
                                        }}
                                        className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-slate-100 last:border-0"
                                      >
                                        <div className="font-semibold text-slate-900">{availItem.name}</div>
                                        <div className="text-xs text-slate-500">Rate: ₹{availItem.wholesale_price} | GST: {availItem.gst_rate}%</div>
                                      </div>
                                    ))}
                                  {availableItems.filter(i => i.name.toLowerCase().includes(item.item_name.toLowerCase())).length === 0 && (
                                    <div className="px-4 py-3 text-sm text-slate-500">No items found</div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                disabled={viewOnly}
                                placeholder="Qty"
                                className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Rate (₹)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                disabled={viewOnly}
                                placeholder="Rate"
                                className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-300 flex justify-between items-center">
                            <span className="text-xs text-slate-600">GST: {item.gst_rate}%</span>
                            <div>
                              <span className="text-xs text-slate-600">Amount: </span>
                              <span className="text-sm font-bold text-slate-900">₹{item.amount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={viewOnly}
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                    placeholder="Additional notes (optional)"
                  />
                </div>

                {/* Totals */}
                {totals && (
                  <div className="border-t-2 border-slate-200 pt-6">
                    <div className="max-w-sm ml-auto space-y-3 bg-slate-50 p-6 rounded-xl border-2 border-slate-200">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-700">Subtotal:</span>
                        <span className="font-semibold text-slate-900">₹{totals.subtotal.toFixed(2)}</span>
                      </div>
                      {isIntrastate ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-600">CGST:</span>
                            <span className="text-slate-900">₹{totals.cgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">SGST:</span>
                            <span className="text-slate-900">₹{totals.sgst.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-slate-600">IGST:</span>
                          <span className="text-slate-900">₹{totals.igst.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-slate-300">
                        <span className="text-slate-900">Total:</span>
                        <span className="text-teal-700">₹{totals.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="sticky bottom-0 bg-slate-50 px-8 py-4 rounded-b-2xl flex gap-3 border-t-2 border-slate-200">
                <Button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  variant="secondary"
                  fullWidth
                >
                  {viewOnly ? 'Close' : 'Cancel'}
                </Button>
                {!viewOnly && (
                  <Button
                    onClick={handleSubmit}
                    disabled={saving || !formData.vendor_id || items.length === 0}
                    variant="primary"
                    fullWidth
                    className="bg-gradient-to-r from-teal-600 to-teal-700"
                  >
                    {saving ? 'Saving...' : (editingPO ? 'Update Purchase Order' : 'Create Purchase Order')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
