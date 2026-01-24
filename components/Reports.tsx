// FILE PATH: components/Reports.tsx
// Beautiful Modern Business Reports - Teal & Gold Theme with Enhanced Analytics

'use client';
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, ShoppingCart, Package, Calendar, 
  FileText, Download, TrendingDown, PieChart, BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Badge, LoadingSpinner, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

const Reports = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [salesData, setSalesData] = useState<any[]>([]);
  const [purchaseData, setPurchaseData] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [returnsData, setReturnsData] = useState<any[]>([]);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  async function loadReports() {
    try {
      setLoading(true);

      // Load sales invoices
      const { data: sales } = await supabase
        .from('sales_invoices')
        .select('invoice_date, total_amount, cgst_amount, sgst_amount, igst_amount, subtotal')
        .gte('invoice_date', dateRange.from)
        .lte('invoice_date', dateRange.to)
        .order('invoice_date');

      // Load purchase invoices (updated table name)
      const { data: purchases } = await supabase
        .from('purchase_invoices')
        .select('invoice_date, total_amount, cgst_amount, sgst_amount, igst_amount, subtotal')
        .gte('invoice_date', dateRange.from)
        .lte('invoice_date', dateRange.to)
        .order('invoice_date');

      // Load expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('expense_date, amount, category_id, category:expense_categories(name)')
        .gte('expense_date', dateRange.from)
        .lte('expense_date', dateRange.to)
        .order('expense_date');

      // Load returns
      const { data: returns } = await supabase
        .from('returns')
        .select('return_date, total_amount, cgst_amount, sgst_amount, igst_amount')
        .gte('return_date', dateRange.from)
        .lte('return_date', dateRange.to)
        .order('return_date');

      // Calculate current inventory value
      const { data: items } = await supabase
        .from('items')
        .select('id, retail_price');

      let totalInventoryValue = 0;
      if (items) {
        for (const item of items) {
          // Get total stock from inventory_batches
          const { data: batches } = await supabase
            .from('inventory_batches')
            .select('quantity')
            .eq('item_id', item.id)
            .eq('status', 'normal');
          
          const totalQty = (batches || []).reduce((sum, b) => sum + (b.quantity || 0), 0);
          totalInventoryValue += totalQty * item.retail_price;
        }
      }

      setSalesData(sales || []);
      setPurchaseData(purchases || []);
      setExpensesData(expenses || []);
      setReturnsData(returns || []);
      setInventoryValue(totalInventoryValue);
    } catch (err: any) {
      console.error('Error loading reports:', err);
      toast.error('Failed to load', 'Could not load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals
  const totalSales = salesData.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalPurchases = purchaseData.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const totalExpenses = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalReturns = returnsData.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  
  // Calculate profits
  const netSales = totalSales - totalReturns;
  const grossProfit = netSales - totalPurchases;
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = netSales > 0 ? ((netProfit / netSales) * 100).toFixed(2) : '0.00';

  // GST calculations
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

  const returnsGST = {
    cgst: returnsData.reduce((sum, r) => sum + (r.cgst_amount || 0), 0),
    sgst: returnsData.reduce((sum, r) => sum + (r.sgst_amount || 0), 0),
    igst: returnsData.reduce((sum, r) => sum + (r.igst_amount || 0), 0)
  };

  const totalSalesGST = salesGST.cgst + salesGST.sgst + salesGST.igst;
  const totalPurchaseGST = purchaseGST.cgst + purchaseGST.sgst + purchaseGST.igst;
  const totalReturnsGST = returnsGST.cgst + returnsGST.sgst + returnsGST.igst;
  const netGSTLiability = totalSalesGST - totalPurchaseGST - totalReturnsGST;

  // Top expense categories
  const expensesByCategory = expensesData.reduce((acc: any, exp: any) => {
    const catName = exp.category?.name || 'Uncategorized';
    acc[catName] = (acc[catName] || 0) + exp.amount;
    return acc;
  }, {});

  const topExpenseCategories = Object.entries(expensesByCategory)
    .map(([name, amount]) => ({ name, amount: amount as number }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl mb-4">
            <LoadingSpinner size="lg" />
          </div>
          <p className="text-slate-700 font-medium">Generating reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md">
                <BarChart3 className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Business Reports</h1>
                <p className="text-slate-600 mt-1">Comprehensive financial analysis</p>
              </div>
            </div>
            <Button 
              onClick={() => toast.info('Export', 'Report export coming soon!')}
              variant="secondary" 
              size="md" 
              icon={<Download size={18} />}
              className="shadow-md"
            >
              Export Report
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Calendar size={20} className="text-teal-600" />
              <span>Report Period:</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <span className="text-slate-500 font-medium">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Key Metrics - 6 Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-md border border-green-100 p-4 hover:shadow-lg transition-all hover:scale-105">
            <div className="text-center">
              <div className="inline-flex p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl mb-2">
                <TrendingUp className="text-white" size={20} />
              </div>
              <p className="text-lg font-bold text-slate-900">₹{(netSales / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-600 mt-1">Net Sales</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4 hover:shadow-lg transition-all hover:scale-105">
            <div className="text-center">
              <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-2">
                <ShoppingCart className="text-white" size={20} />
              </div>
              <p className="text-lg font-bold text-slate-900">₹{(totalPurchases / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-600 mt-1">Purchases</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-amber-100 p-4 hover:shadow-lg transition-all hover:scale-105">
            <div className="text-center">
              <div className="inline-flex p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl mb-2">
                <DollarSign className="text-white" size={20} />
              </div>
              <p className="text-lg font-bold text-slate-900">₹{(totalExpenses / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-600 mt-1">Expenses</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-orange-100 p-4 hover:shadow-lg transition-all hover:scale-105">
            <div className="text-center">
              <div className="inline-flex p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl mb-2">
                <TrendingDown className="text-white" size={20} />
              </div>
              <p className="text-lg font-bold text-slate-900">₹{(totalReturns / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-600 mt-1">Returns</p>
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all hover:scale-105 ${netProfit >= 0 ? 'border-teal-100' : 'border-red-100'}`}>
            <div className="text-center">
              <div className={`inline-flex p-3 rounded-xl mb-2 ${netProfit >= 0 ? 'bg-gradient-to-br from-teal-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                <Package className="text-white" size={20} />
              </div>
              <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-teal-700' : 'text-red-700'}`}>₹{(netProfit / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-600 mt-1">Net Profit</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4 hover:shadow-lg transition-all hover:scale-105">
            <div className="text-center">
              <div className="inline-flex p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mb-2">
                <PieChart className="text-white" size={20} />
              </div>
              <p className="text-lg font-bold text-slate-900">₹{(inventoryValue / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-600 mt-1">Inventory</p>
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <p className="text-sm text-slate-600 mb-1">Sales Invoices</p>
            <p className="text-2xl font-bold text-slate-900">{salesData.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <p className="text-sm text-slate-600 mb-1">Purchase Invoices</p>
            <p className="text-2xl font-bold text-slate-900">{purchaseData.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <p className="text-sm text-slate-600 mb-1">Expense Entries</p>
            <p className="text-2xl font-bold text-slate-900">{expensesData.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <p className="text-sm text-slate-600 mb-1">Return Transactions</p>
            <p className="text-2xl font-bold text-slate-900">{returnsData.length}</p>
          </div>
        </div>

        {/* Profit & Loss Statement */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText size={24} />
              Profit & Loss Statement
            </h3>
          </div>
          <div className="p-6 space-y-3">
            {/* Revenue Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-700 font-medium">Gross Sales</span>
                <span className="font-semibold text-slate-900">₹{totalSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-2 pl-6">
                <span className="text-slate-600">Less: Returns</span>
                <span className="text-red-600">- ₹{totalReturns.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4 border-l-4 border-green-500">
                <span className="font-semibold text-green-900">Net Sales Revenue</span>
                <span className="font-bold text-green-700">₹{netSales.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Cost & Gross Profit */}
            <div className="space-y-2 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-700">Cost of Goods Sold (Purchases)</span>
                <span className="text-red-600">- ₹{totalPurchases.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-4 border-l-4 border-blue-500">
                <span className="font-semibold text-blue-900">Gross Profit</span>
                <span className={`font-bold ${grossProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  ₹{grossProfit.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="space-y-2 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-700">Operating Expenses</span>
                <span className="text-red-600">- ₹{totalExpenses.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className={`flex justify-between items-center py-4 rounded-xl px-6 mt-4 ${netProfit >= 0 ? 'bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200' : 'bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200'}`}>
              <div>
                <span className="font-bold text-slate-900 text-lg block">Net Profit</span>
                <span className="text-xs text-slate-600">Profit Margin: {profitMargin}%</span>
              </div>
              <span className={`font-bold text-2xl ${netProfit >= 0 ? 'text-teal-700' : 'text-red-700'}`}>
                ₹{netProfit.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* GST Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* GST Collected */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">GST Collected</h3>
              <p className="text-sm text-green-100">From Sales</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-700">CGST</span>
                <span className="font-semibold text-slate-900">₹{salesGST.cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">SGST</span>
                <span className="font-semibold text-slate-900">₹{salesGST.sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">IGST</span>
                <span className="font-semibold text-slate-900">₹{salesGST.igst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t-2 border-green-200">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-green-700">₹{totalSalesGST.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* GST Paid */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">GST Paid</h3>
              <p className="text-sm text-blue-100">From Purchases</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-700">CGST</span>
                <span className="font-semibold text-slate-900">₹{purchaseGST.cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">SGST</span>
                <span className="font-semibold text-slate-900">₹{purchaseGST.sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">IGST</span>
                <span className="font-semibold text-slate-900">₹{purchaseGST.igst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t-2 border-blue-200">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-blue-700">₹{totalPurchaseGST.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* GST on Returns */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">GST on Returns</h3>
              <p className="text-sm text-orange-100">Credit Notes</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-700">CGST</span>
                <span className="font-semibold text-slate-900">₹{returnsGST.cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">SGST</span>
                <span className="font-semibold text-slate-900">₹{returnsGST.sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">IGST</span>
                <span className="font-semibold text-slate-900">₹{returnsGST.igst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t-2 border-orange-200">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-orange-700">₹{totalReturnsGST.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net GST Liability */}
        <div className={`rounded-xl shadow-lg overflow-hidden ${netGSTLiability >= 0 ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'}`}>
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Net GST Liability</h3>
                <p className="text-sm text-slate-700 mb-1">
                  GST Collected - GST Paid - GST on Returns
                </p>
                <Badge variant={netGSTLiability >= 0 ? 'warning' : 'success'} size="md">
                  {netGSTLiability >= 0 ? '💰 Payable to Government' : '✅ Refundable/Credit'}
                </Badge>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-bold ${netGSTLiability >= 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  ₹{Math.abs(netGSTLiability).toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-slate-600 mt-2">
                  {netGSTLiability >= 0 ? 'To be paid in GST return' : 'Available as input credit'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Expense Categories */}
        {topExpenseCategories.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Top Expense Categories</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {topExpenseCategories.map((cat, index) => {
                  const percentage = totalExpenses > 0 ? ((cat.amount / totalExpenses) * 100).toFixed(1) : 0;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-900">{cat.name}</span>
                        <span className="font-bold text-slate-900">₹{cat.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500">{percentage}% of total expenses</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Report Footer */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
            <span className="text-slate-600">
              📊 Report generated for period: <span className="font-semibold">{new Date(dateRange.from).toLocaleDateString('en-IN')}</span> to <span className="font-semibold">{new Date(dateRange.to).toLocaleDateString('en-IN')}</span>
            </span>
            <span className="text-slate-600">
              🕒 Generated on: <span className="font-semibold">{new Date().toLocaleString('en-IN')}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
