// FILE PATH: components/Reports.tsx

import React, { useState } from 'react';
import { TrendingUp, Download, Calendar, FileText, DollarSign, Package, ShoppingCart } from 'lucide-react';

type ReportType = 'sales' | 'purchase' | 'gst' | 'inventory' | 'pl';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const reportTypes = [
    { id: 'sales', label: 'Sales Report', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
    { id: 'purchase', label: 'Purchase Report', icon: ShoppingCart, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'gst', label: 'GST Report', icon: FileText, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'inventory', label: 'Inventory Valuation', icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'pl', label: 'Profit & Loss', icon: DollarSign, color: 'text-indigo-600', bgColor: 'bg-indigo-50' }
  ];

  // Mock data
  const mockSalesData = [
    { date: '2026-01-10', invoice_count: 8, total_sales: 12340, cgst: 617, sgst: 617, igst: 0 },
    { date: '2026-01-09', invoice_count: 12, total_sales: 18900, cgst: 945, sgst: 945, igst: 0 },
    { date: '2026-01-08', invoice_count: 6, total_sales: 8750, cgst: 437.5, sgst: 437.5, igst: 0 }
  ];

  const mockPurchaseData = [
    { date: '2026-01-08', vendor: 'Sri Krishna Suppliers', amount: 15750, cgst: 787.5, sgst: 787.5 },
    { date: '2026-01-05', vendor: 'Divine Traders', amount: 28900, cgst: 1445, sgst: 1445 }
  ];

  const mockGSTData = {
    totalSales: 145230,
    totalPurchases: 98450,
    cgstCollected: 7261.5,
    sgstCollected: 7261.5,
    igstCollected: 0,
    cgstPaid: 4922.5,
    sgstPaid: 4922.5,
    igstPaid: 0
  };

  const mockInventoryData = [
    { category: 'Pooja Items', items_count: 15, total_value: 45800 },
    { category: 'Handicrafts', items_count: 8, total_value: 32400 },
    { category: 'Decorative', items_count: 12, total_value: 28900 }
  ];

  const handleDownload = () => {
    alert(`Downloading ${selectedReport} report...`);
  };

  const renderSalesReport = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{mockSalesData.reduce((sum, d) => sum + d.total_sales, 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockSalesData.reduce((sum, d) => sum + d.invoice_count, 0)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">CGST Collected</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{mockSalesData.reduce((sum, d) => sum + d.cgst, 0).toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">SGST Collected</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{mockSalesData.reduce((sum, d) => sum + d.sgst, 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoices</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">CGST</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">SGST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockSalesData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{new Date(row.date).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.invoice_count}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{row.total_sales.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">₹{row.cgst.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">₹{row.sgst.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPurchaseReport = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Purchases</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{mockPurchaseData.reduce((sum, d) => sum + d.amount, 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">CGST Paid</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{mockPurchaseData.reduce((sum, d) => sum + d.cgst, 0).toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">SGST Paid</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{mockPurchaseData.reduce((sum, d) => sum + d.sgst, 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">CGST</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">SGST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockPurchaseData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{new Date(row.date).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.vendor}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{row.amount.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">₹{row.cgst.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">₹{row.sgst.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderGSTReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Output GST (Sales)</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Sales:</span>
              <span className="font-medium text-gray-900">₹{mockGSTData.totalSales.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CGST Collected:</span>
              <span className="font-medium text-gray-900">₹{mockGSTData.cgstCollected.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SGST Collected:</span>
              <span className="font-medium text-gray-900">₹{mockGSTData.sgstCollected.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IGST Collected:</span>
              <span className="font-medium text-gray-900">₹{mockGSTData.igstCollected.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Input GST (Purchases)</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Purchases:</span>
              <span className="font-medium text-gray-900">₹{mockGSTData.totalPurchases.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CGST Paid:</span>
              <span className="font-medium text-gray-900">₹{mockGSTData.cgstPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SGST Paid:</span>
              <span className="font-medium text-gray-900">₹{mockGSTData.sgstPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IGST Paid:</span>
              <span className="font-medium text-gray-900">₹{mockGSTData.igstPaid.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Net GST Liability</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">CGST Payable</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              ₹{(mockGSTData.cgstCollected - mockGSTData.cgstPaid).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">SGST Payable</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              ₹{(mockGSTData.sgstCollected - mockGSTData.sgstPaid).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total GST Payable</p>
            <p className="text-xl font-bold text-green-600 mt-1">
              ₹{((mockGSTData.cgstCollected - mockGSTData.cgstPaid) + (mockGSTData.sgstCollected - mockGSTData.sgstPaid)).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventoryReport = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Items</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockInventoryData.reduce((sum, d) => sum + d.items_count, 0)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Inventory Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ₹{mockInventoryData.reduce((sum, d) => sum + d.total_value, 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Categories</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockInventoryData.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items Count</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockInventoryData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.category}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.items_count}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{row.total_value.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const mockExpensesData = {
    rent: 15000,
    electricity: 2800,
    salaries: 25000,
    transport: 850,
    maintenance: 1200,
    marketing: 3500,
    miscellaneous: 2650
  };

  const totalExpenses = Object.values(mockExpensesData).reduce((sum, val) => sum + val, 0);
  const grossProfit = mockGSTData.totalSales - mockGSTData.totalPurchases;
  const netProfit = grossProfit - totalExpenses;

  const renderPLReport = () => (
    <div className="space-y-6">
      {/* Revenue Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Revenue</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Sales:</span>
            <span className="font-medium text-gray-900">₹{mockGSTData.totalSales.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* COGS Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Cost of Goods Sold</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Purchases:</span>
            <span className="font-medium text-gray-900">₹{mockGSTData.totalPurchases.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className="font-semibold text-gray-900">Gross Profit:</span>
            <span className="font-semibold text-green-600">₹{grossProfit.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Operating Expenses */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Operating Expenses</h3>
        <div className="space-y-2">
          {Object.entries(mockExpensesData).map(([category, amount]) => (
            <div key={category} className="flex justify-between text-sm">
              <span className="text-gray-600 capitalize">{category}:</span>
              <span className="text-red-600">₹{amount.toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className="font-semibold text-gray-900">Total Expenses:</span>
            <span className="font-semibold text-red-600">₹{totalExpenses.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Net Profit/Loss */}
      <div className={`border rounded-lg p-6 ${netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <h3 className="font-semibold text-gray-900 mb-4">Net Profit/Loss</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Gross Profit:</span>
            <span className="font-medium text-gray-900">₹{grossProfit.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Operating Expenses:</span>
            <span className="font-medium text-red-600">-₹{totalExpenses.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-gray-300">
            <span className="text-lg font-semibold text-gray-900">Net {netProfit >= 0 ? 'Profit' : 'Loss'}:</span>
            <span className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.abs(netProfit).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-sm pt-2">
            <span className="text-gray-600">Net Margin:</span>
            <span className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {((netProfit / mockGSTData.totalSales) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReport = () => {
    switch (selectedReport) {
      case 'sales':
        return renderSalesReport();
      case 'purchase':
        return renderPurchaseReport();
      case 'gst':
        return renderGSTReport();
      case 'inventory':
        return renderInventoryReport();
      case 'pl':
        return renderPLReport();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <p className="text-gray-600 text-sm mt-1">View business insights and analytics</p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id as ReportType)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedReport === report.id
                  ? `${report.bgColor} border-current ${report.color}`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon size={24} className={selectedReport === report.id ? report.color : 'text-gray-400'} />
              <p className={`text-sm font-medium mt-2 ${
                selectedReport === report.id ? 'text-gray-900' : 'text-gray-600'
              }`}>
                {report.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Date Range and Export */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div>{renderReport()}</div>
    </div>
  );
};

export default Reports;