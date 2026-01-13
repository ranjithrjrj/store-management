// FILE PATH: app/page.tsx
// UPDATED VERSION - Fully organized dropdown menu structure

"use client"
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, FileText, Users, Settings, TrendingUp, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ThemeProvider } from '@/contexts/ThemeContext';
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
import SettingsComponent from '@/components/Settings';

type Page = 'dashboard' | 'inventory' | 'items' | 'categories' | 'units' | 'purchase-order' | 'purchase-record' | 'sales' | 'returns' | 'expenses' | 'vendors' | 'customers' | 'reports' | 'tax-reports' | 'settings';

const App = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]); // Empty by default
  const [storeName, setStoreName] = useState('Thirukumaran Angadi');
  const [storeCity, setStoreCity] = useState('Mettupalayam, Tamil Nadu');

  // Load store settings for header
  useEffect(() => {
    loadStoreSettings();
  }, []);

  // Auto-expand sections that contain the current page
  useEffect(() => {
    menuItems.forEach((item: any) => {
      if (item.isSection && item.submenu) {
        const hasCurrentPage = item.submenu.some((sub: any) => sub.id === currentPage);
        if (hasCurrentPage && !openSections.includes(item.id)) {
          setOpenSections(prev => [...prev, item.id]);
        }
      }
    });
  }, [currentPage]);

  async function loadStoreSettings() {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('store_name, city, state')
        .limit(1);
      
      if (data && data.length > 0) {
        const settings = data[0];
        setStoreName(settings.store_name || 'Thirukumaran Angadi');
        const location = [settings.city, settings.state].filter(Boolean).join(', ');
        if (location) setStoreCity(location);
      }
    } catch (err) {
      console.error('Error loading store settings:', err);
    }
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    
    // Items Management Section
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
    
    // Purchase Section
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
    
    // Sales Section
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
    
    // User Management Section
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
    
    // Reports Section
    { 
      id: 'reports-section', 
      label: 'Reports', 
      icon: TrendingUp,
      isSection: true,
      submenu: [
        { id: 'reports', label: 'Reports' },
        { id: 'tax-reports', label: 'Tax Reports' }
      ]
    },
    
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
      case 'categories':
        return <CategoriesManagement />;
      case 'units':
        return <UnitsManagement />;
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
        return <SettingsComponent />;
      default:
        return <ComingSoon page={currentPage} />;
    }
  };

  const handlePageChange = (pageId: Page) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
    
    // Auto-expand the section that contains this page
    menuItems.forEach((item: any) => {
      if (item.isSection && item.submenu) {
        const hasThisPage = item.submenu.some((sub: any) => sub.id === pageId);
        if (hasThisPage && !openSections.includes(item.id)) {
          setOpenSections([...openSections, item.id]);
        }
      }
    });
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isSectionActive = (submenu: any[]) => {
    return submenu.some((sub: any) => currentPage === sub.id);
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button - Only shows when closed */}
      {!mobileMenuOpen && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Sidebar */}
      <aside className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-0 lg:inset-y-0 lg:w-64 z-40 w-full bg-white border-r border-gray-200 transition-transform duration-300 overflow-y-auto`}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600">{storeName}</h1>
          <p className="text-xs text-gray-500 mt-1">{storeCity}</p>
        </div>
        <nav className="px-3 space-y-1 pb-24">{/* Added pb-24 for close button space */}
          {menuItems.map((item: any) => {
            const Icon = item.icon;
            
            // Section with submenu
            if (item.isSection) {
              const hasActiveSubmenu = isSectionActive(item.submenu);
              const isOpen = openSections.includes(item.id);
              
              return (
                <div key={item.id}>
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      hasActiveSubmenu
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon size={18} className="mr-3" />
                      {item.label}
                    </div>
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  
                  {/* Submenu */}
                  {isOpen && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.submenu.map((subItem: any) => (
                        <button
                          key={subItem.id}
                          onClick={() => handlePageChange(subItem.id as Page)}
                          className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                            currentPage === subItem.id
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current mr-2"></div>
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            // Regular menu item
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id as Page)}
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
        
        {/* Close button - Bottom right, mobile only */}
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
    </div>
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