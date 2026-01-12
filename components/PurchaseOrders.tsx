// FILE PATH: components/PurchaseOrders.tsx

import React, { useState } from 'react';
import { ShoppingCart, Plus, Eye, Edit2, X, Search, Trash2 } from 'lucide-react';

type POStatus = 'pending' | 'partial' | 'received' | 'cancelled';

type PurchaseOrder = {
  id: string;
  po_number: string;
  vendor_name: string;
  po_date: string;
  expected_delivery_date: string;
  status: POStatus;
  total_amount: number;
  items_count: number;
};

type POItem = {
  id: string;
  item_name: string;
  quantity: number;
  rate: number;
  gst_rate: number;
  amount: number;
  received_quantity: number;
};

const PurchaseOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<POStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Mock data
  const mockPOs: PurchaseOrder[] = [
    {
      id: '1',
      po_number: 'PO-2026-001',
      vendor_name: 'Sri Krishna Suppliers',
      po_date: '2026-01-08',
      expected_delivery_date: '2026-01-15',
      status: 'pending',
      total_amount: 15750,
      items_count: 5
    },
    {
      id: '2',
      po_number: 'PO-2026-002',
      vendor_name: 'Divine Traders',
      po_date: '2026-01-05',
      expected_delivery_date: '2026-01-12',
      status: 'partial',
      total_amount: 28900,
      items_count: 8
    },
    {
      id: '3',
      po_number: 'PO-2026-003',
      vendor_name: 'Pooja Wholesale',
      po_date: '2026-01-03',
      expected_delivery_date: '2026-01-10',
      status: 'received',
      total_amount: 12340,
      items_count: 4
    }
  ];

  const mockPOItems: POItem[] = [
    {
      id: '1',
      item_name: 'Camphor Tablets',
      quantity: 100,
      rate: 40,
      gst_rate: 5,
      amount: 4200,
      received_quantity: 0
    },
    {
      id: '2',
      item_name: 'Agarbatti - Rose',
      quantity: 200,
      rate: 25,
      gst_rate: 12,
      amount: 5600,
      received_quantity: 0
    }
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    partial: 'bg-blue-100 text-blue-800',
    received: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const handleViewPO = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowViewModal(true);
  };

  const filteredPOs = mockPOs.filter(po => {
    const matchesSearch = po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-gray-600 text-sm mt-1">Create and track purchase orders</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          New PO
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by PO number or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border-0 focus:ring-0 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as POStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* PO Cards - Mobile Friendly */}
      <div className="grid grid-cols-1 lg:hidden gap-4">
        {filteredPOs.map((po) => (
          <div key={po.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{po.po_number}</h3>
                <p className="text-sm text-gray-600">{po.vendor_name}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[po.status]}`}>
                {po.status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium text-gray-900">{new Date(po.po_date).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <p className="text-gray-500">Expected</p>
                <p className="font-medium text-gray-900">{new Date(po.expected_delivery_date).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <p className="text-gray-500">Items</p>
                <p className="font-medium text-gray-900">{po.items_count}</p>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-medium text-gray-900">₹{po.total_amount.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <button
              onClick={() => handleViewPO(po)}
              className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Eye size={16} />
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* PO Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Delivery</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPOs.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{po.po_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{po.vendor_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(po.po_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(po.expected_delivery_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[po.status]}`}>
                      {po.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{po.items_count}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">₹{po.total_amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewPO(po)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye size={16} />
                      </button>
                      <button className="p-1 text-gray-600 hover:bg-gray-50 rounded">
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View PO Modal */}
      {showViewModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedPO.po_number}</h3>
                <p className="text-sm text-gray-600">{selectedPO.vendor_name}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* PO Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">PO Date</p>
                  <p className="font-medium text-gray-900">{new Date(selectedPO.po_date).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expected Delivery</p>
                  <p className="font-medium text-gray-900">{new Date(selectedPO.expected_delivery_date).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusColors[selectedPO.status]}`}>
                    {selectedPO.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium text-gray-900">₹{selectedPO.total_amount.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 hidden sm:table-cell">Rate</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 hidden sm:table-cell">GST%</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 hidden md:table-cell">Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {mockPOItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.item_name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 hidden sm:table-cell">₹{item.rate}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 hidden sm:table-cell">{item.gst_rate}%</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">₹{item.amount.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 hidden md:table-cell">{item.received_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                  Record Receipt
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                  Print PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;