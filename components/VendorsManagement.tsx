// FILE PATH: components/VendorsManagement.tsx

import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, X, Search, Building } from 'lucide-react';

type Vendor = {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  state_code: string;
  pincode: string;
  payment_terms: string;
  is_active: boolean;
};

const VendorsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<Vendor>({
    id: '',
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
    payment_terms: 'Net 30 days',
    is_active: true
  });

  // Mock data
  const mockVendors: Vendor[] = [
    {
      id: '1',
      name: 'Sri Krishna Suppliers',
      contact_person: 'Ramesh Kumar',
      phone: '9876543210',
      email: 'ramesh@skrishna.com',
      gstin: '33XXXXX1234X1Z5',
      address: '123 Main Street',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      state_code: '33',
      pincode: '641001',
      payment_terms: 'Net 30 days',
      is_active: true
    },
    {
      id: '2',
      name: 'Divine Traders',
      contact_person: 'Priya Sharma',
      phone: '9876543211',
      email: 'contact@divinetraders.com',
      gstin: '33XXXXX5678X1Z9',
      address: '456 Temple Road',
      city: 'Mettupalayam',
      state: 'Tamil Nadu',
      state_code: '33',
      pincode: '641301',
      payment_terms: 'Net 15 days',
      is_active: true
    },
    {
      id: '3',
      name: 'Mumbai Wholesale',
      contact_person: 'Anil Mehta',
      phone: '9876543212',
      email: 'anil@mumbai.com',
      gstin: '27XXXXX9012X1Z3',
      address: '789 Market Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      state_code: '27',
      pincode: '400001',
      payment_terms: 'Cash on Delivery',
      is_active: true
    }
  ];

  const [vendors, setVendors] = useState(mockVendors);

  const indianStates = [
    { name: 'Tamil Nadu', code: '33' },
    { name: 'Maharashtra', code: '27' },
    { name: 'Karnataka', code: '29' },
    { name: 'Kerala', code: '32' },
    { name: 'Andhra Pradesh', code: '37' },
    { name: 'Telangana', code: '36' },
    { name: 'Gujarat', code: '24' },
    { name: 'Rajasthan', code: '08' },
    { name: 'Delhi', code: '07' }
  ];

  const handleAddNew = () => {
    setEditingVendor(null);
    setFormData({
      id: '',
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
      payment_terms: 'Net 30 days',
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData(vendor);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingVendor) {
      setVendors(vendors.map(v => v.id === editingVendor.id ? formData : v));
    } else {
      setVendors([...vendors, { ...formData, id: Date.now().toString() }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      setVendors(vendors.filter(v => v.id !== id));
    }
  };

  const handleStateChange = (stateName: string) => {
    const state = indianStates.find(s => s.name === stateName);
    if (state) {
      setFormData({ ...formData, state: stateName, state_code: state.code });
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.phone.includes(searchTerm) ||
    vendor.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendors</h2>
          <p className="text-gray-600 text-sm mt-1">Manage vendor information and GSTIN</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          Add Vendor
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border-0 focus:ring-0 focus:outline-none"
          />
        </div>
      </div>

      {/* Vendors Grid - Mobile Friendly */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((vendor) => (
          <div key={vendor.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Building size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                  <p className="text-sm text-gray-600">{vendor.contact_person}</p>
                </div>
              </div>
              {vendor.state_code !== '33' && (
                <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">Interstate</span>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Phone:</span>
                <span>{vendor.phone}</span>
              </div>
              {vendor.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">Email:</span>
                  <span className="truncate">{vendor.email}</span>
                </div>
              )}
              {vendor.gstin && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">GSTIN:</span>
                  <span className="font-mono text-xs">{vendor.gstin}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Location:</span>
                <span>{vendor.city}, {vendor.state}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Terms:</span>
                <span>{vendor.payment_terms}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleEdit(vendor)}
                className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Edit2 size={14} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(vendor.id)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No vendors found. Add your first vendor to get started.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Sri Krishna Suppliers"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Contact person name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    placeholder="33XXXXX1234X1Z5"
                    maxLength={15}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900">Address</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select
                      value={formData.state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {indianStates.map(state => (
                        <option key={state.code} value={state.name}>{state.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Net 30 days, Cash on Delivery"
                />
              </div>

              {/* Status */}
              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Vendor is active</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
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

export default VendorsManagement;