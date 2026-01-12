// FILE PATH: app/page.tsx

"use client"
import React, { useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, FileText, Users, UserCircle, Settings, TrendingUp, Menu, X } from 'lucide-react';

// Import all components
import Dashboard from '@/components/Dashboard';
import Inventory from '@/components/Inventory';
import ItemsManagement from '@/components/ItemsManagement';
import PurchaseOrders from '@/components/PurchaseOrders';
import PurchaseRecording from '@/components/PurchaseRecording';
import SalesInvoice from '@/components/SalesInvoice';
import ReturnsManagement from '@/components/ReturnsManagement';
import ExpensesManagement from '@/components/ExpensesManagement';
import VendorsManagement from '@/components/VendorsManagement';
import CustomersManagement from '@/components/CustomersManagement';
import Reports from '@/components/Reports';
import TaxReports from '@/components/TaxReports';

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
      case 'purchase-record':
        return <PurchaseRecording />;
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

// Settings Page Component (only one that doesn't have separate file yet)
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