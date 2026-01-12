// FILE PATH: components/Inventory.tsx
// UPDATED VERSION - Uses real database data

'use client';
import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Search, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type InventoryItem = {
  id: string;
  item_id?: string;
  name?: string;
  item_name?: string;
  category?: { name: string };
  category_name?: string;
  unit?: { abbreviation: string };
  unit_abbreviation?: string;
  total_stock?: number;
  current_stock?: number;
  min_stock_level: number;
  mrp: number;
  retail_price: number;
  stock_value?: number;
};

const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low-stock' | 'out-of-stock'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      setLoading(true);
      setError(null);
      
      // Query items with category and unit, then calculate stock
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select(`
          id,
          name,
          min_stock_level,
          mrp,
          retail_price,
          category:categories(name),
          unit:units(abbreviation)
        `)
        .eq('is_active', true);
      
      if (itemsError) throw itemsError;
      
      // Get stock for each item from inventory_batches
      const inventoryData = await Promise.all(
        (items || []).map(async (item) => {
          const { data: batches } = await supabase
            .from('inventory_batches')
            .select('quantity')
            .eq('item_id', item.id);
          
          const currentStock = batches?.reduce((sum, b) => sum + b.quantity, 0) || 0;
          
          return {
            id: item.id,
            item_name: item.name,
            category_name: item.category?.name || 'N/A',
            unit_abbreviation: item.unit?.abbreviation || 'pcs',
            current_stock: currentStock,
            min_stock_level: item.min_stock_level,
            mrp: item.mrp,
            retail_price: item.retail_price,
            stock_value: currentStock * item.retail_price
          };
        })
      );
      
      setInventory(inventoryData);
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }

  const getFilteredInventory = () => {
    let filtered = inventory.filter(item => {
      const itemName = (item.item_name || item.name || '').toLowerCase();
      const categoryName = (item.category_name || item.category?.name || '').toLowerCase();
      return itemName.includes(searchTerm.toLowerCase()) || categoryName.includes(searchTerm.toLowerCase());
    });

    switch (filterType) {
      case 'low-stock':
        filtered = filtered.filter(item => 
          item.current_stock > 0 && item.current_stock <= item.min_stock_level
        );
        break;
      case 'out-of-stock':
        filtered = filtered.filter(item => item.current_stock === 0);
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredInventory = getFilteredInventory();

  // Calculate statistics
  const stats = {
    totalItems: inventory.length,
    totalValue: inventory.reduce((sum, item) => sum + item.stock_value, 0),
    lowStock: inventory.filter(item => 
      item.current_stock > 0 && item.current_stock <= item.min_stock_level
    ).length,
    outOfStock: inventory.filter(item => item.current_stock === 0).length
  };

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: TrendingDown };
    } else if (current <= min) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800', icon: TrendingUp };
    }
  };

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Overview</h2>
          <p className="text-gray-600 text-sm mt-1">Track your stock levels and inventory value</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-bold text-red-800 mb-2">Failed to Load Inventory</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadInventory}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            Try Again
          </button>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Items</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Value</p>
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalValue.toLocaleString('en-IN')}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-yellow-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Low Stock</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-yellow-700">{stats.lowStock}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-red-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-red-700">{stats.outOfStock}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-red-50 text-red-600">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Items</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading inventory...</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="p-8 text-center">
            {searchTerm || filterType !== 'all' ? (
              <>
                <p className="text-gray-600">No items found</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <Package size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No inventory data yet</p>
                <p className="text-sm text-gray-500">Add items and record purchases to see inventory</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Min Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">MRP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Stock Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map((item) => {
                  const status = getStockStatus(item.current_stock, item.min_stock_level);
                  const StatusIcon = status.icon;
                  
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
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.current_stock} {item.unit_abbreviation}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                        {item.min_stock_level} {item.unit_abbreviation}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                        ₹{item.mrp}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 hidden lg:table-cell">
                        ₹{item.stock_value.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Note */}
      {!loading && inventory.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Stock values are calculated based on current retail prices. 
            Use Purchase Recording to add stock and update inventory levels.
          </p>
        </div>
      )}
    </div>
  );
};

export default Inventory;