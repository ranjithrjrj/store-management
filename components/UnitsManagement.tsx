// FILE PATH: components/UnitsManagement.tsx
// Units Management with ConfirmDialog and active/inactive filtering

'use client';
import React, { useState, useEffect } from 'react';
import { Ruler, Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { supabase, unitsAPI } from '@/lib/supabase';
import { Button, Card, Input, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type Unit = {
  id: string;
  name: string;
  abbreviation: string;
  is_active: boolean | string | null;
  created_at: string;
};

const UnitsManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    is_active: true
  });

  // Helper to normalize is_active from database
  const normalizeBoolean = (value: boolean | string | null): boolean => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return true; // Default to true if null or undefined
  };

  useEffect(() => {
    loadUnits();
  }, []);

  async function loadUnits() {
    try {
      setLoading(true);
      setError(null);

      const data = await unitsAPI.getAll();
      setUnits(data || []);
    } catch (err: any) {
      console.error('Error loading units:', err);
      setError(err.message || 'Failed to load units');
      toast.error('Failed to load', 'Could not load units. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setEditingUnit(null);
    setFormData({ name: '', abbreviation: '', is_active: true });
    setShowModal(true);
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      abbreviation: unit.abbreviation,
      is_active: normalizeBoolean(unit.is_active)
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.warning('Name required', 'Please enter a unit name.');
      return;
    }
    if (!formData.abbreviation.trim()) {
      toast.warning('Abbreviation required', 'Please enter an abbreviation.');
      return;
    }

    // Show confirmation dialog
    setShowEditConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowEditConfirm(false);
    try {
      setSaving(true);

      if (editingUnit) {
        await unitsAPI.update(editingUnit.id, {
          name: formData.name.trim(),
          abbreviation: formData.abbreviation.trim(),
          is_active: formData.is_active
        } as any);
        toast.success('Updated!', `Unit "${formData.name}" has been updated.`);
      } else {
        await unitsAPI.create({
          name: formData.name.trim(),
          abbreviation: formData.abbreviation.trim(),
          is_active: formData.is_active
        } as any);
        toast.success('Created!', `Unit "${formData.name}" has been created.`);
      }

      await loadUnits();
      setShowModal(false);
      setFormData({ name: '', abbreviation: '', is_active: true });
    } catch (err: any) {
      console.error('Error saving unit:', err);
      toast.error('Failed to save', err.message || 'Could not save unit.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeletingUnit({ id, name });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUnit) return;

    try {
      // Check if unit is assigned to any items
      const { data: items } = await supabase
        .from('items')
        .select('id')
        .eq('unit_id', deletingUnit.id)
        .limit(1);

      if (items && items.length > 0) {
        toast.warning('Cannot delete', 'This unit is assigned to one or more items.');
        setShowDeleteConfirm(false);
        setDeletingUnit(null);
        return;
      }

      await unitsAPI.delete(deletingUnit.id);
      await loadUnits();
      toast.success('Deleted', `Unit "${deletingUnit.name}" has been deleted.`);
      setShowDeleteConfirm(false);
      setDeletingUnit(null);
    } catch (err: any) {
      console.error('Error deleting unit:', err);
      toast.error('Failed to delete', err.message || 'Could not delete unit.');
    }
  };

  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.abbreviation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isActive = unit.is_active === true || unit.is_active === 'true';
    const matchesActive = showInactive || isActive;

    return matchesSearch && matchesActive;
  });

  const activeCount = units.filter(u => u.is_active === true || u.is_active === 'true').length;
  const inactiveCount = units.filter(u => u.is_active === false || u.is_active === 'false' || u.is_active === null).length;

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Units Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage measurement units</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <Ruler size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="font-bold text-red-800 mb-2">Failed to Load Units</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={loadUnits} variant="primary">Try Again</Button>
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
          <h2 className="text-2xl font-bold text-gray-900">Units Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage measurement units</p>
        </div>
        <Button onClick={handleAddNew} variant="primary" size="md" icon={<Plus size={18} />}>
          Add Unit
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8">
          <Card padding="md">
            <Input
              leftIcon={<Search size={18} />}
              placeholder="Search units by name or abbreviation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              rightIcon={searchTerm ? (
                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              ) : undefined}
            />
          </Card>
        </div>
        
        <div className="md:col-span-4">
          <Card padding="md">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className={`rounded ${theme.classes.textPrimary}`}
              />
              <span className="text-sm font-medium text-gray-700">
                Show Inactive ({inactiveCount})
              </span>
            </label>
          </Card>
        </div>
      </div>

      {/* Units List */}
      <Card padding="none">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" text="Loading units..." />
          </div>
        ) : filteredUnits.length === 0 ? (
          <EmptyState
            icon={<Ruler size={64} />}
            title={searchTerm ? "No units found" : "No units yet"}
            description={
              searchTerm
                ? "Try adjusting your search terms"
                : "Add your first unit to get started"
            }
            action={
              !searchTerm && (
                <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                  Add First Unit
                </Button>
              )
            }
          />
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredUnits.map((unit) => (
              <div
                key={unit.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${(unit.is_active === false || unit.is_active === 'false') ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg`}>
                      <Ruler size={20} className={theme.classes.textPrimary} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{unit.name}</h3>
                        <Badge variant="neutral" size="sm">{unit.abbreviation}</Badge>
                        {(unit.is_active === false || unit.is_active === 'false') && (
                          <Badge variant="neutral" size="sm">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Created {new Date(unit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(unit)}
                      className={`${theme.classes.textPrimary} hover:${theme.classes.bgPrimaryLight} p-2 rounded-lg transition-colors`}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(unit.id, unit.name)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Delete"
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
      {!loading && units.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredUnits.length} of {units.length} units • Active: {activeCount} • Inactive: {inactiveCount}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingUnit ? 'Edit Unit' : 'Add New Unit'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Unit Name"
                placeholder="e.g., Kilogram, Liter, Piece"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                leftIcon={<Ruler size={18} />}
              />

              <Input
                label="Abbreviation"
                placeholder="e.g., kg, L, pc"
                value={formData.abbreviation}
                onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                required
                helperText="Short form used in displays"
              />

              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={normalizeBoolean(formData.is_active)}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className={`rounded ${theme.classes.textPrimary}`}
                  />
                  <span className="text-sm font-medium text-gray-700">Active Unit</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowModal(false)} variant="secondary" fullWidth disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} variant="primary" fullWidth loading={saving}>
                {editingUnit ? 'Update' : 'Create'}
              </Button>
            </div>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Confirmation */}
      {showEditConfirm && (
        <ConfirmDialog
          isOpen={showEditConfirm}
          onClose={() => setShowEditConfirm(false)}
          onConfirm={handleConfirmSubmit}
          title={editingUnit ? 'Update Unit' : 'Create Unit'}
          message={editingUnit 
            ? `Save changes to "${formData.name}"?` 
            : `Create new unit "${formData.name}"?`}
          confirmText={editingUnit ? 'Update' : 'Create'}
          cancelText="Cancel"
          variant="primary"
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingUnit && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeletingUnit(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Unit"
          message={`Are you sure you want to delete "${deletingUnit.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}
    </div>
  );
};

export default UnitsManagement;