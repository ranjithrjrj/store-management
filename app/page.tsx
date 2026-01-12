"use client"
import React, { useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, FileText, Users, UserCircle, Settings, TrendingUp, AlertTriangle, IndianRupee, Menu, X } from 'lucide-react';

// Mock data - in real app, this would come from Supabase
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

type Page = 'dashboard' | 'inventory' | 'items' | 'purchase-order' | 'purchase-record' | 'sales' | 'returns' | 'expenses' | 'vendors' | 'customers' | 'reports' | 'tax-reports' | 'settings';

const App = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'purchase-order', label: 'Purchase Orders', icon: ShoppingCart },
    { id: 'purchase-record', label: 'Purchase Recording', icon: FileText },
    { id: 'sales', label: 'Sales Invoice', icon: FileText },
    { id: 'returns', label: 'Returns & Refunds', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: TrendingUp },
    { id: 'vendors', label: 'Vendors', icon: Users },
    { id: 'customers', label: 'Customers', icon: UserCircle },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'tax-reports', label: 'Tax Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'items':
        return <ItemsManagement />;
      case 'purchase-order':
        return <PurchaseOrders />;
      case 'sales':
        return <SalesInvoice />;
      case 'returns':
        return <ReturnsManagement />;
      case 'expenses':
        return <ExpensesManagement />;
      case 'vendors':
        return <VendorsManagement />;
      case 'customers':
        return <CustomersManagement />;
      case 'reports':
        return <Reports />;
      case 'tax-reports':
        return <TaxReports />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <ComingSoon page={currentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-300 overflow-y-auto`}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600">Thirukumaran Angadi</h1>
          <p className="text-xs text-gray-500 mt-1">Mettupalayam, Tamil Nadu</p>
        </div>
        <nav className="px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id as Page);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} className="mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="text-red-500 mr-2" size={20} />
            Low Stock Alert
          </h3>
          <div className="space-y-3">
            {mockLowStock.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Min: {item.minStock} {item.unit}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">{item.stock} {item.unit}</p>
                  <p className="text-xs text-red-500">Reorder now</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, alert }: any) => {
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
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const mockInventory = [
    { id: 1, name: 'Camphor Tablets', category: 'Pooja Items', stock: 15, unit: 'boxes', mrp: 45, batch: 'B001', expiry: '2026-12-31' },
    { id: 2, name: 'Brass Diya', category: 'Handicraft', stock: 3, unit: 'pcs', mrp: 250, batch: 'B045', expiry: null },
    { id: 3, name: 'Agarbatti - Rose', category: 'Pooja Items', stock: 8, unit: 'pkts', mrp: 30, batch: 'B023', expiry: '2027-06-30' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
          <p className="text-gray-600 text-sm mt-1">Manage stock levels and batches</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          + Add Stock
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-medium ${item.stock < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.stock} {item.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.batch}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.expiry || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">₹{item.mrp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ItemsManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Items Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage item catalog with pricing and GST</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          + Add Item
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600">Items catalog with HSN codes, GST rates, MRP, wholesale and retail pricing will be displayed here.</p>
      </div>
    </div>
  );
};

const PurchaseOrders = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-gray-600 text-sm mt-1">Create and track purchase orders</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          + New PO
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600">Purchase orders with status tracking (Pending, Received, Partial) will be shown here.</p>
      </div>
    </div>
  );
};

const SalesInvoice = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sales Invoice</h2>
        <p className="text-gray-600 text-sm mt-1">Create GST-compliant sales invoices</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">Invoice creation form with thermal printer format (58mm/80mm) support.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option>Select customer...</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VendorsManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendors</h2>
          <p className="text-gray-600 text-sm mt-1">Manage vendor information and GSTIN</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          + Add Vendor
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600">Vendor list with contact details, GSTIN, and payment terms.</p>
      </div>
    </div>
  );
};

const CustomersManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <p className="text-gray-600 text-sm mt-1">Manage customer information and GSTIN</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          + Add Customer
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600">Customer list with contact details and GSTIN for B2B transactions.</p>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 text-sm mt-1">Configure store details and preferences</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input type="text" defaultValue="Thirukumaran Angadi" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <input type="text" placeholder="33XXXXX1234X1ZX" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Enter store address"></textarea>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComingSoon = ({ page }: { page: string }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
      <p className="text-gray-600">The {page.replace('-', ' ')} page is under development.</p>
    </div>
  );
};

export default App;