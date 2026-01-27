// FILE PATH: lib/thermalPrinter.ts
// Fixed 80mm width and added customization options

type StoreInfo = {
  store_name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  gstin?: string;
};

type InvoiceData = {
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  customer_phone?: string;
  customer_gstin?: string;
  items: Array<{
    name: string;
    quantity: number;
    rate: number;
    gst_rate: number;
    total: number;
  }>;
  subtotal: number;
  discount_amount?: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  round_off: number;
  total_amount: number;
  payment_method?: string;
};

type PrintOptions = {
  width?: '58mm' | '80mm';
  footer?: string;
  terms?: string;
  method?: 'iframe' | 'preview' | 'browser' | 'bluetooth';
};

export class ThermalPrinter {
  private width: '58mm' | '80mm';
  private maxChars: number;
  
  constructor(width: '58mm' | '80mm' = '80mm') {
    this.width = width;
    // FIXED: 80mm uses 42 chars, not 48
    this.maxChars = width === '58mm' ? 32 : 42;
  }

  // Format text to fit printer width
  private formatLine(text: string, align: 'left' | 'center' | 'right' = 'left'): string {
    if (text.length > this.maxChars) {
      return text.substring(0, this.maxChars);
    }
    
    if (align === 'center') {
      const padding = Math.floor((this.maxChars - text.length) / 2);
      return ' '.repeat(padding) + text;
    } else if (align === 'right') {
      const padding = this.maxChars - text.length;
      return ' '.repeat(padding) + text;
    }
    return text;
  }

  // Create two-column layout
  private twoColumn(left: string, right: string): string {
    const rightLength = right.length;
    const leftLength = this.maxChars - rightLength - 1;
    const truncatedLeft = left.length > leftLength ? left.substring(0, leftLength - 3) + '...' : left;
    const padding = this.maxChars - truncatedLeft.length - rightLength;
    return truncatedLeft + ' '.repeat(padding) + right;
  }

  // Create separator line
  private separator(char: string = '-'): string {
    return char.repeat(this.maxChars);
  }

