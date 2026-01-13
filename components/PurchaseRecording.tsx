// FILE PATH: components/PurchaseRecording.tsx
// Purchase Recording with new UI components and theme support

'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Search, Package, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Badge, LoadingSpinner, useToast } from '@/components/ui';
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

const PurchaseRecording = () => {
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
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
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

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        item_id: '',
        item_name: '',
        batch_number: '',
        expiry_date: '',
        quantity: 0,
        rate: 0,
        gst_rate: 0,
        amount: 0
      }
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        if (field === 'item_id') {
          const selectedItem = availableItems.find(i => i.id === value);
          if (selectedItem) {
            updated.item_name = selectedItem.name;
            updated.gst_rate = selectedItem.gst_rate;
            updated.rate = selectedItem.wholesale_price;
          }
        }
        
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate;
        }
        
        return updated;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    
    let cgst = 0, sgst = 0, igst = 0;
    
    items.forEach(item => {
      const gstAmount = (item.amount * item.gst_rate) / 100;
      if (isIntrastate) {
        cgst += gstAmount / 2;
        sgst += gstAmount / 2;
      } else {
        igst += gstAmount;
      }
    });
    
    const total = subtotal + cgst + sgst + igst;
    
    return { subtotal, cgst, sgst, igst, total };
  };

  const handleSubmit = async () => {
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

      const invalidItems = items.filter(item => !item.item_id || item.quantity <= 0 || item.rate <= 0);
      if (invalidItems.length > 0) {
        toast.warning('Invalid items', 'Please fill all item details correctly.');
        return;
      }

      const totals = calculateTotals();

      // Insert purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchase_recordings')
        .insert({
          vendor_id: formData.vendor_id,
          invoice_number: formData.invoice_number,
          invoice_date: formData.invoice_date,
          received_date: formData.received_date,
          subtotal: totals.subtotal,
          cgst_amount: totals.cgst,
          sgst_amount: totals.sgst,
          igst_amount: totals.igst,
          total_amount: totals.total,
          payment_status: formData.payment_status,
          notes: formData.notes
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Insert purchase items and update inventory
      for (const item of items) {
        // Insert purchase item
        const { error: itemError } = await supabase
          .from('purchase_recording_items')
          .insert({
            purchase_recording_id: purchase.id,
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.rate,
            gst_rate: item.gst_rate,
            total_price: item.amount
          });

        if (itemError) throw itemError;

        // Add to inventory
        const { error: inventoryError } = await supabase
          .from('inventory_batches')
          .insert({
            item_id: item.item_id,
            batch_number: item.batch_number || `BATCH-${Date.now()}`,
            quantity: item.quantity,
            purchase_price: item.rate,
            expiry_date: item.expiry_date || null
          });

        if (inventoryError) throw inventoryError;
      }

      toast.success('Purchase recorded!', `Invoice ${formData.invoice_number} has been saved.`);
      
      // Reset form
      setFormData({
        vendor_id: '',
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        received_date: new Date().toISOString().split('T')[0],
        payment_status: 'pending',
        notes: ''
      });
      setItems([]);

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
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Recording</h2>
          <p className="text-gray-600 text-sm mt-1">Record new purchases and update inventory</p>
        </div>
        <Card>
          <div className="py-12">
            <LoadingSpinner size="lg" text="Loading..." />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Purchase Recording</h2>
        <p className="text-gray-600 text-sm mt-1">Record new purchases and update inventory</p>
      </div>

      {/* Purchase Details */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.vendor_id}
              onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
            >
              <option value="">Select vendor</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Invoice Number"
            placeholder="Enter invoice number"
            value={formData.invoice_number}
            onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
            required
            leftIcon={<FileText size={18} />}
          />

          <Input
            label="Invoice Date"
            type="date"
            value={formData.invoice_date}
            onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
            required
            leftIcon={<Calendar size={18} />}
          />

          <Input
            label="Received Date"
            type="date"
            value={formData.received_date}
            onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
            required
            leftIcon={<Calendar size={18} />}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
            <select
              value={formData.payment_status}
              onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
            >
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type</label>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={isIntrastate}
                  onChange={() => setIsIntrastate(true)}
                  className={theme.classes.textPrimary}
                />
                <span className="text-sm">Intrastate (CGST + SGST)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!isIntrastate}
                  onChange={() => setIsIntrastate(false)}
                  className={theme.classes.textPrimary}
                />
                <span className="text-sm">Interstate (IGST)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
            placeholder="Additional notes (optional)"
          />
        </div>
      </Card>

      {/* Items */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Items</h3>
          <Button onClick={addItem} variant="primary" size="sm" icon={<Plus size={16} />}>
            Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package size={48} className="mx-auto mb-2 opacity-50" />
            <p>No items added yet. Click "Add Item" to start.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">GST%</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-2">
                      <select
                        value={item.item_id}
                        onChange={(e) => updateItem(item.id, 'item_id', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Select item</option>
                        {availableItems.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.name} ({i.unit?.abbreviation})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={item.batch_number}
                        onChange={(e) => updateItem(item.id, 'batch_number', e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Batch"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="date"
                        value={item.expiry_date}
                        onChange={(e) => updateItem(item.id, 'expiry_date', e.target.value)}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={item.rate || ''}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={item.gst_rate || ''}
                        onChange={(e) => updateItem(item.id, 'gst_rate', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-2 py-2 text-sm font-medium">
                      ₹{item.amount.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Summary */}
      {items.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
            </div>
            {isIntrastate ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CGST:</span>
                  <span className="font-medium">₹{totals.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">SGST:</span>
                  <span className="font-medium">₹{totals.sgst.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IGST:</span>
                <span className="font-medium">₹{totals.igst.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Total Amount:</span>
              <span className={theme.classes.textPrimary}>₹{totals.total.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={handleSubmit}
          variant="primary"
          size="lg"
          icon={<Save size={20} />}
          loading={saving}
          disabled={items.length === 0}
          fullWidth
        >
          Record Purchase
        </Button>
      </div>
    </div>
  );
};

export default PurchaseRecording;