// FILE PATH: components/PurchaseRecording.tsx

import React, { useState } from 'react';
import { FileText, Plus, X, Calendar, Trash2 } from 'lucide-react';

type PurchaseItem = {
  id: string;
  item_id: string;
  item_name: string;
  batch_number: string;
  expiry_date: string;
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

  // Mock data
  const mockVendors = [
    { id: '1', name: 'Sri Krishna Suppliers', state_code: '33' },
    { id: '2', name: 'Divine Traders', state_code: '33' },
    { id: '3', name: 'Mumbai Wholesale', state_code: '27' }
  ];

  const mockItems = [
    { id: '1', name: 'Camphor Tablets', gst_rate: 5 },
    { id: '2', name: 'Agarbatti - Rose', gst_rate: 12 },
    { id: '3', name: 'Brass Diya', gst_rate: 18 }
  ];

  const addItem = () => {
    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      item_id: '',
      item_name: '',
      batch_number: '',
      expiry_date: '',
      quantity: 0,
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
        
        // Recalculate amount if quantity or rate changes
        if (field === 'quantity' || field === 'rate' || field === 'gst_rate') {
          const taxableAmount = updated.quantity * updated.rate;
          const gstAmount = (taxableAmount * updated.gst_rate) / 100;
          updated.amount = taxableAmount + gstAmount;
        }
        
        // Update GST rate and name when item is selected
        if (field === 'item_id') {
          const selectedItem = mockItems.find(i => i.id === value);
          if (selectedItem) {
            updated.item_name = selectedItem.name;
            updated.gst_rate = selectedItem.gst_rate;
          }
        }
        
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

  const totals = calculateTotals();

  const handleSubmit = () => {
    // Save to Supabase
    console.log('Purchase Record:', { formData, items, totals });
    alert('Purchase recorded successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Purchase Recording</h2>
        <p className="text-gray-600 text-sm mt-1">Record goods received and update inventory</p>
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
                onChange={(e) => {
                  setFormData({ ...formData, vendor_id: e.target.value });
                  const vendor = mockVendors.find(v => v.id === e.target.value);
                  setIsIntrastate(vendor?.state_code === '33');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select vendor</option>
                {mockVendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name} {vendor.state_code !== '33' && '(Interstate)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Vendor invoice number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date
              </label>
              <input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Received Date
              </label>
              <input
                type="date"
                value={formData.received_date}
                onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
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

          {isIntrastate ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              Intrastate purchase - CGST & SGST will be applied
            </div>
          ) : (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
              Interstate purchase - IGST will be applied
            </div>
          )}
        </div>

        {/* Items Section */}
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Items</h3>
            <button
              onClick={addItem}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">No items added yet. Click "Add Item" to begin.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-900">Item #{index + 1}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                      <select
                        value={item.item_id}
                        onChange={(e) => updateItem(item.id, 'item_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select item</option>
                        {mockItems.map(mockItem => (
                          <option key={mockItem.id} value={mockItem.id}>{mockItem.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                      <input
                        type="text"
                        value={item.batch_number}
                        onChange={(e) => updateItem(item.id, 'batch_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={item.expiry_date}
                        onChange={(e) => updateItem(item.id, 'expiry_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rate (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                      <input
                        type="text"
                        value={item.amount.toFixed(2)}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-medium"
                      />
                    </div>
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
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">₹{totals.total.toFixed(2)}</span>
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
            rows={3}
            placeholder="Any additional notes..."
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={items.length === 0 || !formData.vendor_id || !formData.invoice_number}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Record Purchase
          </button>
          <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseRecording;