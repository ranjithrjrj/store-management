// FILE PATH: components/PurchaseRecording.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Search, Package, Calendar, FileText } from 'lucide-react';
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
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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

      const invalidItems = items.filter(item => !item.item_id || item.quantity <= 0 || item.rate <= 0);
      if (invalidItems.length > 0) {
        toast.warning('Invalid items', 'Please fill all item details correctly.');
        return;
      }

      const totals = calculateTotals();

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

      for (const item of items) {
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
      <div className="p-6">
        <LoadingSpinner size="lg" text="Loading purchase recording..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Record Purchase</h1>
        <p className="text-gray-600">Record new purchase with invoice details</p>
      </div>

      <Card padding="lg" className="mb-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className={theme.classes.textPrimary} size={24} />
          <h2 className="text-lg font-semibold text-gray-900">Purchase Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.vendor_id}
              onChange={(e) => handleVendorChange(e.target.value)}
            >
              <option value="">Select vendor</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </Select>
          </div>

          <Input
            label="Invoice Number"
            placeholder="INV-001"
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
            <Select
              value={formData.payment_status}
              onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <Select
              value={isIntrastate ? 'intrastate' : 'interstate'}
              onChange={(e) => setIsIntrastate(e.target.value === 'intrastate')}
            >
              <option value="intrastate">Intrastate (CGST + SGST)</option>
              <option value="interstate">Interstate (IGST)</option>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            placeholder="Additional notes (optional)"
          />
        </div>
      </Card>

      <Card padding="lg" className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Package className={theme.classes.textPrimary} size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
          </div>
          <Button
            onClick={() => setShowAddItemModal(true)}
            variant="primary"
            icon={<Plus size={18} />}
          >
            Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No items added yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Batch</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">GST %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Amount</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.item_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.batch_number || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">₹{item.rate.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.gst_rate}%</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">₹{item.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card padding="lg" className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span>₹{totals.subtotal.toFixed(2)}</span>
          </div>
          {isIntrastate ? (
            <>
              <div className="flex justify-between text-gray-700">
                <span>CGST:</span>
                <span>₹{totals.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>SGST:</span>
                <span>₹{totals.sgst.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-gray-700">
              <span>IGST:</span>
              <span>₹{totals.igst.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
            <span>Total:</span>
            <span>₹{totals.total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || items.length === 0}
          variant="primary"
          icon={<Save size={18} />}
          className="flex-1"
        >
          {saving ? 'Saving...' : 'Save Purchase'}
        </Button>
      </div>

      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Add Item</h3>
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item <span className="text-red-500">*</span>
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
                    className="mt-2"
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

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Item Amount:</span>
                    <span className="font-medium text-gray-900">
                      ₹{(newItem.quantity * newItem.rate).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={() => setShowAddItemModal(false)} variant="secondary" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAddItem} variant="primary" className="flex-1">
                  Add Item
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRecording;