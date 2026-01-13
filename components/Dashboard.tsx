// FILE PATH: components/Dashboard.tsx
// Dashboard with new UI components and theme support

'use client';
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Package, ShoppingCart, AlertTriangle, Users, DollarSign, Calendar } from 'lucide-react';
import { dashboardAPI } from '@/lib/supabase';
import { Card, Badge, LoadingSpinner, useToast } from '@/components/ui';
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

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }: any) => {
  const { theme } = useTheme();
  
  const colorClasses: any = {
    primary: {
      bg: theme.classes.bgPrimaryLight,
      icon: theme.classes.textPrimary,
      text: theme.classes.textPrimary,
    },
    success: {
      bg: 'bg-green-100',
      icon: 'text-green-600',
      text: 'text-green-600',
    },
    warning: {
      bg: 'bg-amber-100',
      icon: 'text-amber-600',
      text: 'text-amber-600',
    },
    danger: {
      bg: 'bg-red-100',
      icon: 'text-red-600',
      text: 'text-red-600',
    },
    blue: {
      bg: 'bg-blue-100',
      icon: 'text-blue-600',
      text: 'text-blue-600',
    },
    purple: {
      bg: 'bg-purple-100',
      icon: 'text-purple-600',
      text: 'text-purple-600',
    },
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <Card hover padding="md">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp size={14} className="text-green-600" />
              ) : (
                <TrendingDown size={14} className="text-red-600" />
              )}
              <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          <Icon size={24} className={colors.icon} />
        </div>
      </div>
    </Card>
  );
};

const Dashboard = () => {
  const { theme } = useTheme();
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      const [statsData, lowStockData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getLowStock(),
      ]);

      setStats(statsData);
      setLowStockItems(lowStockData || []);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
      toast.error('Failed to load', 'Could not load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 text-sm mt-1">Overview of your business</p>
        </div>
        <Card>
          <div className="py-12">
            <LoadingSpinner size="lg" text="Loading dashboard..." />
          </div>
        </Card>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 text-sm mt-1">Overview of your business</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <TrendingUp size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="font-bold text-red-800 mb-2">Failed to Load Dashboard</h3>
            <p className="text-red-600 text-sm mb-4">{error || 'Unknown error occurred'}</p>
          </div>
        </Card>
      </div>
    );
  }

  const profitMargin = stats.totalRevenue > 0 
    ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 text-sm mt-1">Overview of your business</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Total Expenses"
          value={`₹${stats.totalExpenses.toLocaleString()}`}
          icon={ShoppingCart}
          color="danger"
        />
        <StatCard
          title="Net Profit"
          value={`₹${stats.netProfit.toLocaleString()}`}
          icon={TrendingUp}
          color={stats.netProfit >= 0 ? 'primary' : 'danger'}
        />
        <StatCard
          title="Profit Margin"
          value={`${profitMargin}%`}
          icon={TrendingUp}
          color={parseFloat(profitMargin) >= 20 ? 'success' : 'warning'}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color="warning"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Vendors"
          value={stats.totalVendors}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Inventory Value"
          value={`₹${stats.recentSales.toLocaleString()}`}
          icon={Package}
          color="primary"
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Low Stock Alert</h3>
              <p className="text-sm text-gray-600">{lowStockItems.length} items need restocking</p>
            </div>
            <Badge variant="warning" size="md">
              {lowStockItems.length}
            </Badge>
          </div>

          <div className="space-y-2">
            {lowStockItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Package size={16} className="text-amber-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-600">{item.category_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-amber-900">
                      {item.current_stock} / {item.min_stock_level}
                    </p>
                    <p className="text-xs text-amber-600">Current / Min</p>
                  </div>
                </div>
              </div>
            ))}
            {lowStockItems.length > 5 && (
              <p className="text-sm text-gray-600 text-center pt-2">
                + {lowStockItems.length - 5} more items need attention
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg`}>
              <Calendar size={20} className={theme.classes.textPrimary} />
            </div>
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-gray-600" />
                <span className="text-sm text-gray-900">Recent Sales</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                ₹{stats.recentSales.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-gray-600" />
                <span className="text-sm text-gray-900">Recent Purchases</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                ₹{stats.recentPurchases.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Business Health */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg`}>
              <TrendingUp size={20} className={theme.classes.textPrimary} />
            </div>
            <h3 className="font-semibold text-gray-900">Business Health</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-900">Profit Margin</span>
              <Badge variant={parseFloat(profitMargin) >= 20 ? 'success' : 'warning'}>
                {profitMargin}%
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-900">Inventory Issues</span>
              <Badge variant={stats.lowStockCount > 0 ? 'warning' : 'success'}>
                {stats.lowStockCount > 0 ? `${stats.lowStockCount} items` : 'All good'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-900">Active Customers</span>
              <Badge variant="primary">
                {stats.totalCustomers}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;