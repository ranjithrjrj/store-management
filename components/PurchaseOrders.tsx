// FILE PATH: components/PurchaseOrders.tsx
// Purchase Orders Management with Select/Textarea components and improved mobile UX

'use client';
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Edit2, Trash2, X, Search, CheckCircle, Clock, XCircle, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Textarea, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type POItem = {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  rate: number;
  gst_rate: number;
  amount: number;
  received_quantity: number;
};

type PurchaseOrder = {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor?: { name: string };
  po_date: string;
  expected_delivery_date?: string;
  status: 'pending' | 'partial' | 'received' | 'cancelled';
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
};

const PurchaseOrders = () => {
  const { theme } = useTheme();
  const toast = useToast();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [deletingPO, setDeletingPO] = useState<{ id: string; po_number: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    vendor_id: '',
    po_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: ''
  });

  const [items, setItems] = useState<POItem[]>([]);
  const [isIntrastate, setIsIntrastate] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Load vendors
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      // Load items
      const { data: itemsData } = await supabase
        .from('items')
        .select('id, name, wholesale_price, gst_rate')
        .eq('is_active', true)
        .order('name');
      
      // Load purchase orders
      const { data: ordersData } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          vendor:vendors(name)
        `)
        .order('po_date', { ascending: false });
      
      setVendors(vendorsData || []);
      setAvailableItems(itemsData || []);
      setOrders(ordersData || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
      toast.error('Failed to load', 'Could not load purchase orders.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setEditingPO(null);
    setFormData({
      vendor_id: '',
      po_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      notes: ''
    });
    setItems([]);
    setShowModal(true);
  };

  const handleEdit = async (po: PurchaseOrder) => {
    try {
      setEditingPO(po);
      setFormData({
        vendor_id: po.vendor_id,
        po_date: po.po_date,
        expected_delivery_date: po.expected_delivery_date || '',
        notes: po.notes || ''
      });

      // Load PO items
      const { data: poItems } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('po_id', po.id);

      if (poItems) {
        const loadedItems: POItem[] = poItems.map(item => ({
          id: item.id,
          item_id: item.item_id,
          item_name: availableItems.find(i => i.id === item.item_id)?.name || '',
          quantity: item.quantity,
          rate: item.rate,
          gst_rate: item.gst_rate,
          amount: item.amount,
          received_quantity: item.received_quantity
        }));
        setItems(loadedItems);
      }

      // Set intrastate based on vendor
      const vendor = vendors.find(v => v.id === po.vendor_id);
      if (vendor) {
        setIsIntrastate(vendor.state_code === '33');
      }

      setShowModal(true);
    } catch (err: any) {
      console.error('Error loading PO:', err);
      toast.error('Failed to load', 'Could not load purchase order: ' + err.message);
    }
  };

  const addItem = () => {
    const newItem: POItem = {
      id: Date.now().toString(),
      item_id: '',
      item_name: '',
      quantity: 1,
      rate: 0,
      gst_rate: 0,
      amount: 0,
      received_quantity: 0
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        if (field === 'item_id') {
          const selectedItem = availableItems.find(i => i.id === value);
          if (selectedItem) {
            updated.item_name = selectedItem.name;
            updated.rate = selectedItem.wholesale_price;
            updated.gst_rate = selectedItem.gst_rate;
          }
        }
        
        // Recalculate amount
        const taxableAmount = updated.quantity * updated.rate;
        const gstAmount = (taxableAmount * updated.gst_rate) / 100;
        updated.amount = taxableAmount + gstAmount;
        
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const totalGst = items.reduce((sum, item) => {
      const taxableAmount = item.quantity * item.rate;
      return sum + (taxableAmount * item.gst_rate / 100);
    }, 0);

    const total = subtotal + totalGst;

    if (isIntrastate) {
      return {
        subtotal,
        cgst: totalGst / 2,
        sgst: totalGst / 2,
        igst: 0,
        total
      };
    } else {
      return {
        subtotal,
        cgst: 0,
        sgst: 0,
        igst: totalGst,
        total
      };
    }
  };

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setFormData({ ...formData, vendor_id: vendorId });
      setIsIntrastate(vendor.state_code === '33');
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.vendor_id || items.length === 0) {
        toast.warning('Missing information', 'Please select vendor and add items');
        return;
      }

      const totals = calculateTotals();

      if (editingPO) {
        // UPDATE existing PO
        const poData = {
          vendor_id: formData.vendor_id,
          po_date: formData.po_date,
          expected_delivery_date: formData.expected_delivery_date || null,
          subtotal: totals.subtotal,
          cgst_amount: totals.cgst,
          sgst_amount: totals.sgst,
          igst_amount: totals.igst,
          total_amount: totals.total,
          notes: formData.notes || null
        };

        const { error: poError } = await supabase
          .from('purchase_orders')
          .update(poData)
          .eq('id', editingPO.id);

        if (poError) throw poError;

        // Delete existing items
        await supabase
          .from('purchase_order_items')
          .delete()
          .eq('po_id', editingPO.id);

        // Insert updated items
        const poItems = items.map(item => ({
          po_id: editingPO.id,
          item_id: item.item_id,
          quantity: item.quantity,
          rate: item.rate,
          gst_rate: item.gst_rate,
          amount: item.amount,
          received_quantity: 0
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(poItems);

        if (itemsError) throw itemsError;

        toast.success('Updated!', `Purchase Order ${editingPO.po_number} has been updated.`);
      } else {
        // CREATE new PO
        const poNumber = `PO-${Date.now()}`;

        const poData = {
          po_number: poNumber,
          vendor_id: formData.vendor_id,
          po_date: formData.po_date,
          expected_delivery_date: formData.expected_delivery_date || null,
          status: 'pending',
          subtotal: totals.subtotal,
          cgst_amount: totals.cgst,
          sgst_amount: totals.sgst,
          igst_amount: totals.igst,
          total_amount: totals.total,
          notes: formData.notes || null
        };

        const { data: po, error: poError } = await supabase
          .from('purchase_orders')
          .insert(poData)
          .select()
          .single();

        if (poError) throw poError;

        // Insert PO items
        const poItems = items.map(item => ({
          po_id: po.id,
          item_id: item.item_id,
          quantity: item.quantity,
          rate: item.rate,
          gst_rate: item.gst_rate,
          amount: item.amount,
          received_quantity: 0
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(poItems);

        if (itemsError) throw itemsError;

        toast.success('Created!', `Purchase Order ${poNumber} has been created.`);
      }

      await loadData();
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving PO:', err);
      toast.error('Failed to save', err.message || 'Could not save purchase order.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string, poNumber: string) => {
    setDeletingPO({ id, po_number: poNumber });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPO) return;

    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', deletingPO.id);

      if (error) throw error;
      await loadData();
      toast.success('Deleted', `PO ${deletingPO.po_number} has been deleted.`);
      setShowDeleteConfirm(false);
      setDeletingPO(null);
    } catch (err: any) {
      console.error('Error deleting PO:', err);
      toast.error('Failed to delete', err.message || 'Could not delete purchase order.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'warning' as const, label: 'Pending' },
      partial: { variant: 'primary' as const, label: 'Partial' },
      received: { variant: 'success' as const, label: 'Received' },
      cancelled: { variant: 'danger' as const, label: 'Cancelled' }
    };
    const config = statusMap[status as keyof typeof statusMap] || { variant: 'neutral' as const, label: status };
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-gray-600 text-sm mt-1">Manage purchase orders from vendors</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <ShoppingCart size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="font-bold text-red-800 mb-2">Failed to Load Orders</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={loadData} variant="primary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  const totals = items.length > 0 ? calculateTotals() : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-gray-600 text-sm mt-1">Manage purchase orders from vendors</p>
        </div>
        <Button
          onClick={handleAddNew}
          disabled={loading}
          variant="primary"
          size="md"
          icon={<Plus size={18} />}
        >
          Create PO
        </Button>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              leftIcon={<Search size={18} />}
              rightIcon={searchTerm ? (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              ) : undefined}
              placeholder="Search POs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card padding="none">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" text="Loading orders..." />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<ShoppingCart size={48} />}
              title={searchTerm || filterStatus !== 'all' ? "No orders found" : "No purchase orders yet"}
              description={
                searchTerm || filterStatus !== 'all'
                  ? "Try adjusting your filters"
                  : "Get started by creating your first purchase order"
              }
              action={
                !searchTerm && filterStatus === 'all' ? (
                  <Button onClick={handleAddNew} variant="primary" icon={<Plus size={18} />}>
                    Create Your First PO
                  </Button>
                ) : (
                  <Button onClick={() => { setSearchTerm(''); setFilterStatus('all'); }} variant="secondary">
                    Clear Filters
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Expected</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.po_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.vendor?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(order.po_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                      {order.expected_delivery_date 
                        ? new Date(order.expected_delivery_date).toLocaleDateString('en-IN')
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ₹{order.total_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(order)}
                          className={`${theme.classes.textPrimary} hover:${theme.classes.bgPrimaryLight} p-2 rounded-lg transition-colors`}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(order.id, order.po_number)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
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
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingPO(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase Order"
        message={deletingPO ? `Are you sure you want to delete PO ${deletingPO.po_number}? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Create PO Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <div className="bg-white rounded-lg max-w-4xl w-full">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingPO ? `Edit Purchase Order ${editingPO.po_number}` : 'Create Purchase Order'}
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
                {/* Vendor Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Vendor"
                    value={formData.vendor_id}
                    onChange={(e) => handleVendorChange(e.target.value)}
                    required
                  >
                    <option value="">Select vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                    ))}
                  </Select>

                  <Input
                    label="PO Date"
                    type="date"
                    value={formData.po_date}
                    onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
                  />

                  <Input
                    label="Expected Delivery"
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                  />
                </div>

                {/* Items */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-900">Items</h4>
                    <button
                      onClick={addItem}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Item
                    </button>
                  </div>

                  {items.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <p className="text-gray-500 text-sm">No items added</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Header Row */}
                      <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Item Name</div>
                        <div className="text-xs font-semibold text-gray-600 uppercase">Quantity</div>
                        <div className="text-xs font-semibold text-gray-600 uppercase">Rate (₹)</div>
                      </div>

                      {items.map((item, index) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Item #{index + 1}</span>
                            <button onClick={() => removeItem(item.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="col-span-2 relative">
                              <input
                                type="text"
                                value={item.item_name}
                                onChange={(e) => {
                                  const searchTerm = e.target.value;
                                  setItems(items.map(i => i.id === item.id ? {...i, item_name: searchTerm} : i));
                                }}
                                onFocus={(e) => {
                                  const dropdown = document.getElementById(`dropdown-${item.id}`);
                                  if (dropdown) dropdown.style.display = 'block';
                                }}
                                onBlur={(e) => {
                                  setTimeout(() => {
                                    const dropdown = document.getElementById(`dropdown-${item.id}`);
                                    if (dropdown) dropdown.style.display = 'none';
                                  }, 200);
                                }}
                                placeholder="Type to search..."
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                              />
                              {/* Custom Dropdown */}
                              <div
                                id={`dropdown-${item.id}`}
                                className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto hidden"
                                style={{ display: 'none' }}
                              >
                                {availableItems
                                  .filter(i => i.name.toLowerCase().includes(item.item_name.toLowerCase()))
                                  .slice(0, 50)
                                  .map(availItem => (
                                    <div
                                      key={availItem.id}
                                      onClick={() => {
                                        updateItem(item.id, 'item_id', availItem.id);
                                        const dropdown = document.getElementById(`dropdown-${item.id}`);
                                        if (dropdown) dropdown.style.display = 'none';
                                      }}
                                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                                    >
                                      <div className="font-medium text-gray-900">{availItem.name}</div>
                                      <div className="text-xs text-gray-500">Rate: ₹{availItem.wholesale_price} | GST: {availItem.gst_rate}%</div>
                                    </div>
                                  ))}
                                {availableItems.filter(i => i.name.toLowerCase().includes(item.item_name.toLowerCase())).length === 0 && (
                                  <div className="px-3 py-2 text-sm text-gray-500">No items found</div>
                                )}
                              </div>
                            </div>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              placeholder="Qty"
                              className="px-2 py-1.5 text-sm border border-gray-300 rounded text-gray-900 placeholder:text-gray-400"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              placeholder="Rate"
                              className="px-2 py-1.5 text-sm border border-gray-300 rounded text-gray-900 placeholder:text-gray-400"
                            />
                          </div>
                          {/* Show calculated amount */}
                          <div className="mt-2 text-right">
                            <span className="text-xs text-gray-600">Amount: </span>
                            <span className="text-sm font-semibold text-gray-900">₹{item.amount.toFixed(2)}</span>
                            <span className="text-xs text-gray-500 ml-2">(GST: {item.gst_rate}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <Textarea
                  label="Notes"
                  placeholder="Additional notes (optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />

                {/* Totals */}
                {totals && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="max-w-sm ml-auto space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                      </div>
                      {isIntrastate ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>CGST:</span>
                            <span>₹{totals.cgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>SGST:</span>
                            <span>₹{totals.sgst.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-sm">
                          <span>IGST:</span>
                          <span>₹{totals.igst.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total:</span>
                        <span>₹{totals.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                    variant="secondary"
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={saving || !formData.vendor_id || items.length === 0}
                    variant="primary"
                    fullWidth
                  >
                    {saving ? 'Saving...' : (editingPO ? 'Update Purchase Order' : 'Create Purchase Order')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
