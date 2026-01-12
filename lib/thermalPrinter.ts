// FILE PATH: lib/thermalPrinter.ts

/**
 * Thermal Printer Utility Functions
 * Supports 58mm and 80mm thermal printers
 * ESC/POS command compatible
 */

import { formatCurrency, formatDate } from './utils';

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';

export const PrinterCommands = {
  INIT: ESC + '@',                    // Initialize printer
  FEED: ESC + 'd' + '\x01',          // Line feed
  FEED_MULTI: (lines: number) => ESC + 'd' + String.fromCharCode(lines),
  CUT: GS + 'V' + '\x41' + '\x00',   // Cut paper
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_RIGHT: ESC + 'a' + '\x02',
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  UNDERLINE_ON: ESC + '-' + '\x01',
  UNDERLINE_OFF: ESC + '-' + '\x00',
  DOUBLE_WIDTH: ESC + '!' + '\x20',
  DOUBLE_HEIGHT: ESC + '!' + '\x10',
  NORMAL_SIZE: ESC + '!' + '\x00',
  SMALL_TEXT: ESC + '!' + '\x01',
  BARCODE_HEIGHT: (height: number) => GS + 'h' + String.fromCharCode(height),
  BARCODE_WIDTH: (width: number) => GS + 'w' + String.fromCharCode(width),
  PRINT_BARCODE: (code: string) => GS + 'k' + '\x49' + String.fromCharCode(code.length) + code,
  QR_CODE_SIZE: (size: number) => GS + '(k' + '\x03\x00' + '1C' + String.fromCharCode(size),
  QR_CODE_PRINT: (data: string) => {
    const len = data.length + 3;
    return GS + '(k' + String.fromCharCode(len % 256) + String.fromCharCode(len / 256) + '1P0' + data + 
           GS + '(k\x03\x001Q0';
  }
};

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
  customer_name?: string;
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

export class ThermalPrinter {
  private width: '58mm' | '80mm';
  private maxChars: number;
  