  // Measure actual display width of text (handles Unicode/Tamil characters)
  private measureTextWidth(text: string): number {
    let width = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      // Tamil Unicode range: 0x0B80-0x0BFF
      // Other Indic scripts: 0x0900-0x0DFF
      // CJK: 0x4E00-0x9FFF
      // These characters are typically 1.5-2x wider than ASCII
      if (
        (code >= 0x0900 && code <= 0x0DFF) || // Indic scripts
        (code >= 0x4E00 && code <= 0x9FFF) || // CJK
        (code >= 0x3040 && code <= 0x30FF)    // Japanese
      ) {
        width += 2; // Wide character
      } else {
        width += 1; // Normal ASCII character
      }
    }
    return width;
  }

  // Generate invoice print data
  generateInvoice(store: StoreInfo, invoice: InvoiceData, footer?: string, terms?: string): string {
    let output = '';

    // Store header
    output += this.formatLine(store.store_name, 'center') + '\n';
    if (store.address) output += this.formatLine(store.address, 'center') + '\n';
    if (store.city && store.state) {
      output += this.formatLine(`${store.city}, ${store.state} - ${store.pincode || ''}`, 'center') + '\n';
    }
    if (store.phone) output += this.formatLine(`Ph: ${store.phone}`, 'center') + '\n';
    if (store.gstin) output += this.formatLine(`GSTIN: ${store.gstin}`, 'center') + '\n';
    
    output += this.separator('=') + '\n';

    // Invoice details
    output += this.twoColumn('Invoice:', invoice.invoice_number) + '\n';
    output += this.twoColumn('Date:', invoice.invoice_date) + '\n';
    output += this.twoColumn('Customer:', invoice.customer_name) + '\n';
    if (invoice.customer_phone) {
      output += this.twoColumn('Phone:', invoice.customer_phone) + '\n';
    }
    if (invoice.customer_gstin) {
      output += this.twoColumn('GSTIN:', invoice.customer_gstin) + '\n';
    }
    
    output += this.separator('=') + '\n';

    // Items header - FIXED with proper column widths
    // For 80mm (42 chars): Item=22, Qty=4, Rate=7, Total=9
    // For 58mm (32 chars): Item=16, Qty=4, Rate=6, Total=6
    const itemWidth = this.width === '58mm' ? 16 : 22;
    const qtyWidth = 4;
    const rateWidth = this.width === '58mm' ? 6 : 7;
    const totalWidth = this.width === '58mm' ? 6 : 9;
    
    output += 'ITEM'.padEnd(itemWidth) + 
              'QTY'.padStart(qtyWidth) + 
              'RATE'.padStart(rateWidth) + 
              'TOTAL'.padStart(totalWidth) + '\n';
    output += this.separator('-') + '\n';

    // Items with special handling for long/Unicode names
    invoice.items.forEach(item => {
      // Check if item name is too long (Unicode chars or long names)
      const itemNameLength = this.measureTextWidth(item.name);
      
      if (itemNameLength > itemWidth) {
        // Item name is too long - print on separate line
        output += item.name.substring(0, this.maxChars) + '\n';
        
        // Then print qty, rate, total on next line with proper alignment
        const qtyStr = item.quantity.toString().padStart(qtyWidth);
        const rateStr = item.rate.toFixed(0).padStart(rateWidth);
        const totalStr = item.total.toFixed(0).padStart(totalWidth);
        
        // Indent to align with columns
        output += ' '.repeat(itemWidth) + qtyStr + rateStr + totalStr + '\n';
      } else {
        // Item name fits - print normally
        const itemLine = item.name.substring(0, itemWidth).padEnd(itemWidth);
        const qtyStr = item.quantity.toString().padStart(qtyWidth);
        const rateStr = item.rate.toFixed(0).padStart(rateWidth);
        const totalStr = item.total.toFixed(0).padStart(totalWidth);
        
        output += itemLine + qtyStr + rateStr + totalStr + '\n';
      }
      
      if (item.gst_rate > 0) {
        output += `  (GST ${item.gst_rate}%)\n`;
      }
    });

    output += this.separator('-') + '\n';

    // Totals
    output += this.twoColumn('Subtotal:', `₹${invoice.subtotal.toFixed(2)}`) + '\n';
    
    if (invoice.discount_amount && invoice.discount_amount > 0) {
      output += this.twoColumn('Discount:', `₹${invoice.discount_amount.toFixed(2)}`) + '\n';
    }

    if (invoice.cgst_amount > 0) {
      output += this.twoColumn('CGST:', `₹${invoice.cgst_amount.toFixed(2)}`) + '\n';
      output += this.twoColumn('SGST:', `₹${invoice.sgst_amount.toFixed(2)}`) + '\n';
    }
    
    if (invoice.igst_amount > 0) {
      output += this.twoColumn('IGST:', `₹${invoice.igst_amount.toFixed(2)}`) + '\n';
    }

    if (invoice.round_off !== 0) {
      output += this.twoColumn('Round Off:', `₹${invoice.round_off.toFixed(2)}`) + '\n';
    }

    output += this.separator('=') + '\n';
    output += this.twoColumn('TOTAL:', `₹${invoice.total_amount.toFixed(2)}`) + '\n';
    output += this.separator('=') + '\n';

    if (invoice.payment_method) {
      output += this.formatLine(`Payment: ${invoice.payment_method.toUpperCase()}`, 'center') + '\n';
      output += '\n';
    }

    // Footer
    if (terms) {
      output += this.formatLine(terms, 'center') + '\n';
    }
    if (footer) {
      output += this.formatLine(footer, 'center') + '\n';
    }

    output += '\n\n\n';
    return output;
  }
}

/**
 * Print invoice using various methods
 * 
 * HOW TO CUSTOMIZE STATIC CONTENT:
 * ================================
 * 
 * 1. FOOTER TEXT (Thank you message):
 *    Pass 'footer' in options:
 *    printInvoice(store, invoice, { footer: 'Visit Again!' })
 * 
 * 2. TERMS & CONDITIONS:
 *    Pass 'terms' in options:
 *    printInvoice(store, invoice, { terms: 'No refunds on sale items' })
 * 
 * 3. STORE INFO (name, address, phone, GSTIN):
 *    Update in store_settings table in database
 *    OR pass custom storeInfo object:
 *    printInvoice({ 
 *      store_name: 'My Store',
 *      address: '123 Main St',
 *      city: 'Chennai',
 *      state: 'Tamil Nadu',
 *      pincode: '600001',
 *      phone: '9876543210',
 *      gstin: '33AAAAA0000A1Z5'
 *    }, invoice)
 * 
 * 4. CHANGE DEFAULT FOOTER/TERMS:
 *    Edit the default values in the function below (lines 219-220)
 * 
 * @param storeInfo Store details
 * @param invoiceData Invoice data
 * @param options Print options
 */
