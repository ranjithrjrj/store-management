// FILE PATH: components/SalesInvoice.tsx
// Modern Sales Invoice with inventory check, proper GST, credit note support

'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, Save, ShoppingCart, User, Package, Calendar, AlertTriangle, TrendingUp, Camera, X } from 'lucide-react';
import { printInvoice } from '@/lib/thermalPrinter';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Badge, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import BarcodeScanner from './BarcodeScanner';

type InvoiceItem = {
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

const SalesInvoice = () => {
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    customer_gstin: '',
    customer_state: 'Tamil Nadu',
    invoice_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isIntrastate, setIsIntrastate] = useState(true);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [printSettings, setPrintSettings] = useState({
    width: '80mm' as '58mm' | '80mm',
    method: 'iframe' as 'browser' | 'iframe' | 'bluetooth' | 'preview'
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanningForItemId, setScanningForItemId] = useState<string | null>(null);

  // Credit note states
  const [availableCreditNotes, setAvailableCreditNotes] = useState<any[]>([]);
  const [selectedCreditNote, setSelectedCreditNote] = useState<string>('');
  const [creditNoteAmount, setCreditNoteAmount] = useState(0);

  useEffect(() => {
    loadData();
    checkForConvertingOrder();
  }, []);

  async function checkForConvertingOrder() {
    try {
      const convertingOrderData = sessionStorage.getItem('converting_order');
      if (convertingOrderData) {
        const orderData = JSON.parse(convertingOrderData);
        
        setFormData({
          customer_id: '',
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          customer_gstin: orderData.customer_gstin,
          customer_state: orderData.customer_state,
          invoice_date: new Date().toISOString().split('T')[0],
          payment_method: 'cash',
          notes: orderData.notes
        });

        setIsIntrastate(orderData.customer_state === 'Tamil Nadu');

        const itemsWithStock = await Promise.all(
          orderData.items.map(async (item: any) => {
            const stock = await getItemStock(item.item_id);
            return {
              id: Date.now().toString() + Math.random(),
              item_id: item.item_id,
              item_name: item.item_name,
              available_stock: stock,
              quantity: item.quantity,
              rate: item.rate,
              discount_percent: item.discount_percent,
              gst_rate: item.gst_rate,
              amount: (item.quantity * item.rate) - ((item.quantity * item.rate * item.discount_percent) / 100)
            };
          })
        );

        setItems(itemsWithStock);
        sessionStorage.removeItem('converting_order');
        toast.success('Order loaded!', `Order ${orderData.order_number} data has been loaded. Please review and complete the invoice.`);
      }
    } catch (err) {
      console.error('Error loading converting order:', err);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      
      const [customersData, itemsData, storeData] = await Promise.all([
        supabase.from('customers').select('*').eq('is_active', true).order('name'),
        supabase.from('items').select(`
          id, name, gst_rate, retail_price, discount_percent,
          unit:units(abbreviation)
        `).eq('is_active', true).order('name'),
        supabase.from('store_settings').select('*').limit(1)
      ]);

      setCustomers(customersData.data || []);
      setAvailableItems(itemsData.data || []);
      setStoreSettings(storeData.data?.[0] || null);
    } catch (err: any) {
      console.error('Error loading data:', err);
      toast.error('Failed to load', 'Could not load data.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomerCreditNotes(customerId: string) {
    if (!customerId) {
      setAvailableCreditNotes([]);
      setSelectedCreditNote('');
      setCreditNoteAmount(0);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('credit_notes')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'active')
        .gt('balance_amount', 0)
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .order('issue_date', { ascending: false });
      
      if (error) throw error;
      setAvailableCreditNotes(data || []);
    } catch (err) {
      console.error('Error loading credit notes:', err);
      setAvailableCreditNotes([]);
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

  const handleCustomerChange = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customer_id: customerId,
        customer_name: customer.name,
        customer_phone: customer.phone || '',
        customer_gstin: customer.gstin || '',
        customer_state: customer.state || 'Tamil Nadu'
      });
      setIsIntrastate(customer.state === 'Tamil Nadu');
      
      // Load credit notes for this customer
      if (customer.id) {
        await loadCustomerCreditNotes(customer.id);
      }
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
      toast.warning('Already added', 'This item is already in the invoice.');
      return;
    }

    const newItem: InvoiceItem = {
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

  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode) {
      toast.error('Invalid scan', 'No barcode detected.');
      return;
    }

    try {
      // Search for item by barcode
      const { data: itemData, error } = await supabase
        .from('items')
        .select('id, name, retail_price, gst_rate, discount_percent')
        .eq('barcode', barcode)
        .eq('is_active', true)
        .single();

      if (error || !itemData) {
        toast.error('Item not found', `No item found with barcode: ${barcode}`);
        return;
      }

      // Check if item already exists
      const existingItem = items.find(i => i.item_id === itemData.id);
      if (existingItem) {
        // Increment quantity
        updateItem(existingItem.id, 'quantity', existingItem.quantity + 1);
        toast.success('Quantity updated', `${itemData.name} quantity increased to ${existingItem.quantity + 1}`);
      } else {
        // Add new item
        await addItem(itemData.id);
        toast.success('Item added', `${itemData.name} added to invoice`);
      }

      setShowBarcodeScanner(false);
      setScanningForItemId(null);
    } catch (err: any) {
      console.error('Barcode scan error:', err);
      toast.error('Scan failed', err.message || 'Could not process barcode.');
    }
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
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.rate);
    }, 0);

    const discountAmount = items.reduce((sum, item) => {
      return sum + ((item.quantity * item.rate * item.discount_percent) / 100);
    }, 0);

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

    const totalBeforeRounding = taxableAmount + cgst + sgst + igst;
    const roundedTotal = Math.round(totalBeforeRounding);
    const roundOff = roundedTotal - totalBeforeRounding;

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      cgst,
      sgst,
      igst,
      roundOff,
      total: roundedTotal
    };
  };

  const confirmSave = async () => {
    if (items.length === 0) {
      toast.warning('Add items', 'Please add at least one item.');
      return;
    }
    if (!formData.customer_name.trim()) {
      toast.warning('Customer name required', 'Please enter customer name.');
      return;
    }

    // Validate credit sales require registered customer
    if (formData.payment_method === 'credit' && !formData.customer_id) {
      toast.warning('Credit sales require registered customer', 'Please select a registered customer for credit sales.');
      return;
    }

    // Validate credit note selection
    if (formData.payment_method === 'credit_note') {
      if (!selectedCreditNote) {
        toast.warning('Select credit note', 'Please select a credit note to use.');
        return;
      }
      const totals = calculateTotals();
      if (creditNoteAmount < totals.total) {
        toast.warning('Insufficient credit', 'Credit note does not cover full invoice amount. Please use a different payment method for the remaining balance.');
        return;
      }
    }

    try {
      setSaving(true);
      setShowPrintSettings(false);

      const invoiceNumber = `INV-${Date.now()}`;
      const totals = calculateTotals();

      const invoiceData = {
        invoice_number: invoiceNumber,
        customer_id: formData.customer_id || null,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone || null,
        customer_gstin: formData.customer_gstin || null,
        place_of_supply: formData.customer_state,
        invoice_date: formData.invoice_date,
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        cgst_amount: totals.cgst,
        sgst_amount: totals.sgst,
        igst_amount: totals.igst,
        round_off: totals.roundOff,
        total_amount: totals.total,
        payment_method: formData.payment_method,
        payment_status: formData.payment_method === 'credit' ? 'credit' : 'paid',
        is_printed: true,
        notes: formData.notes
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('sales_invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

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
          total_amount: item.amount + gstAmount
        };
      });

      const { error: itemsError } = await supabase
        .from('sales_invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      // Record payment based on method
      if (formData.payment_method === 'credit_note' && selectedCreditNote) {
        // Handle credit note usage
        const creditNote = availableCreditNotes.find(n => n.id === selectedCreditNote);
        
        // Record credit note usage
        const { error: usageError } = await supabase
          .from('credit_note_usage')
          .insert({
            credit_note_id: selectedCreditNote,
            invoice_id: invoice.id,
            usage_date: formData.invoice_date,
            amount_used: creditNoteAmount,
            notes: `Applied to invoice ${invoiceNumber}`
          });

        if (usageError) {
          console.error('Error recording credit note usage:', usageError);
        }
        
        // Record as payment in sales_payments
        const { error: paymentError } = await supabase
          .from('sales_payments')
          .insert({
            payment_number: `CNP-${Date.now()}`,
            invoice_id: invoice.id,
            payment_date: formData.invoice_date,
            amount: creditNoteAmount,
            payment_method: 'credit_note',
            reference_number: creditNote?.credit_note_number,
            notes: `Credit note ${creditNote?.credit_note_number} applied`
          });

        if (paymentError) {
          console.error('Error recording credit note payment:', paymentError);
        }

      } else if (formData.payment_method !== 'credit') {
        // Regular payments (cash, card, UPI, etc.)
        const paymentNumber = `SP-${Date.now()}`;
        const { error: paymentError } = await supabase
          .from('sales_payments')
          .insert({
            payment_number: paymentNumber,
            invoice_id: invoice.id,
            payment_date: formData.invoice_date,
            amount: totals.total,
            payment_method: formData.payment_method,
            notes: 'Full payment on invoice creation'
          });

        if (paymentError) {
          console.error('Error recording payment:', paymentError);
        }
      }

      // Reduce inventory
      for (const item of items) {
        let remaining = item.quantity;
        const { data: batches } = await supabase
          .from('inventory_batches')
          .select('*')
          .eq('item_id', item.item_id)
          .gt('quantity', 0)
          .order('expiry_date', { ascending: true, nullsFirst: false });

        for (const batch of batches || []) {
          if (remaining <= 0) break;
          const deduct = Math.min(batch.quantity, remaining);
          await supabase
            .from('inventory_batches')
            .update({ quantity: batch.quantity - deduct })
            .eq('id', batch.id);
          remaining -= deduct;
        }
      }

      toast.success('Invoice saved!', `Invoice ${invoiceNumber} has been created.`);

      // Always print
      if (storeSettings) {
        await printInvoice(
          {
            store_name: storeSettings.store_name,
            address: storeSettings.address,
            city: storeSettings.city,
            state: storeSettings.state,
            pincode: storeSettings.pincode,
            phone: storeSettings.phone,
            gstin: storeSettings.gstin
          },
          {
            invoice_number: invoiceNumber,
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
          },
          {
            width: printSettings.width,
            method: printSettings.method
          }
        );
      }

      // Reset form
      setFormData({
        customer_id: '',
        customer_name: '',
        customer_phone: '',
        customer_gstin: '',
        customer_state: 'Tamil Nadu',
        invoice_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        notes: ''
      });
      setItems([]);
      setAvailableCreditNotes([]);
      setSelectedCreditNote('');
      setCreditNoteAmount(0);
    } catch (err: any) {
      console.error('Error saving invoice:', err);
      toast.error('Failed to save', err.message || 'Could not save invoice.');
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600 font-medium">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO SECTION - Teal Gradient Header */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <ShoppingCart className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Sales Invoice</h1>
              <p className="text-teal-100 text-sm md:text-base">Create GST-compliant invoices with instant printing</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
              <p className="text-teal-100 text-xs font-medium">Items in Cart</p>
              <p className="text-white text-xl md:text-2xl font-bold mt-1">{items.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
              <p className="text-teal-100 text-xs font-medium">Cart Total</p>
              <p className="text-white text-xl md:text-2xl font-bold mt-1">
                ₹{items.length > 0 ? totals.total.toFixed(0) : '0'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 col-span-2 md:col-span-1">
              <p className="text-teal-100 text-xs font-medium">Payment Method</p>
              <p className="text-white text-base md:text-lg font-bold mt-1 capitalize">
                {formData.payment_method.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Customer Selection */}
        <Card padding="lg">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Customer Details</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Select Customer</label>
            <Input
              placeholder="Type to search customers..."
              list="customers-list"
              value={formData.customer_name}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, customer_name: value });
                
                const customer = customers.find(c => c.name === value);
                if (customer) {
                  handleCustomerChange(customer.id);
                } else {
                  setFormData({
                    ...formData,
                    customer_id: '',
                    customer_name: value,
                    customer_phone: '',
                    customer_gstin: '',
                    customer_state: 'Tamil Nadu'
                  });
                  setIsIntrastate(true);
                  setAvailableCreditNotes([]);
                  setSelectedCreditNote('');
                  setCreditNoteAmount(0);
                }
              }}
              leftIcon={<User size={18} />}
            />
            <datalist id="customers-list">
              <option value="Walk-in" />
              {customers.map(customer => (
                <option key={customer.id} value={customer.name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              label="Invoice Date"
              type="date"
              value={formData.invoice_date}
              onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
              leftIcon={<Calendar size={18} />}
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
              <Select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="credit">Credit</option>
                <option value="credit_note">Credit Note</option>
              </Select>
            </div>
          </div>

          {/* Credit Note Selector */}
          {formData.payment_method === 'credit_note' && (
            <div className="mt-4 space-y-4">
              {availableCreditNotes.length === 0 ? (
                <div className="bg-orange-50 p-4 rounded-xl">
                  <p className="text-sm text-orange-700 font-medium">
                    No active credit notes available for this customer
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Select Credit Note <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={selectedCreditNote}
                      onChange={(e) => {
                        setSelectedCreditNote(e.target.value);
                        const note = availableCreditNotes.find(n => n.id === e.target.value);
                        if (note) {
                          const amountToUse = Math.min(note.balance_amount, totals.total);
                          setCreditNoteAmount(amountToUse);
                        } else {
                          setCreditNoteAmount(0);
                        }
                      }}
                    >
                      <option value="">Select credit note</option>
                      {availableCreditNotes.map(note => (
                        <option key={note.id} value={note.id}>
                          {note.credit_note_number} - Balance: ₹{note.balance_amount.toLocaleString()} 
                          (Expires: {new Date(note.expiry_date).toLocaleDateString()})
                        </option>
                      ))}
                    </Select>
                  </div>
                  
                  {selectedCreditNote && (
                    <div className="bg-blue-50 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-blue-900">Invoice Total:</span>
                        <span className="text-sm font-bold text-blue-900">₹{totals.total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-blue-900">Credit Applied:</span>
                        <span className="text-sm font-bold text-green-600">-₹{creditNoteAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-200">
                        <span className="text-sm font-bold text-blue-900">Amount Due:</span>
                        <span className="text-sm font-bold text-blue-900">₹{(totals.total - creditNoteAmount).toLocaleString()}</span>
                      </div>
                      {creditNoteAmount < totals.total && (
                        <p className="text-xs text-orange-600 mt-2">
                          ⚠️ Remaining ₹{(totals.total - creditNoteAmount).toLocaleString()} needs separate payment
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Card>

        {/* Items */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Items</h2>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">Add Item</label>
              <button
                onClick={() => setShowBarcodeScanner(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
              >
                <Camera size={16} />
                Scan Barcode
              </button>
            </div>
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
            <div className="text-center py-12 text-slate-500">
              <Package size={48} className="mx-auto mb-3 text-slate-300" />
              <p>No items added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{item.item_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={item.available_stock > 10 ? 'success' : 'warning'} size="sm">
                          {item.available_stock} available
                        </Badge>
                        {item.quantity > item.available_stock && (
                          <Badge variant="danger" size="sm">
                            <AlertTriangle size={12} className="inline mr-1" />
                            Exceeds stock
                          </Badge>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Qty</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Rate</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Disc %</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.discount_percent}
                        onChange={(e) => updateItem(item.id, 'discount_percent', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">GST %</label>
                      <input
                        type="text"
                        value={`${item.gst_rate}%`}
                        readOnly
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Amount</label>
                      <input
                        type="text"
                        value={`₹${item.amount.toFixed(2)}`}
                        readOnly
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-900 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Summary */}
        {items.length > 0 && (
          <Card padding="lg">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal</span>
                <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Discount</span>
                  <span className="font-semibold text-red-600">-₹{totals.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {isIntrastate ? (
                <>
                  <div className="flex justify-between text-slate-700">
                    <span>CGST</span>
                    <span className="font-semibold">₹{totals.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>SGST</span>
                    <span className="font-semibold">₹{totals.sgst.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-700">
                  <span>IGST</span>
                  <span className="font-semibold">₹{totals.igst.toFixed(2)}</span>
                </div>
              )}
              {totals.roundOff !== 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Round Off</span>
                  <span className="font-semibold">{totals.roundOff > 0 ? '+' : ''}₹{totals.roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t-2 border-slate-300">
                <span>Total</span>
                <span className="text-teal-600">₹{totals.total.toFixed(2)}</span>
              </div>
              {formData.payment_method === 'credit_note' && selectedCreditNote && (
                <>
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Credit Note Applied</span>
                    <span>-₹{creditNoteAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t-2 border-slate-300">
                    <span>Amount Due</span>
                    <span className="text-blue-600">₹{(totals.total - creditNoteAmount).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 md:p-6 -mx-4 md:-mx-6 lg:-mx-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setShowSaveConfirm(true)}
              disabled={items.length === 0}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Printer size={20} />
              <span>Save & Print Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save & Print Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={() => { 
          setShowSaveConfirm(false); 
          setShowPrintSettings(true); 
        }}
        title="Create Sales Invoice"
        message={`Create invoice for ${formData.customer_name} with ${items.length} item(s) totaling ₹${totals.total.toFixed(0)}?

This will:
• Generate invoice and print receipt
• Update inventory (deduct ${items.reduce((sum, i) => sum + i.quantity, 0)} items from stock)
• Record ${formData.payment_method === 'credit' ? 'credit sale' : 'payment'}
${formData.payment_method === 'credit_note' && creditNoteAmount > 0 ? `• Apply credit note: ₹${creditNoteAmount.toFixed(0)}` : ''}

${formData.payment_method === 'credit' ? '⚠️ Payment will be pending until collected' : '✓ Payment recorded immediately'}`}
        confirmText="Create & Print"
        cancelText="Review"
        variant="primary"
      />

      {/* Print Settings Modal */}
      {showPrintSettings && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-teal-600 to-teal-700 rounded-t-3xl">
                <h3 className="text-xl font-bold text-white">Print Settings</h3>
                <button
                  onClick={() => setShowPrintSettings(false)}
                  className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Paper Width</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPrintSettings({ ...printSettings, width: '58mm' })}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                        printSettings.width === '58mm'
                          ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      58mm
                    </button>
                    <button
                      onClick={() => setPrintSettings({ ...printSettings, width: '80mm' })}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                        printSettings.width === '80mm'
                          ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      80mm
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Print Method</label>
                  <Select
                    value={printSettings.method}
                    onChange={(e) => setPrintSettings({ ...printSettings, method: e.target.value as any })}
                  >
                    <option value="iframe">Browser Print (Recommended)</option>
                    <option value="preview">Preview Only</option>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPrintSettings(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-xl transition-all shadow-md"
                >
                  {saving ? 'Saving...' : 'Save & Print'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => { setShowBarcodeScanner(false); setScanningForItemId(null); }}
        onScan={handleBarcodeScan}
      />
    </div>
  );
};

export default SalesInvoice;
