// FILE PATH: components/CustomersManagement.tsx
// Complete Customers Management with usage analytics, transaction history, outstanding tracking

'use client';
import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit2, Trash2, X, Search, Phone, Mail, 
  MapPin, FileText, TrendingUp, Eye, Download, Upload,
  Calendar, DollarSign, ShoppingCart, Package
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type Customer = {
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
  customer_type?: string;
  is_active: boolean | string | null;
  created_at: string;
};

type CustomerStats = {
  total_invoices: number;
  total_sales: number;
  total_paid: number;
  outstanding: number;
  last_sale_date?: string;
};

type Transaction = {
  id: string;
  type: 'invoice' | 'payment' | 'return';
  reference: string;
  date: string;
  amount: number;
  status?: string;
};

const CustomersManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerStats, setCustomerStats] = useState<Record<string, CustomerStats>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<{ id: string; name: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Customer>>({
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

  const normalizeBoolean = (value: boolean | string | null | undefined): boolean => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return true;
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);

      // Load stats for all customers
      if (data && data.length > 0) {
        await loadCustomerStats(data);
      }
    } catch (err: any) {
      console.error('Error loading customers:', err);
      toast.error('Failed to load', 'Could not load customers.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomerStats(customers: Customer[]) {
    const stats: Record<string, CustomerStats> = {};

    await Promise.all(
      customers.map(async (customer) => {
        // Get invoices
        const { data: invoices } = await supabase
          .from('sales_invoices')
          .select('total_amount, invoice_date')
          .eq('customer_id', customer.id);

        // Get payments
        const { data: payments } = await supabase
          .from('sales_payments')
          .select('amount, sales_invoices!inner(customer_id)')
          .eq('sales_invoices.customer_id', customer.id);

        const totalSales = (invoices || []).reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const totalPaid = (payments || []).reduce((sum, pay) => sum + (pay.amount || 0), 0);
        const lastSale = invoices && invoices.length > 0 
          ? invoices.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime())[0].invoice_date
          : undefined;

        stats[customer.id] = {
          total_invoices: invoices?.length || 0,
          total_sales: totalSales,
          total_paid: totalPaid,
          outstanding: totalSales - totalPaid,
          last_sale_date: lastSale
        };
      })
    );

    setCustomerStats(stats);
  }

  async function loadCustomerTransactions(customerId: string) {
    try {
      setLoadingTransactions(true);
      const txns: Transaction[] = [];

      // Load invoices
      const { data: invoices } = await supabase
        .from('sales_invoices')
        .select('id, invoice_number, invoice_date, total_amount, payment_status')
        .eq('customer_id', customerId)
        .order('invoice_date', { ascending: false })
        .limit(50);

      if (invoices) {
        invoices.forEach(inv => {
          txns.push({
            id: inv.id,
            type: 'invoice',
            reference: inv.invoice_number,
            date: inv.invoice_date,
            amount: inv.total_amount,
            status: inv.payment_status
          });
        });
      }

      // Load payments
      const { data: payments } = await supabase
        .from('sales_payments')
        .select('id, payment_number, payment_date, amount, sales_invoices!inner(customer_id)')
        .eq('sales_invoices.customer_id', customerId)
        .order('payment_date', { ascending: false })
        .limit(50);

      if (payments) {
        payments.forEach(pay => {
          txns.push({
            id: pay.id,
            type: 'payment',
            reference: pay.payment_number,
            date: pay.payment_date,
            amount: pay.amount
          });
        });
      }

      // Load returns
      const { data: returns } = await supabase
        .from('sales_returns')
        .select('id, return_number, return_date, total_amount')
        .eq('customer_id', customerId)
        .order('return_date', { ascending: false })
        .limit(50);

      if (returns) {
        returns.forEach(ret => {
          txns.push({
            id: ret.id,
            type: 'return',
            reference: ret.return_number,
            date: ret.return_date,
            amount: ret.total_amount
          });
        });
      }

      txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txns);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      toast.error('Failed to load', 'Could not load transaction history.');
    } finally {
      setLoadingTransactions(false);
    }
  }

  const handleAddNew = () => {
    setEditingCustomer(null);
    setFormData({ 
      name: '', contact_person: '', phone: '', email: '', gstin: '', 
      address: '', city: '', state: 'Tamil Nadu', state_code: '33', 
      pincode: '', customer_type: 'retail', is_active: true 
    });
    setShowModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      contact_person: customer.contact_person || '',
      phone: customer.phone || '',
      email: customer.email || '',
      gstin: customer.gstin || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || 'Tamil Nadu',
      state_code: customer.state_code || '33',
      pincode: customer.pincode || '',
      customer_type: customer.customer_type || 'retail',
      is_active: normalizeBoolean(customer.is_active)
    });
    setShowModal(true);
  };

  const handleView = async (customer: Customer) => {
    setViewingCustomer(customer);
    setShowViewModal(true);
    await loadCustomerTransactions(customer.id);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      if (!formData.name?.trim()) { 
        toast.warning('Name required', 'Please enter customer name.'); 
        return; 
      }
      
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({
            name: formData.name.trim(),
            contact_person: formData.contact_person?.trim() || null,
            phone: formData.phone?.trim() || null,
            email: formData.email?.trim() || null,
            gstin: formData.gstin?.trim() || null,
            address: formData.address?.trim() || null,
            city: formData.city?.trim() || null,
            state: formData.state?.trim() || null,
            state_code: formData.state_code?.trim() || null,
            pincode: formData.pincode?.trim() || null,
            customer_type: formData.customer_type || 'retail',
            is_active: formData.is_active
          })
          .eq('id', editingCustomer.id);

        if (error) throw error;
        toast.success('Updated!', `Customer "${formData.name}" has been updated.`);
      } else {
        const { error } = await supabase
          .from('customers')
          .insert({
            name: formData.name.trim(),
            contact_person: formData.contact_person?.trim() || null,
            phone: formData.phone?.trim() || null,
            email: formData.email?.trim() || null,
            gstin: formData.gstin?.trim() || null,
            address: formData.address?.trim() || null,
            city: formData.city?.trim() || null,
            state: formData.state?.trim() || null,
            state_code: formData.state_code?.trim() || null,
            pincode: formData.pincode?.trim() || null,
            customer_type: formData.customer_type || 'retail',
            is_active: formData.is_active
          });

        if (error) throw error;
        toast.success('Created!', `Customer "${formData.name}" has been created.`);
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

  const handleDeleteClick = (id: string, name: string) => { 
    setDeletingCustomer({ id, name }); 
    setShowDeleteConfirm(true); 
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return;
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', deletingCustomer.id);

      if (error) throw error;
      await loadCustomers();
      toast.success('Deleted', `Customer "${deletingCustomer.name}" has been deleted.`);
      setShowDeleteConfirm(false);
      setDeletingCustomer(null);
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      toast.error('Failed to delete', err.message || 'Could not delete customer.');
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Name', 'Contact Person', 'Phone', 'Email', 'GSTIN', 'City', 'State', 'Total Sales', 'Outstanding'].join(','),
      ...filteredCustomers.map(c => {
        const stats = customerStats[c.id] || { total_sales: 0, outstanding: 0 };
        return [
          c.name,
          c.contact_person || '',
          c.phone || '',
          c.email || '',
          c.gstin || '',
          c.city || '',
          c.state || '',
          stats.total_sales,
          stats.outstanding
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exported!', 'Customer data exported to CSV.');
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.contact_person && customer.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const isActive = normalizeBoolean(customer.is_active);
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? isActive : !isActive);

    return matchesSearch && matchesStatus;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const stats = {
    total: customers.length,
    active: customers.filter(c => normalizeBoolean(c.is_active)).length,
    inactive: customers.filter(c => !normalizeBoolean(c.is_active)).length,
    withGSTIN: customers.filter(c => c.gstin).length
  };

  const totalSales = Object.values(customerStats).reduce((sum, s) => sum + s.total_sales, 0);
  const totalOutstanding = Object.values(customerStats).reduce((sum, s) => sum + s.outstanding, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-700 font-medium">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 ${theme.classes.bgPrimaryLight} rounded-xl`}>
                <Users className={theme.classes.textPrimary} size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
                <p className="text-slate-600 text-sm mt-0.5">Manage customer information & track sales</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportCSV} variant="secondary" icon={<Download size={18} />}>
                Export
              </Button>
              <Button onClick={handleAddNew} variant="primary" icon={<Plus size={20} />}>
                Add Customer
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${theme.classes.bgPrimaryLight} rounded-xl p-4`}>
              <p className={`text-sm ${theme.classes.textPrimary} font-medium`}>Total Customers</p>
              <p className={`text-2xl font-bold ${theme.classes.textPrimary} mt-1`}>{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-green-600 font-medium">Total Sales</p>
              <p className="text-2xl font-bold text-green-700 mt-1">₹{totalSales.toLocaleString()}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-sm text-orange-600 font-medium">Outstanding</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">₹{totalOutstanding.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-600 font-medium">Active</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.active}</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <Card padding="md">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === 'all'
                    ? `${theme.classes.bgPrimary} text-white`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === 'inactive'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </Card>

        {/* Customers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="p-12">
              <EmptyState 
                icon={<Users size={64} />}
                title={searchTerm ? "No customers found" : "No customers yet"}
                description={searchTerm ? "Try adjusting your search" : "Add your first customer to get started"}
                action={
                  !searchTerm && (
                    <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                      Add First Customer
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${theme.classes.bgPrimaryLight} border-b border-slate-200`}>
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Location</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Sales</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Outstanding</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((customer) => {
                      const stats = customerStats[customer.id] || { total_invoices: 0, total_sales: 0, outstanding: 0 };
                      return (
                        <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">{customer.name}</p>
                              {customer.contact_person && (
                                <p className="text-sm text-slate-600">{customer.contact_person}</p>
                              )}
                              {customer.gstin && (
                                <Badge variant="neutral" size="sm" className="mt-1">GST</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1 text-sm">
                              {customer.phone && (
                                <div className="flex items-center gap-2 text-slate-700">
                                  <Phone size={14} className="text-slate-400" />
                                  {customer.phone}
                                </div>
                              )}
                              {customer.email && (
                                <div className="flex items-center gap-2 text-slate-700">
                                  <Mail size={14} className="text-slate-400" />
                                  {customer.email}
                                </div>
                              )}
                              {!customer.phone && !customer.email && <span className="text-slate-400">-</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {(customer.city || customer.state) ? (
                              <div className="flex items-center gap-2 text-slate-700">
                                <MapPin size={14} className="text-slate-400" />
                                {[customer.city, customer.state].filter(Boolean).join(', ')}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">₹{stats.total_sales.toLocaleString()}</p>
                              <p className="text-xs text-slate-500">{stats.total_invoices} invoices</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className={`font-semibold ${stats.outstanding > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              ₹{stats.outstanding.toLocaleString()}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={normalizeBoolean(customer.is_active) ? 'success' : 'neutral'} size="sm">
                              {normalizeBoolean(customer.is_active) ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleView(customer)} className={`p-2 ${theme.classes.textPrimary} hover:${theme.classes.bgPrimaryLight} rounded-lg`} title="View">
                                <Eye size={18} />
                              </button>
                              <button onClick={() => handleEdit(customer)} className={`p-2 ${theme.classes.textPrimary} hover:${theme.classes.bgPrimaryLight} rounded-lg`} title="Edit">
                                <Edit2 size={18} />
                              </button>
                              <button onClick={() => handleDeleteClick(customer.id, customer.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Showing <span className="font-semibold text-slate-900">{filteredCustomers.length}</span> of <span className="font-semibold text-slate-900">{customers.length}</span> customers
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h3>
                <button onClick={() => setShowModal(false)} disabled={saving} className="p-2 rounded-lg hover:bg-slate-100">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Customer Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Person</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                      placeholder="Contact person name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">GSTIN</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                    placeholder="15-character GSTIN"
                    maxLength={15}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
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
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">State Code</label>
                    <input
                      type="text"
                      value={formData.state_code}
                      onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                      placeholder="e.g., 33"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                      placeholder="Pincode"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={!!formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active Customer</label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={() => setShowModal(false)} variant="secondary" fullWidth disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} variant="primary" fullWidth loading={saving}>
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* View Modal with Transaction History */}
      {showViewModal && viewingCustomer && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{viewingCustomer.name}</h3>
                  {viewingCustomer.contact_person && (
                    <p className="text-slate-600">{viewingCustomer.contact_person}</p>
                  )}
                </div>
                <button onClick={() => setShowViewModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X size={24} />
                </button>
              </div>

              {/* Customer Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {(() => {
                  const stats = customerStats[viewingCustomer.id] || { total_invoices: 0, total_sales: 0, total_paid: 0, outstanding: 0 };
                  return (
                    <>
                      <div className="bg-blue-50 rounded-xl p-4">
                        <p className="text-sm text-blue-600 font-medium">Total Invoices</p>
                        <p className="text-2xl font-bold text-blue-700 mt-1">{stats.total_invoices}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-sm text-green-600 font-medium">Total Sales</p>
                        <p className="text-2xl font-bold text-green-700 mt-1">₹{stats.total_sales.toLocaleString()}</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4">
                        <p className="text-sm text-purple-600 font-medium">Total Paid</p>
                        <p className="text-2xl font-bold text-purple-700 mt-1">₹{stats.total_paid.toLocaleString()}</p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-4">
                        <p className="text-sm text-orange-600 font-medium">Outstanding</p>
                        <p className="text-2xl font-bold text-orange-700 mt-1">₹{stats.outstanding.toLocaleString()}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Transaction History */}
              <div className="border-t border-slate-200 pt-6">
                <h4 className="font-bold text-slate-900 mb-4">Transaction History</h4>
                {loadingTransactions ? (
                  <div className="py-8 text-center">
                    <LoadingSpinner />
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-lg">
                    No transactions found
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {transactions.map((txn) => (
                      <div key={txn.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                        txn.type === 'invoice' ? 'bg-blue-50 border-blue-200' :
                        txn.type === 'payment' ? 'bg-green-50 border-green-200' :
                        'bg-orange-50 border-orange-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          {txn.type === 'invoice' && <ShoppingCart size={16} className="text-blue-600" />}
                          {txn.type === 'payment' && <DollarSign size={16} className="text-green-600" />}
                          {txn.type === 'return' && <Package size={16} className="text-orange-600" />}
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{txn.reference}</p>
                            <p className="text-xs text-slate-600">{new Date(txn.date).toLocaleDateString()}</p>
                          </div>
                          {txn.status && (
                            <Badge variant={txn.status === 'paid' ? 'success' : 'warning'} size="sm">
                              {txn.status}
                            </Badge>
                          )}
                        </div>
                        <p className={`font-bold ${
                          txn.type === 'invoice' ? 'text-blue-600' :
                          txn.type === 'payment' ? 'text-green-600' :
                          'text-orange-600'
                        }`}>
                          {txn.type === 'payment' ? '+' : txn.type === 'return' ? '-' : ''}₹{txn.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                <Button onClick={() => setShowViewModal(false)} variant="secondary" fullWidth>
                  Close
                </Button>
                <Button onClick={() => { setShowViewModal(false); handleEdit(viewingCustomer); }} variant="primary" fullWidth>
                  Edit Customer
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog 
        isOpen={showDeleteConfirm} 
        onClose={() => { setShowDeleteConfirm(false); setDeletingCustomer(null); }} 
        onConfirm={handleDeleteConfirm} 
        title="Delete Customer" 
        message={deletingCustomer ? `Are you sure you want to delete "${deletingCustomer.name}"? This cannot be undone.` : ''} 
        confirmText="Delete" 
        cancelText="Cancel" 
        variant="danger" 
      />
    </div>
  );
};

export default CustomersManagement;
