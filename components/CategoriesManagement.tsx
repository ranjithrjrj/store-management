// FILE PATH: components/CategoriesManagement.tsx
// Categories Management with consistent theming

'use client';
import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Textarea, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type Category = {
  id: string;
  name: string;
  description?: string;
  is_active: boolean | string | null;
  created_at: string;
};

const CategoriesManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
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

  const normalizeBoolean = (value: boolean | string | null): boolean => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return true;
  };

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
      is_active: normalizeBoolean(category.is_active)
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.warning('Name required', 'Please enter a category name.');
      return;
    }
    setShowEditConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowEditConfirm(false);
    try {
      setSaving(true);

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Updated!', `Category "${formData.name}" has been updated.`);
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(formData);

        if (error) throw error;
        toast.success('Created!', `Category "${formData.name}" has been created.`);
      }

      await loadCategories();
      setShowModal(false);
      setFormData({ name: '', description: '', is_active: true });
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
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', deletingCategory.id);

      if (error) throw error;

      await loadCategories();
      toast.success('Deleted', `Category "${deletingCategory.name}" has been deleted.`);
      setShowDeleteConfirm(false);
      setDeletingCategory(null);
    } catch (err: any) {
      console.error('Error deleting category:', err);
      toast.error('Failed to delete', err.message || 'Could not delete category.');
    }
  };

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const isActive = cat.is_active === true || cat.is_active === 'true';
    const matchesActive = showInactive || isActive;
    
    return matchesSearch && matchesActive;
  });

  const activeCount = categories.filter(c => c.is_active === true || c.is_active === 'true').length;
  const inactiveCount = categories.filter(c => c.is_active === false || c.is_active === 'false' || c.is_active === null).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600 font-medium">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 ${theme.classes.bgPrimaryLight} rounded-xl`}>
                <FolderOpen className={theme.classes.textPrimary} size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Categories Management</h1>
                <p className="text-slate-600 text-sm mt-0.5">Organize your items into categories</p>
              </div>
            </div>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 ${theme.classes.bgPrimaryLight} rounded-xl`}>
                <FolderOpen className={theme.classes.textPrimary} size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Categories Management</h1>
                <p className="text-slate-600 text-sm mt-0.5">Organize your items into categories</p>
              </div>
            </div>
            <Button onClick={handleAddNew} variant="primary" icon={<Plus size={20} />}>
              Add Category
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-9">
            <Card padding="md">
              <Input
                leftIcon={<Search size={18} />}
                rightIcon={searchTerm ? (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                ) : undefined}
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
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">Show Inactive ({inactiveCount})</span>
              </label>
            </Card>
          </div>
        </div>

        {/* Categories List */}
        <Card padding="none">
          {filteredCategories.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<FolderOpen size={64} />}
                title={searchTerm ? "No categories found" : "No categories yet"}
                description={
                  searchTerm
                    ? "Try adjusting your search terms"
                    : "Get started by creating your first category"
                }
                action={
                  !searchTerm ? (
                    <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                      Add Your First Category
                    </Button>
                  ) : (
                    <Button onClick={() => setSearchTerm('')} variant="secondary">
                      Clear Search
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className={`p-4 hover:bg-slate-50 transition-colors ${(category.is_active === false || category.is_active === 'false') ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg flex-shrink-0`}>
                        <FolderOpen size={20} className={theme.classes.textPrimary} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{category.name}</h3>
                          {(category.is_active === false || category.is_active === 'false') && (
                            <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded">Inactive</span>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-slate-600 mt-1">{category.description}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                          Created {new Date(category.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(category)}
                        className={`p-2 ${theme.classes.textPrimary} hover:${theme.classes.bgPrimaryLight} rounded-lg transition-colors`}
                        title="Edit category"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(category.id, category.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete category"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Stats */}
        {categories.length > 0 && (
          <div className="text-sm text-slate-600">
            Showing {filteredCategories.length} of {categories.length} categories • 
            Active: {activeCount} • Inactive: {inactiveCount}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Category Name"
                  placeholder="Enter category name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <Textarea
                  label="Description"
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                <Button onClick={() => setShowModal(false)} variant="secondary" fullWidth>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} variant="primary" fullWidth loading={saving}>
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Confirmation */}
      <ConfirmDialog
        isOpen={showEditConfirm}
        onClose={() => setShowEditConfirm(false)}
        onConfirm={handleConfirmSubmit}
        title={editingCategory ? 'Update Category' : 'Create Category'}
        message={editingCategory 
          ? `Save changes to "${formData.name}"?` 
          : `Create new category "${formData.name}"?`}
        confirmText={editingCategory ? 'Update' : 'Create'}
        cancelText="Cancel"
        variant="primary"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingCategory(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={deletingCategory ? `Are you sure you want to delete "${deletingCategory.name}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default CategoriesManagement;
