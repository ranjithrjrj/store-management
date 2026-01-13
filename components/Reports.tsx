// FILE PATH: components/Reports.tsx
// Business reports with new UI components and theme support

'use client';
import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Package, Calendar, FileText, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Badge, LoadingSpinner, useToast } from '@/components/ui';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  async function loadReports() {
    try {
      setLoading(true);
      setError(null);

      const { data: sales } = await supabase
        .from('sales_invoices')
        .select('invoice_date, total_amount, cgst_amount, sgst_amount, igst_amount')
        .gte('invoice_date', dateRange.from)
        .lte('invoice_date', dateRange.to)
        .order('invoice_date');

      const { data: purchases } = await supabase
        .from('purchase_recordings')
        .select('invoice_date, total_amount, cgst_amount, sgst_amount, igst_amount')
        .gte('invoice_date', dateRange.from)
        .lte('invoice_date', dateRange.to)
        .order('invoice_date');

      const { data: expenses } = await supabase
        .from('expenses')
        .select('expense_date, amount, category')
        .gte('expense_date', dateRange.from)
        .lte('expense_date', dateRange.to)
        .order('expense_date');

      setSalesData(sales || []);
      setPurchaseData(purchases || []);
      setExpensesData(expenses || []);
    } catch (err: any) {
      console.error('Error loading reports:', err);
      setError(err.message || 'Failed to load reports');
      toast.error('Failed to load', 'Could not load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const totalSales = salesData.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalPurchases = purchaseData.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const totalExpenses = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0);
  const grossProfit = totalSales - totalPurchases;
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(2) : '0.00';

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

  const totalSalesGST = salesGST.cgst + salesGST.sgst + salesGST.igst;
  const totalPurchaseGST = purchaseGST.cgst + purchaseGST.sgst + purchaseGST.igst;
  const netGSTLiability = totalSalesGST - totalPurchaseGST;

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Reports</h2>
          <p className="text-gray-600 text-sm mt-1">Analyze your business performance</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <FileText size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="font-bold text-red-800 mb-2">Failed to Load Reports</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={loadReports} variant="primary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Reports</h2>
          <p className="text-gray-600 text-sm mt-1">Analyze your business performance</p>
        </div>
        <Button variant="secondary" size="md" icon={<Download size={18} />}>
          Export Report
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar size={20} />
            <span className="font-medium">Period:</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full sm:w-auto"
            />
            <span className="text-gray-500">to</span>
            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="py-12">
            <LoadingSpinner size="lg" text="Loading reports..." />
          </div>
        </Card>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalSales.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{salesData.length} invoices</p>
                </div>
                <div className={`p-3 rounded-lg ${theme.classes.bgPrimaryLight}`}>
                  <TrendingUp size={24} className={theme.classes.textPrimary} />
                </div>
              </div>
            </Card>

            <Card padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Purchases</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalPurchases.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{purchaseData.length} records</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <ShoppingCart size={24} className="text-blue-600" />
                </div>
              </div>
            </Card>

            <Card padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalExpenses.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{expensesData.length} entries</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-100">
                  <DollarSign size={24} className="text-amber-600" />
                </div>
              </div>
            </Card>

            <Card padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{netProfit.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{profitMargin}% margin</p>
                </div>
                <div className={`p-3 rounded-lg ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Package size={24} className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'} />
                </div>
              </div>
            </Card>
          </div>

          {/* Profit & Loss Summary */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit & Loss Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">Sales Revenue</span>
                <span className="font-semibold text-green-600">+ ₹{totalSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">Cost of Goods (Purchases)</span>
                <span className="font-semibold text-red-600">- ₹{totalPurchases.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-medium text-gray-900">Gross Profit</span>
                <span className={`font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{grossProfit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">Operating Expenses</span>
                <span className="font-semibold text-red-600">- ₹{totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4">
                <span className="font-bold text-gray-900 text-lg">Net Profit</span>
                <span className={`font-bold text-xl ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* GST Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales GST */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">GST Collected (Sales)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">CGST</span>
                  <span className="font-semibold">₹{salesGST.cgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">SGST</span>
                  <span className="font-semibold">₹{salesGST.sgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">IGST</span>
                  <span className="font-semibold">₹{salesGST.igst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total GST Collected</span>
                  <span className={`font-bold ${theme.classes.textPrimary}`}>₹{totalSalesGST.toLocaleString()}</span>
                </div>
              </div>
            </Card>

            {/* Purchase GST */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">GST Paid (Purchases)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">CGST</span>
                  <span className="font-semibold">₹{purchaseGST.cgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">SGST</span>
                  <span className="font-semibold">₹{purchaseGST.sgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">IGST</span>
                  <span className="font-semibold">₹{purchaseGST.igst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total GST Paid</span>
                  <span className="font-bold text-blue-600">₹{totalPurchaseGST.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Net GST Liability */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Net GST Liability</h3>
                <p className="text-sm text-gray-600">
                  GST Collected - GST Paid = {netGSTLiability >= 0 ? 'Payable' : 'Refundable'}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={netGSTLiability >= 0 ? 'warning' : 'success'} size="md">
                  {netGSTLiability >= 0 ? 'Payable' : 'Refundable'}
                </Badge>
                <p className={`text-3xl font-bold mt-2 ${netGSTLiability >= 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  ₹{Math.abs(netGSTLiability).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Stats Footer */}
          <div className="text-sm text-gray-600">
            Report generated for period: {new Date(dateRange.from).toLocaleDateString()} to {new Date(dateRange.to).toLocaleDateString()}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
