// FILE PATH: components/SalesInvoice.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, Save, Eye } from 'lucide-react';
import { printInvoice } from '@/lib/thermalPrinter';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Badge, LoadingSpinner, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type InvoiceItem = {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  rate: number;
  discount_percent: number;
  gst_rate: number;
  amount: number;
};

const SalesInvoice = () => {
  const { theme } = useTheme();
  const toast = useToast();
  const [customerType, setCustomerType] = useState<'walk-in' | 'registered'>('walk-in');
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    customer_gstin: '',
    invoice_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isIntrastate, setIsIntrastate] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printSettings, setPrintSettings] = useState({
    width: '80mm' as '58mm' | '80mm',
    method: 'iframe' as 'browser' | 'iframe' | 'bluetooth' | 'preview'
  });

  // Real data from database
  const [customers, setCustomers] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load customers and items from database
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      // Load items with details
      const { data: itemsData } = await supabase
        .from('items')
        .select(`
          id,
          name,
          retail_price,
          gst_rate,
          category:categories(name),
          unit:units(abbreviation)
        `)
        .eq('is_active', true)
        .order('name');
      
      setCustomers(customersData || []);
      setAvailableItems(itemsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      item_id: '',
      item_name: '',
      quantity: 1,
      rate: 0,
      discount_percent: 0,
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
            updated.rate = selectedItem.retail_price;
            updated.gst_rate = selectedItem.gst_rate;
          }
        }
        
        // Recalculate amount
        const discountAmount = (updated.quantity * updated.rate * updated.discount_percent) / 100;
        const taxableAmount = (updated.quantity * updated.rate) - discountAmount;
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
    const discountAmount = items.reduce((sum, item) => {
      return sum + (item.quantity * item.rate * item.discount_percent / 100);
    }, 0);
    const taxableAmount = subtotal - discountAmount;
    
    const totalGst = items.reduce((sum, item) => {
      const itemDiscount = (item.quantity * item.rate * item.discount_percent) / 100;
      const itemTaxable = (item.quantity * item.rate) - itemDiscount;
      return sum + (itemTaxable * item.gst_rate / 100);
    }, 0);

    const total = taxableAmount + totalGst;
    const roundOff = Math.round(total) - total;
    const finalTotal = Math.round(total);

    if (isIntrastate) {
      return {
        subtotal,
        discountAmount,
        taxableAmount,
        cgst: totalGst / 2,
        sgst: totalGst / 2,
        igst: 0,
        roundOff,
        total: finalTotal
      };
    } else {
      return {
        subtotal,
        discountAmount,
        taxableAmount,
        cgst: 0,
        sgst: 0,
        igst: totalGst,
        roundOff,
        total: finalTotal
      };
    }
  };

  const totals = calculateTotals();

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customer_id: customerId,
        customer_name: customer.name,
        customer_phone: customer.phone || '',
        customer_gstin: customer.gstin || ''
      });
      setIsIntrastate(customer.state_code === '33');
    }
  };

  const handleSave = async () => {
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Prepare invoice data
      const invoiceData = {
        invoice_number: invoiceNumber,
        customer_id: customerType === 'registered' ? formData.customer_id : null,
        customer_name: formData.customer_name || null,
        customer_phone: formData.customer_phone || null,
        customer_gstin: formData.customer_gstin || null,
        customer_state_code: isIntrastate ? '33' : null,
        invoice_date: formData.invoice_date,
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        cgst_amount: totals.cgst,
        sgst_amount: totals.sgst,
        igst_amount: totals.igst,
        round_off: totals.roundOff,
        total_amount: totals.total,
        payment_method: formData.payment_method,
        payment_status: 'paid',
        notes: formData.notes
      };

      // Insert invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('sales_invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert invoice items
      const invoiceItems = items.map(item => {
        const discountAmount = (item.quantity * item.rate * item.discount_percent) / 100;
        const taxableAmount = (item.quantity * item.rate) - discountAmount;
        const gstAmount = (taxableAmount * item.gst_rate) / 100;
        
        return {
          invoice_id: invoice.id,
          item_id: item.item_id,
          quantity: item.quantity,
          rate: item.rate,
          discount_percent: item.discount_percent,
          discount_amount: discountAmount,
          taxable_amount: taxableAmount,
          gst_rate: item.gst_rate,
          cgst_amount: isIntrastate ? gstAmount / 2 : 0,
          sgst_amount: isIntrastate ? gstAmount / 2 : 0,
          igst_amount: !isIntrastate ? gstAmount : 0,
          total_amount: item.amount
        };
      });

      const { error: itemsError } = await supabase
        .from('sales_invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      alert(`Invoice ${invoiceNumber} saved successfully!`);
      
      // Reset form
      setItems([]);
      setFormData({
        customer_id: '',
        customer_name: '',
        customer_phone: '',
        customer_gstin: '',
        invoice_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        notes: ''
      });
      setCustomerType('walk-in');
      
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice: ' + error.message);
    }
  };

  const handlePrint = async () => {
    if (items.length === 0) {
      alert('Please add items before printing');
      return;
    }

    // Prepare store info (get from settings in real app)
    const storeInfo = {
      store_name: 'Thirukumaran Angadi',
      address: 'Your Address Here',
      city: 'Mettupalayam',
      state: 'Tamil Nadu',
      pincode: '641301',
      phone: '1234567890',
      gstin: formData.customer_gstin ? '33XXXXX1234X1ZX' : undefined
    };

    // Prepare invoice data
    const invoiceData = {
      invoice_number: `INV-${Date.now()}`,
      invoice_date: formData.invoice_date,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      customer_gstin: formData.customer_gstin,
      items: items.map(item => ({
        name: item.item_name,
        quantity: item.quantity,
        rate: item.rate,
        gst_rate: item.gst_rate,
        total: item.amount
      })),
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      cgst_amount: totals.cgst,
      sgst_amount: totals.sgst,
      igst_amount: totals.igst,
      round_off: totals.roundOff,
      total_amount: totals.total,
      payment_method: formData.payment_method
    };

    try {
      await printInvoice(storeInfo, invoiceData, {
        width: printSettings.width,
        footer: 'Thank you for your business!',
        terms: 'Goods once sold cannot be returned',
        method: printSettings.method
      });
      alert('Print sent successfully!');
    } catch (error) {
      console.error('Print error:', error);
      alert('Print failed. Please check printer connection.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sales Invoice</h2>
        <p className="text-gray-600 text-sm mt-1">Create GST-compliant sales invoices</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Customer Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="customerType"
                value="walk-in"
                checked={customerType === 'walk-in'}
                onChange={(e) => setCustomerType(e.target.value as 'walk-in' | 'registered')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Walk-in Customer</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="customerType"
                value="registered"
                checked={customerType === 'registered'}
                onChange={(e) => setCustomerType(e.target.value as 'walk-in' | 'registered')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Registered Customer</span>
            </label>
          </div>
        </div>

        {/* Customer Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Customer Details</h3>
          
          {customerType === 'registered' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
              <Select
                value={formData.customer_id}
                onChange={(e) => handleCustomerChange(e.target.value)}
                disabled={loading}
              >
                <option value="">Select customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone && `- ${customer.phone}`}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  value={formData.customer_gstin}
                  onChange={(e) => setFormData({ ...formData, customer_gstin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="Optional"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <Select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="credit">Credit</option>
              </Select>
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
            <div className="space-y-3">
              {/* Header Row */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Item Name</div>
                <div className="text-xs font-semibold text-gray-600 uppercase">Qty</div>
                <div className="text-xs font-semibold text-gray-600 uppercase">Rate (₹)</div>
                <div className="text-xs font-semibold text-gray-600 uppercase">Disc %</div>
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
                              <div className="text-xs text-gray-500">Rate: ₹{availItem.retail_price} | GST: {availItem.gst_rate}%</div>
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="Rate"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        step="0.01"
                        value={item.discount_percent}
                        onChange={(e) => updateItem(item.id, 'discount_percent', parseFloat(e.target.value) || 0)}
                        placeholder="Disc %"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
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

                  {/* Show GST rate */}
                  <div className="mt-2 text-right">
                    <span className="text-xs text-gray-500">GST: {item.gst_rate}%</span>
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
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">-₹{totals.discountAmount.toFixed(2)}</span>
                </div>
              )}
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

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            disabled={items.length === 0}
            className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Save Invoice
          </button>
          <button
            onClick={handlePrint}
            disabled={items.length === 0}
            className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            Print Bill
          </button>
          <button
            onClick={() => setShowPrintPreview(true)}
            disabled={items.length === 0}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Eye size={18} />
            Preview
          </button>
        </div>
      </div>

      {/* Print Settings Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Print Settings</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Printer Width</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPrintSettings({ ...printSettings, width: '58mm' })}
                    className={`p-3 rounded-lg border-2 ${
                      printSettings.width === '58mm'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    58mm (Small)
                  </button>
                  <button
                    onClick={() => setPrintSettings({ ...printSettings, width: '80mm' })}
                    className={`p-3 rounded-lg border-2 ${
                      printSettings.width === '80mm'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    80mm (Standard)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Print Method</label>
                <Select
                  value={printSettings.method}
                  onChange={(e) => setPrintSettings({ ...printSettings, method: e.target.value as any })}
                >
                  <option value="iframe">Browser Print (Recommended)</option>
                  <option value="preview">Preview Only</option>
                  <option value="browser">USB/Serial Printer</option>
                  <option value="bluetooth">Bluetooth Printer</option>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {printSettings.method === 'iframe' && 'Works with most thermal printers via Windows/Mac print drivers'}
                  {printSettings.method === 'preview' && 'Opens preview in new window'}
                  {printSettings.method === 'browser' && 'Direct USB connection (Chrome/Edge only)'}
                  {printSettings.method === 'bluetooth' && 'For mobile Bluetooth printers'}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Make sure your thermal printer is connected and turned on before printing.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePrint}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                >
                  Print Now
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesInvoice;