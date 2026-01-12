import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, X, Search } from 'lucide-react';

// Mock data - Replace with Supabase data
const mockCategories = [
  { id: '1', name: 'Pooja Items' },
  { id: '2', name: 'Handicrafts' },
  { id: '3', name: 'Decorative' },
  { id: '4', name: 'Accessories' }
];

const mockUnits = [
  { id: '1', name: 'Pieces', abbreviation: 'pcs' },
  { id: '2', name: 'Boxes', abbreviation: 'box' },
  { id: '3', name: 'Packets', abbreviation: 'pkt' },
  { id: '4', name: 'Kilograms', abbreviation: 'kg' },
  { id: '5', name: 'Grams', abbreviation: 'g' }
];

const mockItems = [
  {
    id: '1',
    name: 'Camphor Tablets',
    category: 'Pooja Items',
    hsn_code: '3301',
    unit: 'box',
    gst_rate: 5,
    mrp: 50,
    retail_price: 45,
    wholesale_price: 40,
    min_stock_level: 50,
    is_active: true
  },
  {
    id: '2',
    name: 'Agarbatti - Rose',
    category: 'Pooja Items',
    hsn_code: '3307',
    unit: 'pkt',
    gst_rate: 12,
    mrp: 35,
    retail_price: 30,
    wholesale_price: 25,
    min_stock_level: 30,
    is_active: true
  },
  {
    id: '3',
    name: 'Brass Diya',
    category: 'Handicrafts',
    hsn_code: '8306',
    unit: 'pcs',
    gst_rate: 18,
    mrp: 280,
    retail_price: 250,
    wholesale_price: 220,
    min_stock_level: 10,
    is_active: true
  }
];

type Item = {
  id?: string;
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

const ItemsManagement = () => {
  const [items, setItems] = useState(mockItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<Item>({
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

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
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
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: '',
      category_id: mockCategories.find(c => c.name === item.category)?.id || '',
      hsn_code: item.hsn_code,
      unit_id: mockUnits.find(u => u.abbreviation === item.unit)?.id || '',
      gst_rate: item.gst_rate,
      mrp: item.mrp,
      retail_price: item.retail_price,
      wholesale_price: item.wholesale_price,
      discount_percent: 0,
      min_stock_level: item.min_stock_level,
      is_active: item.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    // In real app, save to Supabase here
    console.log('Saving item:', formData);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      // In real app, delete from Supabase
      setItems(items.filter(item => item.id !== id));
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.hsn_code.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Items Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage item catalog with pricing and GST</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, category, or HSN code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border-0 focus:ring-0 focus:outline-none"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
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
                        <div className="text-sm text-gray-500 md:hidden">{item.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{item.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{item.hsn_code}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{item.gst_rate}%</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{item.mrp}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">₹{item.retail_price}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">₹{item.wholesale_price}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
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
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Camphor Tablets"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      {mockCategories.map(cat => (
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
                    >
                      <option value="">Select unit</option>
                      {mockUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900">Tax Information</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HSN/SAC Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.hsn_code}
                      onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 3301"
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
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900">Pricing</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MRP (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Retail Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.retail_price}
                      onChange={(e) => setFormData({ ...formData, retail_price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wholesale Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.wholesale_price}
                      onChange={(e) => setFormData({ ...formData, wholesale_price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) })}
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
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
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

export default ItemsManagement;