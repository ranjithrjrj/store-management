// FILE PATH: app/page.tsx
// Modern navigation with theme integration and auto-closing dropdowns

"use client"
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, FileText, Users, Settings as SettingsIcon, TrendingUp, Menu, X, ChevronDown, ChevronRight, Store, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui';

// Import all components
import Dashboard from '@/components/Dashboard';
import Inventory from '@/components/Inventory';
import ItemsManagement from '@/components/ItemsManagement';
import CategoriesManagement from '@/components/CategoriesManagement';
import UnitsManagement from '@/components/UnitsManagement';
import PurchaseOrders from '@/components/PurchaseOrders';
import PurchaseRecording from '@/components/PurchaseRecording';
import SalesInvoice from '@/components/SalesInvoice';
import ReturnsManagement from '@/components/ReturnsManagement';
import ExpensesManagement from '@/components/ExpensesManagement';
import VendorsManagement from '@/components/VendorsManagement';
import CustomersManagement from '@/components/CustomersManagement';
import Reports from '@/components/Reports';
import TaxReports from '@/components/TaxReports';
import Settings from '@/components/Settings';

type Page = 'dashboard' | 'inventory' | 'items' | 'categories' | 'units' | 'purchase-order' | 'purchase-record' | 'sales' | 'returns' | 'expenses' | 'vendors' | 'customers' | 'reports' | 'tax-reports' | 'settings';

const AppContent = () => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null); // Only one section open at a time
  const [storeInfo, setStoreInfo] = useState({
    name: 'Loading...',
    address: '',
    city: '',
    state: ''
  });

  // Load store settings
  useEffect(() => {
    loadStoreSettings();
  }, []);

  // Auto-expand section containing current page
  useEffect(() => {
    menuItems.forEach((item: any) => {
      if (item.isSection && item.submenu) {
        const hasCurrentPage = item.submenu.some((sub: any) => sub.id === currentPage);
        if (hasCurrentPage) {
          setOpenSection(item.id);
        }
      }
    });
  }, [currentPage]);

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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    
    { 
      id: 'items-section', 
      label: 'Items & Inventory', 
      icon: Package,
      isSection: true,
      submenu: [
        { id: 'inventory', label: 'Inventory Overview' },
        { id: 'items', label: 'Items' },
        { id: 'categories', label: 'Categories' },
        { id: 'units', label: 'Units' }
      ]
    },
    
    { 
      id: 'purchase-section', 
      label: 'Purchase', 
      icon: ShoppingCart,
      isSection: true,
      submenu: [
        { id: 'purchase-order', label: 'Purchase Orders' },
        { id: 'purchase-record', label: 'Purchase Recording' }
      ]
    },
    
    { 
      id: 'sales-section', 
      label: 'Sales', 
      icon: FileText,
      isSection: true,
      submenu: [
        { id: 'sales', label: 'Sales Invoice' },
        { id: 'returns', label: 'Returns & Refunds' }
      ]
    },
    
    { id: 'expenses', label: 'Expenses', icon: TrendingUp },
    
    { 
      id: 'users-section', 
      label: 'User Management', 
      icon: Users,
      isSection: true,
      submenu: [
        { id: 'customers', label: 'Customers' },
        { id: 'vendors', label: 'Vendors' }
      ]
    },
    
    { 
      id: 'reports-section', 
      label: 'Reports', 
      icon: FileText,
      isSection: true,
      submenu: [
        { id: 'reports', label: 'Business Reports' },
        { id: 'tax-reports', label: 'GST Tax Reports' }
      ]
    },
    
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'items': return <ItemsManagement />;
      case 'categories': return <CategoriesManagement />;
      case 'units': return <UnitsManagement />;
      case 'purchase-order': return <PurchaseOrders />;
      case 'purchase-record': return <PurchaseRecording />;
      case 'sales': return <SalesInvoice />;
      case 'returns': return <ReturnsManagement />;
      case 'expenses': return <ExpensesManagement />;
      case 'vendors': return <VendorsManagement />;
      case 'customers': return <CustomersManagement />;
      case 'reports': return <Reports />;
      case 'tax-reports': return <TaxReports />;
      case 'settings': return <Settings />;
      default: return <ComingSoon page={currentPage} />;
    }
  };

  const handlePageChange = (pageId: Page) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
  };

  const toggleSection = (sectionId: string) => {
    // Auto-close: if clicking same section, close it; otherwise open new one
    setOpenSection(prev => prev === sectionId ? null : sectionId);
  };

  const isSectionActive = (submenu: any[]) => {
    return submenu.some((sub: any) => currentPage === sub.id);
  };

  const locationParts = [storeInfo.city, storeInfo.state].filter(Boolean);
  const locationText = locationParts.length > 0 ? locationParts.join(', ') : 'India';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      {!mobileMenuOpen && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`lg:hidden fixed top-4 left-4 z-50 p-2 ${theme.classes.bgPrimary} text-white rounded-lg shadow-lg`}
        >
          <Menu size={24} />
        </button>
      )}

      {/* Sidebar */}
      <aside className={`${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:static inset-0 lg:inset-y-0 lg:w-72 z-40 w-full bg-white border-r border-gray-200 transition-transform duration-300 overflow-y-auto shadow-lg lg:shadow-none`}>
        
        {/* Store Header */}
        <div className={`p-6 border-b border-gray-200 ${theme.classes.bgPrimaryLight}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 ${theme.classes.bgPrimary} rounded-lg flex-shrink-0`}>
              <Store size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`text-lg font-bold ${theme.classes.textPrimary} truncate`}>
                {storeInfo.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-600">
                <MapPin size={12} className="flex-shrink-0" />
                <span className="truncate">{locationText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1 pb-24">
          {menuItems.map((item: any) => {
            const Icon = item.icon;
            
            if (item.isSection) {
              const hasActiveSubmenu = isSectionActive(item.submenu);
              const isOpen = openSection === item.id;
              
              return (
                <div key={item.id}>
                  <button
                    onClick={() => toggleSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                      hasActiveSubmenu
                        ? `${theme.classes.bgPrimaryLight} ${theme.classes.textPrimary}`
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon size={18} className="mr-3" />
                      {item.label}
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {/* Submenu with smooth animation */}
                  <div className={`overflow-hidden transition-all duration-200 ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="ml-6 mt-1 space-y-1 py-1">
                      {item.submenu.map((subItem: any) => (
                        <button
                          key={subItem.id}
                          onClick={() => handlePageChange(subItem.id as Page)}
                          className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                            currentPage === subItem.id
                              ? `${theme.classes.bgPrimary} text-white font-medium shadow-sm`
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            currentPage === subItem.id ? 'bg-white' : 'bg-gray-400'
                          }`}></div>
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
            
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id as Page)}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  currentPage === item.id
                    ? `${theme.classes.bgPrimaryLight} ${theme.classes.textPrimary}`
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} className="mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        {/* Close button - Mobile only */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-4 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {renderPage()}
        </div>
      </main>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
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

const ComingSoon = ({ page }: { page: string }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
      <p className="text-gray-600">The {page.replace('-', ' ')} page is under development.</p>
    </div>
  );
};

export default App;