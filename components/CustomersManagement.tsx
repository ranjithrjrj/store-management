// FILE PATH: components/CustomersManagement.tsx

import React, { useState } from 'react';
import { UserCircle, Plus, Edit2, Trash2, X, Search } from 'lucide-react';

type Customer = {
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
  customer_type: 'retail' | 'wholesale' | 'b2b';
  is_active: boolean;
};

const CustomersManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'retail' | 'wholesale' | 'b2b'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Customer>({
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
    customer_type: 'retail',
    is_active: true
  });

  // Mock data
  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'Lakshmi Store',
      contact_person: 'Lakshmi Devi',
      phone: '9876543210',
      email: 'lakshmi@store.com',
      gstin: '33XXXXX1234X1Z1',
      address: '45 Market Road',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      state_code: '33',
      pincode: '641002',
      customer_type: 'wholesale',
      is_active: true
    },
    {
      id: '2',
      name: 'Ram Prasad',
      contact_person: 'Ram Prasad',
      phone: '9876543211',
      email: '',
      gstin: '',
      address: '123 Temple Street',
      city: 'Mettupalayam',
      state: 'Tamil Nadu',
      state_code: '33',
      pincode: '641301',
      customer_type: 'retail',
      is_active: true
    },
    {
      id: '3',
      name: 'Devi Traders',
      contact_person: 'Suresh Kumar',
      phone: '9876543212',
      email: 'suresh@devitraders.com',
      gstin: '33XXXXX5678X1Z5',
      address: '789 Main Bazaar',
      city: 'Ooty',
      state: 'Tamil Nadu',
      state_code: '33',
      pincode: '643001',
      customer_type: 'b2b',
      is_active: true
    },
    {
      id: '4',
      name: 'Mumbai Retail Hub',
      contact_person: 'Anil Sharma',
      phone: '9876543213',
      email: 'anil@mumbairetail.com',
      gstin: '27XXXXX9012X1Z9',
      address: '456 Commerce Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      state_code: '27',
      pincode: '400001',
      customer_type: 'b2b',
      is_active: true
    }
  ];

  const [customers, setCustomers] = useState(mockCustomers);

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
    setEditingCustomer(null);
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
      customer_type: 'retail',
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === editingCustomer.id ? formData : c));
    } else {
      setCustomers([...customers, { ...formData, id: Date.now().toString() }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const handleStateChange = (stateName: string) => {
    const state = indianStates.find(s => s.name === stateName);
    if (state) {
      setFormData({ ...formData, state: stateName, state_code: state.code });
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || customer.customer_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const typeColors = {
    retail: 'bg-green-100 text-green-800',
    wholesale: 'bg-blue-100 text-blue-800',
    b2b: 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <p className="text-gray-600 text-sm mt-1">Manage customer information and GSTIN</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border-0 focus:ring-0 focus:outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="b2b">B2B</option>
          </select>
        </div>
      </div>

      {/* Customers Grid - Mobile Friendly */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <UserCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  {customer.contact_person && customer.contact_person !== customer.name && (
                    <p className="text-sm text-gray-600">{customer.contact_person}</p>
                  )}
                </div>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded ${typeColors[customer.customer_type]}`}>
                {customer.customer_type.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Phone:</span>
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">Email:</span>
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.gstin && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">GSTIN:</span>
                  <span className="font-mono text-xs">{customer.gstin}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Location:</span>
                <span>{customer.city}, {customer.state}</span>
              </div>
              {customer.state_code !== '33' && (
                <div className="mt-2">
                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">Interstate</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleEdit(customer)}
                className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Edit2 size={14} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(customer.id)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No customers found. Add your first customer to get started.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
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
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Customer or business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
                  <select
                    value={formData.customer_type}
                    onChange={(e) => setFormData({ ...formData, customer_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="b2b">B2B</option>
                  </select>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN (for B2B)</label>
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

              {/* Status */}
              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Customer is active</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
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

export default CustomersManagement;