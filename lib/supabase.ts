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
  Expense,
  SalesReturn
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
        .eq('is_active', true)
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
        .eq('is_active', true)
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
        .eq('is_active', true)
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