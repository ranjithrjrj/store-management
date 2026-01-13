// FILE PATH: components/CustomersManagement.tsx
// Customers Management with ConfirmDialog and active/inactive filtering

'use client';
import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, Search, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { supabase, customersAPI } from '@/lib/supabase';
import { Button, Card, Input, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  state_code?: string;
  pincode?: string;
  is_active: boolean | string | null;
  created_at: string;
};

const CustomersManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    state_code: '',
    pincode: '',
    is_active: true
  });

  // Helper to normalize is_active from database
  const normalizeBoolean = (value: boolean | string | null): boolean => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return true; // Default to true if null or undefined
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError(null);

      const data = await customersAPI.getAll();
      setCustomers(data || []);
    } catch (err: any) {
      console.error('Error loading customers:', err);
      setError(err.message || 'Failed to load customers');
      toast.error('Failed to load', 'Could not load customers. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      gstin: '',
      address: '',
      city: '',
      state: 'Tamil Nadu',
      state_code: '33',
      pincode: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      gstin: customer.gstin || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || 'Tamil Nadu',
      state_code: customer.state_code || '33',
      pincode: customer.pincode || '',
      is_active: normalizeBoolean(customer.is_active)
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name?.trim()) {
      toast.warning('Name required', 'Please enter customer name.');
      return;
    }

    // Show confirmation dialog
    setShowEditConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowEditConfirm(false);
    try {
      setSaving(true);

      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, formData as any);
        toast.success('Updated!', `Customer "${formData.name}" has been updated.`);
      } else {
        await customersAPI.create(formData as any);
        toast.success('Created!', `Customer "${formData.name}" has been created.`);
      }

      await loadCustomers();
      setShowModal(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        gstin: '',
        address: '',
        city: '',
        state: 'Tamil Nadu',
        state_code: '33',
        pincode: '',
        is_active: true
      });
    } catch (err: any) {
      console.error('Error saving customer:', err);
      toast.error('Failed to save', err.message || 'Could not save customer.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeletingCustomer({ id, name });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return;

    try {
      await customersAPI.delete(deletingCustomer.id);
      await loadCustomers();
      toast.success('Deleted', `Customer "${deletingCustomer.name}" has been deleted.`);
      setShowDeleteConfirm(false);
      setDeletingCustomer(null);
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      toast.error('Failed to delete', err.message || 'Could not delete customer.');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const isActive = customer.is_active === true || customer.is_active === 'true';
    const matchesActive = showInactive || isActive;

    return matchesSearch && matchesActive;
  });

  const activeCount = customers.filter(c => c.is_active === true || c.is_active === 'true').length;
  const inactiveCount = customers.filter(c => c.is_active === false || c.is_active === 'false' || c.is_active === null).length;

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage customer information</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <Users size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="font-bold text-red-800 mb-2">Failed to Load Customers</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={loadCustomers} variant="primary">Try Again</Button>
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
          <h2 className="text-2xl font-bold text-gray-900">Customers Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage customer information</p>
        </div>
        <Button onClick={handleAddNew} variant="primary" size="md" icon={<Plus size={18} />}>
          Add Customer
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8">
          <Card padding="md">
            <Input
              leftIcon={<Search size={18} />}
              placeholder="Search customers by name, phone, or email..."
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

      {/* Customers List */}
      <Card padding="none">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" text="Loading customers..." />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon={<Users size={64} />}
            title={searchTerm ? "No customers found" : "No customers yet"}
            description={
              searchTerm
                ? "Try adjusting your search terms"
                : "Add your first customer to get started"
            }
            action={
              !searchTerm && (
                <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                  Add First Customer
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} hover padding="md" className={(customer.is_active === false || customer.is_active === 'false') ? 'opacity-60' : ''}>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {(customer.is_active === false || customer.is_active === 'false') && (
                          <Badge variant="neutral" size="sm">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Badge variant={(customer.is_active === true || customer.is_active === 'true') ? 'success' : 'neutral'} size="sm">
                        {(customer.is_active === true || customer.is_active === 'true') ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="flex-shrink-0" />
                        <span className="truncate">{customer.phone}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="flex-shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {(customer.city || customer.state) && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span className="truncate">{[customer.city, customer.state].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {customer.gstin && (
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="flex-shrink-0" />
                        <span className="truncate font-mono text-xs">{customer.gstin}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(customer)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 ${theme.classes.textPrimary} ${theme.classes.bgPrimaryLighter} rounded-lg hover:${theme.classes.bgPrimaryLight} transition-colors text-sm font-medium`}
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(customer.id, customer.name)}
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
      {!loading && customers.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredCustomers.length} of {customers.length} customers • Active: {activeCount} • Inactive: {inactiveCount}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Customer Name"
                placeholder="Enter customer name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                leftIcon={<Users size={18} />}
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

              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={normalizeBoolean(formData.is_active)}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className={`rounded ${theme.classes.textPrimary} ${theme.classes.focusRing}`}
                  />
                  <span className="text-sm font-medium text-gray-700">Active Customer</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowModal(false)} variant="secondary" fullWidth disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} variant="primary" fullWidth loading={saving}>
                {editingCustomer ? 'Update' : 'Create'}
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
          title={editingCustomer ? 'Update Customer' : 'Create Customer'}
          message={editingCustomer 
            ? `Save changes to "${formData.name}"?` 
            : `Create new customer "${formData.name}"?`}
          confirmText={editingCustomer ? 'Update' : 'Create'}
          cancelText="Cancel"
          variant="primary"
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingCustomer && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeletingCustomer(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Customer"
          message={`Are you sure you want to delete "${deletingCustomer.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}
    </div>
  );
};

export default CustomersManagement;
