// FILE PATH: lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import type {
  Item,
  Category,
  Unit,
  Vendor,
  Customer,
  InventoryBatch,
  PurchaseOrder,
  SalesInvoice,
  StoreSettings,
  Expense
} from '@/types';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// ITEMS API
// ============================================================================
export const itemsAPI = {
  // Get all items with category and unit details
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          category:categories(id, name),
          unit:units(id, name, abbreviation)
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  // Get single item by ID
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          category:categories(id, name),
          unit:units(id, name, abbreviation)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching item:', error);
      throw error;
    }
  },

  // Create new item
  async create(item: Omit<Item, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('items')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  // Update item
  async update(id: string, item: Partial<Item>) {
    try {
      const { data, error } = await supabase
        .from('items')
        .update(item)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },

  // Delete item (soft delete by setting is_active = false)
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('items')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }
};

// ============================================================================
// INVENTORY API
// ============================================================================
export const inventoryAPI = {
  // Get all inventory items with aggregated stock
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          id,
          name,
          min_stock_level,
          mrp,
          retail_price,
          wholesale_price,
          category:categories(name),
          unit:units(name, abbreviation)
        `);
      
      if (error) throw error;

      // Get inventory batches to calculate current stock
      const { data: batches, error: batchError } = await supabase
        .from('inventory_batches')
        .select('item_id, quantity');
      
      if (batchError) throw batchError;

      // Aggregate stock by item
      const stockByItem: Record<string, number> = {};
      batches?.forEach(batch => {
        stockByItem[batch.item_id] = (stockByItem[batch.item_id] || 0) + batch.quantity;
      });

      // Combine data
      return data?.map(item => {
        const category = item.category as any;
        const unit = item.unit as any;
        return {
          id: item.id,
          item_name: item.name,
          category_name: category?.name || 'Uncategorized',
          current_stock: stockByItem[item.id] || 0,
          min_stock_level: item.min_stock_level || 0,
          unit_name: unit?.name || '',
          unit_abbr: unit?.abbreviation || '',
          mrp: item.mrp,
          retail_price: item.retail_price,
          wholesale_price: item.wholesale_price,
          total_value: (stockByItem[item.id] || 0) * item.retail_price
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  // Get inventory summary
  async getSummary() {
    try {
      const { data, error } = await supabase
        .from('inventory_batches')
        .select(`
          *,
          item:items(id, name, min_stock_level, unit:units(abbreviation))
        `)
        .gt('quantity', 0);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  // Get low stock items
  async getLowStock() {
    try {
      const { data, error } = await supabase
        .rpc('get_low_stock_items');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching low stock:', error);
      throw error;
    }
  }
};

// ============================================================================
// VENDORS API
// ============================================================================
export const vendorsAPI = {
  // Get all vendors
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  },

  // Create vendor
  async create(vendor: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert(vendor)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  },

  // Update vendor
  async update(id: string, vendor: Partial<Vendor>) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update(vendor)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  },

  // Delete vendor
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  }
};

// ============================================================================
// CUSTOMERS API
// ============================================================================
export const customersAPI = {
  // Get all customers
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  // Create customer
  async create(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  // Update customer
  async update(id: string, customer: Partial<Customer>) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(customer)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  // Delete customer
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }
};

// ============================================================================
// SALES API
// ============================================================================
export const salesAPI = {
  // Create sales invoice
  async createInvoice(invoice: Omit<SalesInvoice, 'id' | 'created_at' | 'updated_at'>, items: any[]) {
    try {
      // Start transaction
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('sales_invoices')
        .insert(invoice)
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;

      // Insert invoice items
      const invoiceItems = items.map(item => ({
        ...item,
        invoice_id: invoiceData.id
      }));

      const { error: itemsError } = await supabase
        .from('sales_invoice_items')
        .insert(invoiceItems);
      
      if (itemsError) throw itemsError;

      return invoiceData;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  // Get all invoices
  async getAll(fromDate?: string, toDate?: string) {
    try {
      let query = supabase
        .from('sales_invoices')
        .select('*')
        .order('invoice_date', { ascending: false });

      if (fromDate) {
        query = query.gte('invoice_date', fromDate);
      }
      if (toDate) {
        query = query.lte('invoice_date', toDate);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }
};

// ============================================================================
// CATEGORIES & UNITS API
// ============================================================================
export const categoriesAPI = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
};

export const unitsAPI = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching units:', error);
      throw error;
    }
  },

  async create(unit: { name: string; abbreviation: string; is_active?: boolean }) {
    try {
      const { data, error } = await supabase
        .from('units')
        .insert(unit)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating unit:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<{ name: string; abbreviation: string; is_active: boolean }>) {
    try {
      const { data, error } = await supabase
        .from('units')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating unit:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting unit:', error);
      throw error;
    }
  }
};

// ============================================================================
// EXPENSES API
// ============================================================================
export const expensesAPI = {
  async getAll(fromDate?: string, toDate?: string) {
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          category:expense_categories(id, name)
        `)
        .order('expense_date', { ascending: false });

      if (fromDate) {
        query = query.gte('expense_date', fromDate);
      }
      if (toDate) {
        query = query.lte('expense_date', toDate);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },

  async create(expenseData: any) {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, expenseData: any) {
    const { data, error } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ============================================================================
// REPORTS API
// ============================================================================
export const reportsAPI = {
  async getGSTSummary(fromDate: string, toDate: string) {
    try {
      // Get sales data
      const { data: sales, error: salesError } = await supabase
        .from('sales_invoices')
        .select('*')
        .gte('invoice_date', fromDate)
        .lte('invoice_date', toDate);
      
      if (salesError) throw salesError;

      // Get purchase data
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchase_records')
        .select('*')
        .gte('invoice_date', fromDate)
        .lte('invoice_date', toDate);
      
      if (purchasesError) throw purchasesError;

      return {
        sales: {
          cgst: sales.reduce((sum, s) => sum + s.cgst_amount, 0),
          sgst: sales.reduce((sum, s) => sum + s.sgst_amount, 0),
          igst: sales.reduce((sum, s) => sum + s.igst_amount, 0),
          total: sales.reduce((sum, s) => sum + s.total_amount, 0)
        },
        purchases: {
          cgst: purchases.reduce((sum, p) => sum + p.cgst_amount, 0),
          sgst: purchases.reduce((sum, p) => sum + p.sgst_amount, 0),
          igst: purchases.reduce((sum, p) => sum + p.igst_amount, 0),
          total: purchases.reduce((sum, p) => sum + p.total_amount, 0)
        }
      };
    } catch (error) {
      console.error('Error fetching GST summary:', error);
      throw error;
    }
  }
};

// ============================================================================
// SETTINGS API
// ============================================================================
export const settingsAPI = {
  async get() {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  async update(settings: Partial<StoreSettings>) {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .update(settings)
        .eq('id', settings.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
};

// ============================================================================
// DASHBOARD API
// ============================================================================
export const dashboardAPI = {
  async getStats() {
    try {
      // Get revenue from sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales_invoices')
        .select('total_amount');
      
      if (salesError) throw salesError;
      const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

      // Get expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount');
      
      if (expensesError) throw expensesError;
      const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;

      // Get low stock count
      const { data: lowStockData, error: lowStockError } = await supabase
        .rpc('get_low_stock_items');
      
      const lowStockCount = lowStockData?.length || 0;

      // Get customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Get vendors count
      const { count: vendorsCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });

      // Get recent sales (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentSalesData } = await supabase
        .from('sales_invoices')
        .select('total_amount')
        .gte('invoice_date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      const recentSales = recentSalesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

      // Get recent purchases (last 30 days)
      const { data: recentPurchasesData } = await supabase
        .from('purchase_orders')
        .select('total_amount')
        .gte('order_date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      const recentPurchases = recentPurchasesData?.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0) || 0;

      return {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        lowStockCount,
        totalCustomers: customersCount || 0,
        totalVendors: vendorsCount || 0,
        recentSales,
        recentPurchases,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  async getLowStock() {
    try {
      const { data, error } = await supabase.rpc('get_low_stock_items');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching low stock:', error);
      throw error;
    }
  }
};
