// FILE PATH: components/PurchaseInvoices.tsx
// Mobile-Native Purchase Invoices - Beautiful, Consistent, App-Like

'use client';
import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Save, X, Camera, Package, Calendar, 
  ShoppingBag, DollarSign, AlertTriangle, User, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Badge, LoadingSpinner, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import BarcodeScanner from './BarcodeScanner';
import SearchableSelect from './SearchableSelect';

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
  const [linkedPO, setLinkedPO] = useState<any>(null);
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
    
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
      setIsIntrastate(true);
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
      const foundItem = availableItems.find(i => i.barcode === barcode);
      
      if (foundItem) {
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

      for (const item of items) {
        await supabase
          .from('inventory_batches')
          .insert({
            item_id: item.item_id,
            batch_number: item.batch_number || `BATCH-${Date.now()}`,
            quantity: item.quantity,
            purchase_rate: item.rate,
            selling_rate: item.rate * 1.2,
            expiry_date: item.expiry_date || null,
            status: 'normal',
            source_type: 'purchase',
            source_id: invoice.id
          });
      }

      if (linkedPO) {
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-slate-600 mt-4 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO SECTION - Consistent across all pages */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <ShoppingBag className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Purchase Invoice</h1>
              <p className="text-teal-100 text-sm md:text-base">Record goods received</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          {totals && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-teal-100 text-xs font-medium">Items</p>
                <p className="text-white text-xl font-bold mt-0.5">{items.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-teal-100 text-xs font-medium">Total Amount</p>
                <p className="text-white text-xl font-bold mt-0.5">₹{totals.total.toFixed(0)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT - Mobile-first spacing */}
      <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-6 space-y-4">
        
        {/* Linked PO Banner */}
        {linkedPO && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl flex-shrink-0">
              <Package className="text-green-600" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-green-900 text-sm">Linked to {linkedPO.po_number}</p>
              <p className="text-xs text-green-700 truncate">Items pre-filled from purchase order</p>
            </div>
          </div>
        )}

        {/* Vendor & Invoice Details - Single Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 space-y-4">
            {/* Vendor */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Vendor <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={[
                  ...vendors.map(v => ({
                    value: v.id,
                    label: v.name,
                    sublabel: v.phone || v.email || undefined
                  })),
                  {
                    value: 'unregistered',
                    label: '➕ One-off Purchase',
                    sublabel: 'Roadside vendor or temporary supplier'
                  }
                ]}
                value={formData.vendor_id}
                onChange={(value) => handleVendorChange(value)}
                placeholder="Select vendor"
              />
            </div>

            {/* Unregistered Vendor Name */}
            {formData.vendor_id === 'unregistered' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="text-amber-600 flex-shrink-0" size={16} />
                  <p className="text-xs text-amber-800 font-medium">Enter vendor details</p>
                </div>
                <input
                  type="text"
                  value={formData.unregistered_vendor_name}
                  onChange={(e) => setFormData({ ...formData, unregistered_vendor_name: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 text-sm"
                  placeholder="Vendor name"
                />
              </div>
            )}

            {/* Invoice Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Invoice # *</label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm"
                  placeholder="INV-001"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Invoice Date</label>
                <input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header with Add Button */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="text-teal-600" size={20} />
              <h3 className="font-bold text-slate-900">Items ({items.length})</h3>
            </div>
            <button
              onClick={addNewItem}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm active:scale-95 transition-all shadow-sm"
            >
              <Plus size={18} />
              Add
            </button>
          </div>

          {/* Items List */}
          <div className="p-4 space-y-3">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package size={32} className="text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium mb-1">No items added</p>
                <p className="text-sm text-slate-500 mb-4">Add items to create invoice</p>
                <button
                  onClick={addNewItem}
                  className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-medium active:scale-95 transition-all"
                >
                  Add First Item
                </button>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={item.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  {/* Item Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-600">Item #{index + 1}</span>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Item Selection with Scan */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Product</label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <SearchableSelect
                            options={availableItems.map(i => ({
                              value: i.id,
                              label: i.name,
                              sublabel: `₹${i.wholesale_price} • GST ${i.gst_rate}%`
                            }))}
                            value={item.item_id}
                            onChange={(value) => updateItem(item.id, 'item_id', value)}
                            placeholder="Select product"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => openBarcodeScanner(item.id)}
                          className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl active:scale-95 transition-all shadow-sm flex-shrink-0"
                          title="Scan barcode"
                        >
                          <Camera size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Quantity and Rate */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Qty</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Rate (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Amount Display */}
                    <div className="pt-3 border-t border-slate-300 flex justify-between items-center">
                      <span className="text-xs text-slate-600">GST: {item.gst_rate}%</span>
                      <div className="text-right">
                        <p className="text-xs text-slate-600">Total</p>
                        <p className="text-lg font-bold text-teal-700">₹{item.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Totals Summary */}
        {totals && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600">
              <div className="flex items-center gap-2">
                <DollarSign className="text-white" size={20} />
                <h3 className="font-bold text-white">Summary</h3>
              </div>
            </div>
            <div className="p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              {isIntrastate ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">CGST</span>
                    <span className="text-slate-900">₹{totals.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">SGST</span>
                    <span className="text-slate-900">₹{totals.sgst.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">IGST</span>
                  <span className="text-slate-900">₹{totals.igst.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-slate-300">
                <span className="text-slate-900">Total</span>
                <span className="text-teal-700">₹{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <label className="block text-sm font-bold text-slate-900 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm resize-none"
            placeholder="Additional notes..."
          />
        </div>

        {/* Save Button - Prominent */}
        <div className="sticky bottom-20 md:relative md:bottom-0">
          <button
            onClick={handleSubmit}
            disabled={saving || items.length === 0}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                Saving Invoice...
              </>
            ) : (
              <>
                <Check size={24} />
                Save Invoice
              </>
            )}
          </button>
        </div>

        {/* Bottom Padding for Mobile Nav */}
        <div className="h-4 md:hidden" />
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
