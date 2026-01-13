// FILE PATH: components/VendorsManagement.tsx
// Vendors Management with ConfirmDialog and active/inactive filtering

'use client';
import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, X, Search, Phone, Mail, MapPin } from 'lucide-react';
import { vendorsAPI } from '@/lib/supabase';
import { Button, Card, Input, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type Vendor = {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  state_code?: string;
  pincode?: string;
  payment_terms?: string;
  is_active: boolean | string | null;
  created_at: string;
};

const VendorsManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Vendor>>({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    state_code: '',
    pincode: '',
    payment_terms: '',
    is_active: true
  });

  // Helper to normalize is_active from database
  const normalizeBoolean = (value: boolean | string | null): boolean => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return true; // Default to true if null or undefined
  };

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    try {
      setLoading(true);
      setError(null);
      const data = await vendorsAPI.getAll();
      setVendors(data || []);
    } catch (err: any) {
      console.error('Error loading vendors:', err);
      setError(err.message || 'Failed to load vendors');
      toast.error('Failed to load', 'Could not load vendors. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setEditingVendor(null);
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      gstin: '',
      address: '',
      city: '',
      state: 'Tamil Nadu',
      state_code: '33',
      pincode: '',
      payment_terms: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      contact_person: vendor.contact_person || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      gstin: vendor.gstin || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || 'Tamil Nadu',
      state_code: vendor.state_code || '33',
      pincode: vendor.pincode || '',
      payment_terms: vendor.payment_terms || '',
      is_active: normalizeBoolean(vendor.is_active)
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.name?.trim()) {
        toast.warning('Name required', 'Please enter vendor name.');
        return;
      }

      if (editingVendor) {
        await vendorsAPI.update(editingVendor.id, formData as any);
        toast.success('Updated!', `Vendor "${formData.name}" has been updated.`);
      } else {
        await vendorsAPI.create(formData as any);
        toast.success('Created!', `Vendor "${formData.name}" has been added.`);
      }

      await loadVendors();
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving vendor:', err);
      toast.error('Failed to save', err.message || 'Could not save vendor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeletingVendor({ id, name });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVendor) return;

    try {
      await vendorsAPI.delete(deletingVendor.id);
      await loadVendors();
      toast.success('Deleted', `Vendor "${deletingVendor.name}" has been removed.`);
      setShowDeleteConfirm(false);
      setDeletingVendor(null);
    } catch (err: any) {
      console.error('Error deleting vendor:', err);
      toast.error('Failed to delete', err.message || 'Could not delete vendor.');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, name: string) => {
    try {
      await vendorsAPI.update(id, { is_active: !currentStatus } as any);
      await loadVendors();
      toast.success(
        !currentStatus ? 'Activated' : 'Deactivated',
        `Vendor "${name}" has been ${!currentStatus ? 'activated' : 'deactivated'}.`
      );
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error('Failed to update', err.message || 'Could not update status.');
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vendor.phone && vendor.phone.includes(searchTerm)) ||
      (vendor.gstin && vendor.gstin.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Ensure is_active is treated as boolean
    const isActive = vendor.is_active === true || vendor.is_active === 'true';
    const matchesActive = showInactive || isActive;
    
    return matchesSearch && matchesActive;
  });

  const activeCount = vendors.filter(v => v.is_active === true || v.is_active === 'true').length;
  const inactiveCount = vendors.filter(v => v.is_active === false || v.is_active === 'false' || v.is_active === null).length;

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendors Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage your vendor database</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <Building2 size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="font-bold text-red-800 mb-2">Failed to Load Vendors</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={loadVendors} variant="primary">Try Again</Button>
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
          <h2 className="text-2xl font-bold text-gray-900">Vendors Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage your vendor database</p>
        </div>
        <Button onClick={handleAddNew} variant="primary" size="md" icon={<Plus size={18} />}>
          Add Vendor
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-9">
          <Card padding="md">
            <Input
              leftIcon={<Search size={18} />}
              placeholder="Search by name, phone, or GSTIN..."
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

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full">
            <Card>
              <div className="py-12">
                <LoadingSpinner size="lg" text="Loading vendors..." />
              </div>
            </Card>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <EmptyState
                icon={<Building2 size={64} />}
                title={searchTerm ? "No vendors found" : "No vendors yet"}
                description={
                  searchTerm
                    ? "Try adjusting your search terms"
                    : "Get started by adding your first vendor"
                }
                action={
                  !searchTerm && (
                    <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                      Add Your First Vendor
                    </Button>
                  )
                }
              />
            </Card>
          </div>
        ) : (
          filteredVendors.map((vendor) => (
            <Card key={vendor.id} hover padding="md" className={(vendor.is_active === false || vendor.is_active === 'false') ? 'opacity-60' : ''}>
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg flex-shrink-0`}>
                      <Building2 size={20} className={theme.classes.textPrimary} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{vendor.name}</h3>
                        {(vendor.is_active === false || vendor.is_active === 'false') && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded flex-shrink-0">Inactive</span>
                        )}
                      </div>
                      {vendor.contact_person && (
                        <p className="text-sm text-gray-600 truncate">{vendor.contact_person}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={(vendor.is_active === true || vendor.is_active === 'true') ? 'success' : 'neutral'} size="sm">
                    {(vendor.is_active === true || vendor.is_active === 'true') ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} className="flex-shrink-0" />
                      <span className="truncate">{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={14} className="flex-shrink-0" />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                  )}
                  {(vendor.city || vendor.state) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={14} className="flex-shrink-0" />
                      <span className="truncate">
                        {[vendor.city, vendor.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {vendor.gstin && (
                    <div className="text-xs text-gray-500">
                      GSTIN: {vendor.gstin}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleActive(vendor.id, vendor.is_active, vendor.name)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      (vendor.is_active === true || vendor.is_active === 'true') ? theme.classes.bgPrimary : 'bg-gray-200'
                    }`}
                    title={(vendor.is_active === true || vendor.is_active === 'true') ? 'Deactivate' : 'Activate'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        (vendor.is_active === true || vendor.is_active === 'true') ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleEdit(vendor)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 ${theme.classes.textPrimary} ${theme.classes.bgPrimaryLighter} rounded-lg hover:${theme.classes.bgPrimaryLight} transition-colors text-sm font-medium`}
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(vendor.id, vendor.name)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      {!loading && vendors.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredVendors.length} of {vendors.length} vendors • 
          Active: {activeCount} • Inactive: {inactiveCount}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Vendor Name"
                    placeholder="Enter vendor name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Contact Person"
                  placeholder="Enter contact person name"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />

                <Input
                  label="Phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  leftIcon={<Phone size={18} />}
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  leftIcon={<Mail size={18} />}
                />

                <Input
                  label="GSTIN"
                  placeholder="Enter GSTIN (optional)"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  helperText="15-character GST Identification Number"
                />
              </div>

              {/* Address */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Address Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 focus:border-current transition-all`}
                      placeholder="Street address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="City"
                      placeholder="Enter city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />

                    <Input
                      label="State"
                      placeholder="Enter state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />

                    <Input
                      label="State Code"
                      placeholder="e.g., 33"
                      value={formData.state_code}
                      onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                    />

                    <Input
                      label="Pincode"
                      placeholder="Enter pincode"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <textarea
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    rows={2}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 focus:border-current transition-all`}
                    placeholder="e.g., Net 30, COD, Advance payment"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className={`rounded ${theme.classes.textPrimary} ${theme.classes.focusRing}`}
                  />
                  <span className="text-sm font-medium text-gray-700">Active Vendor</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowModal(false)} variant="secondary" fullWidth disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} variant="primary" fullWidth loading={saving}>
                {editingVendor ? 'Update Vendor' : 'Create Vendor'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingVendor && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeletingVendor(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Vendor"
          message={`Are you sure you want to delete "${deletingVendor.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}
    </div>
  );
};

export default VendorsManagement;