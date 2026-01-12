// FILE PATH: types/index.ts

/**
 * Type definitions for the Thirukumaran Angadi inventory system
 */

// Database table types
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
  recurrence_period?: 'monthly' | 'quarterly' | 'yearly';
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
  recurrence_period: 'monthly' | 'quarterly' | 'yearly';
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

export type ExpenseWithCategory = Expense & {
  category?: ExpenseCategory;
};

export type ExpenseSummary = {
  category_id: string;
  category_name: string;
  expense_count: number;
  total_amount: number;
  average_amount: number;
};

export type MonthlyExpenseSummary = {
  month: string;
  category: string;
  expense_count: number;
  total_amount: number;
};

// Extended types with relations
export type ItemWithRelations = Item & {
  category?: Category;
  unit?: Unit;
};

export type InventorySummary = {
  item_id: string;
  name: string;
  min_stock_level: number;
  total_stock: number;
  unit: string;
  is_low_stock: boolean;
};

export type PurchaseOrderWithRelations = PurchaseOrder & {
  vendor?: Vendor;
  items?: (PurchaseOrderItem & { item?: Item })[];
};

export type SalesInvoiceWithRelations = SalesInvoice & {
  customer?: Customer;
  items?: (SalesInvoiceItem & { item?: Item })[];
};

// Form input types
export type ItemFormData = Omit<Item, 'id' | 'created_at' | 'updated_at'>;
export type VendorFormData = Omit<Vendor, 'id' | 'created_at' | 'updated_at'>;
export type CustomerFormData = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
export type InventoryBatchFormData = Omit<InventoryBatch, 'id' | 'created_at' | 'updated_at'>;

// UI state types
export type POStatus = 'pending' | 'partial' | 'received' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type CustomerType = 'retail' | 'wholesale' | 'b2b';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'netbanking' | 'credit';

// Report types
export type SalesReportData = {
  date: string;
  invoice_count: number;
  total_sales: number;
  cgst: number;
  sgst: number;
  igst: number;
};

export type PurchaseReportData = {
  date: string;
  vendor: string;
  amount: number;
  cgst: number;
  sgst: number;
  igst: number;
};

export type GSTSummary = {
  sales: {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
  purchases: {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
  net: {
    cgst: number;
    sgst: number;
    igst: number;
  };
};

export type InventoryValuation = {
  category: string;
  items_count: number;
  total_value: number;
};

export type ProfitLossData = {
  revenue: number;
  cogs: number;
  gross_profit: number;
  margin_percent: number;
};

// Filter and search types
export type DateRange = {
  from: string;
  to: string;
};

export type ItemFilters = {
  category_id?: string;
  is_active?: boolean;
  search?: string;
};

export type InventoryFilters = {
  low_stock_only?: boolean;
  search?: string;
};

export type POFilters = {
  status?: POStatus | 'all';
  vendor_id?: string;
  date_range?: DateRange;
  search?: string;
};

export type InvoiceFilters = {
  payment_status?: PaymentStatus | 'all';
  customer_id?: string;
  date_range?: DateRange;
  search?: string;
};

// Calculation result types
export type GSTCalculation = {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
};

export type ItemCalculation = {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
};

// API response types
export type APIResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
};

// Pagination types
export type PaginationParams = {
  page: number;
  limit: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

// Dashboard statistics
export type DashboardStats = {
  totalItems: number;
  lowStockCount: number;
  totalSales: number;
  totalPurchases: number;
  pendingPOs: number;
  customersCount: number;
  vendorsCount: number;
};

// Invoice settings
export type InvoiceSettings = {
  invoice_prefix: string;
  invoice_footer: string;
  terms_conditions: string;
  print_width: '58mm' | '80mm';
};

// State information
export type IndianState = {
  name: string;
  code: string;
};

// Validation result
export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

// Export types
export type ExportFormat = 'csv' | 'pdf' | 'xlsx';

// Print options
export type PrintOptions = {
  width: '58mm' | '80mm';
  copies: number;
  showGST: boolean;
};

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
};