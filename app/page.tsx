// FILE PATH: app/page.tsx
// Native Mobile App Experience with Bottom Navigation

"use client"
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, ShoppingCart, FileText, Users, 
  Settings as SettingsIcon, TrendingUp, Menu, X, ChevronRight, 
  Store, ArrowLeft, Home, ShoppingBag, Receipt, BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui';

// Import all components
import Dashboard from '@/components/Dashboard';
import InventoryManagement from '@/components/InventoryManagement';
import CategoriesManagement from '@/components/CategoriesManagement';
import UnitsManagement from '@/components/UnitsManagement';
import PurchaseOrders from '@/components/PurchaseOrders';
import PurchasePayments from '@/components/PurchasePayments';
import PurchaseInvoices from '@/components/PurchaseInvoices';
import PurchaseRecordsManagement from '@/components/PurchaseRecordsManagement';
import SalesInvoice from '@/components/SalesInvoice';
import SalesOrders from '@/components/SalesOrders';
import SalesPaymentsManagement from '@/components/SalesPaymentsManagement';
import ReturnsManagement from '@/components/ReturnsManagement';
import ExpensesManagement from '@/components/ExpensesManagement';
import VendorsManagement from '@/components/VendorsManagement';
import CustomersManagement from '@/components/CustomersManagement';
import Reports from '@/components/Reports';
import TaxReports from '@/components/TaxReports';
import Settings from '@/components/Settings';

type Page = 'dashboard' | 'inventory' | 'categories' | 'units' | 
  'purchase-order' | 'purchase-payments' | 'purchase-invoices' | 'purchase-records' | 
  'sales' | 'sales-orders' | 'sales-payments' | 'returns' | 
  'expenses' | 'vendors' | 'customers' | 'reports' | 'tax-reports' | 'settings' | 'menu';

