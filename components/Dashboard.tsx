// FILE PATH: components/Dashboard.tsx

import React from 'react';
import { Package, AlertTriangle, TrendingUp, ShoppingCart } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'red' | 'green' | 'orange';
  alert?: boolean;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, alert }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className={`bg-white rounded-lg border ${alert ? 'border-red-200' : 'border-gray-200'} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

// Mock data - TODO: Replace with real Supabase data
const mockStats = {
  totalItems: 247,
  lowStock: 12,
  totalSales: 145230,
  totalPurchases: 98450,
  pendingOrders: 5,
  customers: 89,
  vendors: 23
};

const mockRecentSales = [
  { id: 'INV-001', customer: 'Lakshmi Store', amount: 2340, date: '2026-01-10', items: 5 },
  { id: 'INV-002', customer: 'Ram Prasad', amount: 890, date: '2026-01-10', items: 3 },
  { id: 'INV-003', customer: 'Devi Traders', amount: 5670, date: '2026-01-09', items: 12 }
];

const mockLowStock = [
  { name: 'Camphor Tablets', stock: 15, unit: 'boxes', minStock: 50 },
  { name: 'Agarbatti - Rose', stock: 8, unit: 'pkts', minStock: 30 },
  { name: 'Brass Diya', stock: 3, unit: 'pcs', minStock: 10 },
  { name: 'Kumkum Powder', stock: 12, unit: 'pkts', minStock: 40 }
];

const Dashboard = () => {
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
          value={mockStats.totalItems.toString()}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Low Stock Items"
          value={mockStats.lowStock.toString()}
          icon={AlertTriangle}
          color="red"
          alert
        />
        <StatCard
          title="Sales (This Month)"
          value={`₹${mockStats.totalSales.toLocaleString('en-IN')}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Pending POs"
          value={mockStats.pendingOrders.toString()}
          icon={ShoppingCart}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
          <div className="space-y-3">
            {mockRecentSales.map((sale) => (
              <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{sale.id}</p>
                  <p className="text-sm text-gray-600">{sale.customer}</p>
                  <p className="text-xs text-gray-500">{sale.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">₹{sale.amount.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-500">{sale.items} items</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
          </div>
          <div className="space-y-3">
            {mockLowStock.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Min: {item.minStock} {item.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{item.stock}</p>
                  <p className="text-xs text-gray-500">{item.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Customers</p>
          <p className="text-xl font-bold text-gray-900">{mockStats.customers}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Vendors</p>
          <p className="text-xl font-bold text-gray-900">{mockStats.vendors}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Purchases (This Month)</p>
          <p className="text-xl font-bold text-gray-900">₹{mockStats.totalPurchases.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;