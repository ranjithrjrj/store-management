// FILE PATH: components/SalesOrders.tsx
// Sales Orders - Create and manage sales orders, convert to invoices

'use client';
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, X, Eye, Edit2, Trash2, CheckCircle, User, Package, Calendar, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type OrderItem = {
  id: string;
  item_id: string;
  item_name: string;
  available_stock: number;
  quantity: number;
  rate: number;
  discount_percent: number;
  gst_rate: number;
  amount: number;
};

type SalesOrder = {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_gstin?: string;
  customer_state: string;
  order_date: string;
  expected_delivery?: string;
  subtotal: number;
  discount_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'converted';
  notes?: string;
  created_at: string;
};

type SalesOrdersProps = {
  onNavigate?: (page: 'sales') => void;
};

const SalesOrders = ({ onNavigate }: SalesOrdersProps = {}) => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<SalesOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<{ id: string; order_number: string } | null>(null);
  const [convertingOrder, setConvertingOrder] = useState<SalesOrder | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_gstin: '',
    customer_state: 'Tamil Nadu',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery: '',
    notes: '',
    status: 'pending' as 'pending' | 'confirmed' | 'converted'
  });

  const [items, setItems] = useState<OrderItem[]>([]);
  const [isIntrastate, setIsIntrastate] = useState(true);

  const [customers, setCustomers] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();
    loadData();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      toast.error('Failed to load', 'Could not load sales orders.');
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    try {
      const [customersData, itemsData] = await Promise.all([
        supabase.from('customers').select('*').eq('is_active', true).order('name'),
        supabase.from('items').select(`
          id, name, gst_rate, retail_price, discount_percent,
          unit:units(abbreviation)
        `).eq('is_active', true).order('name')
      ]);

      setCustomers(customersData.data || []);
      setAvailableItems(itemsData.data || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
    }
  }

  async function getItemStock(itemId: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('inventory_batches')
        .select('quantity')
        .eq('item_id', itemId)
        .gt('quantity', 0);
      
      return data?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
    } catch (err) {
      console.error('Error getting stock:', err);
      return 0;
    }
  }

  async function loadOrderItems(orderId: string) {
    try {
      setLoadingItems(true);
      
      const { data, error } = await supabase
        .from('sales_order_items')
        .select(`
          *,
          item:items(name)
        `)
        .eq('order_id', orderId);

      if (error) throw error;
      
      const itemsWithNames = data?.map(item => ({
        ...item,
        item_name: item.item?.name || 'Unknown Item'
      })) || [];
      
      setOrderItems(itemsWithNames);
    } catch (err: any) {
      console.error('Error loading items:', err);
    } finally {
      setLoadingItems(false);
    }
  }

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customer_name: customer.name,
        customer_phone: customer.phone || '',
        customer_gstin: customer.gstin || '',
        customer_state: customer.state || 'Tamil Nadu'
      });
      setIsIntrastate(customer.state === 'Tamil Nadu');
    }
  };

  const addItem = async (itemId: string) => {
    const selectedItem = availableItems.find(i => i.id === itemId);
    if (!selectedItem) return;

    const stock = await getItemStock(itemId);
    if (stock <= 0) {
      toast.warning('Out of stock', `${selectedItem.name} is currently out of stock.`);
      return;
    }

    const existingItem = items.find(i => i.item_id === itemId);
    if (existingItem) {
      toast.warning('Already added', 'This item is already in the order.');
      return;
    }

    const newItem: OrderItem = {
      id: Date.now().toString(),
      item_id: itemId,
      item_name: selectedItem.name,
      available_stock: stock,
      quantity: 1,
      rate: selectedItem.retail_price,
      discount_percent: selectedItem.discount_percent || 0,
      gst_rate: selectedItem.gst_rate,
      amount: selectedItem.retail_price
    };

    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: string, value: number) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };

      if (field === 'quantity' && value > item.available_stock) {
        toast.warning('Insufficient stock', `Only ${item.available_stock} units available.`);
        return item;
      }

      const subtotal = updated.quantity * updated.rate;
      const discountAmount = (subtotal * updated.discount_percent) / 100;
      updated.amount = subtotal - discountAmount;

      return updated;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const discountAmount = items.reduce((sum, item) => sum + ((item.quantity * item.rate * item.discount_percent) / 100), 0);
    const taxableAmount = subtotal - discountAmount;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    items.forEach(item => {
      const itemTaxable = item.amount;
      const taxAmount = (itemTaxable * item.gst_rate) / 100;
      
      if (isIntrastate) {
        cgst += taxAmount / 2;
        sgst += taxAmount / 2;
      } else {
        igst += taxAmount;
      }
    });

    const total = taxableAmount + cgst + sgst + igst;

    return { subtotal, discountAmount, taxableAmount, cgst, sgst, igst, total };
  };

  const handleAddOrder = () => {
    setEditingOrder(null);
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_gstin: '',
      customer_state: 'Tamil Nadu',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery: '',
      notes: '',
      status: 'pending'
    });
    setItems([]);
    setIsIntrastate(true);
    setShowAddModal(true);
  };

  const handleEdit = async (order: SalesOrder) => {
    setEditingOrder(order);
    setFormData({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone || '',
      customer_gstin: order.customer_gstin || '',
      customer_state: order.customer_state,
      order_date: order.order_date,
      expected_delivery: order.expected_delivery || '',
      notes: order.notes || '',
      status: order.status
    });
    setIsIntrastate(order.customer_state === 'Tamil Nadu');
    
    await loadOrderItems(order.id);
    
    const loadedItems = await Promise.all(
      orderItems.map(async (item) => {
        const stock = await getItemStock(item.item_id);
        return {
          id: item.id,
          item_id: item.item_id,
          item_name: item.item_name,
          available_stock: stock,
          quantity: item.quantity,
          rate: item.rate,
          discount_percent: item.discount_percent,
          gst_rate: item.gst_rate,
          amount: item.total_amount
        };
      })
    );
    
    setItems(loadedItems);
    setShowEditModal(true);
  };

  const handleSaveOrder = async () => {
    if (items.length === 0) {
      toast.warning('Add items', 'Please add at least one item.');
      return;
    }
    if (!formData.customer_name.trim()) {
      toast.warning('Customer name required', 'Please enter customer name.');
      return;
    }

    try {
      setSaving(true);
      const totals = calculateTotals();

      if (editingOrder) {
        // Update existing order
        const { error: orderError } = await supabase
          .from('sales_orders')
          .update({
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone || null,
            customer_gstin: formData.customer_gstin || null,
            customer_state: formData.customer_state,
            order_date: formData.order_date,
            expected_delivery: formData.expected_delivery || null,
            subtotal: totals.subtotal,
            discount_amount: totals.discountAmount,
            cgst_amount: totals.cgst,
            sgst_amount: totals.sgst,
            igst_amount: totals.igst,
            total_amount: totals.total,
            status: formData.status,
            notes: formData.notes
          })
          .eq('id', editingOrder.id);

        if (orderError) throw orderError;

        // Delete old items
        await supabase.from('sales_order_items').delete().eq('order_id', editingOrder.id);

        // Insert new items
        const orderItems = items.map(item => ({
          order_id: editingOrder.id,
          item_id: item.item_id,
          quantity: item.quantity,
          rate: item.rate,
          discount_percent: item.discount_percent,
          gst_rate: item.gst_rate,
          total_amount: item.amount
        }));

        const { error: itemsError } = await supabase
          .from('sales_order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        toast.success('Updated!', `Order ${editingOrder.order_number} has been updated.`);
        setShowEditModal(false);
      } else {
        // Create new order
        const orderNumber = `SO-${Date.now()}`;

        const { data: order, error: orderError } = await supabase
          .from('sales_orders')
          .insert({
            order_number: orderNumber,
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone || null,
            customer_gstin: formData.customer_gstin || null,
            customer_state: formData.customer_state,
            order_date: formData.order_date,
            expected_delivery: formData.expected_delivery || null,
            subtotal: totals.subtotal,
            discount_amount: totals.discountAmount,
            cgst_amount: totals.cgst,
            sgst_amount: totals.sgst,
            igst_amount: totals.igst,
            total_amount: totals.total,
            status: 'pending',
            notes: formData.notes
          })
          .select()
          .single();

        if (orderError) throw orderError;

        const orderItems = items.map(item => ({
          order_id: order.id,
          item_id: item.item_id,
          quantity: item.quantity,
          rate: item.rate,
          discount_percent: item.discount_percent,
          gst_rate: item.gst_rate,
          total_amount: item.amount
        }));

        const { error: itemsError } = await supabase
          .from('sales_order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        toast.success('Order created!', `Order ${orderNumber} has been created.`);
        setShowAddModal(false);
      }

      await loadOrders();
      setItems([]);
    } catch (err: any) {
      console.error('Error saving order:', err);
      toast.error('Failed to save', err.message || 'Could not save order.');
    } finally {
      setSaving(false);
    }
  };

  const handleView = async (order: SalesOrder) => {
    setViewingOrder(order);
    setShowViewModal(true);
    await loadOrderItems(order.id);
  };

  const handleDeleteClick = (order: SalesOrder) => {
    if (order.status === 'converted') {
      toast.warning('Cannot delete', 'Converted orders cannot be deleted.');
      return;
    }
    setDeletingOrder({ id: order.id, order_number: order.order_number });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingOrder) return;

    try {
      const { error } = await supabase
        .from('sales_orders')
        .delete()
        .eq('id', deletingOrder.id);

      if (error) throw error;

      toast.success('Deleted!', `Order ${deletingOrder.order_number} has been deleted.`);
      await loadOrders();
    } catch (err: any) {
      console.error('Error deleting order:', err);
      toast.error('Failed to delete', err.message || 'Could not delete order.');
    } finally {
      setShowDeleteConfirm(false);
      setDeletingOrder(null);
    }
  };

  const handleConvertClick = (order: SalesOrder) => {
    if (order.status === 'converted') {
      toast.warning('Already converted', 'This order has already been converted to an invoice.');
      return;
    }
    setConvertingOrder(order);
    setShowConvertConfirm(true);
  };

  const handleConvertConfirm = async () => {
    if (!convertingOrder) return;

    try {
      // Load order items
      const { data: orderItemsData } = await supabase
        .from('sales_order_items')
        .select(`
          *,
          item:items(id, name, gst_rate)
        `)
        .eq('order_id', convertingOrder.id);

      const items = orderItemsData?.map(item => ({
        item_id: item.item_id,
        item_name: item.item?.name || '',
        quantity: item.quantity,
        rate: item.rate,
        discount_percent: item.discount_percent,
        gst_rate: item.gst_rate
      })) || [];

      // Store order data in sessionStorage for Sales Invoice page to pick up
      const orderData = {
        order_id: convertingOrder.id,
        order_number: convertingOrder.order_number,
        customer_name: convertingOrder.customer_name,
        customer_phone: convertingOrder.customer_phone || '',
        customer_gstin: convertingOrder.customer_gstin || '',
        customer_state: convertingOrder.customer_state,
        order_date: convertingOrder.order_date,
        notes: `Converted from ${convertingOrder.order_number}`,
        items: items
      };

      sessionStorage.setItem('converting_order', JSON.stringify(orderData));

      // Mark order as converted
      await supabase
        .from('sales_orders')
        .update({ status: 'converted' })
        .eq('id', convertingOrder.id);

      toast.success('Opening Sales Invoice', 'Loading order data...');
      setShowConvertConfirm(false);
      setConvertingOrder(null);
      await loadOrders();

      // Navigate to Sales Invoice page
      if (onNavigate) {
        setTimeout(() => {
          onNavigate('sales');
        }, 500);
      } else {
        // Fallback message if navigation not available
        setTimeout(() => {
          toast.info('Next Step', 'Please go to Sales Invoice page to complete the invoice.');
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error converting order:', err);
      toast.error('Failed to convert', err.message || 'Could not convert order.');
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusColors: any = {
    pending: 'warning',
    confirmed: 'primary',
    converted: 'success'
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600 font-medium">Loading sales orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="text-blue-700" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Sales Orders</h1>
                <p className="text-slate-600 text-sm mt-0.5">Create and manage sales orders</p>
              </div>
            </div>
            <Button
              onClick={handleAddOrder}
              variant="primary"
              icon={<Plus size={20} />}
            >
              Add Order
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card padding="md">
            <Input
              placeholder="Search by order number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
              rightIcon={searchTerm ? (
                <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              ) : undefined}
            />
          </Card>
          <Card padding="md">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="converted">Converted</option>
            </Select>
          </Card>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FileText size={64} />}
              title={searchTerm || filterStatus !== 'all' ? "No orders found" : "No sales orders yet"}
              description={
                searchTerm || filterStatus !== 'all'
                  ? "Try adjusting your search or filters"
                  : "Sales orders will appear here once you create them"
              }
              action={
                !searchTerm && filterStatus === 'all' ? (
                  <Button onClick={handleAddOrder} variant="primary" icon={<Plus size={18} />}>
                    Create First Order
                  </Button>
                ) : null
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <Card key={order.id} hover padding="lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{order.order_number}</h3>
                        <p className="text-sm text-slate-600">{order.customer_name}</p>
                      </div>
                      <Badge variant={statusColors[order.status]} size="sm">
                        {order.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 font-medium">Date</p>
                        <p className="text-slate-900 font-semibold">{new Date(order.order_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Amount</p>
                        <p className="text-blue-600 font-bold text-lg">₹{order.total_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">State</p>
                        <p className="text-slate-900 font-semibold">{order.customer_state}</p>
                      </div>
                      {order.expected_delivery && (
                        <div>
                          <p className="text-slate-500 font-medium">Delivery</p>
                          <p className="text-slate-900 font-semibold">{new Date(order.expected_delivery).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(order)}
                      className="p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      title="View"
                    >
                      <Eye size={18} />
                    </button>
                    {order.status !== 'converted' && (
                      <>
                        <button
                          onClick={() => handleEdit(order)}
                          className="p-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleConvertClick(order)}
                          className="p-2.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          title="Convert to Invoice"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(order)}
                          className="p-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingOrder ? 'Edit Order' : 'Create Sales Order'}
                </h3>
                <button
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Details */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Customer Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Customer Name</label>
                      <Input
                        placeholder="Type to search or enter name..."
                        list="customers-list"
                        value={formData.customer_name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, customer_name: value });
                          
                          const customer = customers.find(c => c.name === value);
                          if (customer) {
                            handleCustomerChange(customer.id);
                          }
                        }}
                        leftIcon={<User size={18} />}
                      />
                      <datalist id="customers-list">
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.name} />
                        ))}
                      </datalist>
                    </div>
                    <Input
                      label="Phone"
                      placeholder="Optional"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    />
                    <Input
                      label="GSTIN"
                      placeholder="Optional"
                      value={formData.customer_gstin}
                      onChange={(e) => setFormData({ ...formData, customer_gstin: e.target.value })}
                    />
                    <Input
                      label="State"
                      placeholder="State"
                      value={formData.customer_state}
                      onChange={(e) => {
                        setFormData({ ...formData, customer_state: e.target.value });
                        setIsIntrastate(e.target.value === 'Tamil Nadu');
                      }}
                    />
                    <Input
                      label="Expected Delivery"
                      type="date"
                      value={formData.expected_delivery}
                      onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
                      leftIcon={<Calendar size={18} />}
                    />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Items</h4>
                  <div className="mb-4">
                    <Input
                      placeholder="Type to search items..."
                      list="items-list"
                      onChange={(e) => {
                        const value = e.target.value;
                        const item = availableItems.find(i => i.name === value);
                        if (item) {
                          addItem(item.id);
                          e.target.value = '';
                        }
                      }}
                      leftIcon={<Package size={18} />}
                    />
                    <datalist id="items-list">
                      {availableItems.map(item => (
                        <option key={item.id} value={item.name}>
                          ₹{item.retail_price} ({item.unit?.abbreviation})
                        </option>
                      ))}
                    </datalist>
                  </div>

                  {items.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Package size={32} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">No items added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h5 className="font-semibold text-slate-900 text-sm">{item.item_name}</h5>
                              <Badge variant={item.available_stock > 10 ? 'success' : 'warning'} size="sm">
                                {item.available_stock} available
                              </Badge>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Qty</label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Rate</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Disc %</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.discount_percent}
                                onChange={(e) => updateItem(item.id, 'discount_percent', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">GST %</label>
                              <input
                                type="text"
                                value={`${item.gst_rate}%`}
                                readOnly
                                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg bg-slate-100 text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Amount</label>
                              <input
                                type="text"
                                value={`₹${item.amount.toFixed(2)}`}
                                readOnly
                                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg bg-slate-100 text-slate-900 font-semibold"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                {items.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-900 mb-3">Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-700">Subtotal</span>
                        <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
                      </div>
                      {totals.discountAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Discount</span>
                          <span className="font-semibold text-red-600">-₹{totals.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {isIntrastate ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-700">CGST</span>
                            <span className="font-semibold">₹{totals.cgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">SGST</span>
                            <span className="font-semibold">₹{totals.sgst.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-slate-700">IGST</span>
                          <span className="font-semibold">₹{totals.igst.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-slate-300">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-blue-600">₹{totals.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Input
                  label="Notes"
                  placeholder="Additional notes (optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} variant="secondary" fullWidth>
                  Cancel
                </Button>
                <Button onClick={handleSaveOrder} variant="primary" fullWidth loading={saving}>
                  {editingOrder ? 'Update Order' : 'Create Order'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* View Modal - Similar to Add/Edit but read-only */}
      {showViewModal && viewingOrder && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{viewingOrder.order_number}</h3>
                  <Badge variant={statusColors[viewingOrder.status]} className="mt-2">
                    {viewingOrder.status}
                  </Badge>
                </div>
                <button onClick={() => setShowViewModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl p-5">
                  <h4 className="font-bold text-slate-900 mb-4">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 font-medium">Name</p>
                      <p className="text-slate-900 font-bold">{viewingOrder.customer_name}</p>
                    </div>
                    {viewingOrder.customer_phone && (
                      <div>
                        <p className="text-slate-500 font-medium">Phone</p>
                        <p className="text-slate-900 font-bold">{viewingOrder.customer_phone}</p>
                      </div>
                    )}
                    {viewingOrder.customer_gstin && (
                      <div>
                        <p className="text-slate-500 font-medium">GSTIN</p>
                        <p className="text-slate-900 font-bold">{viewingOrder.customer_gstin}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-500 font-medium">State</p>
                      <p className="text-slate-900 font-bold">{viewingOrder.customer_state}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Order Date</p>
                      <p className="text-slate-900 font-bold">{new Date(viewingOrder.order_date).toLocaleDateString()}</p>
                    </div>
                    {viewingOrder.expected_delivery && (
                      <div>
                        <p className="text-slate-500 font-medium">Expected Delivery</p>
                        <p className="text-slate-900 font-bold">{new Date(viewingOrder.expected_delivery).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-4">Items</h4>
                  {loadingItems ? (
                    <LoadingSpinner />
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map((item, idx) => (
                        <div key={item.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                              {idx + 1}
                            </span>
                            <h5 className="font-semibold text-slate-900">{item.item_name}</h5>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                            <div>
                              <p className="text-slate-500">Qty</p>
                              <p className="text-slate-900 font-semibold">{item.quantity}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Rate</p>
                              <p className="text-slate-900 font-semibold">₹{item.rate.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Disc %</p>
                              <p className="text-slate-900 font-semibold">{item.discount_percent}%</p>
                            </div>
                            <div>
                              <p className="text-slate-500">GST</p>
                              <p className="text-slate-900 font-semibold">{item.gst_rate}%</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Total</p>
                              <p className="text-blue-600 font-bold">₹{item.total_amount.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <h4 className="font-bold text-slate-900 mb-4">Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-700">Subtotal</span>
                      <span className="font-semibold">₹{viewingOrder.subtotal.toFixed(2)}</span>
                    </div>
                    {viewingOrder.discount_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-700">Discount</span>
                        <span className="font-semibold text-red-600">-₹{viewingOrder.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    {viewingOrder.cgst_amount > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-700">CGST</span>
                          <span className="font-semibold">₹{viewingOrder.cgst_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-700">SGST</span>
                          <span className="font-semibold">₹{viewingOrder.sgst_amount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    {viewingOrder.igst_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-700">IGST</span>
                        <span className="font-semibold">₹{viewingOrder.igst_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-3 border-t-2 border-slate-300">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-2xl text-blue-600">₹{viewingOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {viewingOrder.notes && (
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h4 className="font-bold text-slate-900 mb-2">Notes</h4>
                    <p className="text-slate-700">{viewingOrder.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Button onClick={() => setShowViewModal(false)} variant="secondary" fullWidth>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingOrder && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeletingOrder(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Order"
          message={`Are you sure you want to delete order "${deletingOrder.order_number}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}

      {/* Convert Confirmation */}
      {showConvertConfirm && convertingOrder && (
        <ConfirmDialog
          isOpen={showConvertConfirm}
          onClose={() => {
            setShowConvertConfirm(false);
            setConvertingOrder(null);
          }}
          onConfirm={handleConvertConfirm}
          title="Convert to Invoice"
          message={`Convert order "${convertingOrder.order_number}" to sales invoice? This will mark the order as converted and open the Sales Invoice page with pre-filled data for you to complete.`}
          confirmText="Convert & Continue"
          cancelText="Cancel"
          variant="primary"
        />
      )}
    </div>
  );
};

export default SalesOrders;
