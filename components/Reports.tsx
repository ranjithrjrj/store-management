// FILE PATH: components/Reports.tsx
// Business reports with real database data

'use client';
import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Package, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
    to: new Date().toISOString().split('T')[0] // Today
  });

  const [salesData, setSalesData] = useState<any[]>([]);
  const [purchaseData, setPurchaseData] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  async function loadReports() {
    try {
      setLoading(true);
      setError(null);

      // Load sales invoices
      const { data: sales } = await supabase
        .from('sales_invoices')
        .select('invoice_date, total_amount, cgst_amount, sgst_amount, igst_amount')
        .gte('invoice_date', dateRange.from)
        .lte('invoice_date', dateRange.to)
        .order('invoice_date');

      // Load purchase records
      const { data: purchases } = await supabase
        .from('purchase_records')
        .select('invoice_date, total_amount, cgst_amount, sgst_amount, igst_amount')
        .gte('invoice_date', dateRange.from)
        .lte('invoice_date', dateRange.to)
        .order('invoice_date');

      // Load expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('expense_date, amount, category:expense_categories(name)')
        .gte('expense_date', dateRange.from)
        .lte('expense_date', dateRange.to)
        .order('expense_date');

      setSalesData(sales || []);
      setPurchaseData(purchases || []);
      setExpensesData(expenses || []);
    } catch (err: any) {
      console.error('Error loading reports:', err);
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals
  const totalSales = salesData.reduce((sum, s) => sum + s.total_amount, 0);
  const totalPurchases = purchaseData.reduce((sum, p) => sum + p.total_amount, 0);
  const totalExpenses = expensesData.reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = totalSales - totalPurchases;
  const netProfit = grossProfit - totalExpenses;

  // GST totals
  const salesGST = {
    cgst: salesData.reduce((sum, s) => sum + (s.cgst_amount || 0), 0),
    sgst: salesData.reduce((sum, s) => sum + (s.sgst_amount || 0), 0),
    igst: salesData.reduce((sum, s) => sum + (s.igst_amount || 0), 0)
  };

  const purchaseGST = {
    cgst: purchaseData.reduce((sum, p) => sum + (p.cgst_amount || 0), 0),
    sgst: purchaseData.reduce((sum, p) => sum + (p.sgst_amount || 0), 0),
    igst: purchaseData.reduce((sum, p) => sum + (p.igst_amount || 0), 0)
  };

  // Expense breakdown
  const expensesByCategory = expensesData.reduce((acc: any, exp: any) => {
    const category = exp.category?.name || 'Uncategorized';
    acc[category] = (acc[category] || 0) + exp.amount;
    return acc;
  }, {});

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Reports</h2>
          <p className="text-gray-600 text-sm mt-1">View sales, purchase, and profit reports</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-bold text-red-800 mb-2">Failed to Load Reports</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadReports}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Business Reports</h2>
        <p className="text-gray-600 text-sm mt-1">View sales, purchase, and profit reports</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Calendar size={20} className="text-gray-400" />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading reports...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Sales</p>
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">₹{totalSales.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 mt-1">{salesData.length} invoices</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Purchases</p>
                <ShoppingCart size={20} className="text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">₹{totalPurchases.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 mt-1">{purchaseData.length} records</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Expenses</p>
                <DollarSign size={20} className="text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 mt-1">{expensesData.length} expenses</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Net Profit</p>
                <Package size={20} className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'} />
              </div>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{netProfit.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {netProfit >= 0 ? 'Profit' : 'Loss'}
              </p>
            </div>
          </div>

          {/* Profit & Loss Statement */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit & Loss Statement</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Revenue (Sales)</span>
                <span className="text-sm font-semibold text-green-600">₹{totalSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Cost of Goods (Purchases)</span>
                <span className="text-sm font-semibold text-red-600">-₹{totalPurchases.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-900">Gross Profit</span>
                <span className={`text-sm font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{grossProfit.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Operating Expenses</span>
                <span className="text-sm font-semibold text-red-600">-₹{totalExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3 mt-2">
                <span className="font-bold text-gray-900">Net Profit / Loss</span>
                <span className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{netProfit.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GST Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">GST Summary</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Sales GST (Output)</p>
                  <div className="space-y-1 pl-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">CGST:</span>
                      <span className="font-medium">₹{salesGST.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">SGST:</span>
                      <span className="font-medium">₹{salesGST.sgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IGST:</span>
                      <span className="font-medium">₹{salesGST.igst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                      <span>Total Output:</span>
                      <span className="text-green-600">₹{(salesGST.cgst + salesGST.sgst + salesGST.igst).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Purchase GST (Input)</p>
                  <div className="space-y-1 pl-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">CGST:</span>
                      <span className="font-medium">₹{purchaseGST.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">SGST:</span>
                      <span className="font-medium">₹{purchaseGST.sgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IGST:</span>
                      <span className="font-medium">₹{purchaseGST.igst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                      <span>Total Input:</span>
                      <span className="text-orange-600">₹{(purchaseGST.cgst + purchaseGST.sgst + purchaseGST.igst).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-gray-200">
                  <div className="flex justify-between font-bold">
                    <span>Net GST Liability:</span>
                    <span className="text-blue-600">
                      ₹{((salesGST.cgst + salesGST.sgst + salesGST.igst) - (purchaseGST.cgst + purchaseGST.sgst + purchaseGST.igst)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
              {Object.keys(expensesByCategory).length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No expenses in this period</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(expensesByCategory).map(([category, amount]: [string, any]) => (
                    <div key={category} className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-700">{category}</span>
                      <span className="text-sm font-semibold text-gray-900">₹{amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2 bg-gray-50 rounded-lg px-3 mt-2">
                    <span className="font-bold text-gray-900">Total Expenses</span>
                    <span className="font-bold text-red-600">₹{totalExpenses.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;