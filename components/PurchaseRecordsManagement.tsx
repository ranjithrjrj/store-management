// FILE PATH: components/PurchaseRecordsManagement.tsx
// Purchase Records Management - View, Edit, Delete recorded purchases

'use client';
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, X, Eye, Edit2, Trash2, Calendar, FileText, Package, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Select, Badge, EmptyState, LoadingSpinner, ConfirmDialog, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type PurchaseRecord = {
  id: string;
  invoice_number: string;
  vendor_id: string;
  vendor?: { name: string };
  invoice_date: string;
  received_date: string;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  payment_status: string;
  notes?: string;
  po_id?: string;
  po_number?: string;
  created_at: string;
};

type PurchaseRecordItem = {
  id: string;
  item_id: string;
  item_name?: string;
  batch_number?: string;
  expiry_date?: string;
  quantity: number;
  rate: number;
  gst_rate: number;
  amount: number;
};

const PurchaseRecordsManagement = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [records, setRecords] = useState<PurchaseRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<PurchaseRecord | null>(null);
  const [recordItems, setRecordItems] = useState<PurchaseRecordItem[]>([]);
  const [deletingRecord, setDeletingRecord] = useState<{ id: string; invoice_number: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('purchase_invoices')
        .select(`
          *,
          vendor:vendors(name)
        `)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err: any) {
      console.error('Error loading records:', err);
      toast.error('Failed to load', 'Could not load purchase records.');
    } finally {
      setLoading(false);
    }
  }

  async function loadRecordItems(recordId: string) {
    try {
      setLoadingItems(true);
      
      const { data, error } = await supabase
        .from('purchase_invoice_items')
        .select(`
          *,
          item:items(name)
        `)
        .eq('purchase_invoice_id', recordId);

      if (error) throw error;
      
      const itemsWithNames = data?.map(item => ({
        ...item,
        item_name: item.item?.name || 'Unknown Item'
      })) || [];
      
      setRecordItems(itemsWithNames);
    } catch (err: any) {
      console.error('Error loading items:', err);
      toast.error('Failed to load', 'Could not load record items.');
    } finally {
      setLoadingItems(false);
    }
  }

  const handleView = async (record: PurchaseRecord) => {
    setViewingRecord(record);
    setShowViewModal(true);
    await loadRecordItems(record.id);
  };

  const handleDeleteClick = (record: PurchaseRecord) => {
    setDeletingRecord({ id: record.id, invoice_number: record.invoice_number });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;

    try {
      const { error } = await supabase
        .from('purchase_invoices')
        .delete()
        .eq('id', deletingRecord.id);

      if (error) throw error;

      toast.success('Deleted!', `Record ${deletingRecord.invoice_number} has been deleted.`);
      await loadRecords();
    } catch (err: any) {
      console.error('Error deleting record:', err);
      toast.error('Failed to delete', err.message || 'Could not delete record.');
    } finally {
      setShowDeleteConfirm(false);
      setDeletingRecord(null);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || record.payment_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusColors: any = {
    paid: 'success',
    pending: 'warning',
    partial: 'neutral'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Loading purchase records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <ShoppingBag className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Purchase Records</h1>
                <p className="text-white/90 mt-1">View and manage recorded purchases</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl border border-white/20 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search by record number, invoice, or vendor..."
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </Select>
          </div>
        </div>

        {/* Records List */}
        {filteredRecords.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl border border-white/20 p-12">
            <EmptyState
              icon={<ShoppingBag size={64} />}
              title={searchTerm || filterStatus !== 'all' ? "No records found" : "No purchase records yet"}
              description={
                searchTerm || filterStatus !== 'all'
                  ? "Try adjusting your search or filters"
                  : "Purchase records will appear here once you record them"
              }
              action={
                searchTerm || filterStatus !== 'all' ? (
                  <Button onClick={() => { setSearchTerm(''); setFilterStatus('all'); }} variant="secondary">
                    Clear Filters
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record, index) => (
              <div
                key={record.id}
                className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300"
                style={{
                  animation: `slideIn 0.3s ease-out ${index * 0.05}s backwards`
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                        <ShoppingBag className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{record.invoice_number}</h3>
                        <p className="text-sm text-gray-600">Invoice: {record.invoice_number}</p>
                      </div>
                      <Badge variant={statusColors[record.payment_status] || 'neutral'} size="sm">
                        {record.payment_status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 font-medium">Vendor</p>
                        <p className="text-gray-900 font-semibold">{record.vendor?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Date</p>
                        <p className="text-gray-900 font-semibold">{new Date(record.invoice_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Amount</p>
                        <p className="text-blue-600 font-bold text-lg">₹{record.total_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">GST</p>
                        <p className="text-gray-900 font-semibold">
                          ₹{(record.cgst_amount + record.sgst_amount + record.igst_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(record)}
                      className={`p-3 rounded-xl ${theme.classes.bgPrimaryLight} ${theme.classes.textPrimary} hover:scale-110 transition-all`}
                      title="View"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(record)}
                      className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && records.length > 0 && (
          <div className="text-sm text-gray-600 text-center">
            Showing {filteredRecords.length} of {records.length} records
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && viewingRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center py-8">
            <div className="backdrop-blur-xl bg-white/95 rounded-3xl shadow-2xl border border-white/20 w-full max-w-4xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl">
                    <FileText className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{viewingRecord.invoice_number}</h3>
                    <p className="text-gray-600">Purchase Record Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              {/* Record Details */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                  <h4 className="font-bold text-gray-900 mb-4">Purchase Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium">Vendor</p>
                      <p className="text-gray-900 font-bold">{viewingRecord.vendor?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Invoice Number</p>
                      <p className="text-gray-900 font-bold">{viewingRecord.invoice_number}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Invoice Date</p>
                      <p className="text-gray-900 font-bold">{new Date(viewingRecord.invoice_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Received Date</p>
                      <p className="text-gray-900 font-bold">{new Date(viewingRecord.received_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Payment Status</p>
                      <Badge variant={statusColors[viewingRecord.payment_status] || 'neutral'}>
                        {viewingRecord.payment_status}
                      </Badge>
                    </div>
                    {viewingRecord.po_number && (
                      <div>
                        <p className="text-gray-500 font-medium">From Purchase Order</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="success" size="sm">
                            {viewingRecord.po_number}
                          </Badge>
                          <span className="text-xs text-gray-500">Received from PO</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {viewingRecord.notes && (
                    <div className="mt-4">
                      <p className="text-gray-500 font-medium">Notes</p>
                      <p className="text-gray-900">{viewingRecord.notes}</p>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package size={20} />
                    Items
                  </h4>
                  {loadingItems ? (
                    <div className="text-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recordItems.map((item, idx) => (
                        <div key={item.id} className="bg-white/60 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold text-xs">
                              {idx + 1}
                            </span>
                            <h5 className="font-semibold text-gray-900">{item.item_name}</h5>
                            {item.batch_number && (
                              <Badge variant="neutral" size="sm">{item.batch_number}</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Qty</p>
                              <p className="text-gray-900 font-semibold">{item.quantity}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Rate</p>
                              <p className="text-gray-900 font-semibold">₹{item.rate.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">GST</p>
                              <p className="text-gray-900 font-semibold">{item.gst_rate}%</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Amount</p>
                              <p className="text-blue-600 font-bold">₹{item.amount.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                  <h4 className="font-bold text-gray-900 mb-4">Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal</span>
                      <span className="font-semibold">₹{viewingRecord.subtotal.toFixed(2)}</span>
                    </div>
                    {viewingRecord.cgst_amount > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-700">CGST</span>
                          <span className="font-semibold">₹{viewingRecord.cgst_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">SGST</span>
                          <span className="font-semibold">₹{viewingRecord.sgst_amount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    {viewingRecord.igst_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">IGST</span>
                        <span className="font-semibold">₹{viewingRecord.igst_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-3 border-t-2 border-gray-300">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                        ₹{viewingRecord.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={() => setShowViewModal(false)} variant="secondary" fullWidth>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingRecord && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeletingRecord(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Purchase Record"
          message={`Are you sure you want to delete record "${deletingRecord.invoice_number}"? This will also delete all items. This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
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
      `}</style>
    </div>
  );
};

export default PurchaseRecordsManagement;
