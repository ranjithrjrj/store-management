// FILE PATH: components/Dashboard.tsx
// UPDATED VERSION - Uses real database data

'use client';
import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, TrendingUp, ShoppingCart } from 'lucide-react';
import { itemsAPI, inventoryAPI, salesAPI } from '@/lib/supabase';

type StatCardProps = {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'red' | 'green' | 'orange';
  alert?: boolean;
  loading?: boolean;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, alert, loading }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className={`bg-white rounded-lg border ${alert ? 'border-red-200' : 'border-gray-200'} p-6`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    totalSales: 0,
    pendingOrders: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [items, lowStock, sales] = await Promise.all([
        itemsAPI.getAll().catch(() => []),
        inventoryAPI.getLowStock().catch(() => []),
        salesAPI.getAll(
          new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
          new Date().toISOString().split('T')[0] // Today
        ).catch(() => [])
      ]);

      // Calculate stats
      const totalSales = sales.reduce((sum: number, invoice: any) => sum + invoice.total_amount, 0);

      setStats({
        totalItems: items?.length || 0,
        lowStock: lowStock?.length || 0,
        totalSales: totalSales || 0,
        pendingOrders: 0 // Would need PO data
      });

      // Get recent sales (last 5)
      const recent = sales
        .sort((a: any, b: any) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime())
        .slice(0, 5)
        .map((invoice: any) => ({
          id: invoice.invoice_number,
          customer: invoice.customer_name || 'Walk-in Customer',
          amount: invoice.total_amount,
          date: invoice.invoice_date,
          items: 0 // Would need to join with items
        }));

      setRecentSales(recent);
      setLowStockItems(lowStock || []);

    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  // Show error state
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 text-sm mt-1">Overview of your store operations</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-bold text-red-800 mb-2">Failed to Load Dashboard</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <p className="text-red-600 text-sm mt-2">
            Make sure you've run the database schema and your .env.local is configured correctly.
          </p>
          <button
            onClick={loadDashboardData}
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 text-sm mt-1">Overview of your store operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Items"
          value={stats.totalItems.toString()}
          icon={Package}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock.toString()}
          icon={AlertTriangle}
          color="red"
          alert={stats.lowStock > 0}
          loading={loading}
        />
        <StatCard
          title="Sales (This Month)"
          value={`₹${stats.totalSales.toLocaleString('en-IN')}`}
          icon={TrendingUp}
          color="green"
          loading={loading}
        />
        <StatCard
          title="Pending POs"
          value={stats.pendingOrders.toString()}
          icon={ShoppingCart}
          color="orange"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : recentSales.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No sales yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first invoice to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{sale.id}</p>
                    <p className="text-sm text-gray-600">{sale.customer}</p>
                    <p className="text-xs text-gray-500">{new Date(sale.date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">₹{sale.amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-red-50 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">All items well stocked! 🎉</p>
              <p className="text-sm text-gray-400 mt-1">No items below minimum stock level</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.slice(0, 4).map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="font-medium text-gray-900">{item.item_name || item.name}</p>
                    <p className="text-sm text-gray-600">
                      Min: {item.min_stock_level} {item.unit_abbreviation}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{item.current_stock}</p>
                    <p className="text-xs text-gray-500">{item.unit_abbreviation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Banner */}
      {!loading && stats.totalItems === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Getting Started</h3>
          <p className="text-blue-800 text-sm mb-3">
            Your database is connected! Start by adding items to your inventory.
          </p>
          <div className="flex gap-3">
            <a
              href="#"
              onClick={() => window.location.hash = 'items'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              Add Items
            </a>
            <a
              href="#"
              onClick={() => window.location.hash = 'vendors'}
              className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 text-sm"
            >
              Add Vendors
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;