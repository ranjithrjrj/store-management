// FILE PATH: lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for better TypeScript support
export type Item = {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  hsn_code: string;
  unit_id: string;
  gst_rate: number;
  mrp: number;
  wholesale_price: number;
  retail_price: number;
  discount_percent: number;
  min_stock_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
};

export type Unit = {
  id: string;
  name: string;
  abbreviation: string;
  created_at: string;
};

export type Vendor = {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  state_code?: string;
  pincode?: string;
  payment_terms?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  state_code?: string;
  pincode?: string;
  customer_type: 'retail' | 'wholesale' | 'b2b';
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InventoryBatch = {
  id: string;
  item_id: string;
  batch_number?: string;
  quantity: number;
  purchase_price?: number;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
};

export type PurchaseOrder = {
  id: string;
  po_number: string;
  vendor_id: string;
  po_date: string;
  expected_delivery_date?: string;
  status: 'pending' | 'partial' | 'received' | 'cancelled';
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type PurchaseOrderItem = {
  id: string;
  po_id: string;
  item_id: string;
  quantity: number;
  rate: number;
  gst_rate: number;
  amount: number;
  received_quantity: number;
  created_at: string;
};

export type PurchaseRecord = {
  id: string;
  record_number: string;
  po_id?: string;
  vendor_id: string;
  invoice_number?: string;
  invoice_date: string;
  received_date: string;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'partial' | 'paid';
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type PurchaseRecordItem = {
  id: string;
  purchase_record_id: string;
  item_id: string;
  batch_number?: string;
  expiry_date?: string;
  quantity: number;
  rate: number;
  gst_rate: number;
  amount: number;
  inventory_batch_id?: string;
  created_at: string;
};

export type SalesInvoice = {
  id: string;
  invoice_number: string;
  customer_id?: string;
  invoice_date: string;
  customer_name?: string;
  customer_phone?: string;
  customer_gstin?: string;
  customer_state_code?: string;
  place_of_supply?: string;
  subtotal: number;
  discount_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  round_off: number;
  total_amount: number;
  payment_method?: string;
  payment_status: 'paid' | 'pending' | 'partial';
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type SalesInvoiceItem = {
  id: string;
  invoice_id: string;
  item_id: string;
  batch_id?: string;
  quantity: number;
  rate: number;
  discount_percent: number;
  discount_amount: number;
  taxable_amount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  created_at: string;
};

export type StoreSettings = {
  id: string;
  store_name: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  state_code?: string;
  created_at: string;
  updated_at: string;
};

export type ExpenseCategory = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
};

export type Expense = {
  id: string;
  expense_number: string;
  category_id: string;
  expense_date: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  vendor_name?: string;
  description?: string;
  receipt_image_url?: string;
  is_recurring: boolean;
  recurrence_period?: string;
  next_due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type RecurringExpense = {
  id: string;
  name: string;
  category_id: string;
  amount: number;
  recurrence_period: string;
  day_of_month?: number;
  start_date: string;
  end_date?: string;
  payment_method?: string;
  vendor_name?: string;
  description?: string;
  is_active: boolean;
  last_generated_date?: string;
  created_at: string;
  updated_at: string;
};

export type ReturnReason = {
  id: string;
  reason: string;
  description?: string;
  is_active: boolean;
  created_at: string;
};

export type SalesReturn = {
  id: string;
  return_number: string;
  original_invoice_id?: string;
  original_invoice_number?: string;
  return_date: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  return_reason_id?: string;
  return_reason_other?: string;
  condition_of_goods?: string;
  subtotal: number;
  discount_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  refund_method?: string;
  refund_status: 'pending' | 'approved' | 'rejected' | 'completed';
  refund_amount: number;
  refund_date?: string;
  approved_by?: string;
  notes?: string;
  is_restockable: boolean;
  created_at: string;
  updated_at: string;
};

export type SalesReturnItem = {
  id: string;
  return_id: string;
  original_sale_item_id?: string;
  item_id: string;
  batch_id?: string;
  quantity: number;
  rate: number;
  discount_percent: number;
  discount_amount: number;
  taxable_amount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  return_reason?: string;
  is_restocked: boolean;
  restocked_at?: string;
  created_at: string;
};

export type CreditNote = {
  id: string;
  credit_note_number: string;
  return_id: string;
  original_invoice_id?: string;
  customer_id?: string;
  issue_date: string;
  amount: number;
  used_amount: number;
  balance_amount: number;
  expiry_date?: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
};

// Helper functions for common queries
export const itemsAPI = {
  // Get all items with category and unit details
  async getAll() {
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
  },

  // Get single item by ID
  async getById(id: string) {
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
  },

  // Create new item
  async create(item: Omit<Item, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update item
  async update(id: string, item: Partial<Item>) {
    const { data, error } = await supabase
      .from('items')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete item
  async delete(id: string) {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const inventoryAPI = {
  // Get inventory summary
  async getSummary() {
    const { data, error } = await supabase
      .from('inventory_summary')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Get low stock items
  async getLowStock() {
    const { data, error } = await supabase
      .from('inventory_summary')
      .select('*')
      .eq('is_low_stock', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Get batches for an item
  async getBatchesByItem(itemId: string) {
    const { data, error } = await supabase
      .from('inventory_batches')
      .select('*')
      .eq('item_id', itemId)
      .order('expiry_date');
    
    if (error) throw error;
    return data;
  },

  // Add inventory batch
  async addBatch(batch: Omit<InventoryBatch, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('inventory_batches')
      .insert(batch)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update batch quantity
  async updateBatchQuantity(id: string, quantity: number) {
    const { data, error } = await supabase
      .from('inventory_batches')
      .update({ quantity })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const vendorsAPI = {
  // Get all vendors
  async getAll() {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Create vendor
  async create(vendor: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('vendors')
      .insert(vendor)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update vendor
  async update(id: string, vendor: Partial<Vendor>) {
    const { data, error } = await supabase
      .from('vendors')
      .update(vendor)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete vendor
  async delete(id: string) {
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const customersAPI = {
  // Get all customers
  async getAll() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Create customer
  async create(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update customer
  async update(id: string, customer: Partial<Customer>) {
    const { data, error } = await supabase
      .from('customers')
      .update(customer)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete customer
  async delete(id: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const purchaseOrdersAPI = {
  // Get all purchase orders
  async getAll() {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        vendor:vendors(id, name)
      `)
      .order('po_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get PO with items
  async getWithItems(id: string) {
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        vendor:vendors(id, name)
      `)
      .eq('id', id)
      .single();
    
    if (poError) throw poError;

    const { data: items, error: itemsError } = await supabase
      .from('purchase_order_items')
      .select(`
        *,
        item:items(id, name)
      `)
      .eq('po_id', id);
    
    if (itemsError) throw itemsError;

    return { ...po, items };
  },

  // Create PO with items
  async create(po: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>, items: Omit<PurchaseOrderItem, 'id' | 'po_id' | 'created_at'>[]) {
    const { data: poData, error: poError } = await supabase
      .from('purchase_orders')
      .insert(po)
      .select()
      .single();
    
    if (poError) throw poError;

    const itemsWithPOId = items.map(item => ({ ...item, po_id: poData.id }));
    const { data: itemsData, error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(itemsWithPOId)
      .select();
    
    if (itemsError) throw itemsError;

    return { ...poData, items: itemsData };
  }
};

export const salesAPI = {
  // Get all invoices
  async getAll(fromDate?: string, toDate?: string) {
    let query = supabase
      .from('sales_invoices')
      .select(`
        *,
        customer:customers(id, name)
      `)
      .order('invoice_date', { ascending: false });
    
    if (fromDate) query = query.gte('invoice_date', fromDate);
    if (toDate) query = query.lte('invoice_date', toDate);

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  // Create invoice with items
  async create(invoice: Omit<SalesInvoice, 'id' | 'created_at' | 'updated_at'>, items: Omit<SalesInvoiceItem, 'id' | 'invoice_id' | 'created_at'>[]) {
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('sales_invoices')
      .insert(invoice)
      .select()
      .single();
    
    if (invoiceError) throw invoiceError;

    const itemsWithInvoiceId = items.map(item => ({ ...item, invoice_id: invoiceData.id }));
    const { data: itemsData, error: itemsError } = await supabase
      .from('sales_invoice_items')
      .insert(itemsWithInvoiceId)
      .select();
    
    if (itemsError) throw itemsError;

    // Update inventory for each item
    for (const item of items) {
      if (item.batch_id) {
        // Deduct from specific batch
        const { data: batch } = await supabase
          .from('inventory_batches')
          .select('quantity')
          .eq('id', item.batch_id)
          .single();
        
        if (batch) {
          await supabase
            .from('inventory_batches')
            .update({ quantity: batch.quantity - item.quantity })
            .eq('id', item.batch_id);
        }
      }
    }

    return { ...invoiceData, items: itemsData };
  },

  // Get invoice with items
  async getWithItems(id: string) {
    const { data: invoice, error: invoiceError } = await supabase
      .from('sales_invoices')
      .select(`
        *,
        customer:customers(id, name)
      `)
      .eq('id', id)
      .single();
    
    if (invoiceError) throw invoiceError;

    const { data: items, error: itemsError } = await supabase
      .from('sales_invoice_items')
      .select(`
        *,
        item:items(id, name)
      `)
      .eq('invoice_id', id);
    
    if (itemsError) throw itemsError;

    return { ...invoice, items };
  }
};

export const reportsAPI = {
  // Sales report
  async getSalesReport(fromDate: string, toDate: string) {
    const { data, error } = await supabase
      .from('sales_invoices')
      .select('*')
      .gte('invoice_date', fromDate)
      .lte('invoice_date', toDate);
    
    if (error) throw error;
    return data;
  },

  // Purchase report
  async getPurchaseReport(fromDate: string, toDate: string) {
    const { data, error } = await supabase
      .from('purchase_records')
      .select(`
        *,
        vendor:vendors(id, name)
      `)
      .gte('invoice_date', fromDate)
      .lte('invoice_date', toDate);
    
    if (error) throw error;
    return data;
  },

  // GST summary
  async getGSTSummary(fromDate: string, toDate: string) {
    const { data: sales, error: salesError } = await supabase
      .from('sales_invoices')
      .select('cgst_amount, sgst_amount, igst_amount, total_amount')
      .gte('invoice_date', fromDate)
      .lte('invoice_date', toDate);
    
    if (salesError) throw salesError;

    const { data: purchases, error: purchasesError } = await supabase
      .from('purchase_records')
      .select('cgst_amount, sgst_amount, igst_amount, total_amount')
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
  }
};

export const settingsAPI = {
  // Get store settings
  async get() {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update store settings
  async update(settings: Partial<StoreSettings>) {
    const { data, error } = await supabase
      .from('store_settings')
      .update(settings)
      .eq('id', settings.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const categoriesAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }
};

export const unitsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }
};

export const expensesAPI = {
  // Get all expenses
  async getAll(fromDate?: string, toDate?: string) {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        category:expense_categories(id, name, icon)
      `)
      .order('expense_date', { ascending: false });
    
    if (fromDate) query = query.gte('expense_date', fromDate);
    if (toDate) query = query.lte('expense_date', toDate);

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  // Get expense by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:expense_categories(id, name, icon)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create expense
  async create(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update expense
  async update(id: string, expense: Partial<Expense>) {
    const { data, error } = await supabase
      .from('expenses')
      .update(expense)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete expense
  async delete(id: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get category-wise summary
  async getCategorySummary(fromDate?: string, toDate?: string) {
    const { data, error } = await supabase
      .from('category_expense_summary')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  // Get monthly summary
  async getMonthlySummary(year?: number) {
    const { data, error } = await supabase
      .from('monthly_expense_summary')
      .select('*');
    
    if (error) throw error;
    return data;
  }
};

export const expenseCategoriesAPI = {
  // Get all categories
  async getAll() {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Create category
  async create(category: Omit<ExpenseCategory, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('expense_categories')
      .insert(category)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update category
  async update(id: string, category: Partial<ExpenseCategory>) {
    const { data, error } = await supabase
      .from('expense_categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const recurringExpensesAPI = {
  // Get all recurring expenses
  async getAll() {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select(`
        *,
        category:expense_categories(id, name)
      `)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Create recurring expense
  async create(expense: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert(expense)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update recurring expense
  async update(id: string, expense: Partial<RecurringExpense>) {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .update(expense)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete recurring expense
  async delete(id: string) {
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Generate due recurring expenses
  async generateDue() {
    const { data, error } = await supabase.rpc('generate_recurring_expenses');
    
    if (error) throw error;
    return data;
  }
};

export const returnsAPI = {
  // Get all returns
  async getAll(fromDate?: string, toDate?: string) {
    let query = supabase
      .from('sales_returns')
      .select(`
        *,
        customer:customers(id, name),
        reason:return_reasons(id, reason)
      `)
      .order('return_date', { ascending: false });
    
    if (fromDate) query = query.gte('return_date', fromDate);
    if (toDate) query = query.lte('return_date', toDate);

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  // Get return by ID with items
  async getWithItems(id: string) {
    const { data: returnData, error: returnError } = await supabase
      .from('sales_returns')
      .select(`
        *,
        customer:customers(id, name),
        reason:return_reasons(id, reason)
      `)
      .eq('id', id)
      .single();
    
    if (returnError) throw returnError;

    const { data: items, error: itemsError } = await supabase
      .from('sales_return_items')
      .select(`
        *,
        item:items(id, name)
      `)
      .eq('return_id', id);
    
    if (itemsError) throw itemsError;

    return { ...returnData, items };
  },

  // Create return with items
  async create(
    returnData: Omit<SalesReturn, 'id' | 'created_at' | 'updated_at'>, 
    items: Omit<SalesReturnItem, 'id' | 'return_id' | 'created_at'>[]
  ) {
    const { data: newReturn, error: returnError } = await supabase
      .from('sales_returns')
      .insert(returnData)
      .select()
      .single();
    
    if (returnError) throw returnError;

    const itemsWithReturnId = items.map(item => ({ ...item, return_id: newReturn.id }));
    const { data: returnItems, error: itemsError } = await supabase
      .from('sales_return_items')
      .insert(itemsWithReturnId)
      .select();
    
    if (itemsError) throw itemsError;

    return { ...newReturn, items: returnItems };
  },

  // Update return status
  async updateStatus(id: string, status: 'pending' | 'approved' | 'rejected' | 'completed', approvedBy?: string) {
    const updateData: any = { refund_status: status };
    if (approvedBy) updateData.approved_by = approvedBy;
    if (status === 'completed') updateData.refund_date = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('sales_returns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    // If approved and restockable, restock items
    if (status === 'approved') {
      await supabase.rpc('restock_returned_items', { p_return_id: id });
    }

    return data;
  },

  // Delete return
  async delete(id: string) {
    const { error } = await supabase
      .from('sales_returns')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get returns summary
  async getSummary(fromDate?: string, toDate?: string) {
    const { data, error } = await supabase
      .from('returns_summary')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  // Get return reasons analysis
  async getReasonsAnalysis() {
    const { data, error } = await supabase
      .from('return_reasons_analysis')
      .select('*');
    
    if (error) throw error;
    return data;
  }
};

export const returnReasonsAPI = {
  // Get all return reasons
  async getAll() {
    const { data, error } = await supabase
      .from('return_reasons')
      .select('*')
      .eq('is_active', true)
      .order('reason');
    
    if (error) throw error;
    return data;
  }
};

export const creditNotesAPI = {
  // Get all credit notes
  async getAll() {
    const { data, error } = await supabase
      .from('credit_notes')
      .select(`
        *,
        customer:customers(id, name)
      `)
      .order('issue_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get credit notes for a customer
  async getByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('credit_notes')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .gt('balance_amount', 0)
      .order('issue_date');
    
    if (error) throw error;
    return data;
  },

  // Create credit note from return
  async createFromReturn(returnId: string) {
    const { data, error } = await supabase.rpc('create_credit_note_from_return', {
      p_return_id: returnId
    });
    
    if (error) throw error;
    return data;
  },

  // Use credit note
  async use(creditNoteId: string, invoiceId: string, amount: number) {
    const { data, error } = await supabase
      .from('credit_note_usage')
      .insert({
        credit_note_id: creditNoteId,
        invoice_id: invoiceId,
        amount_used: amount
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};