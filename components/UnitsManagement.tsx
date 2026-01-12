// FILE PATH: components/UnitsManagement.tsx
// Units Management with real database integration

'use client';
import React, { useState, useEffect } from 'react';
import { Ruler, Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Unit = {
  id: string;
  name: string;
  abbreviation: string;
  created_at: string;
};

const UnitsManagement = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: ''
  });

  useEffect(() => {
    loadUnits();
  }, []);

  async function loadUnits() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('units')
        .select('*')
        .order('name');

      if (err) throw err;
      setUnits(data || []);
    } catch (err: any) {
      console.error('Error loading units:', err);
      setError(err.message || 'Failed to load units');
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setEditingUnit(null);
    setFormData({ name: '', abbreviation: '' });
    setShowModal(true);
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      abbreviation: unit.abbreviation
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.name.trim() || !formData.abbreviation.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      if (editingUnit) {
        // Update existing unit
        const { error: err } = await supabase
          .from('units')
          .update({
            name: formData.name.trim(),
            abbreviation: formData.abbreviation.trim().toLowerCase()
          })
          .eq('id', editingUnit.id);

        if (err) throw err;
        alert('Unit updated successfully!');
      } else {
        // Create new unit
        const { error: err } = await supabase
          .from('units')
          .insert({
            name: formData.name.trim(),
            abbreviation: formData.abbreviation.trim().toLowerCase()
          });

        if (err) throw err;
        alert('Unit created successfully!');
      }

      await loadUnits();
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving unit:', err);
      if (err.message.includes('duplicate') || err.code === '23505') {
        alert('A unit with this abbreviation already exists. Please use a different abbreviation.');
      } else {
        alert('Failed to save unit: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    // Check if unit has items
    try {
      const { data: items, error: checkErr } = await supabase
        .from('items')
        .select('id')
        .eq('unit_id', id)
        .limit(1);

      if (checkErr) throw checkErr;

      if (items && items.length > 0) {
        alert(`Cannot delete unit "${name}" because it has items assigned to it. Please reassign or delete those items first.`);
        return;
      }

      if (!confirm(`Are you sure you want to delete the unit "${name}"?`)) {
        return;
      }

      const { error: err } = await supabase
        .from('units')
        .delete()
        .eq('id', id);

      if (err) throw err;

      await loadUnits();
      alert('Unit deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting unit:', err);
      alert('Failed to delete unit: ' + err.message);
    }
  };

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show error state
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Units Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage measurement units for your items</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-bold text-red-800 mb-2">Failed to Load Units</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadUnits}
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
          <h2 className="text-2xl font-bold text-gray-900">Units Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage measurement units for your items</p>
        </div>
        <button
          onClick={handleAddNew}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 disabled:bg-gray-400"
        >
          <Plus size={18} />
          Add Unit
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search units..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading units...</p>
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="p-8 text-center">
            {searchTerm ? (
              <>
                <p className="text-gray-600">No units found matching "{searchTerm}"</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <Ruler size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No units yet</p>
                <button
                  onClick={handleAddNew}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Add Your First Unit
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abbreviation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Ruler size={16} className="text-blue-600" />
                        <span className="font-medium text-gray-900">{unit.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        {unit.abbreviation}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(unit.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(unit)}
                          className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(unit.id, unit.name)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUnit ? 'Edit Unit' : 'Add New Unit'}
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
                  Unit Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Pieces, Kilograms, Liters"
                  maxLength={50}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Abbreviation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., pcs, kg, ltr"
                  maxLength={10}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Short form (e.g., pcs, kg, ltr, box, pkt)
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={saving || !formData.name.trim() || !formData.abbreviation.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : (editingUnit ? 'Update Unit' : 'Add Unit')}
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

export default UnitsManagement;