const AppContent = () => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const [storeInfo, setStoreInfo] = useState({
    name: 'Loading...',
    address: '',
    city: '',
    state: ''
  });

  useEffect(() => {
    loadStoreSettings();
  }, []);

  useEffect(() => {
    if (storeInfo.name && storeInfo.name !== 'Loading...') {
      document.title = storeInfo.name;
    }
  }, [storeInfo.name]);

  async function loadStoreSettings() {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('store_name, address, city, state')
        .limit(1);
      
      if (data && data.length > 0) {
        const settings = data[0];
        setStoreInfo({
          name: settings.store_name || 'Thirukumaran Angadi',
          address: settings.address || '',
          city: settings.city || '',
          state: settings.state || ''
        });
      }
    } catch (err) {
      console.error('Error loading store settings:', err);
      setStoreInfo({
        name: 'Thirukumaran Angadi',
        address: '',
        city: 'Mettupalayam',
        state: 'Tamil Nadu'
      });
    }
  }

  const menuCategories = [
    {
      title: 'Inventory',
      items: [
        { id: 'inventory', label: 'Items', icon: Package },
        { id: 'categories', label: 'Categories', icon: LayoutDashboard },
        { id: 'units', label: 'Units', icon: BarChart3 }
      ]
    },
    {
      title: 'Purchases',
      items: [
        { id: 'purchase-order', label: 'Purchase Orders', icon: FileText },
        { id: 'purchase-invoices', label: 'Purchase Invoices', icon: Receipt },
        { id: 'purchase-records', label: 'Purchase Records', icon: FileText },
        { id: 'purchase-payments', label: 'Payments', icon: TrendingUp }
      ]
    },
    {
      title: 'Sales',
      items: [
        { id: 'sales', label: 'Sales Invoice', icon: ShoppingCart },
        { id: 'sales-orders', label: 'Sales Orders', icon: FileText },
        { id: 'sales-payments', label: 'Payments', icon: TrendingUp },
        { id: 'returns', label: 'Returns', icon: Package }
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'vendors', label: 'Vendors', icon: Users },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'expenses', label: 'Expenses', icon: TrendingUp }
      ]
    },
    {
      title: 'Reports',
      items: [
        { id: 'reports', label: 'Business Reports', icon: BarChart3 },
        { id: 'tax-reports', label: 'GST Tax Reports', icon: FileText }
      ]
    }
  ];

  const bottomNavItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: Home },
    { id: 'inventory' as Page, label: 'Items', icon: Package },
    { id: 'sales' as Page, label: 'Sales', icon: ShoppingCart },
    { id: 'purchase-invoices' as Page, label: 'Purchase', icon: ShoppingBag },
    { id: 'menu' as Page, label: 'Menu', icon: Menu }
  ];

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <InventoryManagement />;
      case 'categories': return <CategoriesManagement />;
      case 'units': return <UnitsManagement />;
      case 'purchase-order': return <PurchaseOrders onNavigate={handleNavigate} />;
      case 'purchase-payments': return <PurchasePayments />;
      case 'purchase-invoices': return <PurchaseInvoices />;
      case 'purchase-records': return <PurchaseRecordsManagement />;
      case 'sales': return <SalesInvoice />;
      case 'sales-orders': return <SalesOrders />;
      case 'sales-payments': return <SalesPaymentsManagement />;
      case 'returns': return <ReturnsManagement />;
      case 'expenses': return <ExpensesManagement />;
      case 'vendors': return <VendorsManagement />;
      case 'customers': return <CustomersManagement />;
      case 'reports': return <Reports />;
      case 'tax-reports': return <TaxReports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const handleNavigate = (pageId: string) => {
    setCurrentPage(pageId as Page);
    setShowMenuSheet(false);
  };

  const handleBottomNavClick = (pageId: Page) => {
    if (pageId === 'menu') {
      setShowMenuSheet(true);
    } else {
      setCurrentPage(pageId);
      setShowMenuSheet(false);
    }
  };

  const getPageTitle = () => {
    if (currentPage === 'dashboard') return storeInfo.name;
    
    for (const category of menuCategories) {
      const item = category.items.find(i => i.id === currentPage);
      if (item) return item.label;
    }
    return 'Angadi';
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Mobile: Fixed Top Header */}
      <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${theme.classes.bgPrimary} rounded-lg`}>
            <Store className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900">{getPageTitle()} | {storeInfo.name}</h1>
            <p className="text-xs text-slate-600">{storeInfo.city}</p>
          </div>
        </div>
        <button
          onClick={() => setCurrentPage('settings')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <SettingsIcon size={20} className="text-slate-600" />
        </button>
      </header>

      {/* Desktop: Sidebar */}
      <div className="hidden lg:flex h-screen">
        <aside className="w-64 bg-white border-r border-slate-200 overflow-y-auto">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 ${theme.classes.bgPrimary} rounded-lg`}>
                <Store className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">{storeInfo.name}</h1>
                <p className="text-xs text-slate-600">{storeInfo.city}, {storeInfo.state}</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-6">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                currentPage === 'dashboard'
                  ? `${theme.classes.bgPrimaryLight} ${theme.classes.textPrimary}`
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Home size={18} className="mr-3" />
              Dashboard
            </button>

            {menuCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 px-4">
                  {category.title}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentPage(item.id as Page)}
                        className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-all ${
                          currentPage === item.id
                            ? `${theme.classes.bgPrimaryLight} ${theme.classes.textPrimary}`
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={18} className="mr-3" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={() => setCurrentPage('settings')}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                currentPage === 'settings'
                  ? `${theme.classes.bgPrimaryLight} ${theme.classes.textPrimary}`
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <SettingsIcon size={18} className="mr-3" />
              Settings
            </button>
          </nav>
        </aside>

        {/* Desktop Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {renderPage()}
          </div>
        </main>
      </div>

      {/* Mobile: Main Content with bottom padding */}
      <main className="lg:hidden flex-1 overflow-y-auto pb-20">
        {renderPage()}
      </main>

      {/* Mobile: Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-50 shadow-lg">
        <div className="flex items-center justify-around">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleBottomNavClick(item.id)}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all min-w-[60px] ${
                  isActive 
                    ? `${theme.classes.bgPrimaryLight} ${theme.classes.textPrimary}` 
                    : 'text-slate-600'
                }`}
              >
                <Icon size={22} className="mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile: Menu Bottom Sheet */}
      {showMenuSheet && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden"
            onClick={() => setShowMenuSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[70] lg:hidden max-h-[80vh] flex flex-col shadow-2xl">
            {/* Sheet Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-teal-600 to-teal-700 rounded-t-3xl">
              <h2 className="text-xl font-bold text-white">All Features</h2>
              <button
                onClick={() => setShowMenuSheet(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            {/* Menu Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {menuCategories.map((category) => (
                <div key={category.title}>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 px-2">
                    {category.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCurrentPage(item.id as Page);
                            setShowMenuSheet(false);
                          }}
                          className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl transition-all active:scale-95"
                        >
                          <div className="p-3 bg-white rounded-xl border border-slate-200">
                            <Icon size={24} className="text-teal-600" />
                          </div>
                          <span className="text-xs font-medium text-slate-900 text-center leading-tight">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Settings */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 px-2">System</h3>
                <button
                  onClick={() => {
                    setCurrentPage('settings');
                    setShowMenuSheet(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl transition-all active:scale-95"
                >
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <SettingsIcon size={24} className="text-teal-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Settings</span>
                  <ChevronRight size={20} className="ml-auto text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
