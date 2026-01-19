// FILE PATH: components/Inventory.tsx
// Inventory Overview with returned stock tracking, fixed filters and theme support

'use client';
import React, { useState, useEffect } from 'react';
import { Package, Search, AlertTriangle, TrendingUp, DollarSign, X, Filter, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Badge, EmptyState, LoadingSpinner, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type InventoryItem = {
  id: string;
  item_name: string;
  category_name: string;
  normal_stock: number;
  returned_stock: number;
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'has-returns'>('all');
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

      // Get all items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          id,
          name,
          min_stock_level,
          mrp,
          retail_price,
          wholesale_price,
          category:categories(name),
          unit:units(name, abbreviation)
        `)
        .eq('is_active', true);
      
      if (itemsError) throw itemsError;

      // Get inventory batches with status
      const { data: batches, error: batchError } = await supabase
        .from('inventory_batches')
        .select('item_id, quantity, status')
        .gt('quantity', 0);
      
      if (batchError) throw batchError;

      // Aggregate stock by item and status
      const stockByItem: Record<string, { normal: number; returned: number }> = {};
      
      batches?.forEach(batch => {
        if (!stockByItem[batch.item_id]) {
          stockByItem[batch.item_id] = { normal: 0, returned: 0 };
        }
        
        if (batch.status === 'returned') {
          stockByItem[batch.item_id].returned += batch.quantity;
        } else {
          // null or 'normal' or any other status counts as normal
          stockByItem[batch.item_id].normal += batch.quantity;
        }
      });

      // Combine data
      const inventoryItems = itemsData?.map(item => {
        const category = item.category as any;
        const unit = item.unit as any;
        const stock = stockByItem[item.id] || { normal: 0, returned: 0 };
        const totalStock = stock.normal + stock.returned;
        
        return {
          id: item.id,
          item_name: item.name,
          category_name: category?.name || 'Uncategorized',
          normal_stock: stock.normal,
          returned_stock: stock.returned,
          current_stock: totalStock,
          min_stock_level: item.min_stock_level || 0,
          unit_name: unit?.name || 'Unit',
          unit_abbr: unit?.abbreviation || 'U',
          mrp: item.mrp || 0,
          retail_price: item.retail_price || 0,
          wholesale_price: item.wholesale_price || 0,
          total_value: totalStock * (item.retail_price || 0)
        };
      }) || [];

      setItems(inventoryItems);
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
    let matchesStatus = true;
    
    if (filterStatus === 'has-returns') {
      matchesStatus = item.returned_stock > 0;
    } else if (filterStatus !== 'all') {
      matchesStatus = status === filterStatus;
    }

    // Category filter
    const matchesCategory = filters.categories.length === 0 || 
      filters.categories.includes(item.category_name);

    // Stock range filter
    const stockMin = filters.stockRange.min ? parseFloat(filters.stockRange.min) : null;
    const stockMax = filters.stockRange.max ? parseFloat(filters.stockRange.max) : null;
    const matchesStockMin = stockMin === null || item.current_stock >= stockMin;
    const matchesStockMax = stockMax === null || item.current_stock <= stockMax;

    // Value range filter
    const valueMin = filters.valueRange.min ? parseFloat(filters.valueRange.min) : null;
    const valueMax = filters.valueRange.max ? parseFloat(filters.valueRange.max) : null;
    const matchesValueMin = valueMin === null || item.total_value >= valueMin;
    const matchesValueMax = valueMax === null || item.total_value <= valueMax;

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
  const returnedItemsCount = items.filter(item => item.returned_stock > 0).length;
  const totalReturnedStock = items.reduce((sum, item) => sum + item.returned_stock, 0);
  const uniqueCategories = [...new Set(items.map(item => item.category_name))].sort();

  const clearFilters = () => {
    setFilters({
      categories: [],
      stockRange: { min: '', max: '' },
      valueRange: { min: '', max: '' }
    });
    setSortBy('name');
    setSortOrder('asc');
  };

  const hasActiveFilters = filters.categories.length > 0 || 
    filters.stockRange.min || filters.stockRange.max || 
    filters.valueRange.min || filters.valueRange.max;

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventory Overview</h2>
          <p className="text-slate-600 text-sm mt-1">Track your stock levels and inventory value</p>
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 ${theme.classes.bgPrimaryLight} rounded-xl`}>
              <Package className={theme.classes.textPrimary} size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Inventory Overview</h1>
              <p className="text-slate-600 text-sm mt-0.5">Track stock levels, returned items, and inventory value</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Value</p>
                <p className={`text-2xl font-bold ${theme.classes.textPrimary} mt-1`}>
                  ₹{totalInventoryValue.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 ${theme.classes.bgPrimaryLight} rounded-xl`}>
                <DollarSign className={theme.classes.textPrimary} size={24} />
              </div>
            </div>
          </Card>

          <Card padding="md" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Low Stock</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{lowStockCount}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertTriangle className="text-amber-600" size={24} />
              </div>
            </div>
          </Card>

          <Card padding="md" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{outOfStockCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <Package className="text-red-600" size={24} />
              </div>
            </div>
          </Card>

          <Card padding="md" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Returned Items</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{returnedItemsCount}</p>
                <p className="text-xs text-slate-500 mt-0.5">{totalReturnedStock} units</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <RotateCcw className="text-orange-600" size={24} />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card padding="md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              leftIcon={<Search size={18} />}
              placeholder="Search items or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                {hasActiveFilters && (
                  <Badge variant="primary" size="sm" className="ml-2">Active</Badge>
                )}
              </Button>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  setSortBy(sort as 'name' | 'stock' | 'value');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="flex-1"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="stock-desc">Stock (High to Low)</option>
                <option value="stock-asc">Stock (Low to High)</option>
                <option value="value-desc">Value (High to Low)</option>
                <option value="value-asc">Value (Low to High)</option>
              </Select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === 'all'
                  ? `${theme.classes.bgPrimary} text-white shadow-md`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilterStatus('in-stock')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === 'in-stock'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setFilterStatus('low-stock')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === 'low-stock'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              onClick={() => setFilterStatus('out-of-stock')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === 'out-of-stock'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
            <button
              onClick={() => setFilterStatus('has-returns')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === 'has-returns'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Has Returns ({returnedItemsCount})
            </button>
          </div>
        </Card>

        {/* Inventory Table */}
        {loading ? (
          <Card>
            <div className="p-12">
              <LoadingSpinner size="lg" text="Loading inventory..." />
            </div>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Package size={64} />}
              title={searchTerm || filterStatus !== 'all' || hasActiveFilters ? "No items found" : "No inventory yet"}
              description={
                searchTerm || filterStatus !== 'all' || hasActiveFilters
                  ? "Try adjusting your filters or search"
                  : "Start by adding items and recording purchases"
              }
              action={
                (searchTerm || hasActiveFilters) && (
                  <Button onClick={() => { setSearchTerm(''); clearFilters(); }} variant="secondary">
                    Clear Filters
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const status = getStockStatus(item);
                return (
                  <Card key={item.id} hover padding="lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg`}>
                            <Package className={theme.classes.textPrimary} size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{item.item_name}</h3>
                            <p className="text-sm text-slate-600">{item.category_name}</p>
                          </div>
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
                          {item.returned_stock > 0 && (
                            <Badge variant="warning" size="sm">
                              <RotateCcw size={12} className="inline mr-1" />
                              {item.returned_stock} Returned
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 font-medium">Normal Stock</p>
                            <p className="text-slate-900 font-bold text-lg">{item.normal_stock} {item.unit_abbr}</p>
                          </div>
                          {item.returned_stock > 0 && (
                            <div>
                              <p className="text-slate-500 font-medium">Returned Stock</p>
                              <p className="text-orange-600 font-bold text-lg">{item.returned_stock} {item.unit_abbr}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-slate-500 font-medium">Total Stock</p>
                            <p className={`${theme.classes.textPrimary} font-bold text-lg`}>{item.current_stock} {item.unit_abbr}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-medium">Min Level</p>
                            <p className="text-slate-900 font-semibold">{item.min_stock_level} {item.unit_abbr}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-medium">Value</p>
                            <p className="text-slate-900 font-bold">₹{item.total_value.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Stats Footer */}
            <div className="text-sm text-slate-600">
              Showing {filteredItems.length} of {items.length} items • Total Value: ₹{totalInventoryValue.toLocaleString()}
            </div>
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
                  <h3 className="text-xl font-bold text-slate-900">Filter Inventory</h3>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueCategories.map(category => (
                      <button
                        key={category}
                        onClick={() => {
                          if (filters.categories.includes(category)) {
                            setFilters({
                              ...filters,
                              categories: filters.categories.filter(c => c !== category)
                            });
                          } else {
                            setFilters({
                              ...filters,
                              categories: [...filters.categories, category]
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          filters.categories.includes(category)
                            ? `${theme.classes.bgPrimary} text-white`
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Range */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Stock Range</label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      placeholder="Min stock"
                      value={filters.stockRange.min}
                      onChange={(e) => setFilters({
                        ...filters,
                        stockRange: { ...filters.stockRange, min: e.target.value }
                      })}
                    />
                    <Input
                      type="number"
                      placeholder="Max stock"
                      value={filters.stockRange.max}
                      onChange={(e) => setFilters({
                        ...filters,
                        stockRange: { ...filters.stockRange, max: e.target.value }
                      })}
                    />
                  </div>
                </div>

                {/* Value Range */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Value Range (₹)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      placeholder="Min value"
                      value={filters.valueRange.min}
                      onChange={(e) => setFilters({
                        ...filters,
                        valueRange: { ...filters.valueRange, min: e.target.value }
                      })}
                    />
                    <Input
                      type="number"
                      placeholder="Max value"
                      value={filters.valueRange.max}
                      onChange={(e) => setFilters({
                        ...filters,
                        valueRange: { ...filters.valueRange, max: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => {
                    clearFilters();
                    setShowFilterModal(false);
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
        </div>
      )}
    </div>
  );
};

export default Inventory;
