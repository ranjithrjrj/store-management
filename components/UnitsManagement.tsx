// FILE PATH: components/UnitsManagement.tsx
// Units Management with ConfirmDialog and active/inactive filtering

'use client';
import React, { useState, useEffect } from 'react';
import { Ruler, Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { unitsAPI } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
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
    try {
      setSaving(true);
      setError(null);

      if (!formData.name.trim()) {
        toast.warning('Name required', 'Please enter unit name.');
        return;
      }

      if (!formData.abbreviation.trim()) {
        toast.warning('Abbreviation required', 'Please enter unit abbreviation.');
        return;
      }

      if (editingUnit) {
        await unitsAPI.update(editingUnit.id, formData as any);
        toast.success('Updated!', `Unit "${formData.name}" has been updated.`);
      } else {
        await unitsAPI.create(formData as any);
        toast.success('Created!', `Unit "${formData.name}" has been added.`);
      }

      await loadUnits();
      setShowModal(false);
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
      const { data: items, error: checkErr } = await supabase
        .from('items')
        .select('id')
        .eq('unit_id', deletingUnit.id)
        .limit(1);

      if (checkErr) throw checkErr;

      if (items && items.length > 0) {
        toast.warning(
          'Cannot delete',
          `Unit "${deletingUnit.name}" has items assigned. Please reassign them first.`
        );
        setShowDeleteConfirm(false);
        setDeletingUnit(null);
        return;
      }

      await unitsAPI.delete(deletingUnit.id);
      await loadUnits();
      toast.success('Deleted', `Unit "${deletingUnit.name}" has been removed.`);
      setShowDeleteConfirm(false);
      setDeletingUnit(null);
    } catch (err: any) {
      console.error('Error deleting unit:', err);
      toast.error('Failed to delete', err.message || 'Could not delete unit.');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, name: string) => {
    try {
      await unitsAPI.update(id, { is_active: !currentStatus } as any);
      await loadUnits();
      toast.success(
        !currentStatus ? 'Activated' : 'Deactivated',
        `Unit "${name}" has been ${!currentStatus ? 'activated' : 'deactivated'}.`
      );
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error('Failed to update', err.message || 'Could not update status.');
    }
  };

  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.abbreviation.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Ensure is_active is treated as boolean
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
        <div className="md:col-span-9">
          <Card padding="md">
            <Input
              leftIcon={<Search size={18} />}
              placeholder="Search units..."
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
                : "Get started by creating your first unit"
            }
            action={
              !searchTerm && (
                <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                  Add Your First Unit
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
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg flex-shrink-0`}>
                      <Ruler size={20} className={theme.classes.textPrimary} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{unit.name}</h3>
                        <span className="text-sm text-gray-500">({unit.abbreviation})</span>
                        {(unit.is_active === false || unit.is_active === 'false') && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Created {new Date(unit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Toggle Active/Inactive */}
                    <button
                      onClick={() => handleToggleActive(unit.id, unit.is_active, unit.name)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        (unit.is_active === true || unit.is_active === 'true') ? theme.classes.bgPrimary : 'bg-gray-200'
                      }`}
                      title={(unit.is_active === true || unit.is_active === 'true') ? 'Deactivate' : 'Activate'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          (unit.is_active === true || unit.is_active === 'true') ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => handleEdit(unit)}
                      className={`${theme.classes.textPrimary} hover:${theme.classes.bgPrimaryLight} p-2 rounded-lg transition-colors`}
                      title="Edit unit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(unit.id, unit.name)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Delete unit"
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
          Showing {filteredUnits.length} of {units.length} units • 
          Active: {activeCount} • Inactive: {inactiveCount}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
              />

              <Input
                label="Abbreviation"
                placeholder="e.g., kg, L, pcs"
                value={formData.abbreviation}
                onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                required
                helperText="Short form of the unit (2-10 characters)"
              />

              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
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