  constructor(width: '58mm' | '80mm' = '80mm') {
    this.width = width;
    this.maxChars = width === '58mm' ? 32 : 48;
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

  // Generate invoice print data
  generateInvoice(store: StoreInfo, invoice: InvoiceData, footer?: string, terms?: string): string {
    let output = '';
    
    // Initialize printer
    output += PrinterCommands.INIT;
    
    // Store header (centered, bold, double height)
    output += PrinterCommands.ALIGN_CENTER;
    output += PrinterCommands.BOLD_ON;
    output += PrinterCommands.DOUBLE_HEIGHT;
    output += this.formatLine(store.store_name.toUpperCase(), 'center') + '\n';
    output += PrinterCommands.NORMAL_SIZE;
    
    // Store address
    if (store.address) {
      output += PrinterCommands.SMALL_TEXT;
      output += this.formatLine(store.address, 'center') + '\n';
      output += PrinterCommands.NORMAL_SIZE;
    }
    
    if (store.city && store.state && store.pincode) {
      output += PrinterCommands.SMALL_TEXT;
      output += this.formatLine(`${store.city}, ${store.state} - ${store.pincode}`, 'center') + '\n';
      output += PrinterCommands.NORMAL_SIZE;
    }
    
    if (store.phone) {
      output += PrinterCommands.SMALL_TEXT;
      output += this.formatLine(`Ph: ${store.phone}`, 'center') + '\n';
      output += PrinterCommands.NORMAL_SIZE;
    }
    
    if (store.gstin) {
      output += PrinterCommands.SMALL_TEXT;
      output += this.formatLine(`GSTIN: ${store.gstin}`, 'center') + '\n';
      output += PrinterCommands.NORMAL_SIZE;
    }
    
    output += PrinterCommands.BOLD_OFF;
    
    // Separator
    output += PrinterCommands.ALIGN_LEFT;
    output += this.separator('=') + '\n';
    
    // Invoice details
    output += PrinterCommands.BOLD_ON;
    output += this.twoColumn('Invoice:', invoice.invoice_number) + '\n';
    output += PrinterCommands.BOLD_OFF;
    output += this.twoColumn('Date:', formatDate(invoice.invoice_date)) + '\n';
    
    // Customer details (if available)
    if (invoice.customer_name) {
      output += this.twoColumn('Customer:', invoice.customer_name) + '\n';
    }
    if (invoice.customer_phone) {
      output += this.twoColumn('Phone:', invoice.customer_phone) + '\n';
    }
    if (invoice.customer_gstin) {
      output += PrinterCommands.SMALL_TEXT;
      output += this.twoColumn('GSTIN:', invoice.customer_gstin) + '\n';
      output += PrinterCommands.NORMAL_SIZE;
    }
    
    // Separator
    output += this.separator('=') + '\n';
    
    // Items header
    if (this.width === '80mm') {
      output += PrinterCommands.BOLD_ON;
      output += this.formatLine('ITEM                QTY  RATE    AMOUNT') + '\n';
      output += PrinterCommands.BOLD_OFF;
    } else {
      output += PrinterCommands.BOLD_ON;
      output += this.formatLine('ITEM        QTY RATE   AMT') + '\n';
      output += PrinterCommands.BOLD_OFF;
    }
    output += this.separator('-') + '\n';
    
    // Items
    invoice.items.forEach(item => {
      const qty = item.quantity.toString();
      const rate = item.rate.toFixed(0);
      const total = item.total.toFixed(0);
      
      if (this.width === '80mm') {
        // Item name (first line)
        const itemName = item.name.length > 24 ? item.name.substring(0, 21) + '...' : item.name;
        const itemLine = itemName.padEnd(24) + qty.padStart(3) + '  ' + rate.padStart(6) + '  ' + total.padStart(8);
        output += itemLine + '\n';
        
        // GST rate (second line, smaller)
        output += PrinterCommands.SMALL_TEXT;
        output += `  (GST ${item.gst_rate}%)\n`;
        output += PrinterCommands.NORMAL_SIZE;
      } else {
        // 58mm format - more compact
        const itemName = item.name.length > 12 ? item.name.substring(0, 9) + '...' : item.name;
        const itemLine = itemName.padEnd(12) + qty.padStart(3) + ' ' + rate.padStart(5) + ' ' + total.padStart(6);
        output += itemLine + '\n';
      }
    });
    
    // Separator
    output += this.separator('-') + '\n';
    
    // Totals
    output += this.twoColumn('Subtotal:', '₹' + invoice.subtotal.toFixed(2)) + '\n';
    
    if (invoice.discount_amount && invoice.discount_amount > 0) {
      output += this.twoColumn('Discount:', '-₹' + invoice.discount_amount.toFixed(2)) + '\n';
    }
    
    // GST breakdown
    if (invoice.cgst_amount > 0) {
      output += PrinterCommands.SMALL_TEXT;
      output += this.twoColumn('CGST:', '₹' + invoice.cgst_amount.toFixed(2)) + '\n';
      output += this.twoColumn('SGST:', '₹' + invoice.sgst_amount.toFixed(2)) + '\n';
      output += PrinterCommands.NORMAL_SIZE;
    }
    if (invoice.igst_amount > 0) {
      output += PrinterCommands.SMALL_TEXT;
      output += this.twoColumn('IGST:', '₹' + invoice.igst_amount.toFixed(2)) + '\n';
      output += PrinterCommands.NORMAL_SIZE;
    }
    
    if (invoice.round_off !== 0) {
      output += PrinterCommands.SMALL_TEXT;
      output += this.twoColumn('Round Off:', '₹' + invoice.round_off.toFixed(2)) + '\n';
      output += PrinterCommands.NORMAL_SIZE;
    }
    
    // Total (bold, double height)
    output += this.separator('=') + '\n';
    output += PrinterCommands.BOLD_ON;
    output += PrinterCommands.DOUBLE_WIDTH;
    output += this.twoColumn('TOTAL:', '₹' + invoice.total_amount.toFixed(0)) + '\n';
    output += PrinterCommands.NORMAL_SIZE;
    output += PrinterCommands.BOLD_OFF;
    output += this.separator('=') + '\n';
    
    // Payment method
    if (invoice.payment_method) {
      output += this.twoColumn('Payment:', invoice.payment_method.toUpperCase()) + '\n';
      output += this.separator('-') + '\n';
    }
    
    // Footer message
    if (footer) {
      output += '\n';
      output += PrinterCommands.ALIGN_CENTER;
      output += PrinterCommands.SMALL_TEXT;
      output += this.formatLine(footer, 'center') + '\n';
      output += PrinterCommands.NORMAL_SIZE;
    }
    
    // Terms and conditions
    if (terms) {
      output += '\n';
      output += PrinterCommands.SMALL_TEXT;
      output += this.formatLine(terms, 'center') + '\n';
      output += PrinterCommands.NORMAL_SIZE;
    }
    
    // Barcode (invoice number)
    output += '\n';
    output += PrinterCommands.ALIGN_CENTER;
    output += PrinterCommands.BARCODE_HEIGHT(50);
    output += PrinterCommands.BARCODE_WIDTH(2);
    output += PrinterCommands.PRINT_BARCODE(invoice.invoice_number);
    output += '\n\n';
    
    // Feed and cut
    output += PrinterCommands.FEED_MULTI(3);
    output += PrinterCommands.CUT;
    
    return output;
  }

  // Print to browser (Web Serial API or USB)
  async printViaBrowser(content: string): Promise<void> {
    try {
      // Check if Web Serial API is supported
      if ('serial' in navigator) {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        
        const writer = port.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(content));
        writer.releaseLock();
        
        await port.close();
      } else {
        throw new Error('Web Serial API not supported');
      }
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  }

  // Print via iframe (for desktop apps with print drivers)
  printViaIframe(content: string): void {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <style>
              @media print {
                @page {
                  size: ${this.width} auto;
                  margin: 0;
                }
                body {
                  font-family: monospace;
                  font-size: ${this.width === '58mm' ? '10px' : '12px'};
                  margin: 0;
                  padding: 5px;
                  white-space: pre;
                }
              }
            </style>
          </head>
          <body>${this.escapeHtml(content)}</body>
        </html>
      `);
      doc.close();
      
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }
  }

  // Print via Bluetooth (for mobile apps)
  async printViaBluetooth(content: string): Promise<void> {
    try {
      if ('bluetooth' in navigator) {
        const device = await (navigator as any).bluetooth.requestDevice({
          filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }]
        });
        
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
        const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
        
        const encoder = new TextEncoder();
        await characteristic.writeValue(encoder.encode(content));
      } else {
        throw new Error('Bluetooth API not supported');
      }
    } catch (error) {
      console.error('Bluetooth print error:', error);
      throw error;
    }
  }

  // Generate HTML preview (for testing/preview)
  generateHTMLPreview(store: StoreInfo, invoice: InvoiceData, footer?: string, terms?: string): string {
    const content = this.generateInvoice(store, invoice, footer, terms);
    
    return `
      <div style="
        font-family: 'Courier New', monospace;
        font-size: ${this.width === '58mm' ? '10px' : '12px'};
        width: ${this.width};
        background: white;
        padding: 10px;
        border: 1px solid #ccc;
        white-space: pre;
        line-height: 1.4;
      ">
${this.escapeHtml(content)}
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Utility function to print invoice
export async function printInvoice(
  store: StoreInfo,
  invoice: InvoiceData,
  settings: {
    width: '58mm' | '80mm';
    footer?: string;
    terms?: string;
    method: 'browser' | 'iframe' | 'bluetooth' | 'preview';
  }
): Promise<void> {
  const printer = new ThermalPrinter(settings.width);
  const content = printer.generateInvoice(store, invoice, settings.footer, settings.terms);
  
  switch (settings.method) {
    case 'browser':
      await printer.printViaBrowser(content);
      break;
    case 'iframe':
      printer.printViaIframe(content);
      break;
    case 'bluetooth':
      await printer.printViaBluetooth(content);
      break;
    case 'preview':
      // Open preview in new window
      const previewWindow = window.open('', '_blank', 'width=400,height=600');
      if (previewWindow) {
        previewWindow.document.write(printer.generateHTMLPreview(store, invoice, settings.footer, settings.terms));
        previewWindow.document.close();
      }
      break;
  }
}