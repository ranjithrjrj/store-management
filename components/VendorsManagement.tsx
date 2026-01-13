// FILE PATH: components/VendorsManagement.tsx
// Vendors Management with ConfirmDialog and active/inactive filtering

'use client';
import React, { useState, useEffect } from 'react';
import { Store, Plus, Edit2, Trash2, X, Search, Phone, Mail, MapPin, FileText, CreditCard } from 'lucide-react';
import { supabase, vendorsAPI } from '@/lib/supabase';
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
  const [showEditConfirm, setShowEditConfirm] = useState(false);
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
  const normalizeBoolean = (value: boolean | string | null | undefined): boolean => {
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
    if (!formData.name?.trim()) {
      toast.warning('Name required', 'Please enter vendor name.');
      return;
    }

    // Show confirmation dialog
    setShowEditConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowEditConfirm(false);
    try {
      setSaving(true);

      if (editingVendor) {
        await vendorsAPI.update(editingVendor.id, formData as any);
        toast.success('Updated!', `Vendor "${formData.name}" has been updated.`);
      } else {
        await vendorsAPI.create(formData as any);
        toast.success('Created!', `Vendor "${formData.name}" has been created.`);
      }

      await loadVendors();
      setShowModal(false);
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
      toast.success('Deleted', `Vendor "${deletingVendor.name}" has been deleted.`);
      setShowDeleteConfirm(false);
      setDeletingVendor(null);
    } catch (err: any) {
      console.error('Error deleting vendor:', err);
      toast.error('Failed to delete', err.message || 'Could not delete vendor.');
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vendor.contact_person && vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vendor.phone && vendor.phone.includes(searchTerm)) ||
      (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
          <p className="text-gray-600 text-sm mt-1">Manage vendor information</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <Store size={48} className="mx-auto opacity-50" />
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
          <p className="text-gray-600 text-sm mt-1">Manage vendor information</p>
        </div>
        <Button onClick={handleAddNew} variant="primary" size="md" icon={<Plus size={18} />}>
          Add Vendor
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8">
          <Card padding="md">
            <Input
              leftIcon={<Search size={18} />}
              placeholder="Search vendors by name, contact, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Vendors List */}
      <Card padding="none">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" text="Loading vendors..." />
          </div>
        ) : filteredVendors.length === 0 ? (
          <EmptyState
            icon={<Store size={64} />}
            title={searchTerm ? "No vendors found" : "No vendors yet"}
            description={
              searchTerm
                ? "Try adjusting your search terms"
                : "Add your first vendor to get started"
            }
            action={
              !searchTerm && (
                <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                  Add First Vendor
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredVendors.map((vendor) => (
              <Card key={vendor.id} hover padding="md" className={(vendor.is_active === false || vendor.is_active === 'false') ? 'opacity-60' : ''}>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{vendor.name}</h3>
                      {vendor.contact_person && (
                        <p className="text-sm text-gray-600 truncate mt-1">{vendor.contact_person}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {(vendor.is_active === false || vendor.is_active === 'false') && (
                          <Badge variant="neutral" size="sm">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Badge variant={(vendor.is_active === true || vendor.is_active === 'true') ? 'success' : 'neutral'} size="sm">
                        {(vendor.is_active === true || vendor.is_active === 'true') ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    {vendor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="flex-shrink-0" />
                        <span className="truncate">{vendor.phone}</span>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="flex-shrink-0" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    )}
                    {(vendor.city || vendor.state) && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span className="truncate">{[vendor.city, vendor.state].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {vendor.gstin && (
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="flex-shrink-0" />
                        <span className="truncate font-mono text-xs">{vendor.gstin}</span>
                      </div>
                    )}
                    {vendor.payment_terms && (
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="flex-shrink-0" />
                        <span className="truncate text-xs">{vendor.payment_terms}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
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
            ))}
          </div>
        )}
      </Card>

      {/* Stats */}
      {!loading && vendors.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredVendors.length} of {vendors.length} vendors • Active: {activeCount} • Inactive: {inactiveCount}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Vendor Name"
                placeholder="Enter vendor name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                leftIcon={<Store size={18} />}
              />

              <Input
                label="Contact Person"
                placeholder="Enter contact person name"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <Input
                label="GSTIN (Optional)"
                placeholder="Enter 15-character GSTIN"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                maxLength={15}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
                  placeholder="Enter street address"
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
                  helperText="2-digit GST state code"
                />

                <Input
                  label="Pincode"
                  placeholder="Enter pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </div>

              <Input
                label="Payment Terms"
                placeholder="e.g., Net 30, Cash on Delivery"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              />

              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={normalizeBoolean(formData.is_active)}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className={`rounded ${theme.classes.textPrimary} ${theme.classes.focusRing}`}
                  />
                  <span className="text-sm font-medium text-gray-700">Active Vendor</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowModal(false)} variant="secondary" fullWidth disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} variant="primary" fullWidth loading={saving}>
                {editingVendor ? 'Update' : 'Create'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Confirmation */}
      {showEditConfirm && (
        <ConfirmDialog
          isOpen={showEditConfirm}
          onClose={() => setShowEditConfirm(false)}
          onConfirm={handleConfirmSubmit}
          title={editingVendor ? 'Update Vendor' : 'Create Vendor'}
          message={editingVendor 
            ? `Save changes to "${formData.name}"?` 
            : `Create new vendor "${formData.name}"?`}
          confirmText={editingVendor ? 'Update' : 'Create'}
          cancelText="Cancel"
          variant="primary"
        />
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
