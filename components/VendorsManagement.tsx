// FILE PATH: components/VendorsManagement.tsx
// Beautiful Modern Vendors Management - Teal & Gold Theme with Table Layout

'use client';
import React, { useState, useEffect } from 'react';
import { 
  Store, Plus, Edit2, Trash2, X, Search, Phone, Mail, 
  MapPin, FileText, CreditCard, Filter, ChevronDown 
} from 'lucide-react';
import { supabase, vendorsAPI } from '@/lib/supabase';
import { Button, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Vendor>>({
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

  const normalizeBoolean = (value: boolean | string | null | undefined): boolean => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return true;
  };

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    try {
      setLoading(true);
      const data = await vendorsAPI.getAll();
      setVendors(data || []);
    } catch (err: any) {
      console.error('Error loading vendors:', err);
      toast.error('Failed to load', 'Could not load vendors.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setEditingVendor(null);
    setFormData({ name: '', contact_person: '', phone: '', email: '', gstin: '', address: '', city: '', state: 'Tamil Nadu', state_code: '33', pincode: '', payment_terms: '', is_active: true });
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
      if (!formData.name?.trim()) { toast.warning('Name required', 'Please enter vendor name.'); return; }
      
      if (editingVendor) {
        await vendorsAPI.update(editingVendor.id, formData as any);
        toast.success('Updated!', `Vendor "${formData.name}" has been updated.`);
      } else {
        await vendorsAPI.create(formData as any);
        toast.success('Created!', `Vendor "${formData.name}" has been created.`);
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

  const handleDeleteClick = (id: string, name: string) => { setDeletingVendor({ id, name }); setShowDeleteConfirm(true); };

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

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
  };

  const filteredVendors = vendors
    .filter(vendor => {
      const matchesSearch = 
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vendor.contact_person && vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vendor.phone && vendor.phone.includes(searchTerm)) ||
        (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const isActive = normalizeBoolean(vendor.is_active);
      const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? isActive : !isActive);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === 'name') { aVal = a.name; bVal = b.name; }
      else if (sortBy === 'city') { aVal = a.city || ''; bVal = b.city || ''; }
      else { aVal = new Date(a.created_at).getTime(); bVal = new Date(b.created_at).getTime(); }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  const stats = {
    total: vendors.length,
    active: vendors.filter(v => normalizeBoolean(v.is_active)).length,
    inactive: vendors.filter(v => !normalizeBoolean(v.is_active)).length,
    withGSTIN: vendors.filter(v => v.gstin).length
  };

  const hasActiveFilters = filterStatus !== 'all' || searchTerm !== '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl mb-4">
            <LoadingSpinner size="lg" />
          </div>
          <p className="text-slate-700 font-medium">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md">
                <Store className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Vendors</h1>
                <p className="text-slate-600 mt-1">Manage vendor information</p>
              </div>
            </div>
            <Button 
              onClick={handleAddNew} 
              variant="primary" 
              size="md" 
              icon={<Plus size={20} />}
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md"
            >
              Add Vendor
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md border border-teal-100 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Store className="text-teal-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            </div>
            <p className="text-sm text-slate-600">Total Vendors</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-green-100 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Store className="text-green-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.active}</span>
            </div>
            <p className="text-sm text-slate-600">Active</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Store className="text-slate-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.inactive}</span>
            </div>
            <p className="text-sm text-slate-600">Inactive</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-amber-100 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileText className="text-amber-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.withGSTIN}</span>
            </div>
            <p className="text-sm text-slate-600">With GSTIN</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            <Button
              onClick={() => setShowFilterModal(true)}
              variant="secondary"
              size="md"
              icon={<Filter size={18} />}
              className="relative"
            >
              Filters
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                  {[filterStatus !== 'all'].filter(Boolean).length}
                </span>
              )}
            </Button>

            {hasActiveFilters && (
              <Button onClick={handleClearFilters} variant="secondary" size="md">Clear All</Button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-medium text-slate-700">
                  Sort: {sortBy === 'name' ? 'Name' : sortBy === 'city' ? 'City' : 'Date Added'}
                </span>
                <ChevronDown size={16} className="text-slate-500" />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                  <button onClick={() => { setSortBy('name'); setSortOrder('asc'); setShowSortDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between">
                    <span>Name (A-Z)</span>
                    {sortBy === 'name' && sortOrder === 'asc' && <span className="text-teal-600">✓</span>}
                  </button>
                  <button onClick={() => { setSortBy('name'); setSortOrder('desc'); setShowSortDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between">
                    <span>Name (Z-A)</span>
                    {sortBy === 'name' && sortOrder === 'desc' && <span className="text-teal-600">✓</span>}
                  </button>
                  <div className="border-t border-slate-200 my-1"></div>
                  <button onClick={() => { setSortBy('created_at'); setSortOrder('desc'); setShowSortDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between">
                    <span>Date (Newest First)</span>
                    {sortBy === 'created_at' && sortOrder === 'desc' && <span className="text-teal-600">✓</span>}
                  </button>
                  <button onClick={() => { setSortBy('created_at'); setSortOrder('asc'); setShowSortDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between">
                    <span>Date (Oldest First)</span>
                    {sortBy === 'created_at' && sortOrder === 'asc' && <span className="text-teal-600">✓</span>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200">
              {filterStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                  Status: {filterStatus}
                  <button onClick={() => setFilterStatus('all')} className="hover:text-teal-900"><X size={14} /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {filteredVendors.length === 0 ? (
            <div className="p-12">
              <EmptyState 
                icon={<Store size={64} className="text-slate-300" />}
                title={hasActiveFilters ? "No vendors found" : "No vendors yet"}
                description={hasActiveFilters ? "Try adjusting your filters" : "Add your first vendor to get started"}
                action={
                  hasActiveFilters ? (
                    <Button onClick={handleClearFilters} variant="secondary">Clear Filters</Button>
                  ) : (
                    <Button onClick={handleAddNew} variant="primary" icon={<Plus size={20} />}>Add First Vendor</Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-teal-50 to-amber-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">GSTIN</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Terms</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-teal-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">{vendor.name}</p>
                            {vendor.contact_person && (
                              <p className="text-sm text-slate-600 mt-1">{vendor.contact_person}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-sm">
                            {vendor.phone && (
                              <div className="flex items-center gap-2 text-slate-700">
                                <Phone size={14} className="text-slate-400" />
                                {vendor.phone}
                              </div>
                            )}
                            {vendor.email && (
                              <div className="flex items-center gap-2 text-slate-700">
                                <Mail size={14} className="text-slate-400" />
                                {vendor.email}
                              </div>
                            )}
                            {!vendor.phone && !vendor.email && <span className="text-slate-400">-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {(vendor.city || vendor.state) ? (
                            <div className="flex items-center gap-2 text-slate-700">
                              <MapPin size={14} className="text-slate-400" />
                              {[vendor.city, vendor.state].filter(Boolean).join(', ')}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {vendor.gstin ? (
                            <span className="font-mono text-sm text-slate-700">{vendor.gstin}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {vendor.payment_terms ? (
                            <div className="flex items-center gap-2 text-slate-700">
                              <CreditCard size={14} className="text-slate-400" />
                              <span className="text-sm">{vendor.payment_terms}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={normalizeBoolean(vendor.is_active) ? 'success' : 'neutral'} size="sm">
                            {normalizeBoolean(vendor.is_active) ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEdit(vendor)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Edit">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDeleteClick(vendor.id, vendor.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
                  <span className="text-slate-600">
                    Showing <span className="font-semibold text-slate-900">{filteredVendors.length}</span> of <span className="font-semibold text-slate-900">{vendors.length}</span> vendors
                  </span>
                  <span className="text-slate-600">
                    Active: <span className="font-semibold text-green-700">{stats.active}</span> • Inactive: <span className="font-semibold text-slate-500">{stats.inactive}</span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Filter Vendors</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-white hover:bg-white/20 p-1 rounded transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="all">All Vendors</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 rounded-b-2xl flex gap-3">
              <Button onClick={() => setFilterStatus('all')} variant="secondary" fullWidth>Clear</Button>
              <Button onClick={() => setShowFilterModal(false)} variant="primary" fullWidth className="bg-gradient-to-r from-teal-600 to-teal-700">Apply Filters</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-6 rounded-t-2xl flex items-center justify-between z-10">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                {editingVendor ? <Edit2 size={24} /> : <Plus size={24} />}
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>
              <button onClick={() => setShowModal(false)} disabled={saving} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Vendor Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter vendor name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Contact person name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="15-character GSTIN"
                  maxLength={15}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  rows={2}
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">State Code</label>
                  <input
                    type="text"
                    value={formData.state_code}
                    onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., 33"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Pincode"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Terms</label>
                <input
                  type="text"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="e.g., Net 30, Cash on Delivery"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={!!formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active Vendor</label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 px-8 py-4 rounded-b-2xl flex gap-3 border-t border-slate-200">
              <Button onClick={() => setShowModal(false)} variant="secondary" fullWidth disabled={saving}>Cancel</Button>
              <Button onClick={handleSubmit} variant="primary" fullWidth disabled={saving} className="bg-gradient-to-r from-teal-600 to-teal-700">
                {saving ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Add Vendor'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={showDeleteConfirm} 
        onClose={() => { setShowDeleteConfirm(false); setDeletingVendor(null); }} 
        onConfirm={handleDeleteConfirm} 
        title="Delete Vendor" 
        message={deletingVendor ? `Are you sure you want to delete "${deletingVendor.name}"? This cannot be undone.` : ''} 
        confirmText="Delete" 
        cancelText="Cancel" 
        variant="danger" 
      />
    </div>
  );
};

export default VendorsManagement;
