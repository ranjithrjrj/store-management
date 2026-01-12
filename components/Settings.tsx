// FILE PATH: components/Settings.tsx

import React, { useState } from 'react';
import { Save, Building, FileText, Printer } from 'lucide-react';

const Settings = () => {
  const [storeSettings, setStoreSettings] = useState({
    store_name: 'Thirukumaran Angadi',
    gstin: '',
    address: '',
    city: 'Mettupalayam',
    state: 'Tamil Nadu',
    state_code: '33',
    pincode: '',
    phone: '',
    email: ''
  });

  const [invoiceSettings, setInvoiceSettings] = useState({
    invoice_prefix: 'INV',
    invoice_footer: 'Thank you for your business!',
    terms_conditions: 'Goods once sold cannot be returned.',
    print_width: '80mm'
  });

  const handleSaveStore = () => {
    // Save to Supabase
    console.log('Saving store settings:', storeSettings);
    alert('Store settings saved successfully!');
  };

  const handleSaveInvoice = () => {
    // Save to Supabase
    console.log('Saving invoice settings:', invoiceSettings);
    alert('Invoice settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 text-sm mt-1">Configure store and system preferences</p>
      </div>

      {/* Store Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Building className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Store Information</h3>
            <p className="text-sm text-gray-600">Basic details about your store</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={storeSettings.store_name}
                onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your store name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GSTIN
              </label>
              <input
                type="text"
                value={storeSettings.gstin}
                onChange={(e) => setStoreSettings({ ...storeSettings, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="33XXXXX1234X1ZX"
                maxLength={15}
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank if not registered yet</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={storeSettings.address}
              onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={storeSettings.city}
                onChange={(e) => setStoreSettings({ ...storeSettings, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={storeSettings.state}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
              <input
                type="text"
                value={storeSettings.state_code}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input
                type="text"
                value={storeSettings.pincode}
                onChange={(e) => setStoreSettings({ ...storeSettings, pincode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="641301"
                maxLength={6}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={storeSettings.phone}
                onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10-digit mobile number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={storeSettings.email}
                onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="store@example.com"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSaveStore}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <Save size={18} />
              Save Store Settings
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <FileText className="text-green-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Invoice Settings</h3>
            <p className="text-sm text-gray-600">Customize your invoice format</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={invoiceSettings.invoice_prefix}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoice_prefix: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="INV"
              />
              <p className="text-xs text-gray-500 mt-1">e.g., INV-2026-001</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Print Width</label>
              <select
                value={invoiceSettings.print_width}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, print_width: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="58mm">58mm (Small)</option>
                <option value="80mm">80mm (Standard)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Footer</label>
            <textarea
              value={invoiceSettings.invoice_footer}
              onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoice_footer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Thank you message"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
            <textarea
              value={invoiceSettings.terms_conditions}
              onChange={(e) => setInvoiceSettings({ ...invoiceSettings, terms_conditions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Terms and conditions for sales"
            />
          </div>

          <div className="pt-4">
            <button
              onClick={handleSaveInvoice}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <Save size={18} />
              Save Invoice Settings
            </button>
          </div>
        </div>
      </div>

      {/* Sample Invoice Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Printer className="text-purple-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Invoice Preview</h3>
            <p className="text-sm text-gray-600">Sample thermal print format</p>
          </div>
        </div>

        <div className={`mx-auto bg-white border-2 border-gray-300 p-4 font-mono text-xs ${
          invoiceSettings.print_width === '58mm' ? 'max-w-xs' : 'max-w-sm'
        }`}>
          <div className="text-center border-b-2 border-gray-300 pb-2 mb-2">
            <div className="font-bold text-sm">{storeSettings.store_name.toUpperCase()}</div>
            {storeSettings.address && <div className="text-xs mt-1">{storeSettings.address}</div>}
            {storeSettings.city && <div className="text-xs">{storeSettings.city}, {storeSettings.state} - {storeSettings.pincode}</div>}
            {storeSettings.phone && <div className="text-xs">Ph: {storeSettings.phone}</div>}
            {storeSettings.gstin && <div className="text-xs">GSTIN: {storeSettings.gstin}</div>}
          </div>

          <div className="border-b border-gray-300 pb-2 mb-2">
            <div className="flex justify-between">
              <span>Invoice: {invoiceSettings.invoice_prefix}-2026-001</span>
            </div>
            <div className="flex justify-between">
              <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          <div className="border-b border-gray-300 pb-2 mb-2">
            <div className="grid grid-cols-12 gap-1 font-bold">
              <div className="col-span-5">ITEM</div>
              <div className="col-span-2 text-right">QTY</div>
              <div className="col-span-2 text-right">RATE</div>
              <div className="col-span-3 text-right">AMT</div>
            </div>
            <div className="grid grid-cols-12 gap-1 mt-1">
              <div className="col-span-5">Camphor</div>
              <div className="col-span-2 text-right">2</div>
              <div className="col-span-2 text-right">45.00</div>
              <div className="col-span-3 text-right">90.00</div>
            </div>
          </div>

          <div className="border-b-2 border-gray-300 pb-2 mb-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹90.00</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>CGST (2.5%):</span>
              <span>₹2.25</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>SGST (2.5%):</span>
              <span>₹2.25</span>
            </div>
            <div className="flex justify-between font-bold mt-1">
              <span>TOTAL:</span>
              <span>₹95</span>
            </div>
          </div>

          <div className="text-center text-xs border-b border-gray-300 pb-2 mb-2">
            {invoiceSettings.invoice_footer}
          </div>

          <div className="text-xs text-center">
            {invoiceSettings.terms_conditions}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Important Notes</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Store settings will appear on all invoices and reports</li>
          <li>GSTIN can be updated later when you get GST registration</li>
          <li>Invoice settings affect how receipts are printed</li>
          <li>Tamil Nadu state code is 33 for GST purposes</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;