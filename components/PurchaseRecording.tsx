// FILE PATH: components/PurchaseRecording.tsx
// Purchase Recording with automatic inventory updates

'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Search, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  
  // Real data from database
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
      
      // Load vendors
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      // Load items
      const { data: itemsData } = await supabase
        .from('items')
        .select(`
          id,
          name,
          wholesale_price,
          gst_rate,
          unit:units(abbreviation)
        `)
        .eq('is_active', true)
        .order('name');
      
      setVendors(vendorsData || []);
      setAvailableItems(itemsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const addItem = () => {
    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      item_id: '',
      item_name: '',
      batch_number: '',
      expiry_date: '',
      quantity: 1,
      rate: 0,
      gst_rate: 0,
      amount: 0
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
    const roundOff = Math.round(total) - total;
    const finalTotal = Math.round(total);

    if (isIntrastate) {
      return {
        subtotal,
        cgst: totalGst / 2,
        sgst: totalGst / 2,
        igst: 0,
        roundOff,
        total: finalTotal
      };
    } else {
      return {
        subtotal,
        cgst: 0,
        sgst: 0,
        igst: totalGst,
        roundOff,
        total: finalTotal
      };
    }
  };

  const totals = calculateTotals();

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setFormData({ ...formData, vendor_id: vendorId });
      setIsIntrastate(vendor.state_code === '33');
    }
  };

  const handleSave = async () => {
    if (!formData.vendor_id) {
      alert('Please select a vendor');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    // Validate all items have required fields
    for (const item of items) {
      if (!item.item_id || item.quantity <= 0 || item.rate <= 0) {
        alert('Please fill in all item details');
        return;
      }
    }

    try {
      setSaving(true);

      // Generate record number
      const recordNumber = `PR-${Date.now()}`;
      
      // Prepare purchase record data
      const purchaseData = {
        record_number: recordNumber,
        vendor_id: formData.vendor_id,
        invoice_number: formData.invoice_number || null,
        invoice_date: formData.invoice_date,
        received_date: formData.received_date,
        subtotal: totals.subtotal,
        cgst_amount: totals.cgst,
        sgst_amount: totals.sgst,
        igst_amount: totals.igst,
        total_amount: totals.total,
        payment_status: formData.payment_status,
        notes: formData.notes || null
      };

      // Insert purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchase_records')
        .insert(purchaseData)
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Insert purchase record items AND create inventory batches
      for (const item of items) {
        const taxableAmount = item.quantity * item.rate;
        const gstAmount = (taxableAmount * item.gst_rate) / 100;
        
        // Insert purchase record item
        const recordItem = {
          purchase_record_id: purchase.id,
          item_id: item.item_id,
          batch_number: item.batch_number || null,
          expiry_date: item.expiry_date || null,
          quantity: item.quantity,
          rate: item.rate,
          gst_rate: item.gst_rate,
          amount: item.amount
        };

        const { data: insertedItem, error: itemError } = await supabase
          .from('purchase_record_items')
          .insert(recordItem)
          .select()
          .single();

        if (itemError) throw itemError;

        // Create inventory batch (this updates stock)
        const batchData = {
          item_id: item.item_id,
          batch_number: item.batch_number || recordNumber,
          quantity: item.quantity,
          purchase_price: item.rate,
          expiry_date: item.expiry_date || null
        };

        const { error: batchError } = await supabase
          .from('inventory_batches')
          .insert(batchData);

        if (batchError) throw batchError;
      }

      alert(`Purchase record ${recordNumber} saved successfully! Inventory updated.`);
      
      // Reset form
      setItems([]);
      setFormData({
        vendor_id: '',
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        received_date: new Date().toISOString().split('T')[0],
        payment_status: 'pending',
        notes: ''
      });
      
    } catch (error: any) {
      console.error('Error saving purchase:', error);
      alert('Failed to save purchase: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Purchase Recording</h2>
        <p className="text-gray-600 text-sm mt-1">Record purchases and update inventory</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Vendor & Invoice Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Purchase Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vendor_id}
                onChange={(e) => handleVendorChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Select vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Invoice #</label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
              <input
                type="date"
                value={formData.received_date}
                onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Items</h3>
            <button
              onClick={addItem}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
              disabled={loading}
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Package size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No items added yet. Click "Add Item" to begin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header Row */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Item Name</div>
                <div className="text-xs font-semibold text-gray-600 uppercase">Quantity</div>
                <div className="text-xs font-semibold text-gray-600 uppercase">Rate (₹)</div>
                <div className="text-xs font-semibold text-gray-600 uppercase">Batch #</div>
                <div className="text-xs font-semibold text-gray-600 uppercase">Amount</div>
              </div>

              {items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">Item #{index + 1}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    <div className="col-span-2 relative">
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => {
                          setItems(items.map(i => i.id === item.id ? {...i, item_name: e.target.value} : i));
                        }}
                        onFocus={() => {
                          const dropdown = document.getElementById(`dropdown-${item.id}`);
                          if (dropdown) dropdown.style.display = 'block';
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            const dropdown = document.getElementById(`dropdown-${item.id}`);
                            if (dropdown) dropdown.style.display = 'none';
                          }, 200);
                        }}
                        placeholder="Type to search..."
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      />
                      <div
                        id={`dropdown-${item.id}`}
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto hidden"
                        style={{ display: 'none' }}
                      >
                        {availableItems
                          .filter(i => i.name.toLowerCase().includes(item.item_name.toLowerCase()))
                          .slice(0, 50)
                          .map(availItem => (
                            <div
                              key={availItem.id}
                              onMouseDown={() => {
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

                    <div>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="Qty"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="Rate"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={item.batch_number}
                        onChange={(e) => updateItem(item.id, 'batch_number', e.target.value)}
                        placeholder="Batch #"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={`₹${item.amount.toFixed(2)}`}
                        readOnly
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 font-medium"
                      />
                    </div>
                  </div>

                  {/* Expiry Date Row */}
                  <div className="mt-2">
                    <input
                      type="date"
                      value={item.expiry_date}
                      onChange={(e) => updateItem(item.id, 'expiry_date', e.target.value)}
                      placeholder="Expiry Date (Optional)"
                      className="w-full md:w-1/3 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        {items.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="max-w-sm ml-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              {isIntrastate ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">CGST:</span>
                    <span className="font-medium text-gray-900">₹{totals.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SGST:</span>
                    <span className="font-medium text-gray-900">₹{totals.sgst.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IGST:</span>
                  <span className="font-medium text-gray-900">₹{totals.igst.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Round Off:</span>
                <span className="font-medium text-gray-900">₹{totals.roundOff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">₹{totals.total}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            placeholder="Optional notes"
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={items.length === 0 || !formData.vendor_id || saving}
            className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save & Update Inventory'}
          </button>
        </div>

        {/* Info Note */}
        {items.length > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Note:</strong> Saving this purchase will automatically add stock to your inventory.
              Each item will create a new batch with the specified quantity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseRecording;