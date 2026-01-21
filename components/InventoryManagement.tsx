// FILE PATH: components/InventoryManagement.tsx
// Stunning Modern Inventory & Items Management - Beautiful Tailwind UI

'use client';
import React, { useState, useEffect } from 'react';
import { 
  Package, Search, AlertTriangle, TrendingUp, DollarSign, X, 
  Plus, Edit2, Trash2, History, Info, Tag, Layers, Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Textarea, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type Item = {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category_id?: string;
  category?: { id: string; name: string };
  unit_id?: string;
  unit?: { id: string; name: string; abbreviation: string };
  description?: string;
  mrp: number;
  retail_price: number;
  wholesale_price: number;
  gst_rate: number;
  min_stock_level: number;
  max_stock_level?: number;
  current_stock: number;
  normal_stock: number;
  returned_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Transaction = {
  id: string;
  type: 'sale' | 'purchase' | 'return';
  quantity: number;
  date: string;
  reference: string;
  notes?: string;
};

type Category = { id: string; name: string };
type Unit = { id: string; name: string; abbreviation: string };

const InventoryManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'has-returns'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'stock' | 'history' | 'settings'>('details');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    unit_id: '',
    description: '',
    mrp: 0,
    retail_price: 0,
    wholesale_price: 0,
    gst_rate: 18,
    min_stock_level: 10,
    max_stock_level: 0,
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      const { data: categoriesData } = await supabase.from('categories').select('*').order('name');
      const { data: unitsData } = await supabase.from('units').select('*').order('name');
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*, category:categories(id, name), unit:units(id, name, abbreviation)')
        .order('name');

      if (itemsError) throw itemsError;

      const itemsWithStock = await Promise.all((itemsData || []).map(async (item) => {
        const { data: normalStock } = await supabase.from('inventory').select('quantity').eq('item_id', item.id).eq('is_returned', false).single();
        const { data: returnedStock } = await supabase.from('inventory').select('quantity').eq('item_id', item.id).eq('is_returned', true).single();
        return {
          ...item,
          normal_stock: normalStock?.quantity || 0,
          returned_stock: returnedStock?.quantity || 0,
          current_stock: (normalStock?.quantity || 0) + (returnedStock?.quantity || 0)
        };
      }));

      setCategories(categoriesData || []);
      setUnits(unitsData || []);
      setItems(itemsWithStock);
    } catch (err: any) {
      console.error('Error loading data:', err);
      toast.error('Failed to load', 'Could not load inventory data.');
    } finally {
      setLoading(false);
    }
  }

  async function loadItemHistory(itemId: string) {
    try {
      setLoadingHistory(true);
      const transactions: Transaction[] = [];

      const { data: sales } = await supabase.from('sales_invoice_items').select('quantity, sales_invoice:sales_invoices(invoice_number, invoice_date)').eq('item_id', itemId).order('created_at', { ascending: false }).limit(50);
      if (sales) sales.forEach((s: any) => transactions.push({ id: `sale-${s.sales_invoice?.invoice_number}`, type: 'sale', quantity: -s.quantity, date: s.sales_invoice?.invoice_date || '', reference: s.sales_invoice?.invoice_number || '', notes: 'Sale' }));

      const { data: purchases } = await supabase.from('purchase_invoice_items').select('quantity, purchase_invoice:purchase_invoices(invoice_number, invoice_date)').eq('item_id', itemId).order('created_at', { ascending: false }).limit(50);
      if (purchases) purchases.forEach((p: any) => transactions.push({ id: `purchase-${p.purchase_invoice?.invoice_number}`, type: 'purchase', quantity: p.quantity, date: p.purchase_invoice?.invoice_date || '', reference: p.purchase_invoice?.invoice_number || '', notes: 'Purchase' }));

      const { data: returns } = await supabase.from('return_items').select('quantity, return:returns(return_number, return_date)').eq('item_id', itemId).order('created_at', { ascending: false}).limit(50);
      if (returns) returns.forEach((r: any) => transactions.push({ id: `return-${r.return?.return_number}`, type: 'return', quantity: r.quantity, date: r.return?.return_date || '', reference: r.return?.return_number || '', notes: 'Customer Return' }));

      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(transactions);
    } catch (err: any) {
      console.error('Error loading history:', err);
      toast.error('Failed to load', 'Could not load transaction history.');
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleViewItem = async (item: Item) => {
    setSelectedItem(item);
    setActiveTab('details');
    setShowItemModal(true);
    await loadItemHistory(item.id);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({ name: '', sku: '', barcode: '', category_id: '', unit_id: '', description: '', mrp: 0, retail_price: 0, wholesale_price: 0, gst_rate: 18, min_stock_level: 10, max_stock_level: 0, is_active: true });
    setShowAddModal(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setFormData({ name: item.name, sku: item.sku || '', barcode: item.barcode || '', category_id: item.category_id || '', unit_id: item.unit_id || '', description: item.description || '', mrp: item.mrp, retail_price: item.retail_price, wholesale_price: item.wholesale_price, gst_rate: item.gst_rate, min_stock_level: item.min_stock_level, max_stock_level: item.max_stock_level || 0, is_active: item.is_active });
    setShowItemModal(false);
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      if (!formData.name.trim()) { toast.warning('Name required', 'Please enter item name.'); return; }
      
      if (editingItem) {
        const { error } = await supabase.from('items').update(formData).eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Updated!', `Item "${formData.name}" has been updated.`);
      } else {
        const { error } = await supabase.from('items').insert(formData);
        if (error) throw error;
        toast.success('Created!', `Item "${formData.name}" has been added.`);
      }
      await loadData();
      setShowAddModal(false);
    } catch (err: any) {
      console.error('Error saving item:', err);
      toast.error('Failed to save', err.message || 'Could not save item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => { setDeletingItem({ id, name }); setShowDeleteConfirm(true); };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      const { error } = await supabase.from('items').delete().eq('id', deletingItem.id);
      if (error) throw error;
      await loadData();
      toast.success('Deleted', `Item "${deletingItem.name}" has been removed.`);
      setShowDeleteConfirm(false);
      setDeletingItem(null);
      setShowItemModal(false);
    } catch (err: any) {
      console.error('Error deleting item:', err);
      toast.error('Failed to delete', err.message || 'Could not delete item.');
    }
  };

  const getStockStatus = (item: Item) => {
    if (item.current_stock === 0) return 'out-of-stock';
    if (item.current_stock <= item.min_stock_level) return 'low-stock';
    return 'in-stock';
  };

  const getStockBadge = (item: Item) => {
    const status = getStockStatus(item);
    if (status === 'out-of-stock') return <Badge variant="danger" size="sm">Out of Stock</Badge>;
    if (status === 'low-stock') return <Badge variant="warning" size="sm">Low Stock</Badge>;
    return <Badge variant="success" size="sm">In Stock</Badge>;
  };

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.barcode || '').toLowerCase().includes(searchTerm.toLowerCase());
      const status = getStockStatus(item);
      const matchesStatus = filterStatus === 'all' || (filterStatus === 'has-returns' ? item.returned_stock > 0 : status === filterStatus);
      const matchesCategory = filterCategory === 'all' || item.category_id === filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === 'name') { aVal = a.name; bVal = b.name; }
      else if (sortBy === 'stock') { aVal = a.current_stock; bVal = b.current_stock; }
      else { aVal = a.current_stock * a.retail_price; bVal = b.current_stock * b.retail_price; }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  const stats = {
    totalItems: items.length,
    totalValue: items.reduce((sum, item) => sum + (item.current_stock * item.retail_price), 0),
    lowStock: items.filter(item => getStockStatus(item) === 'low-stock').length,
    outOfStock: items.filter(item => getStockStatus(item) === 'out-of-stock').length,
    returns: items.filter(item => item.returned_stock > 0).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex p-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl mb-4 animate-pulse">
            <LoadingSpinner size="lg" />
          </div>
          <p className="text-slate-600 font-medium animate-pulse">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* Stunning Header with Gradient & Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-1 shadow-2xl">
          <div className="relative bg-white/95 backdrop-blur-xl rounded-[22px] p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                  <Package className="text-white" size={32} />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Inventory & Items
                  </h1>
                  <p className="text-slate-600 mt-1 flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-500" />
                    Unified inventory management
                  </p>
                </div>
              </div>
              <Button onClick={handleAddNew} variant="primary" size="md" icon={<Plus size={20} />} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
                Add Item
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { icon: Package, color: 'from-blue-500 to-blue-600', value: stats.totalItems, label: 'Total Items' },
            { icon: DollarSign, color: 'from-green-500 to-emerald-600', value: `₹${(stats.totalValue / 1000).toFixed(0)}K`, label: 'Total Value' },
            { icon: AlertTriangle, color: 'from-orange-500 to-amber-600', value: stats.lowStock, label: 'Low Stock' },
            { icon: X, color: 'from-red-500 to-rose-600', value: stats.outOfStock, label: 'Out of Stock' },
            { icon: TrendingUp, color: 'from-purple-500 to-pink-600', value: stats.returns, label: 'Has Returns' }
          ].map((stat, i) => (
            <div key={i} className="group relative overflow-hidden backdrop-blur-xl bg-white/80 rounded-2xl shadow-lg border border-white/20 p-5 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer" style={{ animation: `slideUp 0.4s ease-out ${i * 0.1}s backwards` }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              <div className="relative text-center">
                <div className={`inline-flex p-3 bg-gradient-to-br ${stat.color} rounded-xl mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon className="text-white" size={24} />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-600 mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Elegant Search & Filters */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-lg border border-white/20 p-4 hover:shadow-xl transition-shadow">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Input placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} leftIcon={<Search size={18} className="text-slate-400" />} rightIcon={searchTerm ? <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button> : undefined} className="pl-10 pr-10" />
              </div>
            </div>
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="md:w-48 bg-white/50 backdrop-blur">
              <option value="all">All Status</option>
              <option value="in-stock">✓ In Stock</option>
              <option value="low-stock">⚠ Low Stock</option>
              <option value="out-of-stock">✗ Out of Stock</option>
              <option value="has-returns">↩ Has Returns</option>
            </Select>
            <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="md:w-48 bg-white/50 backdrop-blur">
              <option value="all">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </Select>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="md:w-40 bg-white/50 backdrop-blur">
              <option value="name">Sort by Name</option>
              <option value="stock">Sort by Stock</option>
              <option value="value">Sort by Value</option>
            </Select>
            <Button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} variant="secondary" size="md" className="shadow-md hover:shadow-lg transition-shadow">
              {sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A'}
            </Button>
          </div>
        </div>

        {/* Beautiful Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-lg border border-white/20 p-12">
            <EmptyState icon={<Package size={64} className="text-slate-300" />} title={searchTerm || filterStatus !== 'all' ? "No items found" : "No items yet"} description={searchTerm || filterStatus !== 'all' ? "Try adjusting your filters" : "Add your first item to get started"} action={searchTerm || filterStatus !== 'all' ? <Button onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterCategory('all'); }} variant="secondary">Clear Filters</Button> : <Button onClick={handleAddNew} variant="primary" icon={<Plus size={20} />}>Add First Item</Button>} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item, i) => (
              <div key={item.id} onClick={() => handleViewItem(item)} className="group relative overflow-hidden backdrop-blur-xl bg-white/90 rounded-2xl shadow-lg border border-white/20 p-5 cursor-pointer hover:shadow-2xl hover:scale-[1.02] hover:bg-white transition-all duration-300" style={{ animation: `slideUp 0.3s ease-out ${i * 0.05}s backwards` }}>
                <div className={`absolute inset-0 bg-gradient-to-br ${getStockStatus(item) === 'out-of-stock' ? 'from-red-500/5 to-rose-500/5' : getStockStatus(item) === 'low-stock' ? 'from-orange-500/5 to-amber-500/5' : 'from-green-500/5 to-emerald-500/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-lg mb-1 truncate group-hover:text-purple-600 transition-colors">{item.name}</h3>
                      {item.sku && <p className="text-xs text-slate-500 flex items-center gap-1"><Tag size={12} />{item.sku}</p>}
                    </div>
                    {getStockBadge(item)}
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg group-hover:bg-white/50 transition-colors">
                      <span className="text-slate-600 flex items-center gap-2"><Layers size={14} />Stock</span>
                      <span className="font-semibold text-slate-900">{item.current_stock} {item.unit?.abbreviation || ''}</span>
                    </div>
                    {item.returned_stock > 0 && (
                      <div className="flex items-center justify-between p-2 bg-orange-50/50 rounded-lg">
                        <span className="text-orange-600 text-xs">Returns</span>
                        <span className="font-medium text-orange-600 text-xs">+{item.returned_stock}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg group-hover:bg-white/50 transition-colors">
                      <span className="text-slate-600">Retail</span>
                      <span className="font-semibold text-slate-900">₹{item.retail_price}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg group-hover:bg-white/50 transition-colors">
                      <span className="text-slate-600">GST</span>
                      <span className="font-medium text-slate-900">{item.gst_rate}%</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <Badge variant="neutral" size="sm" className="bg-gradient-to-r from-slate-100 to-slate-200">{item.category?.name || 'Uncategorized'}</Badge>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleViewItem(item)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 transition-all" title="View"><Info size={14} /></button>
                      <button onClick={() => handleEditItem(item)} className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 hover:scale-110 transition-all" title="Edit"><Edit2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Elegant Summary */}
        {filteredItems.length > 0 && (
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-lg border border-white/20 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
              <span className="text-slate-600">Showing <span className="font-bold text-slate-900">{filteredItems.length}</span> of <span className="font-bold text-slate-900">{items.length}</span> items</span>
              <span className="text-slate-600">Total Inventory Value: <span className="font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">₹{stats.totalValue.toLocaleString('en-IN')}</span></span>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal - Beautiful Design */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-slideUp">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  {editingItem ? <Edit2 size={24} /> : <Plus size={24} />}
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h3>
                <button onClick={() => setShowAddModal(false)} disabled={saving} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Item Name" placeholder="e.g., Premium Widget" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="font-medium" />
                <Input label="SKU" placeholder="e.g., SKU-001" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} leftIcon={<Tag size={16} />} />
                <Input label="Barcode" placeholder="e.g., 123456789" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
                <Select label="Category" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </Select>
                <Select label="Unit" value={formData.unit_id} onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}>
                  <option value="">Select unit</option>
                  {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</option>)}
                </Select>
                <Input label="MRP" type="number" step="0.01" value={formData.mrp || ''} onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })} required leftIcon={<DollarSign size={16} />} />
                <Input label="Retail Price" type="number" step="0.01" value={formData.retail_price || ''} onChange={(e) => setFormData({ ...formData, retail_price: parseFloat(e.target.value) || 0 })} required leftIcon={<DollarSign size={16} />} />
                <Input label="Wholesale Price" type="number" step="0.01" value={formData.wholesale_price || ''} onChange={(e) => setFormData({ ...formData, wholesale_price: parseFloat(e.target.value) || 0 })} required leftIcon={<DollarSign size={16} />} />
                <Input label="GST Rate (%)" type="number" value={formData.gst_rate || ''} onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) || 0 })} required />
                <Input label="Min Stock Level" type="number" value={formData.min_stock_level || ''} onChange={(e) => setFormData({ ...formData, min_stock_level: parseFloat(e.target.value) || 0 })} required />
                <Input label="Max Stock Level" type="number" value={formData.max_stock_level || ''} onChange={(e) => setFormData({ ...formData, max_stock_level: parseFloat(e.target.value) || 0 })} />
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active Item</label>
                </div>
              </div>
              <Textarea label="Description" placeholder="Product details..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>

            <div className="sticky bottom-0 bg-slate-50 px-8 py-6 rounded-b-3xl flex gap-3">
              <Button onClick={() => setShowAddModal(false)} variant="secondary" fullWidth disabled={saving}>Cancel</Button>
              <Button onClick={handleSubmit} variant="primary" fullWidth disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600">{saving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal - Stunning Tabs */}
      {showItemModal && selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-slideUp">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedItem.name}</h3>
                  <p className="text-white/80">{selectedItem.category?.name || 'Uncategorized'}</p>
                </div>
                <button onClick={() => setShowItemModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={24} className="text-white" />
                </button>
              </div>
              <div className="flex gap-2">
                {[
                  { id: 'details', label: 'Details', icon: Info },
                  { id: 'stock', label: 'Stock', icon: Package },
                  { id: 'history', label: 'History', icon: History },
                  { id: 'settings', label: 'Settings', icon: Edit2 }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${activeTab === tab.id ? 'bg-white text-purple-600 shadow-lg' : 'text-white/80 hover:bg-white/20'}`}>
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8">
              {activeTab === 'details' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'SKU', value: selectedItem.sku || 'N/A', icon: Tag },
                      { label: 'Barcode', value: selectedItem.barcode || 'N/A', icon: Tag },
                      { label: 'Unit', value: selectedItem.unit?.name || 'N/A', icon: Layers },
                      { label: 'MRP', value: `₹${selectedItem.mrp}`, icon: DollarSign },
                      { label: 'Retail', value: `₹${selectedItem.retail_price}`, icon: DollarSign },
                      { label: 'Wholesale', value: `₹${selectedItem.wholesale_price}`, icon: DollarSign },
                      { label: 'GST Rate', value: `${selectedItem.gst_rate}%`, icon: DollarSign },
                      { label: 'Min Stock', value: selectedItem.min_stock_level, icon: AlertTriangle },
                      { label: 'Status', value: selectedItem.is_active ? 'Active' : 'Inactive', icon: Info }
                    ].map((field, i) => (
                      <div key={i} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 text-slate-600 mb-1">
                          <field.icon size={14} />
                          <p className="text-xs font-medium">{field.label}</p>
                        </div>
                        <p className="font-bold text-slate-900">{field.value}</p>
                      </div>
                    ))}
                  </div>
                  {selectedItem.description && (
                    <div className="p-6 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-600 font-medium mb-2">Description</p>
                      <p className="text-slate-900">{selectedItem.description}</p>
                    </div>
                  )}
                  <Button onClick={() => handleEditItem(selectedItem)} variant="primary" icon={<Edit2 size={18} />} className="bg-gradient-to-r from-blue-600 to-purple-600">Edit Item</Button>
                </div>
              )}

              {activeTab === 'stock' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Total Stock', value: selectedItem.current_stock, color: 'from-blue-500 to-blue-600', icon: Package },
                      { label: 'Normal Stock', value: selectedItem.normal_stock, color: 'from-green-500 to-green-600', icon: Package },
                      { label: 'Returned Stock', value: selectedItem.returned_stock, color: 'from-orange-500 to-orange-600', icon: Package }
                    ].map((stat, i) => (
                      <div key={i} className={`relative overflow-hidden p-6 bg-gradient-to-br ${stat.color} rounded-2xl shadow-xl text-white`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="relative">
                          <stat.icon size={32} className="mb-3 opacity-80" />
                          <p className="text-4xl font-bold mb-1">{stat.value}</p>
                          <p className="text-sm opacity-90">{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                    <p className="text-sm text-green-700 font-medium mb-2">Stock Value</p>
                    <p className="text-3xl font-bold text-green-900">₹{(selectedItem.current_stock * selectedItem.retail_price).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStockBadge(selectedItem)}
                    {selectedItem.current_stock <= selectedItem.min_stock_level && (
                      <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
                        <AlertTriangle size={18} />
                        <span className="text-sm font-medium">Below minimum stock level</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="animate-fadeIn">
                  {loadingHistory ? (
                    <div className="py-12 text-center"><LoadingSpinner size="md" /></div>
                  ) : transactions.length === 0 ? (
                    <EmptyState icon={<History size={48} className="text-slate-300" />} title="No history yet" description="Transaction history will appear here" />
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((txn) => (
                        <div key={txn.id} className={`flex items-center justify-between p-5 rounded-2xl shadow-md hover:shadow-xl transition-all ${txn.type === 'sale' ? 'bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500' : txn.type === 'purchase' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500' : 'bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${txn.type === 'sale' ? 'bg-red-100 text-red-600' : txn.type === 'purchase' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                              {txn.type === 'sale' ? <TrendingUp size={20} /> : <Package size={20} />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{txn.reference}</p>
                              <p className="text-sm text-slate-600">{txn.notes}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${txn.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>{txn.quantity > 0 ? '+' : ''}{txn.quantity}</p>
                            <p className="text-xs text-slate-500">{new Date(txn.date).toLocaleDateString('en-IN')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-red-100 rounded-xl"><AlertTriangle className="text-red-600" size={24} /></div>
                      <div className="flex-1">
                        <h4 className="font-bold text-red-900 text-lg mb-2">Delete Item</h4>
                        <p className="text-sm text-red-700 mb-4">Permanently remove this item from inventory. This action cannot be undone.</p>
                        <Button onClick={() => handleDeleteClick(selectedItem.id, selectedItem.name)} variant="danger" size="sm" icon={<Trash2 size={16} />}>Delete Item</Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl">
                    <h4 className="font-bold text-slate-900 mb-3">Item Information</h4>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p>Created: {new Date(selectedItem.created_at).toLocaleString('en-IN')}</p>
                      <p>Last Updated: {new Date(selectedItem.updated_at).toLocaleString('en-IN')}</p>
                      <p className="font-mono text-xs text-slate-400">ID: {selectedItem.id}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeletingItem(null); }} onConfirm={handleDeleteConfirm} title="Delete Item" message={deletingItem ? `Are you sure you want to delete "${deletingItem.name}"? This will remove all stock records and history. This cannot be undone.` : ''} confirmText="Delete" cancelText="Cancel" variant="danger" />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default InventoryManagement;
