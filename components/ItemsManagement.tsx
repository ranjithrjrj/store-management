// FILE PATH: components/ItemsManagement.tsx
// Items Management with new UI components and theme support

'use client';
import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { itemsAPI, categoriesAPI, unitsAPI, supabase } from '@/lib/supabase';
import { Button, Card, Input, Badge, EmptyState, LoadingSpinner, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type Item = {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  unit_id: string;
  hsn_code: string;
  gst_rate: number;
  mrp: number;
  retail_price: number;
  wholesale_price: number;
  discount_percent: number;
  min_stock_level: number;
  is_active: boolean | string | null;
  category?: { id: string; name: string };
  unit?: { id: string; name: string; abbreviation: string };
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

const ItemsManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);
  const [itemTransactions, setItemTransactions] = useState<{
    purchases: any[];
    sales: any[];
    loading: boolean;
  }>({ purchases: [], sales: [], loading: false });
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Filter & Sort states
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: { min: '', max: '' },
    gstRates: [] as number[]
  });
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'gst'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    unit_id: '',
    hsn_code: '',
    gst_rate: 18,
    mrp: 0,
    retail_price: 0,
    wholesale_price: 0,
    discount_percent: 0,
    min_stock_level: 0,
    is_active: true
  });

  // Helper to normalize is_active from database
  const normalizeBoolean = (value: boolean | string | null): boolean => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return true; // Default to true if null or undefined
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [itemsData, categoriesData, unitsData] = await Promise.all([
        itemsAPI.getAll(),
        categoriesAPI.getAll(),
        unitsAPI.getAll()
      ]);
      setItems(itemsData || []);
      setCategories(categoriesData || []);
      setUnits(unitsData || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
      toast.error('Failed to load', 'Could not load items. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      category_id: '',
      unit_id: '',
      hsn_code: '',
      gst_rate: 18,
      mrp: 0,
      retail_price: 0,
      wholesale_price: 0,
      discount_percent: 0,
      min_stock_level: 0,
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category_id: item.category_id,
      unit_id: item.unit_id,
      hsn_code: item.hsn_code,
      gst_rate: item.gst_rate,
      mrp: item.mrp,
      retail_price: item.retail_price,
      wholesale_price: item.wholesale_price,
      discount_percent: item.discount_percent,
      min_stock_level: item.min_stock_level,
      is_active: normalizeBoolean(item.is_active)
    });
    setShowModal(true);
    setOpenDropdown(null);
  };

  const handleView = async (item: Item) => {
    setViewingItem(item);
    setShowViewModal(true);
    setOpenDropdown(null);
    
    // Load transaction history
    setItemTransactions({ purchases: [], sales: [], loading: true });
    
    try {
      // Get purchase history
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchase_order_items')
        .select(`
          *,
          purchase_order:purchase_orders(
            po_date,
            po_number,
            vendor:vendors(name)
          )
        `)
        .eq('item_id', item.id)
        .order('created_at', { ascending: false });

      if (purchaseError) throw purchaseError;

      // Get sales history
      const { data: sales, error: salesError } = await supabase
        .from('sales_invoice_items')
        .select(`
          *,
          sales_invoice:sales_invoices(
            invoice_date,
            invoice_number,
            customer:customers(name)
          )
        `)
        .eq('item_id', item.id)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      setItemTransactions({
        purchases: purchases || [],
        sales: sales || [],
        loading: false
      });
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      toast.error('Failed to load', 'Could not load transaction history.');
      setItemTransactions({ purchases: [], sales: [], loading: false });
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeletingItem({ id, name });
    setShowDeleteConfirm(true);
    setOpenDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      await itemsAPI.delete(deletingItem.id);
      await loadData();
      toast.success('Deleted', `Item "${deletingItem.name}" has been removed.`);
      setShowDeleteConfirm(false);
      setDeletingItem(null);
    } catch (err: any) {
      console.error('Error deleting item:', err);
      toast.error('Failed to delete', err.message || 'Could not delete item.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.warning('Name required', 'Please enter item name.');
      return;
    }

    if (!formData.category_id) {
      toast.warning('Category required', 'Please select a category.');
      return;
    }

    if (!formData.unit_id) {
      toast.warning('Unit required', 'Please select a unit.');
      return;
    }

    // Show confirmation dialog
    setShowEditConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowEditConfirm(false);
    try {
      setSaving(true);
      setError(null);

      if (editingItem) {
        await itemsAPI.update(editingItem.id, formData as any);
        toast.success('Updated!', `Item "${formData.name}" has been updated.`);
      } else {
        await itemsAPI.create(formData as any);
        toast.success('Created!', `Item "${formData.name}" has been added.`);
      }

      await loadData();
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving item:', err);
      toast.error('Failed to save', err.message || 'Could not save item.');
    } finally {
      setSaving(false);
    }
  };


  const filteredItems = items.filter(item => {
    // Text search
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hsn_code.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    const matchesCategory = filters.categories.length === 0 || 
      (item.category?.id && filters.categories.includes(item.category.id));

    // Price range filter
    const matchesPriceMin = !filters.priceRange.min || item.retail_price >= parseFloat(filters.priceRange.min);
    const matchesPriceMax = !filters.priceRange.max || item.retail_price <= parseFloat(filters.priceRange.max);

    // GST rate filter
    const matchesGst = filters.gstRates.length === 0 || filters.gstRates.includes(item.gst_rate);

    return matchesSearch && matchesCategory && matchesPriceMin && matchesPriceMax && matchesGst;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'price') {
      comparison = a.retail_price - b.retail_price;
    } else if (sortBy === 'gst') {
      comparison = a.gst_rate - b.gst_rate;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const gstRateOptions = [0, 5, 12, 18, 28];

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Items Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage your inventory items</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <Package size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="font-bold text-red-800 mb-2">Failed to Load Items</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={loadData} variant="primary">Try Again</Button>
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
          <h2 className="text-2xl font-bold text-gray-900">Items Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage your inventory items</p>
        </div>
        <Button onClick={handleAddNew} variant="primary" size="md" icon={<Plus size={18} />}>
          Add Item
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-9">
          <Card padding="md">
            <Input
              leftIcon={<Search size={18} />}
              placeholder="Search items by name or HSN code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Card>
        </div>

        <div className="md:col-span-3">
          <Button
            onClick={() => setShowFilterModal(true)}
            variant="secondary"
            size="md"
            fullWidth
            className="h-full"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter & Sort
              {(filters.categories.length > 0 || filters.priceRange.min || filters.priceRange.max || filters.gstRates.length > 0) && (
                <Badge variant="primary" size="sm">Active</Badge>
              )}
            </div>
          </Button>
        </div>
      </div>

      {/* Items Table */}
      <Card padding="none">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" text="Loading items..." />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={<Package size={64} />}
            title={searchTerm ? "No items found" : "No items yet"}
            description={
              searchTerm
                ? "Try adjusting your search terms"
                : "Get started by adding your first item"
            }
            action={
              !searchTerm && (
                <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                  Add Your First Item
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">HSN</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">GST %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Retail</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Wholesale</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500 md:hidden">
                            {item.category?.name || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                      {item.category?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{item.hsn_code}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="primary" size="sm">
                        {item.gst_rate}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{item.mrp}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">₹{item.retail_price}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">₹{item.wholesale_price}</td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                          className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {openDropdown === item.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdown(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                onClick={() => handleView(item)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Details
                              </button>
                              <button
                                onClick={() => handleEdit(item)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit2 size={16} />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClick(item.id, item.name)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Stats */}
      {!loading && items.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredItems.length} of {items.length} items
        </div>
      )}

      {/* Filter & Sort Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Filter & Sort</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Sort Section */}
              <div className="pb-6 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Sort By</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Field</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
                    >
                      <option value="name">Item Name</option>
                      <option value="price">Price</option>
                      <option value="gst">GST Rate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
                    >
                      <option value="asc">A-Z / Low to High</option>
                      <option value="desc">Z-A / High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <div className="pb-6 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Filter by Category</h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {categories.map(category => (
                    <label key={category.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, categories: [...filters.categories, category.id]});
                          } else {
                            setFilters({...filters, categories: filters.categories.filter(c => c !== category.id)});
                          }
                        }}
                        className={`rounded ${theme.classes.textPrimary}`}
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* GST Rate Filter */}
              <div className="pb-6 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Filter by GST Rate</h4>
                <div className="flex flex-wrap gap-2">
                  {gstRateOptions.map(rate => (
                    <label key={rate} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.gstRates.includes(rate)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, gstRates: [...filters.gstRates, rate]});
                          } else {
                            setFilters({...filters, gstRates: filters.gstRates.filter(r => r !== rate)});
                          }
                        }}
                        className={`rounded ${theme.classes.textPrimary}`}
                      />
                      {rate}%
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Filter by Price Range</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Min Price (₹)"
                    type="number"
                    placeholder="0"
                    value={filters.priceRange.min}
                    onChange={(e) => setFilters({...filters, priceRange: {...filters.priceRange, min: e.target.value}})}
                  />
                  <Input
                    label="Max Price (₹)"
                    type="number"
                    placeholder="No limit"
                    value={filters.priceRange.max}
                    onChange={(e) => setFilters({...filters, priceRange: {...filters.priceRange, max: e.target.value}})}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                onClick={() => {
                  setFilters({
                    categories: [],
                    priceRange: { min: '', max: '' },
                    gstRates: []
                  });
                  setSortBy('name');
                  setSortOrder('asc');
                }}
                variant="secondary"
                fullWidth
              >
                Clear All
              </Button>
              <Button onClick={() => setShowFilterModal(false)} variant="primary" fullWidth>
                Apply Filters
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Add/Edit Modal - Continue in next part due to length */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="w-full max-w-3xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="space-y-4">
                  <Input
                    label="Item Name"
                    placeholder="Enter item name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
                      placeholder="Optional description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.unit_id}
                        onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
                      >
                        <option value="">Select unit</option>
                        {units.map(unit => (
                          <option key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Info */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Tax Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="HSN Code"
                    placeholder="Enter HSN code"
                    value={formData.hsn_code}
                    onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                    <select
                      value={formData.gst_rate}
                      onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) })}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
                    >
                      {gstRateOptions.map(rate => (
                        <option key={rate} value={rate}>{rate}%</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Pricing & Stock</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Input
                    label="MRP (₹)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.mrp || ''}
                    onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                  />

                  <Input
                    label="Retail Price (₹)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.retail_price || ''}
                    onChange={(e) => setFormData({ ...formData, retail_price: parseFloat(e.target.value) || 0 })}
                  />

                  <Input
                    label="Wholesale Price (₹)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.wholesale_price || ''}
                    onChange={(e) => setFormData({ ...formData, wholesale_price: parseFloat(e.target.value) || 0 })}
                  />

                  <Input
                    label="Discount (%)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.discount_percent || ''}
                    onChange={(e) => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0 })}
                  />

                  <Input
                    label="Min Stock Level"
                    type="number"
                    placeholder="0"
                    value={formData.min_stock_level || ''}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="pt-6 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={normalizeBoolean(formData.is_active)}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className={`rounded ${theme.classes.textPrimary}`}
                  />
                  <span className="text-sm font-medium text-gray-700">Active Item</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowModal(false)} variant="secondary" fullWidth disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} variant="primary" fullWidth loading={saving}>
                {editingItem ? 'Update Item' : 'Create Item'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Item Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Basic Information</h4>
                  <Badge variant={normalizeBoolean(viewingItem.is_active) ? 'success' : 'neutral'}>
                    {normalizeBoolean(viewingItem.is_active) ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Item Name</p>
                    <p className="font-medium text-gray-900 mt-1">{viewingItem.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Category</p>
                    <p className="font-medium text-gray-900 mt-1">{viewingItem.category?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Unit</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {viewingItem.unit?.name} ({viewingItem.unit?.abbreviation})
                    </p>
                  </div>
                  {viewingItem.description && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Description</p>
                      <p className="font-medium text-gray-900 mt-1">{viewingItem.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tax Info */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Tax Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">HSN Code</p>
                    <p className="font-medium text-gray-900 mt-1">{viewingItem.hsn_code || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">GST Rate</p>
                    <p className="font-medium text-gray-900 mt-1">{viewingItem.gst_rate}%</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Pricing</h4>
                <div className="grid grid-cols-3 gap-4">
                  <Card padding="sm" className="bg-gray-50">
                    <p className="text-xs text-gray-600 mb-1">MRP</p>
                    <p className="text-lg font-bold text-gray-900">₹{viewingItem.mrp}</p>
                  </Card>
                  <Card padding="sm" className="bg-gray-50">
                    <p className="text-xs text-gray-600 mb-1">Retail Price</p>
                    <p className="text-lg font-bold text-gray-900">₹{viewingItem.retail_price}</p>
                  </Card>
                  <Card padding="sm" className="bg-gray-50">
                    <p className="text-xs text-gray-600 mb-1">Wholesale Price</p>
                    <p className="text-lg font-bold text-gray-900">₹{viewingItem.wholesale_price}</p>
                  </Card>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Discount</p>
                    <p className="font-medium text-gray-900 mt-1">{viewingItem.discount_percent}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Min Stock Level</p>
                    <p className="font-medium text-gray-900 mt-1">{viewingItem.min_stock_level}</p>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Transaction History</h4>
                
                {itemTransactions.loading ? (
                  <div className="py-8">
                    <LoadingSpinner size="md" text="Loading transactions..." />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Purchases */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-semibold text-gray-900">Purchases</h5>
                        <Badge variant="primary" size="sm">{itemTransactions.purchases.length}</Badge>
                      </div>
                      {itemTransactions.purchases.length === 0 ? (
                        <p className="text-sm text-gray-500 italic py-4 text-center bg-gray-50 rounded-lg">
                          No purchase history
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {itemTransactions.purchases.map((purchase, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg text-sm">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900">
                                    {purchase.purchase_order?.vendor?.name || 'Unknown Vendor'}
                                  </span>
                                  <Badge variant="neutral" size="sm">
                                    {purchase.purchase_order?.po_number || 'N/A'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600">
                                  {new Date(purchase.purchase_order?.po_date).toLocaleDateString()} • 
                                  Qty: {purchase.quantity} @ ₹{purchase.unit_price}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">₹{purchase.total_price}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sales */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-semibold text-gray-900">Sales</h5>
                        <Badge variant="success" size="sm">{itemTransactions.sales.length}</Badge>
                      </div>
                      {itemTransactions.sales.length === 0 ? (
                        <p className="text-sm text-gray-500 italic py-4 text-center bg-gray-50 rounded-lg">
                          No sales history
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {itemTransactions.sales.map((sale, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg text-sm">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900">
                                    {sale.sales_invoice?.customer?.name || 'Walk-in Customer'}
                                  </span>
                                  <Badge variant="neutral" size="sm">
                                    {sale.sales_invoice?.invoice_number || 'N/A'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600">
                                  {new Date(sale.sales_invoice?.invoice_date).toLocaleDateString()} • 
                                  Qty: {sale.quantity} @ ₹{sale.unit_price}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">₹{sale.total_price}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Total Purchased</p>
                        <p className="text-lg font-bold text-blue-900">
                          {itemTransactions.purchases.reduce((sum, p) => sum + p.quantity, 0)} units
                        </p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Total Sold</p>
                        <p className="text-lg font-bold text-green-900">
                          {itemTransactions.sales.reduce((sum, s) => sum + s.quantity, 0)} units
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="pt-6 border-t border-gray-200 flex gap-3">
                <Button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingItem);
                  }}
                  variant="primary"
                  fullWidth
                  icon={<Edit2 size={18} />}
                >
                  Edit Item
                </Button>
                <Button
                  onClick={() => {
                    setShowViewModal(false);
                    handleDeleteClick(viewingItem.id, viewingItem.name);
                  }}
                  variant="danger"
                  fullWidth
                  icon={<Trash2 size={18} />}
                >
                  Delete Item
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Confirmation */}
      {showEditConfirm && (
        <ConfirmDialog
          isOpen={showEditConfirm}
          onClose={() => setShowEditConfirm(false)}
          onConfirm={handleConfirmSubmit}
          title={editingItem ? 'Update Item' : 'Create Item'}
          message={editingItem 
            ? `Save changes to "${formData.name}"?` 
            : `Create new item "${formData.name}"?`}
          confirmText={editingItem ? 'Update' : 'Create'}
          cancelText="Cancel"
          variant="primary"
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingItem && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Item</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">"{deletingItem.name}"</span>? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingItem(null);
                  }}
                  variant="secondary"
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  variant="danger"
                  fullWidth
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ItemsManagement;
