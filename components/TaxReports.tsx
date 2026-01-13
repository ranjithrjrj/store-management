// FILE PATH: components/TaxReports.tsx
// GST Tax Reports for compliance

'use client';
import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const TaxReports = () => {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [salesData, setSalesData] = useState<any[]>([]);
  const [purchaseData, setPurchaseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTaxData();
  }, [month]);

  async function loadTaxData() {
    try {
      setLoading(true);
      setError(null);

      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0];

      // Load sales
      const { data: sales } = await supabase
        .from('sales_invoices')
        .select(`
          invoice_number,
          invoice_date,
          customer_name,
          customer_gstin,
          customer_state_code,
          subtotal,
          cgst_amount,
          sgst_amount,
          igst_amount,
          total_amount
        `)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate)
        .order('invoice_date');

      // Load purchases
      const { data: purchases } = await supabase
        .from('purchase_records')
        .select(`
          record_number,
          invoice_number,
          invoice_date,
          vendor:vendors(name, gstin, state_code),
          subtotal,
          cgst_amount,
          sgst_amount,
          igst_amount,
          total_amount
        `)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate)
        .order('invoice_date');

      setSalesData(sales || []);
      setPurchaseData(purchases || []);
    } catch (err: any) {
      console.error('Error loading tax data:', err);
      setError(err.message || 'Failed to load tax data');
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals
  const salesTotals = {
    b2b: salesData.filter(s => s.customer_gstin).length,
    b2c: salesData.filter(s => !s.customer_gstin).length,
    intrastate: salesData.filter(s => s.customer_state_code === '33').length,
    interstate: salesData.filter(s => s.customer_state_code && s.customer_state_code !== '33').length,
    taxable: salesData.reduce((sum, s) => sum + s.subtotal, 0),
    cgst: salesData.reduce((sum, s) => sum + (s.cgst_amount || 0), 0),
    sgst: salesData.reduce((sum, s) => sum + (s.sgst_amount || 0), 0),
    igst: salesData.reduce((sum, s) => sum + (s.igst_amount || 0), 0),
    total: salesData.reduce((sum, s) => sum + s.total_amount, 0)
  };

  const purchaseTotals = {
    registered: purchaseData.filter(p => p.vendor?.gstin).length,
    unregistered: purchaseData.filter(p => !p.vendor?.gstin).length,
    intrastate: purchaseData.filter(p => p.vendor?.state_code === '33').length,
    interstate: purchaseData.filter(p => p.vendor?.state_code && p.vendor?.state_code !== '33').length,
    taxable: purchaseData.reduce((sum, p) => sum + p.subtotal, 0),
    cgst: purchaseData.reduce((sum, p) => sum + (p.cgst_amount || 0), 0),
    sgst: purchaseData.reduce((sum, p) => sum + (p.sgst_amount || 0), 0),
    igst: purchaseData.reduce((sum, p) => sum + (p.igst_amount || 0), 0),
    total: purchaseData.reduce((sum, p) => sum + p.total_amount, 0)
  };

  const netGST = {
    cgst: salesTotals.cgst - purchaseTotals.cgst,
    sgst: salesTotals.sgst - purchaseTotals.sgst,
    igst: salesTotals.igst - purchaseTotals.igst
  };

  const downloadCSV = (data: any[], filename: string, type: 'sales' | 'purchase') => {
    if (type === 'sales') {
      const headers = ['Date', 'Invoice #', 'Customer', 'GSTIN', 'State', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total'];
      const rows = data.map(item => [
        item.invoice_date,
        item.invoice_number,
        item.customer_name || 'Walk-in',
        item.customer_gstin || '-',
        item.customer_state_code || '33',
        item.subtotal,
        item.cgst_amount || 0,
        item.sgst_amount || 0,
        item.igst_amount || 0,
        item.total_amount
      ]);
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } else {
      const headers = ['Date', 'Record #', 'Invoice #', 'Vendor', 'GSTIN', 'State', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total'];
      const rows = data.map(item => [
        item.invoice_date,
        item.record_number,
        item.invoice_number || '-',
        item.vendor?.name || '-',
        item.vendor?.gstin || '-',
        item.vendor?.state_code || '33',
        item.subtotal,
        item.cgst_amount || 0,
        item.sgst_amount || 0,
        item.igst_amount || 0,
        item.total_amount
      ]);
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    }
  };

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GST Tax Reports</h2>
          <p className="text-gray-600 text-sm mt-1">GST returns and compliance reports</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-bold text-red-800 mb-2">Failed to Load Tax Data</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadTaxData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">GST Tax Reports</h2>
        <p className="text-gray-600 text-sm mt-1">GST returns and compliance reports (GSTR-1, GSTR-3B)</p>
      </div>

      {/* Month Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Calendar size={20} className="text-gray-400" />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Select Month:</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading tax reports...</p>
        </div>
      ) : (
        <>
          {/* GSTR-1 Summary (Outward Supplies) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">GSTR-1: Outward Supplies (Sales)</h3>
              <button
                onClick={() => downloadCSV(salesData, `GSTR1_${month}.csv`, 'sales')}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
              >
                <Download size={16} />
                Download CSV
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">B2B Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{salesTotals.b2b}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">B2C Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{salesTotals.b2c}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Intrastate</p>
                <p className="text-2xl font-bold text-gray-900">{salesTotals.intrastate}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Interstate</p>
                <p className="text-2xl font-bold text-gray-900">{salesTotals.interstate}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Taxable Value</span>
                <span className="text-sm font-semibold">₹{salesTotals.taxable.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-700">CGST Collected</span>
                <span className="text-sm font-semibold text-green-600">₹{salesTotals.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-700">SGST Collected</span>
                <span className="text-sm font-semibold text-green-600">₹{salesTotals.sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-700">IGST Collected</span>
                <span className="text-sm font-semibold text-green-600">₹{salesTotals.igst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 bg-green-50 rounded-lg px-3 mt-2">
                <span className="font-bold text-gray-900">Total Sales</span>
                <span className="font-bold text-green-600">₹{salesTotals.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* GSTR-2 Summary (Inward Supplies) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">GSTR-2: Inward Supplies (Purchases)</h3>
              <button
                onClick={() => downloadCSV(purchaseData, `GSTR2_${month}.csv`, 'purchase')}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
              >
                <Download size={16} />
                Download CSV
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Registered Vendors</p>
                <p className="text-2xl font-bold text-gray-900">{purchaseTotals.registered}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Unregistered</p>
                <p className="text-2xl font-bold text-gray-900">{purchaseTotals.unregistered}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Intrastate</p>
                <p className="text-2xl font-bold text-gray-900">{purchaseTotals.intrastate}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Interstate</p>
                <p className="text-2xl font-bold text-gray-900">{purchaseTotals.interstate}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Taxable Value</span>
                <span className="text-sm font-semibold">₹{purchaseTotals.taxable.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-700">CGST Paid (Input Credit)</span>
                <span className="text-sm font-semibold text-orange-600">₹{purchaseTotals.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-700">SGST Paid (Input Credit)</span>
                <span className="text-sm font-semibold text-orange-600">₹{purchaseTotals.sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-700">IGST Paid (Input Credit)</span>
                <span className="text-sm font-semibold text-orange-600">₹{purchaseTotals.igst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 bg-orange-50 rounded-lg px-3 mt-2">
                <span className="font-bold text-gray-900">Total Purchases</span>
                <span className="font-bold text-orange-600">₹{purchaseTotals.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* GSTR-3B Summary (Net Liability) */}
          <div className="bg-white rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">GSTR-3B: Net GST Liability</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-sm font-medium text-gray-700">Net CGST (Output - Input)</span>
                <span className={`text-sm font-bold ${netGST.cgst >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{Math.abs(netGST.cgst).toFixed(2)} {netGST.cgst >= 0 ? '(Payable)' : '(Refund)'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm font-medium text-gray-700">Net SGST (Output - Input)</span>
                <span className={`text-sm font-bold ${netGST.sgst >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{Math.abs(netGST.sgst).toFixed(2)} {netGST.sgst >= 0 ? '(Payable)' : '(Refund)'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm font-medium text-gray-700">Net IGST (Output - Input)</span>
                <span className={`text-sm font-bold ${netGST.igst >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{Math.abs(netGST.igst).toFixed(2)} {netGST.igst >= 0 ? '(Payable)' : '(Refund)'}
                </span>
              </div>
              <div className="flex justify-between py-4 bg-blue-50 rounded-lg px-4 mt-4 border-t-2 border-blue-200">
                <span className="font-bold text-gray-900 text-lg">Total GST Liability</span>
                <span className={`font-bold text-lg ${(netGST.cgst + netGST.sgst + netGST.igst) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{Math.abs(netGST.cgst + netGST.sgst + netGST.igst).toFixed(2)}
                  <span className="text-sm ml-2">
                    {(netGST.cgst + netGST.sgst + netGST.igst) >= 0 ? '(Payable)' : '(Refund)'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>📌 Important:</strong> These reports are generated from your recorded transactions. 
              Please verify all data before filing GST returns. Consult with a tax professional for accurate filing.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default TaxReports;