// FILE PATH: components/InventoryManagement.tsx
// Inventory Management with consistent theming

'use client';
import React, { useState, useEffect } from 'react';
import { 
  Package, Search, AlertTriangle, TrendingUp, DollarSign, X, 
  Plus, Edit2, Trash2, History, Info, Tag, Filter, Camera
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Textarea, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import BarcodeScanner from './BarcodeScanner';

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
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'stock' | 'history' | 'settings'>('details');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [itemBatches, setItemBatches] = useState<any[]>([]);
  
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
      
      // Load categories and units
      const { data: categoriesData } = await supabase.from('categories').select('*').order('name');
      const { data: unitsData } = await supabase.from('units').select('*').order('name');
      
      // Load items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*, category:categories(id, name), unit:units(id, name, abbreviation)')
        .order('name');

      if (itemsError) throw itemsError;

      // Get stock for all items with single aggregated query
      const { data: stockData, error: stockError } = await supabase
        .from('inventory_batches')
        .select('item_id, status, quantity');

      if (stockError) throw stockError;

      // Aggregate stock by item_id and status
      const stockByItem = (stockData || []).reduce((acc, batch) => {
        if (!acc[batch.item_id]) {
          acc[batch.item_id] = { normal: 0, returned: 0 };
        }
        const qty = parseFloat(batch.quantity) || 0; // Handle null/undefined/string quantities
        if (batch.status === 'normal') {
          acc[batch.item_id].normal += qty;
        } else if (batch.status === 'returned') {
          acc[batch.item_id].returned += qty;
        }
        return acc;
      }, {} as Record<string, { normal: number; returned: number }>);

      // Map stock to items
      const itemsWithStock = (itemsData || []).map((item) => {
        const stock = stockByItem[item.id] || { normal: 0, returned: 0 };
        return {
          ...item,
          normal_stock: stock.normal,
          returned_stock: stock.returned,
          current_stock: stock.normal + stock.returned
        };
      });

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

  async function loadItemBatches(itemId: string) {
    try {
      setLoadingBatches(true);
      const { data, error } = await supabase
        .from('inventory_batches')
        .select('*')
        .eq('item_id', itemId)
        .gt('quantity', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItemBatches(data || []);
    } catch (err: any) {
      console.error('Error loading batches:', err);
      toast.error('Failed to load', 'Could not load batch details.');
    } finally {
      setLoadingBatches(false);
    }
  }

  const handleViewItem = async (item: Item) => {
    setSelectedItem(item);
    setActiveTab('details');
    setShowItemModal(true);
    await Promise.all([
      loadItemHistory(item.id),
      loadItemBatches(item.id)
    ]);
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

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterCategory('all');
  };

  const handleBarcodeScan = (barcode: string) => {
    setFormData({ ...formData, barcode });
    setShowBarcodeScanner(false);
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

  const hasActiveFilters = filterStatus !== 'all' || filterCategory !== 'all' || searchTerm !== '';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600 font-medium">Loading inventory...</p>
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
              <div className={`p-3 ${theme.classes.bgPrimaryLight} rounded-xl`}>
                <Package className={theme.classes.textPrimary} size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Inventory & Items</h1>
                <p className="text-slate-600 text-sm mt-0.5">Manage stock and product catalog</p>
              </div>
            </div>
            <Button 
              onClick={handleAddNew} 
              variant="primary" 
              icon={<Plus size={20} />}
            >
              Add Item
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card padding="md" className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg`}>
                <Package className={theme.classes.textPrimary} size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.totalItems}</span>
            </div>
            <p className="text-sm text-slate-600">Total Items</p>
          </Card>

          <Card padding="md" className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="text-amber-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">₹{(stats.totalValue / 1000).toFixed(0)}K</span>
            </div>
            <p className="text-sm text-slate-600">Total Value</p>
          </Card>

          <Card padding="md" className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="text-orange-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.lowStock}</span>
            </div>
            <p className="text-sm text-slate-600">Low Stock</p>
          </Card>

          <Card padding="md" className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="text-red-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.outOfStock}</span>
            </div>
            <p className="text-sm text-slate-600">Out of Stock</p>
          </Card>

          <Card padding="md" className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="text-blue-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.returns}</span>
            </div>
            <p className="text-sm text-slate-600">Has Returns</p>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <Card padding="md">
              <Input
                leftIcon={<Search size={18} />}
                rightIcon={searchTerm ? (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                ) : undefined}
                placeholder="Search by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Card>
          </div>

          <div className="md:col-span-3">
            <Card padding="md">
              <Button
                onClick={() => setShowFilterModal(true)}
                variant="secondary"
                icon={<Filter size={18} />}
                fullWidth
                className="relative"
              >
                Filters
                {hasActiveFilters && (
                  <span className={`absolute -top-1 -right-1 w-5 h-5 ${theme.classes.bgPrimary} text-white text-xs rounded-full flex items-center justify-center`}>
                    {[filterStatus !== 'all', filterCategory !== 'all'].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </Card>
          </div>

          <div className="md:col-span-3">
            <Card padding="md">
              <Select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  setSortBy(sort);
                  setSortOrder(order as 'asc' | 'desc');
                }}
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="stock-desc">Stock (High to Low)</option>
                <option value="stock-asc">Stock (Low to High)</option>
                <option value="value-desc">Value (High to Low)</option>
                <option value="value-asc">Value (Low to High)</option>
              </Select>
            </Card>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <Card padding="md">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Active filters:</span>
              {filterStatus !== 'all' && (
                <span className={`inline-flex items-center gap-1 px-3 py-1 ${theme.classes.bgPrimaryLight} ${theme.classes.textPrimary} rounded-full text-sm`}>
                  Status: {filterStatus}
                  <button onClick={() => setFilterStatus('all')} className="hover:opacity-70">
                    <X size={14} />
                  </button>
                </span>
              )}
              {filterCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                  Category: {categories.find(c => c.id === filterCategory)?.name}
                  <button onClick={() => setFilterCategory('all')} className="hover:opacity-70">
                    <X size={14} />
                  </button>
                </span>
              )}
              <Button onClick={handleClearFilters} variant="secondary" size="sm">
                Clear All
              </Button>
            </div>
          </Card>
        )}

        {/* Items Table */}
        <Card padding="none">
          {filteredItems.length === 0 ? (
            <div className="p-12">
              <EmptyState 
                icon={<Package size={64} />}
                title={hasActiveFilters ? "No items found" : "No items yet"}
                description={hasActiveFilters ? "Try adjusting your filters" : "Add your first item to get started"}
                action={
                  hasActiveFilters ? (
                    <Button onClick={handleClearFilters} variant="secondary">Clear Filters</Button>
                  ) : (
                    <Button onClick={handleAddNew} variant="primary" icon={<Plus size={20} />}>Add First Item</Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Prices</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">GST</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => (
                      <tr 
                        key={item.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleViewItem(item)}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            {item.sku && (
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <Tag size={12} />
                                {item.sku}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="neutral" size="sm">
                            {item.category?.name || 'Uncategorized'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-900">
                              {item.current_stock} <span className="text-sm font-normal text-slate-500">{item.unit?.abbreviation || ''}</span>
                            </p>
                            {item.returned_stock > 0 && (
                              <p className="text-xs text-orange-600 mt-1">+{item.returned_stock} returns</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            <p className="text-slate-600">MRP: <span className="font-medium text-slate-900">₹{item.mrp}</span></p>
                            <p className="text-slate-600">Retail: <span className="font-semibold text-slate-900">₹{item.retail_price}</span></p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">{item.gst_rate}%</span>
                        </td>
                        <td className="px-6 py-4">
                          {getStockBadge(item)}
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewItem(item)}
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Info size={18} />
                            </button>
                            <button
                              onClick={() => handleEditItem(item)}
                              className={`p-2 ${theme.classes.textPrimary} ${theme.classes.bgPrimaryLight} rounded-lg transition-colors hover:opacity-80`}
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
                  <span className="text-slate-600">
                    Showing <span className="font-semibold text-slate-900">{filteredItems.length}</span> of <span className="font-semibold text-slate-900">{items.length}</span> items
                  </span>
                  <span className="text-slate-600">
                    Total Value: <span className={`font-bold ${theme.classes.textPrimary}`}>₹{stats.totalValue.toLocaleString('en-IN')}</span>
                  </span>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 ${theme.classes.bgPrimaryLight} rounded-xl`}>
                    <Filter className={theme.classes.textPrimary} size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Filter Items</h3>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Stock Status</label>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                  >
                    <option value="all">All Status</option>
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                    <option value="has-returns">Has Returns</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                  <Select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => { setFilterStatus('all'); setFilterCategory('all'); }}
                  variant="secondary"
                  fullWidth
                >
                  Clear
                </Button>
                <Button
                  onClick={() => setShowFilterModal(false)}
                  variant="primary"
                  fullWidth
                >
                  Apply Filters
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h3>
                <button onClick={() => setShowAddModal(false)} disabled={saving} className="p-2 rounded-lg hover:bg-slate-100">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Item Name *"
                    placeholder="e.g., Premium Widget"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />

                  <Input
                    label="SKU"
                    placeholder="e.g., SKU-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Barcode</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter or scan barcode"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setShowBarcodeScanner(true)}
                        className={`px-4 py-2.5 ${theme.classes.bgPrimary} text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-md`}
                      >
                        <Camera size={18} />
                        <span className="hidden sm:inline">Scan</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                    <Select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Unit</label>
                    <Select
                      value={formData.unit_id}
                      onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                    >
                      <option value="">Select unit</option>
                      {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</option>)}
                    </Select>
                  </div>

                  <Input
                    label="MRP *"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.mrp || ''}
                    onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                    required
                  />

                  <Input
                    label="Retail Price *"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.retail_price || ''}
                    onChange={(e) => setFormData({ ...formData, retail_price: parseFloat(e.target.value) || 0 })}
                    required
                  />

                  <Input
                    label="Wholesale Price *"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.wholesale_price || ''}
                    onChange={(e) => setFormData({ ...formData, wholesale_price: parseFloat(e.target.value) || 0 })}
                    required
                  />

                  <Input
                    label="GST Rate (%) *"
                    type="number"
                    placeholder="18"
                    value={formData.gst_rate || ''}
                    onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) || 0 })}
                    required
                  />

                  <Input
                    label="Min Stock Level *"
                    type="number"
                    placeholder="10"
                    value={formData.min_stock_level || ''}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: parseFloat(e.target.value) || 0 })}
                    required
                  />

                  <Input
                    label="Max Stock Level"
                    type="number"
                    placeholder="0"
                    value={formData.max_stock_level || ''}
                    onChange={(e) => setFormData({ ...formData, max_stock_level: parseFloat(e.target.value) || 0 })}
                  />

                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active Item</label>
                  </div>
                </div>

                <Textarea
                  label="Description"
                  placeholder="Product details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={() => setShowAddModal(false)} variant="secondary" fullWidth disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} variant="primary" fullWidth loading={saving}>
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* View Item Modal */}
      {showItemModal && selectedItem && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedItem.name}</h3>
                  <p className="text-slate-600">{selectedItem.category?.name || 'Uncategorized'}</p>
                </div>
                <button onClick={() => setShowItemModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'details', label: 'Details', icon: Info },
                  { id: 'stock', label: 'Stock', icon: Package },
                  { id: 'history', label: 'History', icon: History },
                  { id: 'settings', label: 'Settings', icon: Edit2 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeTab === tab.id 
                        ? `${theme.classes.bgPrimary} text-white shadow-md` 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div>
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: 'SKU', value: selectedItem.sku || 'N/A' },
                        { label: 'Barcode', value: selectedItem.barcode || 'N/A' },
                        { label: 'Unit', value: selectedItem.unit?.name || 'N/A' },
                        { label: 'MRP', value: `₹${selectedItem.mrp}` },
                        { label: 'Retail', value: `₹${selectedItem.retail_price}` },
                        { label: 'Wholesale', value: `₹${selectedItem.wholesale_price}` },
                        { label: 'GST Rate', value: `${selectedItem.gst_rate}%` },
                        { label: 'Min Stock', value: selectedItem.min_stock_level },
                        { label: 'Status', value: selectedItem.is_active ? 'Active' : 'Inactive' }
                      ].map((field, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="text-xs font-semibold text-slate-600 mb-1">{field.label}</p>
                          <p className="font-bold text-slate-900">{field.value}</p>
                        </div>
                      ))}
                    </div>
                    {selectedItem.description && (
                      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-sm font-semibold text-slate-600 mb-2">Description</p>
                        <p className="text-slate-900">{selectedItem.description}</p>
                      </div>
                    )}
                    <Button onClick={() => handleEditItem(selectedItem)} variant="primary" icon={<Edit2 size={18} />}>
                      Edit Item
                    </Button>
                  </div>
                )}

                {activeTab === 'stock' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Total Stock', value: selectedItem.current_stock, bg: theme.classes.bgPrimary, text: 'text-white' },
                        { label: 'Normal Stock', value: selectedItem.normal_stock, bg: 'bg-green-600', text: 'text-white' },
                        { label: 'Returned Stock', value: selectedItem.returned_stock, bg: 'bg-orange-600', text: 'text-white' }
                      ].map((stat, i) => (
                        <div key={i} className={`p-6 ${stat.bg} rounded-xl shadow-lg ${stat.text}`}>
                          <Package size={32} className="mb-3 opacity-80" />
                          <p className="text-4xl font-bold mb-1">{stat.value}</p>
                          <p className="text-sm opacity-90">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-6 bg-amber-50 rounded-xl border-2 border-amber-200">
                      <p className="text-sm text-amber-700 font-medium mb-2">Stock Value</p>
                      <p className="text-3xl font-bold text-amber-900">
                        ₹{(selectedItem.current_stock * selectedItem.retail_price).toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Batch Details */}
                    <div className="border-t border-slate-200 pt-6">
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Package size={20} />
                        Inventory Batches
                      </h4>
                      {loadingBatches ? (
                        <div className="py-8 text-center"><LoadingSpinner size="md" /></div>
                      ) : itemBatches.length === 0 ? (
                        <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-lg">
                          No active batches found
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {itemBatches.map((batch) => {
                            const purchaseRate = batch.purchase_price || batch.purchase_rate || 0;
                            const margin = selectedItem.retail_price - purchaseRate;
                            const marginPercent = purchaseRate > 0 ? (margin / purchaseRate) * 100 : 0;
                            const isExpiring = batch.expiry_date && new Date(batch.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                            const isExpired = batch.expiry_date && new Date(batch.expiry_date) < new Date();

                            return (
                              <div key={batch.id} className={`p-4 rounded-xl border-2 ${
                                isExpired ? 'bg-red-50 border-red-300' :
                                isExpiring ? 'bg-orange-50 border-orange-300' :
                                batch.status === 'returned' ? 'bg-orange-50 border-orange-300' :
                                'bg-slate-50 border-slate-200'
                              }`}>
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      {batch.batch_number && (
                                        <Badge variant="neutral" size="sm">Batch: {batch.batch_number}</Badge>
                                      )}
                                      <Badge variant={batch.status === 'returned' ? 'warning' : 'success'} size="sm">
                                        {batch.status}
                                      </Badge>
                                      {isExpired && <Badge variant="danger" size="sm">Expired</Badge>}
                                      {isExpiring && !isExpired && <Badge variant="warning" size="sm">Expiring Soon</Badge>}
                                    </div>
                                    {batch.notes && (
                                      <p className="text-xs text-slate-600 mt-1">{batch.notes}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-slate-900">{batch.quantity}</p>
                                    <p className="text-xs text-slate-500">{selectedItem.unit?.abbreviation}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  {batch.expiry_date && (
                                    <div>
                                      <p className="text-slate-500">Expiry Date</p>
                                      <p className={`font-semibold ${isExpired ? 'text-red-600' : isExpiring ? 'text-orange-600' : 'text-slate-900'}`}>
                                        {new Date(batch.expiry_date).toLocaleDateString()}
                                      </p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-slate-500">Purchase Rate</p>
                                    <p className="font-semibold text-slate-900">₹{purchaseRate.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500">Retail Price</p>
                                    <p className="font-semibold text-slate-900">₹{selectedItem.retail_price.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500">Margin</p>
                                    <p className={`font-semibold ${margin > 0 ? 'text-green-600' : margin < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                      ₹{margin.toFixed(2)} ({marginPercent > 0 ? '+' : ''}{marginPercent.toFixed(1)}%)
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {getStockBadge(selectedItem)}
                      {selectedItem.current_stock <= selectedItem.min_stock_level && (
                        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
                          <AlertTriangle size={18} />
                          <span className="text-sm font-medium">Below minimum stock level</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div>
                    {loadingHistory ? (
                      <div className="py-12 text-center"><LoadingSpinner size="md" /></div>
                    ) : transactions.length === 0 ? (
                      <EmptyState icon={<History size={48} />} title="No history yet" description="Transaction history will appear here" />
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((txn) => (
                          <div 
                            key={txn.id} 
                            className={`flex items-center justify-between p-5 rounded-xl border-l-4 ${
                              txn.type === 'sale' 
                                ? 'bg-red-50 border-red-500' 
                                : txn.type === 'purchase' 
                                ? 'bg-green-50 border-green-500' 
                                : 'bg-orange-50 border-orange-500'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-lg ${
                                txn.type === 'sale' ? 'bg-red-100 text-red-600' :
                                txn.type === 'purchase' ? 'bg-green-100 text-green-600' :
                                'bg-orange-100 text-orange-600'
                              }`}>
                                {txn.type === 'sale' ? <TrendingUp size={20} /> : <Package size={20} />}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{txn.reference}</p>
                                <p className="text-sm text-slate-600">{txn.notes}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-xl font-bold ${txn.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                              </p>
                              <p className="text-xs text-slate-500">{new Date(txn.date).toLocaleDateString('en-IN')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                          <AlertTriangle className="text-red-600" size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-red-900 text-lg mb-2">Delete Item</h4>
                          <p className="text-sm text-red-700 mb-4">Permanently remove this item. This cannot be undone.</p>
                          <Button onClick={() => handleDeleteClick(selectedItem.id, selectedItem.name)} variant="danger" size="sm" icon={<Trash2 size={16} />}>
                            Delete Item
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
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
            </Card>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={showDeleteConfirm} 
        onClose={() => { setShowDeleteConfirm(false); setDeletingItem(null); }} 
        onConfirm={handleDeleteConfirm} 
        title="Delete Item" 
        message={deletingItem ? `Are you sure you want to delete "${deletingItem.name}"? This will remove all records. This cannot be undone.` : ''} 
        confirmText="Delete" 
        cancelText="Cancel" 
        variant="danger" 
      />

      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
};

export default InventoryManagement;
