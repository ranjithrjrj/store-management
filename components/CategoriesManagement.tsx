// FILE PATH: components/CategoriesManagement.tsx
// Categories Management with real database integration

'use client';
import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Category = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
};

const CategoriesManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (err) throw err;
      setCategories(data || []);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.name.trim()) {
        alert('Please enter a category name');
        return;
      }

      if (editingCategory) {
        // Update existing category
        const { error: err } = await supabase
          .from('categories')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null
          })
          .eq('id', editingCategory.id);

        if (err) throw err;
        alert('Category updated successfully!');
      } else {
        // Create new category
        const { error: err } = await supabase
          .from('categories')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null
          });

        if (err) throw err;
        alert('Category created successfully!');
      }

      await loadCategories();
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving category:', err);
      alert('Failed to save category: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    // Check if category has items
    try {
      const { data: items, error: checkErr } = await supabase
        .from('items')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (checkErr) throw checkErr;

      if (items && items.length > 0) {
        alert(`Cannot delete category "${name}" because it has items assigned to it. Please reassign or delete those items first.`);
        return;
      }

      if (!confirm(`Are you sure you want to delete the category "${name}"?`)) {
        return;
      }

      const { error: err } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (err) throw err;

      await loadCategories();
      alert('Category deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category: ' + err.message);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Show error state
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categories Management</h2>
          <p className="text-gray-600 text-sm mt-1">Organize your items into categories</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-bold text-red-800 mb-2">Failed to Load Categories</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadCategories}
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
          <h2 className="text-2xl font-bold text-gray-900">Categories Management</h2>
          <p className="text-gray-600 text-sm mt-1">Organize your items into categories</p>
        </div>
        <button
          onClick={handleAddNew}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 disabled:bg-gray-400"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-8 text-center">
            {searchTerm ? (
              <>
                <p className="text-gray-600">No categories found matching "{searchTerm}"</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No categories yet</p>
                <button
                  onClick={handleAddNew}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Add Your First Category
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen size={20} className="text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600 mt-2">{category.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-3">
                  Created: {new Date(category.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Pooja Items, Handicrafts"
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Optional description"
                  maxLength={500}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={saving || !formData.name.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
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

export default CategoriesManagement;