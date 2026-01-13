// FILE PATH: components/CategoriesManagement.tsx
// Categories Management with ConfirmDialog and active/inactive filtering

'use client';
import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type Category = {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
};

const CategoriesManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
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
      toast.error('Failed to load', 'Could not load categories. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', is_active: true });
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.name.trim()) {
        toast.warning('Name required', 'Please enter a category name.');
        return;
      }

      if (editingCategory) {
        const { error: err } = await supabase
          .from('categories')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            is_active: formData.is_active
          })
          .eq('id', editingCategory.id);

        if (err) throw err;
        toast.success('Updated!', `Category "${formData.name}" has been updated.`);
      } else {
        const { error: err } = await supabase
          .from('categories')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            is_active: formData.is_active
          });

        if (err) throw err;
        toast.success('Created!', `Category "${formData.name}" has been added.`);
      }

      await loadCategories();
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving category:', err);
      toast.error('Failed to save', err.message || 'Could not save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeletingCategory({ id, name });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;

    try {
      const { data: items, error: checkErr } = await supabase
        .from('items')
        .select('id')
        .eq('category_id', deletingCategory.id)
        .limit(1);

      if (checkErr) throw checkErr;

      if (items && items.length > 0) {
        toast.warning(
          'Cannot delete',
          `Category "${deletingCategory.name}" has items assigned. Please reassign them first.`
        );
        setShowDeleteConfirm(false);
        setDeletingCategory(null);
        return;
      }

      const { error: err } = await supabase
        .from('categories')
        .delete()
        .eq('id', deletingCategory.id);

      if (err) throw err;

      await loadCategories();
      toast.success('Deleted', `Category "${deletingCategory.name}" has been removed.`);
      setShowDeleteConfirm(false);
      setDeletingCategory(null);
    } catch (err: any) {
      console.error('Error deleting category:', err);
      toast.error('Failed to delete', err.message || 'Could not delete category.');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, name: string) => {
    try {
      const { error: err } = await supabase
        .from('categories')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (err) throw err;

      await loadCategories();
      toast.success(
        !currentStatus ? 'Activated' : 'Deactivated',
        `Category "${name}" has been ${!currentStatus ? 'activated' : 'deactivated'}.`
      );
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error('Failed to update', err.message || 'Could not update status.');
    }
  };

  const filteredCategories = categories.filter(cat => {
  const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Clean boolean check
  const isActive = cat.is_active === true;
  const matchesActive = showInactive || isActive;
  
  return matchesSearch && matchesActive;
});

  const activeCount = categories.filter(c => c.is_active).length;
const inactiveCount = categories.filter(c => !c.is_active).length;

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categories Management</h2>
          <p className="text-gray-600 text-sm mt-1">Organize your items into categories</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <FolderOpen size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="font-bold text-red-800 mb-2">Failed to Load Categories</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={loadCategories} variant="primary">Try Again</Button>
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
          <h2 className="text-2xl font-bold text-gray-900">Categories Management</h2>
          <p className="text-gray-600 text-sm mt-1">Organize your items into categories</p>
        </div>
        <Button onClick={handleAddNew} variant="primary" size="md" icon={<Plus size={18} />}>
          Add Category
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-9">
          <Card padding="md">
            <Input
              leftIcon={<Search size={18} />}
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <Card padding="md">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className={`rounded ${theme.classes.textPrimary}`}
              />
              <span className="text-sm font-medium text-gray-700">Show Inactive ({inactiveCount})</span>
            </label>
          </Card>
        </div>
      </div>

      {/* Categories List */}
      <Card padding="none">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" text="Loading categories..." />
          </div>
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={64} />}
            title={searchTerm ? "No categories found" : "No categories yet"}
            description={
              searchTerm
                ? "Try adjusting your search terms"
                : "Get started by creating your first category"
            }
            action={
              !searchTerm && (
                <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                  Add Your First Category
                </Button>
              )
            }
          />
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${!category.is_active ? 'opacity-60' : ''}`}
>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg flex-shrink-0`}>
                      <FolderOpen size={20} className={theme.classes.textPrimary} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        {!category.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">Inactive</span>
                        )}
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Created {new Date(category.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Toggle Active/Inactive */}
                    <button
                      onClick={() => handleToggleActive(category.id, category.is_active, category.name)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        category.is_active ? theme.classes.bgPrimary : 'bg-gray-200'
                      }`}
                      title={category.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          category.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => handleEdit(category)}
                      className={`${theme.classes.textPrimary} hover:${theme.classes.bgPrimaryLight} p-2 rounded-lg transition-colors`}
                      title="Edit category"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category.id, category.name)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Delete category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Stats */}
      {!loading && categories.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredCategories.length} of {categories.length} categories • 
          Active: {activeCount} • Inactive: {inactiveCount}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Category Name"
                placeholder="e.g., Electronics, Groceries, Clothing"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 focus:border-current transition-all`}
                  placeholder="Optional description..."
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className={`rounded ${theme.classes.textPrimary}`}
                  />
                  <span className="text-sm font-medium text-gray-700">Active Category</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowModal(false)} variant="secondary" fullWidth disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} variant="primary" fullWidth loading={saving}>
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingCategory && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeletingCategory(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Category"
          message={`Are you sure you want to delete "${deletingCategory.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}
    </div>
  );
};

export default CategoriesManagement;