// FILE PATH: components/Inventory.tsx

import React, { useState } from 'react';
import { Package, Plus, Edit2, Search, AlertTriangle, Filter } from 'lucide-react';

type InventoryBatch = {
  id: string;
  item_name: string;
  category: string;
  batch_number: string;
  quantity: number;
  unit: string;
  purchase_price: number;
  expiry_date: string | null;
  min_stock_level: number;
  is_low_stock: boolean;
};

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null);
  const [adjustment, setAdjustment] = useState({ type: 'add', quantity: 0, reason: '' });

  // Mock data - Replace with Supabase query
  const mockInventory: InventoryBatch[] = [
    {
      id: '1',
      item_name: 'Camphor Tablets',
      category: 'Pooja Items',
      batch_number: 'B001',
      quantity: 15,
      unit: 'box',
      purchase_price: 40,
      expiry_date: '2026-12-31',
      min_stock_level: 50,
      is_low_stock: true
    },
    {
      id: '2',
      item_name: 'Agarbatti - Rose',
      category: 'Pooja Items',
      batch_number: 'B023',
      quantity: 8,
      unit: 'pkt',
      purchase_price: 25,
      expiry_date: '2027-06-30',
      min_stock_level: 30,
      is_low_stock: true
    },
    {
      id: '3',
      item_name: 'Brass Diya',
      category: 'Handicrafts',
      batch_number: 'B045',
      quantity: 3,
      unit: 'pcs',
      purchase_price: 220,
      expiry_date: null,
      min_stock_level: 10,
      is_low_stock: true
    },
    {
      id: '4',
      item_name: 'Kumkum Powder',
      category: 'Pooja Items',
      batch_number: 'B012',
      quantity: 45,
      unit: 'pkt',
      purchase_price: 15,
      expiry_date: '2026-08-15',
      min_stock_level: 40,
      is_low_stock: false
    }
  ];

  const handleAdjustStock = (batch: InventoryBatch) => {
    setSelectedBatch(batch);
    setAdjustment({ type: 'add', quantity: 0, reason: '' });
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = () => {
    // Save to Supabase here
    console.log('Adjusting stock:', selectedBatch, adjustment);
    setShowAdjustModal(false);
  };

  const filteredInventory = mockInventory.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filterLowStock || item.is_low_stock;
    
    return matchesSearch && matchesFilter;
  });

  const lowStockCount = mockInventory.filter(item => item.is_low_stock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-600 text-sm mt-1">Track stock levels and batches</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
            <Plus size={18} />
            Add Stock
          </button>
        </div>
      </div>

      {/* Alert for Low Stock */}
      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-900">Low Stock Alert</h3>
            <p className="text-sm text-red-700 mt-1">
              {lowStockCount} item{lowStockCount > 1 ? 's are' : ' is'} below minimum stock level. Consider reordering.
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search items or batch numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border-0 focus:ring-0 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filterLowStock}
                onChange={(e) => setFilterLowStock(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Low Stock Only
            </label>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Purchase Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.is_low_stock ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{item.item_name}</div>
                        <div className="text-sm text-gray-500 sm:hidden">{item.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{item.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.batch_number}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className={`font-semibold ${item.is_low_stock ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.quantity} {item.unit}
                      </span>
                      {item.is_low_stock && (
                        <span className="text-xs text-red-600">Min: {item.min_stock_level}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">₹{item.purchase_price}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                    {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-IN') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleAdjustStock(item)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Adjust Stock</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedBatch.item_name} - {selectedBatch.batch_number}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedBatch.quantity} {selectedBatch.unit}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustment({ ...adjustment, type: 'add' })}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      adjustment.type === 'add'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Add Stock
                  </button>
                  <button
                    onClick={() => setAdjustment({ ...adjustment, type: 'remove' })}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      adjustment.type === 'remove'
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Remove Stock
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={adjustment.quantity}
                  onChange={(e) => setAdjustment({ ...adjustment, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={adjustment.reason}
                  onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="e.g., Damaged items, Stock correction, etc."
                />
              </div>

              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-700">New Stock Level</span>
                  <span className="text-xl font-bold text-gray-900">
                    {adjustment.type === 'add'
                      ? selectedBatch.quantity + adjustment.quantity
                      : selectedBatch.quantity - adjustment.quantity}{' '}
                    {selectedBatch.unit}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveAdjustment}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Save Adjustment
                </button>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;