export async function printInvoice(
  storeInfo: StoreInfo,
  invoiceData: InvoiceData,
  options: PrintOptions = {}
): Promise<void> {
  const {
    width = '80mm',
    // CUSTOMIZE DEFAULT FOOTER HERE:
    footer = 'Thank you for your business!',
    // CUSTOMIZE DEFAULT TERMS HERE:
    terms = 'Goods once sold cannot be returned',
    method = 'iframe'
  } = options;

  const printer = new ThermalPrinter(width);
  const printContent = printer.generateInvoice(storeInfo, invoiceData, footer, terms);

  switch (method) {
    case 'iframe':
      // Browser print using iframe (works with most thermal printers via system drivers)
      return printUsingIframe(printContent, width);
    
    case 'preview':
      // Open in new window for preview
      return printPreview(printContent);
    
    case 'browser':
      // Direct browser print (Chrome/Edge USB printing)
      return printDirectBrowser(printContent);
    
    case 'bluetooth':
      // Bluetooth printing (for mobile)
      return printBluetooth(printContent);
    
    default:
      return printUsingIframe(printContent, width);
  }
}

/**
 * Print using iframe method (most compatible)
 */
function printUsingIframe(content: string, width: '58mm' | '80mm'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const printWindow = document.createElement('iframe');
      printWindow.style.display = 'none';
      document.body.appendChild(printWindow);

      const doc = printWindow.contentWindow?.document;
      if (!doc) {
        reject(new Error('Cannot access iframe document'));
        return;
      }

      const widthMm = width === '58mm' ? 58 : 80;
      
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @page {
              size: ${widthMm}mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 2mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 9pt;
              line-height: 1.2;
            }
            pre {
              margin: 0;
              padding: 0;
              white-space: pre;
              overflow: hidden;
              font-family: 'Courier New', Courier, monospace;
              font-size: 9pt;
              line-height: 1.2;
            }
          </style>
        </head>
        <body>
          <pre>${content}</pre>
        </body>
        </html>
      `);
      doc.close();

      printWindow.contentWindow?.focus();
      printWindow.contentWindow?.print();

      setTimeout(() => {
        document.body.removeChild(printWindow);
        resolve();
      }, 100);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Print preview in new window
 */
function printPreview(content: string): Promise<void> {
  return new Promise((resolve) => {
    const previewWindow = window.open('', '_blank', 'width=500,height=700');
    if (!previewWindow) {
      alert('Please allow popups to preview print');
      resolve();
      return;
    }

    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Preview</title>
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11pt;
            padding: 20px;
            background: #f0f0f0;
          }
          pre {
            background: white;
            padding: 15px;
            border: 1px solid #ccc;
            white-space: pre;
            overflow-x: auto;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11pt;
            line-height: 1.3;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            pre {
              border: none;
              padding: 5mm;
            }
          }
        </style>
      </head>
      <body>
        <pre>${content}</pre>
        <button onclick="window.print()">Print</button>
        <button onclick="window.close()">Close</button>
      </body>
      </html>
    `);
    previewWindow.document.close();
    resolve();
  });
}

/**
 * Direct browser print (Chrome/Edge Web USB)
 */
function printDirectBrowser(content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // This requires Web USB API and is more complex
    // For now, fall back to iframe method
    console.warn('Direct browser printing not yet implemented, using iframe method');
    printUsingIframe(content, '80mm').then(resolve).catch(reject);
  });
}

/**
 * Bluetooth printing (mobile)
 */
function printBluetooth(content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // This requires Web Bluetooth API
    console.warn('Bluetooth printing not yet implemented, using iframe method');
    printUsingIframe(content, '80mm').then(resolve).catch(reject);
  });
}
