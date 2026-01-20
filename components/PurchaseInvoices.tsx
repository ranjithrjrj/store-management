// FILE PATH: components/PurchaseInvoices.tsx
// Purchase Invoices with modern aesthetic UI

'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Search, Package, Calendar, FileText, ShoppingBag, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Textarea, Badge, LoadingSpinner, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type PurchaseItem = {
  id: string;
  item_id: string;
  item_name: string;
  batch_number?: string;
  expiry_date?: string;
  quantity: number;
  rate: number;
  gst_rate: number;
  amount: number;
};

const PurchaseInvoices = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    vendor_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    received_date: new Date().toISOString().split('T')[0],
    payment_status: 'pending',
    notes: ''
  });

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [isIntrastate, setIsIntrastate] = useState(true);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [linkedPO, setLinkedPO] = useState<any>(null);
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newItem, setNewItem] = useState<PurchaseItem>({
    id: '',
    item_id: '',
    item_name: '',
    batch_number: '',
    expiry_date: '',
    quantity: 0,
    rate: 0,
    gst_rate: 18,
    amount: 0
  });

  useEffect(() => {
    loadData();
    
    // Check if we're receiving from a PO
    const receivePO = sessionStorage.getItem('receivePO');
    if (receivePO) {
      const poData = JSON.parse(receivePO);
      loadPOForReceiving(poData);
      sessionStorage.removeItem('receivePO');
    }
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      const { data: itemsData } = await supabase
        .from('items')
        .select(`
          id,
          name,
          gst_rate,
          wholesale_price,
          unit:units(abbreviation)
        `)
        .order('name');

      setVendors(vendorsData || []);
      setAvailableItems(itemsData || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      toast.error('Failed to load', 'Could not load vendors and items.');
    } finally {
      setLoading(false);
    }
  }

  async function loadPOForReceiving(poData: any) {
    try {
      setLinkedPO(poData);
      
      // Pre-fill vendor
      setFormData(prev => ({
        ...prev,
        vendor_id: poData.vendor_id
      }));
      
      // Load PO items
      const { data: poItems } = await supabase
        .from('purchase_order_items')
        .select(`
          *,
          item:items(name, gst_rate, unit:units(abbreviation))
        `)
        .eq('po_id', poData.po_id);
      
      if (poItems) {
        const prefilledItems: PurchaseItem[] = poItems.map((item: any) => ({
          id: crypto.randomUUID(),
          item_id: item.item_id,
          item_name: item.item.name,
          batch_number: '',
          expiry_date: '',
          quantity: item.quantity - (item.received_quantity || 0), // Remaining qty
          rate: item.rate,
          gst_rate: item.gst_rate,
          amount: (item.quantity - (item.received_quantity || 0)) * item.rate
        }));
        
        setItems(prefilledItems);
      }
      
      // Check vendor state code for tax type
      const vendor = poData.vendor_state_code;
      setIsIntrastate(vendor === '33');
      
      toast.success('PO Loaded!', `Receiving goods for PO ${poData.po_number}`);
    } catch (err: any) {
      console.error('Error loading PO:', err);
      toast.error('Failed to load PO', 'Could not load purchase order data.');
    }
  }

  const handleVendorChange = (vendorId: string) => {
    setFormData({ ...formData, vendor_id: vendorId });
    
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setIsIntrastate(vendor.state === 'Tamil Nadu');
    }
  };

  const handleAddItem = () => {
    if (!newItem.item_id || newItem.quantity <= 0 || newItem.rate <= 0) {
      toast.warning('Invalid item', 'Please fill all item details.');
      return;
    }

    const selectedItem = availableItems.find(i => i.id === newItem.item_id);
    const itemAmount = newItem.quantity * newItem.rate;
    
    setItems([...items, {
      ...newItem,
      id: Date.now().toString(),
      item_name: selectedItem?.name || '',
      amount: itemAmount
    }]);

    setNewItem({
      id: '',
      item_id: '',
      item_name: '',
      batch_number: '',
      expiry_date: '',
      quantity: 0,
      rate: 0,
      gst_rate: 18,
      amount: 0
    });
    setShowAddItemModal(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isIntrastate) {
      items.forEach(item => {
        const taxAmount = (item.amount * item.gst_rate) / 100;
        cgst += taxAmount / 2;
        sgst += taxAmount / 2;
      });
    } else {
      items.forEach(item => {
        igst += (item.amount * item.gst_rate) / 100;
      });
    }

    const total = subtotal + cgst + sgst + igst;

    return { subtotal, cgst, sgst, igst, total };
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!formData.vendor_id) {
        toast.warning('Vendor required', 'Please select a vendor.');
        return;
      }

      if (!formData.invoice_number) {
        toast.warning('Invoice number required', 'Please enter invoice number.');
        return;
      }

      if (items.length === 0) {
        toast.warning('Add items', 'Please add at least one item.');
        return;
      }

      const totals = calculateTotals();

      const { data: purchase, error: purchaseError } = await supabase
        .from('purchase_invoices')
        .insert({
          invoice_number: formData.invoice_number,
          vendor_id: formData.vendor_id,
          invoice_date: formData.invoice_date,
          received_date: formData.received_date,
          subtotal: totals.subtotal,
          cgst_amount: totals.cgst,
          sgst_amount: totals.sgst,
          igst_amount: totals.igst,
          total_amount: totals.total,
          payment_status: formData.payment_status,
          notes: formData.notes,
          po_id: linkedPO?.po_id || null,
          po_number: linkedPO?.po_number || null
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      for (const item of items) {
        const { error: itemError } = await supabase
          .from('purchase_invoice_items')
          .insert({
            purchase_invoice_id: purchase.id,
            item_id: item.item_id,
            quantity: item.quantity,
            rate: item.rate,
            gst_rate: item.gst_rate,
            amount: item.amount,
            batch_number: item.batch_number || null,
            expiry_date: item.expiry_date || null
          });

        if (itemError) throw itemError;
      }

      // If linked to PO, update PO status and received quantities
      if (linkedPO) {
        for (const item of items) {
          // Get current received quantity
          const { data: poItem } = await supabase
            .from('purchase_order_items')
            .select('received_quantity')
            .eq('po_id', linkedPO.po_id)
            .eq('item_id', item.item_id)
            .single();

          const newReceivedQty = (poItem?.received_quantity || 0) + item.quantity;

          await supabase
            .from('purchase_order_items')
            .update({ received_quantity: newReceivedQty })
            .eq('po_id', linkedPO.po_id)
            .eq('item_id', item.item_id);
        }
        
        // Check if PO is fully/partially received
        const { data: poItems } = await supabase
          .from('purchase_order_items')
          .select('quantity, received_quantity')
          .eq('po_id', linkedPO.po_id);
        
        const fullyReceived = poItems?.every(i => (i.received_quantity || 0) >= i.quantity);
        const partiallyReceived = poItems?.some(i => (i.received_quantity || 0) > 0);
        
        const newStatus = fullyReceived ? 'received' : 
                          partiallyReceived ? 'partial' : 'pending';
        
        await supabase
          .from('purchase_orders')
          .update({ status: newStatus })
          .eq('id', linkedPO.po_id);
          
        toast.success('PO Updated!', `Purchase Order ${linkedPO.po_number} marked as ${newStatus}`);
      }

      toast.success('Purchase recorded!', `Invoice ${formData.invoice_number} has been saved.`);
      
      setFormData({
        vendor_id: '',
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        received_date: new Date().toISOString().split('T')[0],
        payment_status: 'pending',
        notes: ''
      });
      setItems([]);
      setLinkedPO(null);

    } catch (err: any) {
      console.error('Error recording purchase:', err);
      toast.error('Failed to save', err.message || 'Could not record purchase.');
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Loading purchase data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <ShoppingBag className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Purchase Invoices</h1>
                <p className="text-white/90 mt-1">Record new purchase with invoice details</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* PO Indicator Banner */}
        {linkedPO && (
          <div className="backdrop-blur-xl bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg border-2 border-green-200 p-5 transition-all hover:shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Package className="text-green-600" size={28} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-lg font-bold text-green-900">Receiving from PO: {linkedPO.po_number}</p>
                  <Badge variant="success" size="sm">Linked</Badge>
                </div>
                <p className="text-sm text-green-700">Items and vendor pre-filled from purchase order</p>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Details Card - Glassmorphism */}
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8 transition-all hover:shadow-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2.5 ${theme.classes.bgPrimary} rounded-xl`}>
              <FileText className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Purchase Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vendor <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.vendor_id}
                onChange={(e) => handleVendorChange(e.target.value)}
                className="transition-all duration-200 focus:scale-[1.02]"
              >
                <option value="">Select vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </Select>
            </div>

            <div className="group">
              <Input
                label="Invoice Number"
                placeholder="INV-001"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                required
                leftIcon={<FileText size={18} />}
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>

            <div className="group">
              <Input
                label="Invoice Date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                required
                leftIcon={<Calendar size={18} />}
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>

            <div className="group">
              <Input
                label="Received Date"
                type="date"
                value={formData.received_date}
                onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                required
                leftIcon={<Calendar size={18} />}
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
              <Select
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                className="transition-all duration-200 focus:scale-[1.02]"
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </Select>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Type</label>
              <Select
                value={isIntrastate ? 'intrastate' : 'interstate'}
                onChange={(e) => setIsIntrastate(e.target.value === 'intrastate')}
                className="transition-all duration-200 focus:scale-[1.02]"
              >
                <option value="intrastate">Intrastate (CGST + SGST)</option>
                <option value="interstate">Interstate (IGST)</option>
              </Select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes (optional)"
              className="transition-all duration-200 focus:scale-[1.01]"
            />
          </div>
        </div>

        {/* Items Card */}
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 ${theme.classes.bgPrimary} rounded-xl`}>
                <Package className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Items</h2>
                <p className="text-sm text-gray-600">{items.length} item{items.length !== 1 ? 's' : ''} added</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddItemModal(true)}
              variant="primary"
              icon={<Plus size={20} />}
              className="shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              Add Item
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                <Package size={48} className="text-blue-600" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No items added yet</p>
              <p className="text-sm text-gray-500">Click "Add Item" to start building your purchase order</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="group relative backdrop-blur-sm bg-gradient-to-r from-white/80 to-white/60 rounded-2xl p-5 border border-gray-200/50 hover:border-blue-300 transition-all duration-300 hover:shadow-lg"
                  style={{
                    animation: `slideIn 0.3s ease-out ${index * 0.1}s backwards`
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-sm">
                          {index + 1}
                        </span>
                        <h4 className="font-bold text-gray-900 text-lg">{item.item_name}</h4>
                        {item.batch_number && (
                          <Badge variant="neutral" size="sm" className="font-mono">
                            {item.batch_number}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-gray-500 font-medium">Quantity</p>
                          <p className="text-gray-900 font-bold text-lg">{item.quantity}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-500 font-medium">Rate</p>
                          <p className="text-gray-900 font-bold text-lg">₹{item.rate.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-500 font-medium">GST</p>
                          <p className="text-gray-900 font-bold text-lg">{item.gst_rate}%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-500 font-medium">Amount</p>
                          <p className="text-blue-600 font-bold text-xl">₹{item.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 hover:scale-110"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Card with Gradient */}
        {items.length > 0 && (
          <div className="backdrop-blur-xl bg-gradient-to-br from-blue-50/80 to-purple-50/80 rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="text-yellow-500" size={24} />
              Summary
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                <span className="text-gray-700 font-medium">Subtotal</span>
                <span className="text-gray-900 font-bold text-xl">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              {isIntrastate ? (
                <>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                    <span className="text-gray-700 font-medium">CGST</span>
                    <span className="text-gray-900 font-bold text-xl">₹{totals.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                    <span className="text-gray-700 font-medium">SGST</span>
                    <span className="text-gray-900 font-bold text-xl">₹{totals.sgst.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                  <span className="text-gray-700 font-medium">IGST</span>
                  <span className="text-gray-900 font-bold text-xl">₹{totals.igst.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl px-6 mt-2">
                <span className="text-gray-900 font-bold text-lg">Total Amount</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-3xl">
                  ₹{totals.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            variant="primary"
            icon={<Save size={20} />}
            className="text-lg px-8 py-4 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {saving ? 'Saving...' : 'Save Purchase'}
          </Button>
        </div>
      </div>

      {/* Modern Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <div className="backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl border border-white/20 w-full max-w-2xl p-8 animate-slideUp">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl">
                    <Plus className="text-white" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Add Item</h3>
                </div>
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Search Item <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search size={18} />}
                    rightIcon={searchTerm ? (
                      <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                      </button>
                    ) : undefined}
                    className="transition-all duration-200"
                  />
                  <Select
                    value={newItem.item_id}
                    onChange={(e) => {
                      const selected = availableItems.find(i => i.id === e.target.value);
                      setNewItem({
                        ...newItem,
                        item_id: e.target.value,
                        gst_rate: selected?.gst_rate || 18,
                        rate: selected?.wholesale_price || 0
                      });
                    }}
                    className="mt-3"
                  >
                    <option value="">Select item</option>
                    {availableItems
                      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} - ₹{item.wholesale_price} ({item.unit?.abbreviation})
                        </option>
                      ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Batch Number"
                    placeholder="BATCH-001"
                    value={newItem.batch_number}
                    onChange={(e) => setNewItem({ ...newItem, batch_number: e.target.value })}
                  />

                  <Input
                    label="Expiry Date"
                    type="date"
                    value={newItem.expiry_date}
                    onChange={(e) => setNewItem({ ...newItem, expiry_date: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Quantity"
                    type="number"
                    placeholder="0"
                    value={newItem.quantity || ''}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                    required
                  />

                  <Input
                    label="Rate (₹)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItem.rate || ''}
                    onChange={(e) => setNewItem({ ...newItem, rate: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <Input
                  label="GST Rate (%)"
                  type="number"
                  placeholder="18"
                  value={newItem.gst_rate || ''}
                  onChange={(e) => setNewItem({ ...newItem, gst_rate: parseFloat(e.target.value) || 0 })}
                  required
                />

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-semibold">Item Amount</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-2xl">
                      ₹{(newItem.quantity * newItem.rate).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button 
                  onClick={() => setShowAddItemModal(false)} 
                  variant="secondary" 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddItem} 
                  variant="primary" 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Add Item
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PurchaseInvoices;
