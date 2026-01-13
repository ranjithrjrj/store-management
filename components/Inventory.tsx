// FILE PATH: components/Inventory.tsx
// Inventory Overview with new UI components and theme support

'use client';
import React, { useState, useEffect } from 'react';
import { Package, Search, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { inventoryAPI } from '@/lib/supabase';
import { Button, Card, Input, Badge, EmptyState, LoadingSpinner, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type InventoryItem = {
  id: string;
  item_name: string;
  category_name: string;
  current_stock: number;
  min_stock_level: number;
  unit_name: string;
  unit_abbr: string;
  mrp: number;
  retail_price: number;
  wholesale_price: number;
  total_value: number;
};

const Inventory = () => {
  const { theme } = useTheme();
  const toast = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    categories: [] as string[],
    stockRange: { min: '', max: '' },
    valueRange: { min: '', max: '' }
  });
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'value'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryAPI.getAll();
      setItems(data || []);
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      setError(err.message || 'Failed to load inventory');
      toast.error('Failed to load', 'Could not load inventory. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock === 0) return 'out-of-stock';
    if (item.current_stock < item.min_stock_level) return 'low-stock';
    return 'in-stock';
  };

  const filteredItems = items.filter(item => {
    // Text search
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category_name.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const status = getStockStatus(item);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;

    // Category filter
    const matchesCategory = filters.categories.length === 0 || filters.categories.includes(item.category_name);

    // Stock range filter
    const matchesStockMin = !filters.stockRange.min || item.current_stock >= parseFloat(filters.stockRange.min);
    const matchesStockMax = !filters.stockRange.max || item.current_stock <= parseFloat(filters.stockRange.max);

    // Value range filter
    const matchesValueMin = !filters.valueRange.min || item.total_value >= parseFloat(filters.valueRange.min);
    const matchesValueMax = !filters.valueRange.max || item.total_value <= parseFloat(filters.valueRange.max);

    return matchesSearch && matchesStatus && matchesCategory && 
           matchesStockMin && matchesStockMax && matchesValueMin && matchesValueMax;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.item_name.localeCompare(b.item_name);
    } else if (sortBy === 'stock') {
      comparison = a.current_stock - b.current_stock;
    } else if (sortBy === 'value') {
      comparison = a.total_value - b.total_value;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const totalInventoryValue = filteredItems.reduce((sum, item) => sum + item.total_value, 0);
  const lowStockCount = items.filter(item => getStockStatus(item) === 'low-stock').length;
  const outOfStockCount = items.filter(item => getStockStatus(item) === 'out-of-stock').length;
  const uniqueCategories = [...new Set(items.map(item => item.category_name))];

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Overview</h2>
          <p className="text-gray-600 text-sm mt-1">Track your stock levels and inventory value</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <Package size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="font-bold text-red-800 mb-2">Failed to Load Inventory</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={loadInventory} variant="primary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Inventory Overview</h2>
        <p className="text-gray-600 text-sm mt-1">Track your stock levels and inventory value</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalInventoryValue.toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-lg ${theme.classes.bgPrimaryLight}`}>
              <DollarSign size={24} className={theme.classes.textPrimary} />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <Package size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-amber-900">{lowStockCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-100">
              <AlertTriangle size={24} className="text-amber-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-900">{outOfStockCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-100">
              <Package size={24} className="text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search, Filter & Status Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6">
          <Card padding="md">
            <Input
              leftIcon={<Search size={18} />}
              placeholder="Search items or categories..."
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
              {(filters.categories.length > 0 || filters.stockRange.min || filters.stockRange.max || 
                filters.valueRange.min || filters.valueRange.max) && (
                <Badge variant="primary" size="sm">Active</Badge>
              )}
            </div>
          </Button>
        </div>

        <div className="md:col-span-3">
          <div className="flex gap-2 h-full">
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? `${theme.classes.bgPrimary} text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('low-stock')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'low-stock'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Low
            </button>
            <button
              onClick={() => setFilterStatus('out-of-stock')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'out-of-stock'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Out
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <Card padding="none">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" text="Loading inventory..." />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={<Package size={64} />}
            title={searchTerm || filterStatus !== 'all' ? "No items found" : "No inventory yet"}
            description={
              searchTerm || filterStatus !== 'all'
                ? "Try adjusting your filters"
                : "Start by adding items and recording purchases"
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">MRP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{item.item_name}</div>
                            <div className="text-sm text-gray-500 md:hidden">{item.category_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {item.category_name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">
                            {item.current_stock} {item.unit_abbr}
                          </div>
                          <div className="text-xs text-gray-500">
                            Min: {item.min_stock_level}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 hidden lg:table-cell">
                        ₹{item.mrp}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 hidden lg:table-cell">
                        ₹{item.total_value.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            status === 'in-stock' ? 'success' :
                            status === 'low-stock' ? 'warning' : 'danger'
                          }
                          size="sm"
                        >
                          {status === 'in-stock' ? 'In Stock' :
                           status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Stats */}
      {!loading && items.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredItems.length} of {items.length} items • Total Value: ₹{totalInventoryValue.toLocaleString()}
        </div>
      )}

      {/* Filter & Sort Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Filter & Sort</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                      <option value="stock">Stock Level</option>
                      <option value="value">Inventory Value</option>
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
                  {uniqueCategories.map(category => (
                    <label key={category} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, categories: [...filters.categories, category]});
                          } else {
                            setFilters({...filters, categories: filters.categories.filter(c => c !== category)});
                          }
                        }}
                        className={`rounded ${theme.classes.textPrimary}`}
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </div>

              {/* Stock Range Filter */}
              <div className="pb-6 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Filter by Stock Range</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Min Stock"
                    type="number"
                    placeholder="0"
                    value={filters.stockRange.min}
                    onChange={(e) => setFilters({...filters, stockRange: {...filters.stockRange, min: e.target.value}})}
                  />
                  <Input
                    label="Max Stock"
                    type="number"
                    placeholder="No limit"
                    value={filters.stockRange.max}
                    onChange={(e) => setFilters({...filters, stockRange: {...filters.stockRange, max: e.target.value}})}
                  />
                </div>
              </div>

              {/* Stock Value Range Filter */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Filter by Stock Value Range</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Min Value (₹)"
                    type="number"
                    placeholder="0"
                    value={filters.valueRange.min}
                    onChange={(e) => setFilters({...filters, valueRange: {...filters.valueRange, min: e.target.value}})}
                    leftIcon={<DollarSign size={18} />}
                  />
                  <Input
                    label="Max Value (₹)"
                    type="number"
                    placeholder="No limit"
                    value={filters.valueRange.max}
                    onChange={(e) => setFilters({...filters, valueRange: {...filters.valueRange, max: e.target.value}})}
                    leftIcon={<DollarSign size={18} />}
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
                    stockRange: { min: '', max: '' },
                    valueRange: { min: '', max: '' }
                  });
                  setSortBy('name');
                  setSortOrder('asc');
                }}
                variant="secondary"
                fullWidth
              >
                Clear All
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
      )}
    </div>
  );
};

export default Inventory;