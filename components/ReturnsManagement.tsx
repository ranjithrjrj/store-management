// FILE PATH: components/ReturnsManagement.tsx

import React, { useState } from 'react';
import { RotateCcw, Plus, Eye, CheckCircle, XCircle, Search, Filter, FileText, CreditCard } from 'lucide-react';

type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';
type RefundMethod = 'cash' | 'bank_transfer' | 'store_credit';

type SalesReturn = {
  id: string;
  return_number: string;
  original_invoice_number: string;
  return_date: string;
  customer_name: string;
  customer_phone?: string;
  return_reason: string;
  total_amount: number;
  refund_amount: number;
  refund_method: RefundMethod;
  refund_status: ReturnStatus;
  items_count: number;
  is_restockable: boolean;
};

type ReturnItem = {
  id: string;
  item_name: string;
  quantity: number;
  rate: number;
  total_amount: number;
  return_reason?: string;
  is_restocked: boolean;
};

const ReturnsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
  const [activeTab, setActiveTab] = useState<'returns' | 'credit-notes'>('returns');

  // Mock data
  const mockReturns: SalesReturn[] = [
    {
      id: '1',
      return_number: 'RTN-202601-001',
      original_invoice_number: 'INV-202601-045',
      return_date: '2026-01-10',
      customer_name: 'Ram Prasad',
      customer_phone: '9876543210',
      return_reason: 'Defective Product',
      total_amount: 890,
      refund_amount: 890,
      refund_method: 'cash',
      refund_status: 'completed',
      items_count: 2,
      is_restockable: false
    },
    {
      id: '2',
      return_number: 'RTN-202601-002',
      original_invoice_number: 'INV-202601-038',
      return_date: '2026-01-09',
      customer_name: 'Lakshmi Store',
      customer_phone: '9876543211',
      return_reason: 'Wrong Item Delivered',
      total_amount: 2340,
      refund_amount: 2340,
      refund_method: 'store_credit',
      refund_status: 'approved',
      items_count: 3,
      is_restockable: true
    },
    {
      id: '3',
      return_number: 'RTN-202601-003',
      original_invoice_number: 'INV-202601-042',
      return_date: '2026-01-08',
      customer_name: 'Devi Traders',
      return_reason: 'Quality Issue',
      total_amount: 1250,
      refund_amount: 1250,
      refund_method: 'bank_transfer',
      refund_status: 'pending',
      items_count: 4,
      is_restockable: true
    }
  ];

  const mockReturnItems: ReturnItem[] = [
    {
      id: '1',
      item_name: 'Camphor Tablets',
      quantity: 2,
      rate: 45,
      total_amount: 90,
      return_reason: 'Product damaged',
      is_restocked: false
    },
    {
      id: '2',
      item_name: 'Agarbatti - Rose',
      quantity: 1,
      rate: 30,
      total_amount: 30,
      is_restocked: false
    }
  ];

  const mockCreditNotes = [
    {
      id: '1',
      credit_note_number: 'CN-202601-001',
      customer_name: 'Lakshmi Store',
      issue_date: '2026-01-09',
      amount: 2340,
      balance_amount: 2340,
      expiry_date: '2026-04-09',
      status: 'active'
    },
    {
      id: '2',
      credit_note_number: 'CN-202601-002',
      customer_name: 'Ram Prasad',
      issue_date: '2026-01-05',
      amount: 500,
      balance_amount: 150,
      expiry_date: '2026-04-05',
      status: 'active'
    }
  ];

  const [returns, setReturns] = useState(mockReturns);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800'
  };

  const refundMethodLabels = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    store_credit: 'Store Credit'
  };

  const handleViewReturn = (returnItem: SalesReturn) => {
    setSelectedReturn(returnItem);
    setShowViewModal(true);
  };

  const handleApproveReturn = (id: string) => {
    if (confirm('Approve this return and process refund?')) {
      setReturns(returns.map(r => 
        r.id === id ? { ...r, refund_status: 'approved' } : r
      ));
      alert('Return approved! Refund will be processed.');
    }
  };

  const handleRejectReturn = (id: string) => {
    if (confirm('Reject this return request?')) {
      setReturns(returns.map(r => 
        r.id === id ? { ...r, refund_status: 'rejected' } : r
      ));
    }
  };

  const handleCompleteReturn = (id: string) => {
    if (confirm('Mark refund as completed?')) {
      setReturns(returns.map(r => 
        r.id === id ? { ...r, refund_status: 'completed' } : r
      ));
    }
  };

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = ret.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.original_invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ret.refund_status === statusFilter;
    const matchesDate = ret.return_date >= dateRange.from && ret.return_date <= dateRange.to;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalReturns = filteredReturns.reduce((sum, r) => sum + r.total_amount, 0);
  const pendingReturns = filteredReturns.filter(r => r.refund_status === 'pending').length;
  const completedReturns = filteredReturns.filter(r => r.refund_status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Returns & Refunds</h2>
          <p className="text-gray-600 text-sm mt-1">Manage product returns and customer refunds</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          Process Return
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'returns'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <RotateCcw size={16} className="inline mr-2" />
            Returns
          </button>
          <button
            onClick={() => setActiveTab('credit-notes')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'credit-notes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <CreditCard size={16} className="inline mr-2" />
            Credit Notes
          </button>
        </div>
      </div>

      {activeTab === 'returns' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Returns</p>
              <p className="text-2xl font-bold text-red-600 mt-1">₹{totalReturns.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Returns Count</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{filteredReturns.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingReturns}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{completedReturns}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <div className="flex items-center gap-2">
                  <Search size={20} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search returns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 border-0 focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ReturnStatus | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Returns Cards - Mobile */}
          <div className="grid grid-cols-1 lg:hidden gap-4">
            {filteredReturns.map((returnItem) => (
              <div key={returnItem.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{returnItem.return_number}</h3>
                    <p className="text-sm text-gray-600">Invoice: {returnItem.original_invoice_number}</p>
                    <p className="text-sm text-gray-600">{returnItem.customer_name}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[returnItem.refund_status]}`}>
                    {returnItem.refund_status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">{new Date(returnItem.return_date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reason:</span>
                    <span className="text-gray-900">{returnItem.return_reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-red-600">₹{returnItem.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Method:</span>
                    <span className="text-gray-900">{refundMethodLabels[returnItem.refund_method]}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleViewReturn(returnItem)}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Eye size={14} />
                    View
                  </button>
                  {returnItem.refund_status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveReturn(returnItem.id)}
                        className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        onClick={() => handleRejectReturn(returnItem.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                  {returnItem.refund_status === 'approved' && (
                    <button
                      onClick={() => handleCompleteReturn(returnItem.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Returns Table - Desktop */}
          <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Original Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refund Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReturns.map((returnItem) => (
                    <tr key={returnItem.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 text-sm">{returnItem.return_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{returnItem.original_invoice_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(returnItem.return_date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{returnItem.customer_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{returnItem.return_reason}</td>
                      <td className="px-4 py-3 text-sm font-bold text-red-600">₹{returnItem.total_amount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{refundMethodLabels[returnItem.refund_method]}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[returnItem.refund_status]}`}>
                          {returnItem.refund_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewReturn(returnItem)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {returnItem.refund_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveReturn(returnItem.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Approve"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => handleRejectReturn(returnItem.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          {returnItem.refund_status === 'approved' && (
                            <button
                              onClick={() => handleCompleteReturn(returnItem.id)}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Credit Notes Tab */
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit Note #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockCreditNotes.map((cn) => (
                    <tr key={cn.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 text-sm">{cn.credit_note_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{cn.customer_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(cn.issue_date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{cn.amount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">₹{cn.balance_amount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(cn.expiry_date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                          {cn.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View Return Modal */}
      {showViewModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedReturn.return_number}</h3>
                <p className="text-sm text-gray-600">Return Details</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <FileText size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Return Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Original Invoice</p>
                  <p className="font-medium text-gray-900">{selectedReturn.original_invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Return Date</p>
                  <p className="font-medium text-gray-900">{new Date(selectedReturn.return_date).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">{selectedReturn.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusColors[selectedReturn.refund_status]}`}>
                    {selectedReturn.refund_status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Return Reason */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-1">Return Reason</p>
                <p className="text-sm text-gray-700">{selectedReturn.return_reason}</p>
              </div>

              {/* Returned Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Returned Items</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Rate</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Restocked</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {mockReturnItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.item_name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">₹{item.rate}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">₹{item.total_amount}</td>
                          <td className="px-4 py-2">
                            {item.is_restocked ? (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Yes</span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Refund Details */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Total Return Amount:</span>
                  <span className="font-bold text-red-600 text-xl">₹{selectedReturn.total_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Refund Method:</span>
                  <span className="font-medium text-gray-900">{refundMethodLabels[selectedReturn.refund_method]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsManagement;