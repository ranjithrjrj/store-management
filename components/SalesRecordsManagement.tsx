// FILE PATH: components/SalesRecordsManagement.tsx
// Sales Records Management - View saved and printed invoices

'use client';
import React, { useState, useEffect } from 'react';
import { FileText, Search, X, Eye, Edit2, Trash2, Printer, ShoppingCart } from 'lucide-react';
import { printInvoice } from '@/lib/thermalPrinter';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type SalesInvoice = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_gstin?: string;
  customer_state: string;
  invoice_date: string;
  subtotal: number;
  discount_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  round_off: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  is_printed: boolean;
  notes?: string;
  created_at: string;
};

type InvoiceItem = {
  id: string;
  item_name?: string;
  quantity: number;
  rate: number;
  discount_percent: number;
  gst_rate: number;
  total_amount: number;
};

const SalesRecordsManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<SalesInvoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [deletingInvoice, setDeletingInvoice] = useState<{ id: string; invoice_number: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [printingInvoice, setPrintingInvoice] = useState<SalesInvoice | null>(null);
  const [printSettings, setPrintSettings] = useState({
    width: '80mm' as '58mm' | '80mm',
    method: 'iframe' as 'browser' | 'iframe' | 'bluetooth' | 'preview'
  });
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    loadInvoices();
    loadStoreSettings();
  }, []);

  async function loadStoreSettings() {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1);
      
      setStoreSettings(data?.[0] || null);
    } catch (err) {
      console.error('Error loading store settings:', err);
    }
  }

  async function loadInvoices() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*')
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err: any) {
      console.error('Error loading invoices:', err);
      toast.error('Failed to load', 'Could not load sales invoices.');
    } finally {
      setLoading(false);
    }
  }

  async function loadInvoiceItems(invoiceId: string) {
    try {
      setLoadingItems(true);
      
      const { data, error } = await supabase
        .from('sales_invoice_items')
        .select(`
          *,
          item:items(name)
        `)
        .eq('invoice_id', invoiceId);

      if (error) throw error;
      
      const itemsWithNames = data?.map(item => ({
        ...item,
        item_name: item.item?.name || 'Unknown Item'
      })) || [];
      
      setInvoiceItems(itemsWithNames);
    } catch (err: any) {
      console.error('Error loading items:', err);
      toast.error('Failed to load', 'Could not load invoice items.');
    } finally {
      setLoadingItems(false);
    }
  }

  const handleView = async (invoice: SalesInvoice) => {
    setViewingInvoice(invoice);
    setShowViewModal(true);
    await loadInvoiceItems(invoice.id);
  };

  const handleReprint = (invoice: SalesInvoice) => {
    setPrintingInvoice(invoice);
    setShowPrintSettings(true);
  };

  const handleConfirmPrint = async () => {
    if (!printingInvoice || !storeSettings) return;

    try {
      setPrinting(true);
      
      // Load items
      const { data: items } = await supabase
        .from('sales_invoice_items')
        .select(`
          *,
          item:items(name)
        `)
        .eq('invoice_id', printingInvoice.id);

      if (!items || items.length === 0) {
        throw new Error('No items found');
      }

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
          invoice_number: printingInvoice.invoice_number,
          invoice_date: printingInvoice.invoice_date,
          customer_name: printingInvoice.customer_name,
          customer_phone: printingInvoice.customer_phone,
          customer_gstin: printingInvoice.customer_gstin,
          items: items.map(item => ({
            name: item.item?.name || 'Unknown Item',
            quantity: item.quantity,
            rate: item.rate,
            gst_rate: item.gst_rate,
            total: item.total_amount
          })),
          subtotal: printingInvoice.subtotal,
          discount_amount: printingInvoice.discount_amount,
          cgst_amount: printingInvoice.cgst_amount,
          sgst_amount: printingInvoice.sgst_amount,
          igst_amount: printingInvoice.igst_amount,
          round_off: printingInvoice.round_off,
          total_amount: printingInvoice.total_amount,
          payment_method: printingInvoice.payment_method
        },
        {
          width: printSettings.width,
          method: printSettings.method
        }
      );

      toast.success('Printing!', `Invoice ${printingInvoice.invoice_number} sent to printer.`);
      setShowPrintSettings(false);
      setPrintingInvoice(null);
    } catch (err: any) {
      console.error('Error printing:', err);
      toast.error('Print failed', err.message || 'Could not print invoice.');
    } finally {
      setPrinting(false);
    }
  };

  const handleDeleteClick = (invoice: SalesInvoice) => {
    setDeletingInvoice({ id: invoice.id, invoice_number: invoice.invoice_number });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingInvoice) return;

    try {
      const { error } = await supabase
        .from('sales_invoices')
        .delete()
        .eq('id', deletingInvoice.id);

      if (error) throw error;

      toast.success('Deleted!', `Invoice ${deletingInvoice.invoice_number} has been deleted.`);
      await loadInvoices();
    } catch (err: any) {
      console.error('Error deleting invoice:', err);
      toast.error('Failed to delete', err.message || 'Could not delete invoice.');
    } finally {
      setShowDeleteConfirm(false);
      setDeletingInvoice(null);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600 font-medium">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <ShoppingCart className="text-emerald-700" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Sales Records</h1>
              <p className="text-slate-600 text-sm mt-0.5">View and manage sales invoices</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card padding="md">
          <Input
            placeholder="Search by invoice number or customer..."
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

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FileText size={64} />}
              title={searchTerm ? "No invoices found" : "No invoices yet"}
              description={
                searchTerm
                  ? "Try adjusting your search"
                  : "Sales invoices will appear here"
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} hover padding="lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <FileText className="text-emerald-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{invoice.invoice_number}</h3>
                        <p className="text-sm text-slate-600">{invoice.customer_name}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 font-medium">Date</p>
                        <p className="text-slate-900 font-semibold">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Amount</p>
                        <p className="text-emerald-600 font-bold text-lg">₹{invoice.total_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Payment</p>
                        <Badge variant="neutral" size="sm">{invoice.payment_method}</Badge>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">GST</p>
                        <p className="text-slate-900 font-semibold">
                          ₹{(invoice.cgst_amount + invoice.sgst_amount + invoice.igst_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(invoice)}
                      className="p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      title="View"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleReprint(invoice)}
                      className="p-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      title="Reprint"
                    >
                      <Printer size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(invoice)}
                      className="p-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && viewingInvoice && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <FileText className="text-emerald-700" size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{viewingInvoice.invoice_number}</h3>
                    <p className="text-slate-600">Invoice Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={24} className="text-slate-600" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-slate-50 rounded-xl p-5">
                  <h4 className="font-bold text-slate-900 mb-4">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 font-medium">Name</p>
                      <p className="text-slate-900 font-bold">{viewingInvoice.customer_name}</p>
                    </div>
                    {viewingInvoice.customer_phone && (
                      <div>
                        <p className="text-slate-500 font-medium">Phone</p>
                        <p className="text-slate-900 font-bold">{viewingInvoice.customer_phone}</p>
                      </div>
                    )}
                    {viewingInvoice.customer_gstin && (
                      <div>
                        <p className="text-slate-500 font-medium">GSTIN</p>
                        <p className="text-slate-900 font-bold">{viewingInvoice.customer_gstin}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-500 font-medium">State</p>
                      <p className="text-slate-900 font-bold">{viewingInvoice.customer_state}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Invoice Date</p>
                      <p className="text-slate-900 font-bold">{new Date(viewingInvoice.invoice_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Payment Method</p>
                      <Badge variant="neutral">{viewingInvoice.payment_method}</Badge>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-4">Items</h4>
                  {loadingItems ? (
                    <div className="text-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invoiceItems.map((item, idx) => (
                        <div key={item.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
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
                              <p className="text-emerald-600 font-bold">₹{item.total_amount.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-slate-50 rounded-xl p-5">
                  <h4 className="font-bold text-slate-900 mb-4">Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-700">Subtotal</span>
                      <span className="font-semibold">₹{viewingInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    {viewingInvoice.discount_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-700">Discount</span>
                        <span className="font-semibold text-red-600">-₹{viewingInvoice.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    {viewingInvoice.cgst_amount > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-700">CGST</span>
                          <span className="font-semibold">₹{viewingInvoice.cgst_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-700">SGST</span>
                          <span className="font-semibold">₹{viewingInvoice.sgst_amount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    {viewingInvoice.igst_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-700">IGST</span>
                        <span className="font-semibold">₹{viewingInvoice.igst_amount.toFixed(2)}</span>
                      </div>
                    )}
                    {viewingInvoice.round_off !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-700">Round Off</span>
                        <span className="font-semibold">{viewingInvoice.round_off > 0 ? '+' : ''}₹{viewingInvoice.round_off.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-3 border-t-2 border-slate-300">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-2xl text-emerald-600">₹{viewingInvoice.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {viewingInvoice.notes && (
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h4 className="font-bold text-slate-900 mb-2">Notes</h4>
                    <p className="text-slate-700">{viewingInvoice.notes}</p>
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
      {showDeleteConfirm && deletingInvoice && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeletingInvoice(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Invoice"
          message={`Are you sure you want to delete invoice "${deletingInvoice.invoice_number}"? This will permanently remove the invoice. For customer returns, please use the Returns page instead. This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}

      {/* Print Settings Modal */}
      {showPrintSettings && printingInvoice && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <Card className="w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Print Settings</h3>
                <button
                  onClick={() => setShowPrintSettings(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Paper Width</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPrintSettings({ ...printSettings, width: '58mm' })}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium ${
                        printSettings.width === '58mm'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      58mm
                    </button>
                    <button
                      onClick={() => setPrintSettings({ ...printSettings, width: '80mm' })}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium ${
                        printSettings.width === '80mm'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
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
                <Button onClick={() => setShowPrintSettings(false)} variant="secondary" fullWidth>
                  Cancel
                </Button>
                <Button onClick={handleConfirmPrint} variant="primary" fullWidth loading={printing}>
                  Print
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesRecordsManagement;
