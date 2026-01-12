// FILE PATH: components/ItemsManagement.tsx
// UPDATED VERSION - Uses real database data

'use client';
import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { itemsAPI, categoriesAPI, unitsAPI } from '@/lib/supabase';

type Item = {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  hsn_code: string;
  unit_id: string;
  gst_rate: number;
  mrp: number;
  retail_price: number;
  wholesale_price: number;
  discount_percent: number;
  min_stock_level: number;
  is_active: boolean;
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
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Item>>({
    name: '',
    description: '',
    category_id: '',
    hsn_code: '',
    unit_id: '',
    gst_rate: 0,
    mrp: 0,
    retail_price: 0,
    wholesale_price: 0,
    discount_percent: 0,
    min_stock_level: 0,
    is_active: true
  });

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
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      category_id: categories[0]?.id || '',
      hsn_code: '',
      unit_id: units[0]?.id || '',
      gst_rate: 0,
      mrp: 0,
      retail_price: 0,
      wholesale_price: 0,
      discount_percent: 0,
      min_stock_level: 0,
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category_id: item.category_id,
      hsn_code: item.hsn_code,
      unit_id: item.unit_id,
      gst_rate: item.gst_rate,
      mrp: item.mrp,
      retail_price: item.retail_price,
      wholesale_price: item.wholesale_price,
      discount_percent: item.discount_percent || 0,
      min_stock_level: item.min_stock_level,
      is_active: item.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validation
      if (!formData.name || !formData.category_id || !formData.unit_id || !formData.hsn_code) {
        alert('Please fill in all required fields');
        return;
      }

      if (editingItem) {
        // Update existing item
        await itemsAPI.update(editingItem.id, formData as any);
      } else {
        // Create new item
        await itemsAPI.create(formData as any);
      }

      // Reload data
      await loadData();
      setShowModal(false);
      
      // Show success message
      alert(editingItem ? 'Item updated successfully!' : 'Item created successfully!');
    } catch (err: any) {
      console.error('Error saving item:', err);
      alert('Failed to save item: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will soft-delete the item (mark as inactive).`)) {
      return;
    }

    try {
      await itemsAPI.delete(id);
      await loadData();
      alert('Item deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item: ' + err.message);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.hsn_code.includes(searchTerm)
  );

  // Show error state
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Items Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage your inventory items</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-bold text-red-800 mb-2">Failed to Load Items</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadData}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Items Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage your inventory items with GST rates</p>
        </div>
        <button
          onClick={handleAddNew}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 disabled:bg-gray-400"
        >
          <Plus size={18} />
          Add New Item
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by item name or HSN code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            {searchTerm ? (
              <>
                <p className="text-gray-600">No items found matching "{searchTerm}"</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <Package size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No items yet</p>
                <button
                  onClick={handleAddNew}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Add Your First Item
                </button>
              </>
            )}
          </div>
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
                            {categories.find(c => c.id === item.category_id)?.name || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                      {categories.find(c => c.id === item.category_id)?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{item.hsn_code}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {item.gst_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{item.mrp}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">₹{item.retail_price}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">₹{item.wholesale_price}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={saving}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Basic Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Camphor Tablets"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Optional description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select unit</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.abbreviation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HSN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.hsn_code}
                      onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 38249990"
                      maxLength={8}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST Rate (%) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.gst_rate}
                      onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.retail_price}
                      onChange={(e) => setFormData({ ...formData, retail_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.wholesale_price}
                      onChange={(e) => setFormData({ ...formData, wholesale_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                    <input
                      type="number"
                      value={formData.min_stock_level}
                      onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Item is active</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:cursor-not-allowed"
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

export default ItemsManagement;