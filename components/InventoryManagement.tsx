// FILE PATH: components/InventoryManagement.tsx
// Unified Inventory & Items Management - Single page with comprehensive item modal

'use client';
import React, { useState, useEffect } from 'react';
import { 
  Package, Search, AlertTriangle, TrendingUp, DollarSign, X, Filter, 
  Plus, Edit2, Trash2, History, Settings, Info, BarChart3, Image as ImageIcon
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
  image_url?: string;
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

type Category = {
  id: string;
  name: string;
};

type Unit = {
  id: string;
  name: string;
  abbreviation: string;
};

const InventoryManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  // Data states
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'has-returns'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'stock' | 'history' | 'settings'>('details');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Form data
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
      
      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      // Load units
      const { data: unitsData } = await supabase
        .from('units')
        .select('*')
        .order('name');
      
      // Load items with inventory
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          *,
          category:categories(id, name),
          unit:units(id, name, abbreviation)
        `)
        .order('name');

      if (itemsError) throw itemsError;

      // Calculate stock for each item
      const itemsWithStock = await Promise.all((itemsData || []).map(async (item) => {
        // Get normal stock
        const { data: normalStock } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('item_id', item.id)
          .eq('is_returned', false)
          .single();

        // Get returned stock
        const { data: returnedStock } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('item_id', item.id)
          .eq('is_returned', true)
          .single();

        const normal = normalStock?.quantity || 0;
        const returned = returnedStock?.quantity || 0;

        return {
          ...item,
          normal_stock: normal,
          returned_stock: returned,
          current_stock: normal + returned
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

      // Load sales
      const { data: sales } = await supabase
        .from('sales_invoice_items')
        .select(`
          quantity,
          sales_invoice:sales_invoices(invoice_number, invoice_date)
        `)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (sales) {
        sales.forEach((sale: any) => {
          transactions.push({
            id: `sale-${sale.sales_invoice?.invoice_number}`,
            type: 'sale',
            quantity: -sale.quantity,
            date: sale.sales_invoice?.invoice_date || '',
            reference: sale.sales_invoice?.invoice_number || '',
            notes: 'Sale'
          });
        });
      }

      // Load purchases
      const { data: purchases } = await supabase
        .from('purchase_invoice_items')
        .select(`
          quantity,
          purchase_invoice:purchase_invoices(invoice_number, invoice_date)
        `)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (purchases) {
        purchases.forEach((purchase: any) => {
          transactions.push({
            id: `purchase-${purchase.purchase_invoice?.invoice_number}`,
            type: 'purchase',
            quantity: purchase.quantity,
            date: purchase.purchase_invoice?.invoice_date || '',
            reference: purchase.purchase_invoice?.invoice_number || '',
            notes: 'Purchase'
          });
        });
      }

      // Load returns
      const { data: returns } = await supabase
        .from('return_items')
        .select(`
          quantity,
          return:returns(return_number, return_date)
        `)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false})
        .limit(50);

      if (returns) {
        returns.forEach((ret: any) => {
          transactions.push({
            id: `return-${ret.return?.return_number}`,
            type: 'return',
            quantity: ret.quantity,
            date: ret.return?.return_date || '',
            reference: ret.return?.return_number || '',
            notes: 'Customer Return'
          });
        });
      }

      // Sort by date
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
    setFormData({
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
    setShowAddModal(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku || '',
      barcode: item.barcode || '',
      category_id: item.category_id || '',
      unit_id: item.unit_id || '',
      description: item.description || '',
      mrp: item.mrp,
      retail_price: item.retail_price,
      wholesale_price: item.wholesale_price,
      gst_rate: item.gst_rate,
      min_stock_level: item.min_stock_level,
      max_stock_level: item.max_stock_level || 0,
      is_active: item.is_active
    });
    setShowItemModal(false);
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      if (!formData.name.trim()) {
        toast.warning('Name required', 'Please enter item name.');
        return;
      }

      if (editingItem) {
        const { error } = await supabase
          .from('items')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Updated!', `Item "${formData.name}" has been updated.`);
      } else {
        const { error } = await supabase
          .from('items')
          .insert(formData);

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

  const handleDeleteClick = (id: string, name: string) => {
    setDeletingItem({ id, name });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', deletingItem.id);

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
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.barcode || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const status = getStockStatus(item);
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'has-returns' ? item.returned_stock > 0 : status === filterStatus);
      
      const matchesCategory = filterCategory === 'all' || item.category_id === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      if (sortBy === 'name') {
        aVal = a.name;
        bVal = b.name;
      } else if (sortBy === 'stock') {
        aVal = a.current_stock;
        bVal = b.current_stock;
      } else {
        aVal = a.current_stock * a.retail_price;
        bVal = b.current_stock * b.retail_price;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
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
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory & Items</h2>
          <p className="text-gray-600 text-sm mt-1">Manage inventory and item details</p>
        </div>
        <Card>
          <div className="py-12">
            <LoadingSpinner size="lg" text="Loading inventory..." />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory & Items</h2>
          <p className="text-gray-600 text-sm mt-1">Unified inventory and item management</p>
        </div>
        <Button onClick={handleAddNew} variant="primary" size="md" icon={<Plus size={18} />}>
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <Package className="mx-auto mb-2 text-blue-600" size={24} />
            <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            <p className="text-xs text-gray-600">Total Items</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <DollarSign className="mx-auto mb-2 text-green-600" size={24} />
            <p className="text-2xl font-bold text-gray-900">₹{(stats.totalValue / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-600">Total Value</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-2 text-orange-600" size={24} />
            <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
            <p className="text-xs text-gray-600">Low Stock</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <X className="mx-auto mb-2 text-red-600" size={24} />
            <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
            <p className="text-xs text-gray-600">Out of Stock</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <TrendingUp className="mx-auto mb-2 text-purple-600" size={24} />
            <p className="text-2xl font-bold text-gray-900">{stats.returns}</p>
            <p className="text-xs text-gray-600">Has Returns</p>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
              rightIcon={searchTerm ? (
                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              ) : undefined}
            />
          </div>
          
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="md:w-48"
          >
            <option value="all">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="has-returns">Has Returns</option>
          </Select>

          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="md:w-48"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </Select>
          
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="md:w-40"
          >
            <option value="name">Sort by Name</option>
            <option value="stock">Sort by Stock</option>
            <option value="value">Sort by Value</option>
          </Select>
          
          <Button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            variant="secondary"
            size="md"
          >
            {sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A'}
          </Button>
        </div>
      </Card>

      {/* Items Table */}
      <Card padding="none">
        {filteredItems.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Package size={48} />}
              title={searchTerm || filterStatus !== 'all' ? "No items found" : "No items yet"}
              description={
                searchTerm || filterStatus !== 'all'
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first item"
              }
              action={
                searchTerm || filterStatus !== 'all' ? (
                  <Button onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterCategory('all'); }} variant="secondary">
                    Clear Filters
                  </Button>
                ) : (
                  <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                    Add Your First Item
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prices</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleViewItem(item)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        {item.sku && (
                          <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral" size="sm">{item.category?.name || 'Uncategorized'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.current_stock} {item.unit?.abbreviation || ''}
                        </p>
                        {item.returned_stock > 0 && (
                          <p className="text-xs text-orange-600">+{item.returned_stock} returns</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <p className="text-gray-600">MRP: ₹{item.mrp}</p>
                        <p className="text-gray-900 font-medium">Retail: ₹{item.retail_price}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.gst_rate}%</td>
                    <td className="px-4 py-3">{getStockBadge(item)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewItem(item)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Info size={16} />
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className={`${theme.classes.textPrimary} hover:${theme.classes.bgPrimaryLight} p-2 rounded-lg transition-colors`}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Summary Footer */}
      {filteredItems.length > 0 && (
        <div className="text-sm text-gray-600 text-right">
          Showing {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} • Total Value: ₹{stats.totalValue.toLocaleString('en-IN')}
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600" disabled={saving}>
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Item Name"
                    placeholder="e.g., Product Name"
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

                  <Input
                    label="Barcode"
                    placeholder="e.g., 123456789"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />

                  <Select
                    label="Category"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Select>

                  <Select
                    label="Unit"
                    value={formData.unit_id}
                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                  >
                    <option value="">Select unit</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</option>
                    ))}
                  </Select>

                  <Input
                    label="MRP"
                    type="number"
                    step="0.01"
                    value={formData.mrp || ''}
                    onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                    required
                  />

                  <Input
                    label="Retail Price"
                    type="number"
                    step="0.01"
                    value={formData.retail_price || ''}
                    onChange={(e) => setFormData({ ...formData, retail_price: parseFloat(e.target.value) || 0 })}
                    required
                  />

                  <Input
                    label="Wholesale Price"
                    type="number"
                    step="0.01"
                    value={formData.wholesale_price || ''}
                    onChange={(e) => setFormData({ ...formData, wholesale_price: parseFloat(e.target.value) || 0 })}
                    required
                  />

                  <Input
                    label="GST Rate (%)"
                    type="number"
                    value={formData.gst_rate || ''}
                    onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) || 0 })}
                    required
                  />

                  <Input
                    label="Min Stock Level"
                    type="number"
                    value={formData.min_stock_level || ''}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: parseFloat(e.target.value) || 0 })}
                    required
                  />

                  <Input
                    label="Max Stock Level"
                    type="number"
                    value={formData.max_stock_level || ''}
                    onChange={(e) => setFormData({ ...formData, max_stock_level: parseFloat(e.target.value) || 0 })}
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-700">Active Item</label>
                  </div>
                </div>

                <Textarea
                  label="Description"
                  placeholder="Product description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <Button onClick={() => setShowAddModal(false)} variant="secondary" fullWidth disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} variant="primary" fullWidth disabled={saving}>
                  {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Item Detail Modal with Tabs */}
      {showItemModal && selectedItem && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h3>
                  <p className="text-sm text-gray-600">{selectedItem.category?.name || 'Uncategorized'}</p>
                </div>
                <button onClick={() => setShowItemModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'details'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Info size={16} className="inline mr-2" />
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('stock')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'stock'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Package size={16} className="inline mr-2" />
                  Stock
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'history'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <History size={16} className="inline mr-2" />
                  History
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'settings'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Settings size={16} className="inline mr-2" />
                  Settings
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">SKU</p>
                        <p className="font-medium text-gray-900">{selectedItem.sku || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Barcode</p>
                        <p className="font-medium text-gray-900">{selectedItem.barcode || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Unit</p>
                        <p className="font-medium text-gray-900">{selectedItem.unit?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">MRP</p>
                        <p className="font-medium text-gray-900">₹{selectedItem.mrp}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Retail Price</p>
                        <p className="font-medium text-gray-900">₹{selectedItem.retail_price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Wholesale Price</p>
                        <p className="font-medium text-gray-900">₹{selectedItem.wholesale_price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">GST Rate</p>
                        <p className="font-medium text-gray-900">{selectedItem.gst_rate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Min Stock</p>
                        <p className="font-medium text-gray-900">{selectedItem.min_stock_level}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <Badge variant={selectedItem.is_active ? 'success' : 'danger'}>
                          {selectedItem.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    {selectedItem.description && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Description</p>
                        <p className="text-gray-900">{selectedItem.description}</p>
                      </div>
                    )}
                    <div className="pt-4 border-t">
                      <Button onClick={() => handleEditItem(selectedItem)} variant="primary" icon={<Edit2 size={18} />}>
                        Edit Item
                      </Button>
                    </div>
                  </div>
                )}

                {/* Stock Tab */}
                {activeTab === 'stock' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <div className="text-center">
                          <Package className="mx-auto mb-2 text-blue-600" size={32} />
                          <p className="text-3xl font-bold text-gray-900">{selectedItem.current_stock}</p>
                          <p className="text-sm text-gray-600">Total Stock</p>
                        </div>
                      </Card>
                      <Card>
                        <div className="text-center">
                          <Package className="mx-auto mb-2 text-green-600" size={32} />
                          <p className="text-3xl font-bold text-gray-900">{selectedItem.normal_stock}</p>
                          <p className="text-sm text-gray-600">Normal Stock</p>
                        </div>
                      </Card>
                      <Card>
                        <div className="text-center">
                          <Package className="mx-auto mb-2 text-orange-600" size={32} />
                          <p className="text-3xl font-bold text-gray-900">{selectedItem.returned_stock}</p>
                          <p className="text-sm text-gray-600">Returned Stock</p>
                        </div>
                      </Card>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Stock Value</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{(selectedItem.current_stock * selectedItem.retail_price).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      {getStockBadge(selectedItem)}
                      {selectedItem.current_stock <= selectedItem.min_stock_level && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertTriangle size={18} />
                          <span className="text-sm">Below minimum stock level</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div>
                    {loadingHistory ? (
                      <div className="py-12">
                        <LoadingSpinner size="md" text="Loading history..." />
                      </div>
                    ) : transactions.length === 0 ? (
                      <EmptyState
                        icon={<History size={48} />}
                        title="No transactions yet"
                        description="Transaction history will appear here"
                      />
                    ) : (
                      <div className="space-y-2">
                        {transactions.map((txn) => (
                          <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-lg ${
                                txn.type === 'sale' ? 'bg-red-100 text-red-600' :
                                txn.type === 'purchase' ? 'bg-green-100 text-green-600' :
                                'bg-orange-100 text-orange-600'
                              }`}>
                                {txn.type === 'sale' ? <TrendingUp size={20} /> : <Package size={20} />}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{txn.reference}</p>
                                <p className="text-sm text-gray-600">{txn.notes}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${txn.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                              </p>
                              <p className="text-xs text-gray-500">{new Date(txn.date).toLocaleDateString('en-IN')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
                        <div>
                          <h4 className="font-medium text-yellow-900 mb-1">Delete Item</h4>
                          <p className="text-sm text-yellow-700 mb-3">
                            Deleting this item will remove all stock records and transaction history. This action cannot be undone.
                          </p>
                          <Button
                            onClick={() => handleDeleteClick(selectedItem.id, selectedItem.name)}
                            variant="danger"
                            size="sm"
                            icon={<Trash2 size={16} />}
                          >
                            Delete Item
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Item Information</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Created: {new Date(selectedItem.created_at).toLocaleString('en-IN')}</p>
                        <p>Last Updated: {new Date(selectedItem.updated_at).toLocaleString('en-IN')}</p>
                        <p>Item ID: {selectedItem.id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingItem(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Item"
        message={deletingItem ? `Are you sure you want to delete "${deletingItem.name}"? This will remove all stock records and transaction history. This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default InventoryManagement;
