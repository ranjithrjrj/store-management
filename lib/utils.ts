// FILE PATH: lib/utils.ts

/**
 * Utility functions for the inventory system
 */

// Format currency in Indian Rupee format
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date to Indian format
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Format datetime
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Validate GSTIN format
export const validateGSTIN = (gstin: string): boolean => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};

// Extract state code from GSTIN
export const getStateCodeFromGSTIN = (gstin: string): string | null => {
  if (gstin && gstin.length >= 2) {
    return gstin.substring(0, 2);
  }
  return null;
};

// Check if transaction is intrastate
export const isIntrastate = (stateCode1: string, stateCode2: string): boolean => {
  return stateCode1 === stateCode2;
};

// Calculate GST amounts
export const calculateGST = (
  amount: number,
  gstRate: number,
  isIntrastate: boolean
): { cgst: number; sgst: number; igst: number; total: number } => {
  const gstAmount = (amount * gstRate) / 100;
  
  if (isIntrastate) {
    return {
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      total: amount + gstAmount
    };
  } else {
    return {
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      total: amount + gstAmount
    };
  }
};

// Calculate item total with discount and GST
export const calculateItemTotal = (
  quantity: number,
  rate: number,
  discountPercent: number,
  gstRate: number,
  isIntrastate: boolean
): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
} => {
  const subtotal = quantity * rate;
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const gstAmount = (taxableAmount * gstRate) / 100;

  if (isIntrastate) {
    return {
      subtotal,
      discountAmount,
      taxableAmount,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      total: taxableAmount + gstAmount
    };
  } else {
    return {
      subtotal,
      discountAmount,
      taxableAmount,
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      total: taxableAmount + gstAmount
    };
  }
};

// Generate invoice number
export const generateInvoiceNumber = (prefix: string = 'INV'): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${year}${month}-${timestamp}`;
};

// Generate PO number
export const generatePONumber = (prefix: string = 'PO'): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${year}${month}-${timestamp}`;
};

// Generate purchase record number
export const generateRecordNumber = (prefix: string = 'PR'): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${year}${month}-${timestamp}`;
};

// Validate phone number (Indian 10-digit)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Validate pincode (Indian 6-digit)
export const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

// Validate email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Calculate round off
export const calculateRoundOff = (amount: number): number => {
  return Math.round(amount) - amount;
};

// Indian states with GST codes
export const indianStates = [
  { name: 'Andaman and Nicobar Islands', code: '35' },
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Arunachal Pradesh', code: '12' },
  { name: 'Assam', code: '18' },
  { name: 'Bihar', code: '10' },
  { name: 'Chandigarh', code: '04' },
  { name: 'Chhattisgarh', code: '22' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: '26' },
  { name: 'Delhi', code: '07' },
  { name: 'Goa', code: '30' },
  { name: 'Gujarat', code: '24' },
  { name: 'Haryana', code: '06' },
  { name: 'Himachal Pradesh', code: '02' },
  { name: 'Jammu and Kashmir', code: '01' },
  { name: 'Jharkhand', code: '20' },
  { name: 'Karnataka', code: '29' },
  { name: 'Kerala', code: '32' },
  { name: 'Ladakh', code: '38' },
  { name: 'Lakshadweep', code: '31' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Manipur', code: '14' },
  { name: 'Meghalaya', code: '17' },
  { name: 'Mizoram', code: '15' },
  { name: 'Nagaland', code: '13' },
  { name: 'Odisha', code: '21' },
  { name: 'Puducherry', code: '34' },
  { name: 'Punjab', code: '03' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Sikkim', code: '11' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Telangana', code: '36' },
  { name: 'Tripura', code: '16' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Uttarakhand', code: '05' },
  { name: 'West Bengal', code: '19' }
];

// Get state name from code
export const getStateNameFromCode = (code: string): string | undefined => {
  return indianStates.find(state => state.code === code)?.name;
};

// Get state code from name
export const getStateCodeFromName = (name: string): string | undefined => {
  return indianStates.find(state => state.name === name)?.code;
};

// Common GST rates in India
export const gstRates = [0, 5, 12, 18, 28];

// Payment methods
export const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'netbanking', label: 'Net Banking' },
  { value: 'credit', label: 'Credit' }
];

// Convert number to words (for invoices)
export const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  if (num < 1000) return convertLessThanThousand(num);
  if (num < 100000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return convertLessThanThousand(thousands) + ' Thousand' + (remainder !== 0 ? ' ' + convertLessThanThousand(remainder) : '');
  }
  if (num < 10000000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    return convertLessThanThousand(lakhs) + ' Lakh' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
  }
  
  const crores = Math.floor(num / 10000000);
  const remainder = num % 10000000;
  return convertLessThanThousand(crores) + ' Crore' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
};

// Format amount in words for invoice
export const formatAmountInWords = (amount: number): string => {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let words = numberToWords(rupees) + ' Rupees';
  if (paise > 0) {
    words += ' and ' + numberToWords(paise) + ' Paise';
  }
  return words + ' Only';
};

// Debounce function for search
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Export for CSV
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value).replace(/"/g, '""');
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Check if date is expired
export const isExpired = (expiryDate: string): boolean => {
  return new Date(expiryDate) < new Date();
};

// Get days until expiry
export const getDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Check if expiring soon (within 30 days)
export const isExpiringSoon = (expiryDate: string): boolean => {
  const daysUntil = getDaysUntilExpiry(expiryDate);
  return daysUntil > 0 && daysUntil <= 30;
};