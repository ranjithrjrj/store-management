// FILE PATH: components/CustomersManagement.tsx
// Customers Management with new UI components and theme support

'use client';
import React, { useState, useEffect } from 'react';
import { UserCircle, Plus, Edit2, Trash2, X, Search, Phone, Mail, MapPin } from 'lucide-react';
import { customersAPI } from '@/lib/supabase';
import { Button, Card, Input, Badge, EmptyState, LoadingSpinner, useToast } from '@/components/ui';
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
  is_active: boolean;
  created_at: string;
};

const CustomersManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
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
      is_active: customer.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.name?.trim()) {
        toast.warning('Name required', 'Please enter customer name.');
        return;
      }

      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, formData as any);
        toast.success('Updated!', `Customer "${formData.name}" has been updated.`);
      } else {
        await customersAPI.create(formData as any);
        toast.success('Created!', `Customer "${formData.name}" has been added.`);
      }

      await loadCustomers();
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving customer:', err);
      toast.error('Failed to save', err.message || 'Could not save customer.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete customer "${name}"?`)) {
      return;
    }

    try {
      await customersAPI.delete(id);
      await loadCustomers();
      toast.success('Deleted', `Customer "${name}" has been removed.`);
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      toast.error('Failed to delete', err.message || 'Could not delete customer.');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm)) ||
    (customer.gstin && customer.gstin.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage your customer database</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <UserCircle size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="font-bold text-red-800 mb-2">Failed to Load Customers</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={loadCustomers} variant="primary">
              Try Again
            </Button>
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
          <p className="text-gray-600 text-sm mt-1">Manage your customer database</p>
        </div>
        <Button
          onClick={handleAddNew}
          variant="primary"
          size="md"
          icon={<Plus size={18} />}
        >
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <Card padding="md">
        <Input
          leftIcon={<Search size={18} />}
          placeholder="Search by name, phone, or GSTIN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full">
            <Card>
              <div className="py-12">
                <LoadingSpinner size="lg" text="Loading customers..." />
              </div>
            </Card>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <EmptyState
                icon={<UserCircle size={64} />}
                title={searchTerm ? "No customers found" : "No customers yet"}
                description={
                  searchTerm
                    ? "Try adjusting your search terms"
                    : "Get started by adding your first customer"
                }
                action={
                  !searchTerm && (
                    <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                      Add Your First Customer
                    </Button>
                  )
                }
              />
            </Card>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <Card key={customer.id} hover padding="md">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg flex-shrink-0`}>
                      <UserCircle size={20} className={theme.classes.textPrimary} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                    </div>
                  </div>
                  <Badge variant={customer.is_active ? 'success' : 'neutral'} size="sm">
                    {customer.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} className="flex-shrink-0" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={14} className="flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {(customer.city || customer.state) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={14} className="flex-shrink-0" />
                      <span className="truncate">
                        {[customer.city, customer.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {customer.gstin && (
                    <div className="text-xs text-gray-500">
                      GSTIN: {customer.gstin}
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
                    onClick={() => handleDelete(customer.id, customer.name)}
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
      {!loading && customers.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Customer Name"
                    placeholder="Enter customer name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

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

                <div className="md:col-span-2">
                  <Input
                    label="GSTIN"
                    placeholder="Enter GSTIN (optional)"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    helperText="15-character GST Identification Number"
                  />
                </div>
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

              {/* Status */}
              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className={`rounded ${theme.classes.textPrimary} ${theme.classes.focusRing}`}
                  />
                  <span className="text-sm font-medium text-gray-700">Active Customer</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowModal(false)}
                variant="secondary"
                fullWidth
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                variant="primary"
                fullWidth
                loading={saving}
              >
                {editingCustomer ? 'Update Customer' : 'Create Customer'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CustomersManagement;