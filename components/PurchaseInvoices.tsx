// FILE PATH: components/PurchaseInvoices.tsx
// Beautiful Modern Purchase Invoices - Teal & Gold Theme with Barcode Scanning

'use client';
import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Save, X, Search, Package, Calendar, FileText, 
  ShoppingBag, Camera, TrendingUp, DollarSign, AlertTriangle, User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Badge, LoadingSpinner, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import BarcodeScanner from './BarcodeScanner';

type PurchaseItem = {
  id: string;
  item_id: string;
  item_name: string;
  barcode?: string;
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
    unregistered_vendor_name: '',
    unregistered_vendor_phone: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    received_date: new Date().toISOString().split('T')[0],
    payment_status: 'pending',
    notes: ''
  });

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [isIntrastate, setIsIntrastate] = useState(true);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanningForItemId, setScanningForItemId] = useState<string | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [linkedPO, setLinkedPO] = useState<any>(null);
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newItem, setNewItem] = useState<PurchaseItem>({
    id: '',
    item_id: '',
    item_name: '',
    barcode: '',
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
          barcode,
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
      const { data: po } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          vendor:vendors(name, state_code)
        `)
        .eq('id', poData.po_id)
        .single();

      if (!po) return;

      const { data: poItems } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('po_id', poData.po_id);

      setLinkedPO(po);
      setFormData({
        ...formData,
        vendor_id: po.vendor_id,
        invoice_number: `INV-${Date.now()}`
      });

      const vendor = vendors.find(v => v.id === po.vendor_id);
      if (vendor) {
        setIsIntrastate(vendor.state_code === '33');
      }

      if (poItems) {
        const loadedItems: PurchaseItem[] = poItems.map(item => ({
          id: Date.now().toString() + Math.random(),
          item_id: item.item_id,
          item_name: availableItems.find(i => i.id === item.item_id)?.name || '',
          barcode: availableItems.find(i => i.id === item.item_id)?.barcode || '',
          batch_number: '',
          expiry_date: '',
          quantity: item.quantity - (item.received_quantity || 0),
          rate: item.rate,
          gst_rate: item.gst_rate,
          amount: 0
        }));

        loadedItems.forEach(item => {
          const taxableAmount = item.quantity * item.rate;
          const gstAmount = (taxableAmount * item.gst_rate) / 100;
          item.amount = taxableAmount + gstAmount;
        });

        setItems(loadedItems);
      }

      toast.success('PO Loaded', `Receiving goods from ${po.po_number}`);
    } catch (err: any) {
      console.error('Error loading PO:', err);
      toast.error('Failed to load PO', err.message);
    }
  }

  const handleVendorChange = (vendorId: string) => {
    if (vendorId === 'unregistered') {
      setFormData({ 
        ...formData, 
        vendor_id: 'unregistered',
        unregistered_vendor_name: '',
        unregistered_vendor_phone: ''
      });
      setIsIntrastate(true); // Default to intrastate for unregistered
    } else {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor) {
        setFormData({ 
          ...formData, 
          vendor_id: vendorId,
          unregistered_vendor_name: '',
          unregistered_vendor_phone: ''
        });
        setIsIntrastate(vendor.state_code === '33');
      }
    }
  };

  const openBarcodeScanner = (itemId: string) => {
    setScanningForItemId(itemId);
    setShowBarcodeScanner(true);
  };

  const handleBarcodeScan = (barcode: string) => {
    if (scanningForItemId) {
      // Find item by barcode
      const foundItem = availableItems.find(i => i.barcode === barcode);
      
      if (foundItem) {
        // Update the item being scanned
        setItems(items.map(item => {
          if (item.id === scanningForItemId) {
            const taxableAmount = item.quantity * foundItem.wholesale_price;
            const gstAmount = (taxableAmount * foundItem.gst_rate) / 100;
            return {
              ...item,
              item_id: foundItem.id,
              item_name: foundItem.name,
              barcode: barcode,
              rate: foundItem.wholesale_price,
              gst_rate: foundItem.gst_rate,
              amount: taxableAmount + gstAmount
            };
          }
          return item;
        }));
        toast.success('Item found!', foundItem.name);
      } else {
        toast.warning('Not found', `No item with barcode: ${barcode}`);
      }
    }
    
    setShowBarcodeScanner(false);
    setScanningForItemId(null);
  };

  const addNewItem = () => {
    const newId = Date.now().toString() + Math.random();
    setItems([...items, {
      id: newId,
      item_id: '',
      item_name: '',
      barcode: '',
      batch_number: '',
      expiry_date: '',
      quantity: 1,
      rate: 0,
      gst_rate: 18,
      amount: 0
    }]);
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        if (field === 'item_id') {
          const selectedItem = availableItems.find(i => i.id === value);
          if (selectedItem) {
            updated.item_name = selectedItem.name;
            updated.barcode = selectedItem.barcode || '';
            updated.rate = selectedItem.wholesale_price;
            updated.gst_rate = selectedItem.gst_rate;
          }
        }
        
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

  const handleSubmit = async () => {
    try {
      setSaving(true);

      // Validation
      if (!formData.vendor_id) {
        toast.warning('Select vendor', 'Please select a vendor');
        return;
      }

      if (formData.vendor_id === 'unregistered' && !formData.unregistered_vendor_name.trim()) {
        toast.warning('Enter vendor name', 'Please enter vendor name for unregistered purchase');
        return;
      }

      if (!formData.invoice_number.trim()) {
        toast.warning('Invoice number required', 'Please enter invoice number');
        return;
      }

      if (items.length === 0) {
        toast.warning('Add items', 'Please add at least one item');
        return;
      }

      const totals = calculateTotals();

      // Create purchase invoice
      const invoiceData: any = {
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        received_date: formData.received_date,
        subtotal: totals.subtotal,
        cgst_amount: totals.cgst,
        sgst_amount: totals.sgst,
        igst_amount: totals.igst,
        total_amount: totals.total,
        paid_amount: 0,
        pending_amount: totals.total,
        payment_status: formData.payment_status,
        notes: formData.notes || null
      };

      // Add vendor info based on selection
      if (formData.vendor_id === 'unregistered') {
        invoiceData.vendor_id = null;
        invoiceData.is_unregistered_vendor = true;
        invoiceData.unregistered_vendor_name = formData.unregistered_vendor_name;
        invoiceData.unregistered_vendor_phone = formData.unregistered_vendor_phone || null;
      } else {
        invoiceData.vendor_id = formData.vendor_id;
        invoiceData.is_unregistered_vendor = false;
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert items
      const invoiceItems = items.map(item => ({
        purchase_invoice_id: invoice.id,
        item_id: item.item_id,
        batch_number: item.batch_number || null,
        expiry_date: item.expiry_date || null,
        quantity: item.quantity,
        rate: item.rate,
        gst_rate: item.gst_rate,
        amount: item.amount
      }));

      const { error: itemsError } = await supabase
        .from('purchase_invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      // Update inventory batches
      for (const item of items) {
        await supabase
          .from('inventory_batches')
          .insert({
            item_id: item.item_id,
            batch_number: item.batch_number || `BATCH-${Date.now()}`,
            quantity: item.quantity,
            purchase_rate: item.rate,
            selling_rate: item.rate * 1.2, // Default markup
            expiry_date: item.expiry_date || null,
            status: 'normal',
            source_type: 'purchase',
            source_id: invoice.id
          });
      }

      // Update PO status if linked
      if (linkedPO) {
        // Update received quantities in PO items
        for (const item of items) {
          const { data: poItem } = await supabase
            .from('purchase_order_items')
            .select('*')
            .eq('po_id', linkedPO.id)
            .eq('item_id', item.item_id)
            .single();

          if (poItem) {
            const newReceived = (poItem.received_quantity || 0) + item.quantity;
            await supabase
              .from('purchase_order_items')
              .update({ received_quantity: newReceived })
              .eq('id', poItem.id);
          }
        }

        // Check if PO is fully received
        const { data: allPOItems } = await supabase
          .from('purchase_order_items')
          .select('*')
          .eq('po_id', linkedPO.id);

        const isFullyReceived = allPOItems?.every(i => i.received_quantity >= i.quantity);
        const isPartiallyReceived = allPOItems?.some(i => i.received_quantity > 0);

        await supabase
          .from('purchase_orders')
          .update({ 
            status: isFullyReceived ? 'received' : (isPartiallyReceived ? 'partial' : 'pending')
          })
          .eq('id', linkedPO.id);
      }

      toast.success('Saved!', `Purchase invoice ${formData.invoice_number} has been recorded.`);
      
      // Reset form
      setFormData({
        vendor_id: '',
        unregistered_vendor_name: '',
        unregistered_vendor_phone: '',
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        received_date: new Date().toISOString().split('T')[0],
        payment_status: 'pending',
        notes: ''
      });
      setItems([]);
      setLinkedPO(null);

    } catch (err: any) {
      console.error('Error saving invoice:', err);
      toast.error('Failed to save', err.message || 'Could not save purchase invoice.');
    } finally {
      setSaving(false);
    }
  };

  const totals = items.length > 0 ? calculateTotals() : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl mb-4">
            <LoadingSpinner size="lg" />
          </div>
          <p className="text-slate-700 font-medium">Loading purchase form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md">
              <ShoppingBag className="text-white" size={32} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">Purchase Invoice</h1>
              <p className="text-slate-600 mt-1">Record goods received from vendors</p>
            </div>
          </div>
        </div>

        {/* Linked PO Banner */}
        {linkedPO && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="text-green-600" size={24} />
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

        {/* Vendor Selection */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <User className="text-white" size={24} />
              <div>
                <h3 className="text-xl font-bold text-white">Vendor Details</h3>
                <p className="text-sm text-purple-100">Select vendor or enter new one-off vendor</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Vendor Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Vendor <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vendor_id}
                onChange={(e) => handleVendorChange(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
              >
                <option value="">Select vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
                <option value="unregistered">➕ Unregistered Vendor (One-off Purchase)</option>
              </select>
            </div>

            {/* Show name field if unregistered vendor selected */}
            {formData.vendor_id === 'unregistered' && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-amber-800">
                    Enter vendor name for one-off purchases (roadside vendors, temporary suppliers, etc.)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.unregistered_vendor_name}
                    onChange={(e) => setFormData({ ...formData, unregistered_vendor_name: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900"
                    placeholder="e.g., Roadside Vendor, Local Shop"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <FileText className="text-white" size={24} />
              <div>
                <h3 className="text-xl font-bold text-white">Invoice Details</h3>
                <p className="text-sm text-teal-100">Invoice information and dates</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                  placeholder="INV-001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Invoice Date</label>
                <input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Received Date</label>
                <input
                  type="date"
                  value={formData.received_date}
                  onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="text-white" size={24} />
                <div>
                  <h3 className="text-xl font-bold text-white">Items</h3>
                  <p className="text-sm text-blue-100">Add products to this purchase</p>
                </div>
              </div>
              <button
                onClick={addNewItem}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center gap-2 transition-all"
              >
                <Plus size={20} />
                Add Item
              </button>
            </div>
          </div>

          <div className="p-6">
            {items.length === 0 ? (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center bg-slate-50">
                <Package size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium mb-2">No items added yet</p>
                <p className="text-sm text-slate-500 mb-4">Click "Add Item" to start adding products</p>
                <button
                  onClick={addNewItem}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md"
                >
                  Add First Item
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50 hover:border-teal-300 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-900">Item #{index + 1}</span>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                      {/* Item Selection with Barcode */}
                      <div className="sm:col-span-2 lg:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Item</label>
                        <div className="flex gap-2">
                          <select
                            value={item.item_id}
                            onChange={(e) => updateItem(item.id, 'item_id', e.target.value)}
                            className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm"
                          >
                            <option value="">Select item</option>
                            {availableItems.map(availItem => (
                              <option key={availItem.id} value={availItem.id}>{availItem.name}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => openBarcodeScanner(item.id)}
                            className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-1 shadow-md flex-shrink-0"
                            title="Scan Barcode"
                          >
                            <Camera size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Batch #</label>
                        <input
                          type="text"
                          value={item.batch_number}
                          onChange={(e) => updateItem(item.id, 'batch_number', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm"
                          placeholder="Optional"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Expiry</label>
                        <input
                          type="date"
                          value={item.expiry_date}
                          onChange={(e) => updateItem(item.id, 'expiry_date', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm"
                          min="0"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Rate (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-300 flex justify-between items-center">
                      <span className="text-xs text-slate-600">GST: {item.gst_rate}%</span>
                      <div>
                        <span className="text-xs text-slate-600">Amount: </span>
                        <span className="text-base font-bold text-teal-700">₹{item.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Totals */}
        {totals && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <DollarSign className="text-white" size={24} />
                <h3 className="text-xl font-bold text-white">Invoice Summary</h3>
              </div>
            </div>

            <div className="p-6">
              <div className="max-w-md ml-auto space-y-3 bg-slate-50 p-6 rounded-xl border-2 border-slate-200">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-700">Subtotal:</span>
                  <span className="font-semibold text-slate-900">₹{totals.subtotal.toFixed(2)}</span>
                </div>
                {isIntrastate ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">CGST:</span>
                      <span className="text-slate-900">₹{totals.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">SGST:</span>
                      <span className="text-slate-900">₹{totals.sgst.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-600">IGST:</span>
                    <span className="text-slate-900">₹{totals.igst.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-slate-300">
                  <span className="text-slate-900">Total:</span>
                  <span className="text-teal-700">₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
            placeholder="Additional notes about this purchase..."
          />
        </div>

        {/* Save Button Section */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl shadow-xl p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white">
              <p className="text-lg font-bold">Ready to save?</p>
              <p className="text-sm text-teal-100">Review all details before saving the invoice</p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={saving || items.length === 0}
              variant="secondary"
              size="md"
              icon={<Save size={20} />}
              className="w-full md:w-auto bg-white hover:bg-teal-50 text-teal-700 font-bold shadow-lg"
            >
              {saving ? 'Saving Invoice...' : 'Save Invoice'}
            </Button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => { setShowBarcodeScanner(false); setScanningForItemId(null); }}
        onScan={handleBarcodeScan}
      />
    </div>
  );
};

export default PurchaseInvoices;
