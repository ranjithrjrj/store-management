// FILE PATH: components/Dashboard.tsx
// Beautiful Modern Dashboard - Teal & Gold Theme with Comprehensive Business Overview

'use client';
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Package, ShoppingCart, AlertTriangle, 
  Users, DollarSign, Calendar, FileText, BarChart3, Store, 
  ArrowUpRight, ArrowDownRight, Activity, CheckCircle
} from 'lucide-react';
import { dashboardAPI, supabase } from '@/lib/supabase';
import { Badge, LoadingSpinner, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

type DashboardStats = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  lowStockCount: number;
  totalCustomers: number;
  totalVendors: number;
  recentSales: number;
  recentPurchases: number;
};

type LowStockItem = {
  id: string;
  name: string;
  current_stock: number;
  min_stock_level: number;
  category_name: string;
};

const Dashboard = () => {
  const { theme } = useTheme();
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Additional stats
  const [todaySales, setTodaySales] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [monthSales, setMonthSales] = useState(0);
  const [monthExpenses, setMonthExpenses] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [outOfStock, setOutOfStock] = useState(0);
  const [returnsCount, setReturnsCount] = useState(0);
  const [gstLiability, setGstLiability] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Load basic stats
      const [statsData, lowStockData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getLowStock(),
      ]);

      setStats(statsData);
      setLowStockItems(lowStockData || []);

      // Load additional data
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().setDate(1)).toISOString().split('T')[0];
      const monthEnd = new Date().toISOString().split('T')[0];

      // Today's sales
      const { data: todaySalesData } = await supabase
        .from('sales_invoices')
        .select('total_amount')
        .eq('invoice_date', today);
      const todaySalesTotal = (todaySalesData || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);
      setTodaySales(todaySalesTotal);

      // Today's expenses
      const { data: todayExpensesData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('expense_date', today);
      const todayExpensesTotal = (todayExpensesData || []).reduce((sum, e) => sum + (e.amount || 0), 0);
      setTodayExpenses(todayExpensesTotal);

      // This month's sales
      const { data: monthSalesData } = await supabase
        .from('sales_invoices')
        .select('total_amount, cgst_amount, sgst_amount, igst_amount')
        .gte('invoice_date', monthStart)
        .lte('invoice_date', monthEnd);
      const monthSalesTotal = (monthSalesData || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const monthGst = (monthSalesData || []).reduce((sum, s) => 
        sum + (s.cgst_amount || 0) + (s.sgst_amount || 0) + (s.igst_amount || 0), 0
      );
      setMonthSales(monthSalesTotal);
      setGstLiability(monthGst);

      // This month's expenses
      const { data: monthExpensesData } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', monthStart)
        .lte('expense_date', monthEnd);
      const monthExpensesTotal = (monthExpensesData || []).reduce((sum, e) => sum + (e.amount || 0), 0);
      setMonthExpenses(monthExpensesTotal);

      // Inventory stats
      const { data: items } = await supabase.from('items').select('id, retail_price, min_stock_level');
      setTotalItems(items?.length || 0);

      // Calculate inventory value and out of stock
      let totalValue = 0;
      let outOfStockCount = 0;
      if (items) {
        for (const item of items) {
          const { data: batches } = await supabase
            .from('inventory_batches')
            .select('quantity')
            .eq('item_id', item.id)
            .eq('status', 'normal');
          
          const totalQty = (batches || []).reduce((sum, b) => sum + (b.quantity || 0), 0);
          totalValue += totalQty * item.retail_price;
          if (totalQty === 0) outOfStockCount++;
        }
      }
      setInventoryValue(totalValue);
      setOutOfStock(outOfStockCount);

      // Returns count for this month
      const { data: returnsData } = await supabase
        .from('returns')
        .select('id')
        .gte('return_date', monthStart)
        .lte('return_date', monthEnd);
      setReturnsCount(returnsData?.length || 0);

    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      toast.error('Failed to load', 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl mb-4">
            <LoadingSpinner size="lg" />
          </div>
          <p className="text-slate-700 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const profitMargin = stats.totalRevenue > 0 
    ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)
    : '0.0';

  const monthProfit = monthSales - monthExpenses;
  const todayProfit = todaySales - todayExpenses;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md">
              <BarChart3 className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 mt-1">Real-time business overview & insights</p>
            </div>
          </div>
        </div>

        {/* Today's Performance - 4 Cards */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Activity size={20} className="text-teal-600" />
            Today's Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md border border-green-100 p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowUpRight className="text-green-600" size={18} />
                </div>
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">TODAY</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">₹{(todaySales / 1000).toFixed(1)}K</p>
              <p className="text-xs text-slate-600 mt-1">Sales Revenue</p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-red-100 p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ArrowDownRight className="text-red-600" size={18} />
                </div>
                <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">TODAY</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">₹{(todayExpenses / 1000).toFixed(1)}K</p>
              <p className="text-xs text-slate-600 mt-1">Expenses</p>
            </div>

            <div className={`bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all ${todayProfit >= 0 ? 'border-teal-100' : 'border-orange-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${todayProfit >= 0 ? 'bg-teal-100' : 'bg-orange-100'}`}>
                  <DollarSign className={todayProfit >= 0 ? 'text-teal-600' : 'text-orange-600'} size={18} />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${todayProfit >= 0 ? 'text-teal-700 bg-teal-100' : 'text-orange-700 bg-orange-100'}`}>TODAY</span>
              </div>
              <p className={`text-2xl font-bold ${todayProfit >= 0 ? 'text-teal-700' : 'text-orange-700'}`}>₹{(todayProfit / 1000).toFixed(1)}K</p>
              <p className="text-xs text-slate-600 mt-1">Net Profit</p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="text-blue-600" size={18} />
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">TODAY</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{new Date().toLocaleDateString('en-IN', { day: 'numeric' })}</p>
              <p className="text-xs text-slate-600 mt-1">{new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* This Month - 4 Cards */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Calendar size={20} className="text-teal-600" />
            This Month ({new Date().toLocaleDateString('en-IN', { month: 'long' })})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md border border-emerald-100 p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                  <TrendingUp className="text-white" size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">₹{(monthSales / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-600 mt-1">Total Sales</p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-rose-100 p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-gradient-to-br from-rose-500 to-red-600 rounded-lg">
                  <TrendingDown className="text-white" size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">₹{(monthExpenses / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-600 mt-1">Total Expenses</p>
            </div>

            <div className={`bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all ${monthProfit >= 0 ? 'border-teal-100' : 'border-red-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${monthProfit >= 0 ? 'bg-gradient-to-br from-teal-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                  <DollarSign className="text-white" size={18} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${monthProfit >= 0 ? 'text-teal-700' : 'text-red-700'}`}>₹{(monthProfit / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-600 mt-1">Net Profit</p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-amber-100 p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                  <FileText className="text-white" size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">₹{(gstLiability / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-600 mt-1">GST Collected</p>
            </div>
          </div>
        </div>

        {/* Overall Business Stats - 6 Cards */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <BarChart3 size={20} className="text-teal-600" />
            Overall Business Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl shadow-md border border-teal-100 p-4 hover:shadow-lg transition-all hover:scale-105">
              <div className="text-center">
                <div className="inline-flex p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl mb-2">
                  <DollarSign className="text-white" size={20} />
                </div>
                <p className="text-lg font-bold text-slate-900">₹{(stats.totalRevenue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-slate-600 mt-1">Total Revenue</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-green-100 p-4 hover:shadow-lg transition-all hover:scale-105">
              <div className="text-center">
                <div className={`inline-flex p-3 rounded-xl mb-2 ${stats.netProfit >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                  <TrendingUp className="text-white" size={20} />
                </div>
                <p className={`text-lg font-bold ${stats.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>₹{(stats.netProfit / 1000).toFixed(0)}K</p>
                <p className="text-xs text-slate-600 mt-1">Net Profit</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4 hover:shadow-lg transition-all hover:scale-105">
              <div className="text-center">
                <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-2">
                  <Activity className="text-white" size={20} />
                </div>
                <p className="text-lg font-bold text-slate-900">{profitMargin}%</p>
                <p className="text-xs text-slate-600 mt-1">Profit Margin</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4 hover:shadow-lg transition-all hover:scale-105">
              <div className="text-center">
                <div className="inline-flex p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mb-2">
                  <Package className="text-white" size={20} />
                </div>
                <p className="text-lg font-bold text-slate-900">₹{(inventoryValue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-slate-600 mt-1">Inventory Value</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-indigo-100 p-4 hover:shadow-lg transition-all hover:scale-105">
              <div className="text-center">
                <div className="inline-flex p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl mb-2">
                  <Users className="text-white" size={20} />
                </div>
                <p className="text-lg font-bold text-slate-900">{stats.totalCustomers}</p>
                <p className="text-xs text-slate-600 mt-1">Customers</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-pink-100 p-4 hover:shadow-lg transition-all hover:scale-105">
              <div className="text-center">
                <div className="inline-flex p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl mb-2">
                  <Store className="text-white" size={20} />
                </div>
                <p className="text-lg font-bold text-slate-900">{stats.totalVendors}</p>
                <p className="text-xs text-slate-600 mt-1">Vendors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Status - 4 Cards */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Package size={20} className="text-teal-600" />
            Inventory Health
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
              <p className="text-sm text-slate-600 mb-1">Total Items</p>
              <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-orange-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="text-orange-600" size={16} />
                <p className="text-sm text-slate-600">Low Stock</p>
              </div>
              <p className="text-2xl font-bold text-orange-700">{stats.lowStockCount}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-red-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <X className="text-red-600" size={16} />
                <p className="text-sm text-slate-600">Out of Stock</p>
              </div>
              <p className="text-2xl font-bold text-red-700">{outOfStock}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="text-blue-600" size={16} />
                <p className="text-sm text-slate-600">Returns (Month)</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{returnsCount}</p>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-orange-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-white" size={24} />
                <div>
                  <h3 className="text-xl font-bold text-white">Low Stock Alert</h3>
                  <p className="text-sm text-orange-100">{lowStockItems.length} items need immediate restocking</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {lowStockItems.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Package className="text-orange-600" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-600">{item.category_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-700">{item.current_stock}</p>
                        <p className="text-xs text-slate-600">Current</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">{item.min_stock_level}</p>
                        <p className="text-xs text-slate-600">Min Required</p>
                      </div>
                      <div className="px-3 py-1 bg-orange-200 rounded-full">
                        <p className="text-xs font-bold text-orange-800">
                          {item.min_stock_level - item.current_stock > 0 ? `Need ${item.min_stock_level - item.current_stock}` : 'Critical'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {lowStockItems.length > 8 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-slate-600">
                      + {lowStockItems.length - 8} more items need restocking
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Business Health Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Insights */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity size={24} />
                Quick Insights
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-900">Profit Margin Status</span>
                <Badge variant={parseFloat(profitMargin) >= 20 ? 'success' : parseFloat(profitMargin) >= 10 ? 'warning' : 'danger'}>
                  {parseFloat(profitMargin) >= 20 ? 'Excellent' : parseFloat(profitMargin) >= 10 ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-900">Inventory Health</span>
                <Badge variant={stats.lowStockCount === 0 ? 'success' : stats.lowStockCount < 5 ? 'warning' : 'danger'}>
                  {stats.lowStockCount === 0 ? 'Perfect' : stats.lowStockCount < 5 ? 'Monitor' : 'Action Needed'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-900">Today's Performance</span>
                <Badge variant={todayProfit > 0 ? 'success' : 'neutral'}>
                  {todayProfit > 0 ? 'Profitable' : 'Break-even'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-900">Returns Rate</span>
                <Badge variant={returnsCount < 5 ? 'success' : returnsCount < 10 ? 'warning' : 'danger'}>
                  {returnsCount < 5 ? 'Low' : returnsCount < 10 ? 'Moderate' : 'High'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle size={24} />
                Key Metrics
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ShoppingCart className="text-purple-600" size={18} />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Avg Daily Sales</span>
                </div>
                <span className="text-lg font-bold text-purple-700">₹{((monthSales / new Date().getDate()) / 1000).toFixed(1)}K</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="text-blue-600" size={18} />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Items in Stock</span>
                </div>
                <span className="text-lg font-bold text-blue-700">{totalItems - outOfStock}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="text-green-600" size={18} />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Revenue per Customer</span>
                </div>
                <span className="text-lg font-bold text-green-700">
                  ₹{stats.totalCustomers > 0 ? ((stats.totalRevenue / stats.totalCustomers) / 1000).toFixed(1) : 0}K
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <DollarSign className="text-amber-600" size={18} />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Inventory Turnover</span>
                </div>
                <span className="text-lg font-bold text-amber-700">
                  {inventoryValue > 0 ? (stats.totalRevenue / inventoryValue).toFixed(1) : 0}x
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <div className="text-sm text-slate-600 text-center">
            📊 Dashboard last updated: <span className="font-semibold">{new Date().toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// Helper component for X icon since it's not imported
const X: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
