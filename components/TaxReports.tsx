// FILE PATH: components/TaxReports.tsx

import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, Printer } from 'lucide-react';

type ReportType = 'gstr1' | 'gstr3b' | 'hsn-summary' | 'sales-register' | 'purchase-register' | 'tax-liability';

const TaxReports = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('gstr1');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Mock data for GSTR-1
  const mockGSTR1Data = {
    b2b: [
      {
        gstin: '33XXXXX1234X1Z1',
        customer_name: 'Lakshmi Store',
        invoice_number: 'INV-202601-001',
        invoice_date: '2026-01-10',
        invoice_value: 11700,
        place_of_supply: 'Tamil Nadu',
        taxable_value: 10000,
        cgst: 900,
        sgst: 900,
        igst: 0
      },
      {
        gstin: '33XXXXX5678X1Z5',
        customer_name: 'Devi Traders',
        invoice_number: 'INV-202601-002',
        invoice_date: '2026-01-09',
        invoice_value: 5850,
        place_of_supply: 'Tamil Nadu',
        taxable_value: 5000,
        cgst: 450,
        sgst: 450,
        igst: 0
      }
    ],
    b2c: {
      total_invoices: 45,
      total_value: 125430,
      taxable_value: 107300,
      cgst: 9065,
      sgst: 9065,
      igst: 0
    }
  };

  // Mock data for GSTR-3B
  const mockGSTR3BData = {
    outward_supplies: {
      taxable_value: 145230,
      cgst: 12300,
      sgst: 12300,
      igst: 0,
      cess: 0
    },
    inward_supplies: {
      taxable_value: 98450,
      cgst: 8350,
      sgst: 8350,
      igst: 0,
      cess: 0
    },
    net_liability: {
      cgst: 3950,
      sgst: 3950,
      igst: 0,
      cess: 0
    }
  };

  // Mock HSN Summary
  const mockHSNData = [
    {
      hsn: '3301',
      description: 'Essential oils',
      uqc: 'BOX',
      total_quantity: 150,
      total_value: 45000,
      taxable_value: 45000,
      cgst_rate: 2.5,
      sgst_rate: 2.5,
      igst_rate: 0,
      cgst_amount: 1125,
      sgst_amount: 1125,
      igst_amount: 0
    },
    {
      hsn: '3307',
      description: 'Perfumes and toilet preparations',
      uqc: 'PKT',
      total_quantity: 320,
      total_value: 38400,
      taxable_value: 38400,
      cgst_rate: 6,
      sgst_rate: 6,
      igst_rate: 0,
      cgst_amount: 2304,
      sgst_amount: 2304,
      igst_amount: 0
    },
    {
      hsn: '8306',
      description: 'Bells and gongs',
      uqc: 'PCS',
      total_quantity: 45,
      total_value: 56250,
      taxable_value: 56250,
      cgst_rate: 9,
      sgst_rate: 9,
      igst_rate: 0,
      cgst_amount: 5062.5,
      sgst_amount: 5062.5,
      igst_amount: 0
    }
  ];

  // Mock Sales Register
  const mockSalesRegister = [
    {
      date: '2026-01-10',
      invoice_no: 'INV-202601-001',
      customer_name: 'Lakshmi Store',
      gstin: '33XXXXX1234X1Z1',
      place_of_supply: 'Tamil Nadu',
      taxable_value: 10000,
      cgst: 900,
      sgst: 900,
      igst: 0,
      total: 11700
    },
    {
      date: '2026-01-10',
      invoice_no: 'INV-202601-002',
      customer_name: 'Ram Prasad',
      gstin: '',
      place_of_supply: 'Tamil Nadu',
      taxable_value: 800,
      cgst: 45,
      sgst: 45,
      igst: 0,
      total: 890
    },
    {
      date: '2026-01-09',
      invoice_no: 'INV-202601-003',
      customer_name: 'Devi Traders',
      gstin: '33XXXXX5678X1Z5',
      place_of_supply: 'Tamil Nadu',
      taxable_value: 5000,
      cgst: 450,
      sgst: 450,
      igst: 0,
      total: 5850
    }
  ];

  // Mock Purchase Register
  const mockPurchaseRegister = [
    {
      date: '2026-01-08',
      invoice_no: 'VNDR-001',
      vendor_name: 'Sri Krishna Suppliers',
      gstin: '33XXXXX1234X1Z5',
      place_of_supply: 'Tamil Nadu',
      taxable_value: 15000,
      cgst: 750,
      sgst: 750,
      igst: 0,
      total: 16500
    },
    {
      date: '2026-01-05',
      invoice_no: 'VNDR-002',
      vendor_name: 'Divine Traders',
      gstin: '33XXXXX5678X1Z9',
      place_of_supply: 'Tamil Nadu',
      taxable_value: 28000,
      cgst: 1680,
      sgst: 1680,
      igst: 0,
      total: 31360
    }
  ];

  const handleExport = () => {
    alert(`Exporting ${selectedReport.toUpperCase()} report...`);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderGSTR1 = () => (
    <div className="space-y-6">
      {/* B2B Supplies */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">4. B2B Invoices - Supplies to Registered Persons</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">GSTIN</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Customer Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Invoice No.</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Invoice Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Invoice Value</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Place of Supply</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Taxable Value</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">CGST</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SGST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockGSTR1Data.b2b.map((inv, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{inv.gstin}</td>
                  <td className="px-3 py-2">{inv.customer_name}</td>
                  <td className="px-3 py-2">{inv.invoice_number}</td>
                  <td className="px-3 py-2">{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-3 py-2 font-medium">₹{inv.invoice_value.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2">{inv.place_of_supply}</td>
                  <td className="px-3 py-2">₹{inv.taxable_value.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2">₹{inv.cgst.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2">₹{inv.sgst.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              <tr className="bg-blue-50 font-semibold">
                <td colSpan={4} className="px-3 py-2">Total B2B</td>
                <td className="px-3 py-2">₹{mockGSTR1Data.b2b.reduce((s, i) => s + i.invoice_value, 0).toLocaleString('en-IN')}</td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2">₹{mockGSTR1Data.b2b.reduce((s, i) => s + i.taxable_value, 0).toLocaleString('en-IN')}</td>
                <td className="px-3 py-2">₹{mockGSTR1Data.b2b.reduce((s, i) => s + i.cgst, 0).toLocaleString('en-IN')}</td>
                <td className="px-3 py-2">₹{mockGSTR1Data.b2b.reduce((s, i) => s + i.sgst, 0).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* B2C Supplies */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">7. B2C (Small) - Supplies to Unregistered Persons</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Invoices</p>
            <p className="text-xl font-bold text-gray-900">{mockGSTR1Data.b2c.total_invoices}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-xl font-bold text-gray-900">₹{mockGSTR1Data.b2c.total_value.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Taxable Value</p>
            <p className="text-xl font-bold text-gray-900">₹{mockGSTR1Data.b2c.taxable_value.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">CGST</p>
            <p className="text-xl font-bold text-gray-900">₹{mockGSTR1Data.b2c.cgst.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">SGST</p>
            <p className="text-xl font-bold text-gray-900">₹{mockGSTR1Data.b2c.sgst.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGSTR3B = () => (
    <div className="space-y-6">
      {/* Table 3.1 - Outward Supplies */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">3.1 - Details of Outward Supplies</h3>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Nature of Supplies</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Taxable Value</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">CGST</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">SGST</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">IGST</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Cess</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-3 text-sm">Outward taxable supplies (other than zero rated, nil rated and exempted)</td>
              <td className="px-4 py-3 text-sm text-right font-medium">₹{mockGSTR3BData.outward_supplies.taxable_value.toLocaleString('en-IN')}</td>
              <td className="px-4 py-3 text-sm text-right">₹{mockGSTR3BData.outward_supplies.cgst.toLocaleString('en-IN')}</td>
              <td className="px-4 py-3 text-sm text-right">₹{mockGSTR3BData.outward_supplies.sgst.toLocaleString('en-IN')}</td>
              <td className="px-4 py-3 text-sm text-right">₹{mockGSTR3BData.outward_supplies.igst.toLocaleString('en-IN')}</td>
              <td className="px-4 py-3 text-sm text-right">₹{mockGSTR3BData.outward_supplies.cess.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 4 - Inward Supplies (ITC) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">4. Eligible ITC - Inward Supplies</h3>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Details</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Taxable Value</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">CGST</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">SGST</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">IGST</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Cess</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-3 text-sm">Inputs</td>
              <td className="px-4 py-3 text-sm text-right font-medium">₹{mockGSTR3BData.inward_supplies.taxable_value.toLocaleString('en-IN')}</td>
              <td className="px-4 py-3 text-sm text-right">₹{mockGSTR3BData.inward_supplies.cgst.toLocaleString('en-IN')}</td>
              <td className="px-4 py-3 text-sm text-right">₹{mockGSTR3BData.inward_supplies.sgst.toLocaleString('en-IN')}</td>
              <td className="px-4 py-3 text-sm text-right">₹{mockGSTR3BData.inward_supplies.igst.toLocaleString('en-IN')}</td>
              <td className="px-4 py-3 text-sm text-right">₹{mockGSTR3BData.inward_supplies.cess.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 6.1 - Net Liability */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">6.1 - Payment of Tax (Net Liability)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">CGST Payable</p>
            <p className="text-2xl font-bold text-green-600">₹{mockGSTR3BData.net_liability.cgst.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">SGST Payable</p>
            <p className="text-2xl font-bold text-green-600">₹{mockGSTR3BData.net_liability.sgst.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">IGST Payable</p>
            <p className="text-2xl font-bold text-green-600">₹{mockGSTR3BData.net_liability.igst.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Tax Payable</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{(mockGSTR3BData.net_liability.cgst + mockGSTR3BData.net_liability.sgst + mockGSTR3BData.net_liability.igst).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHSNSummary = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="font-semibold text-gray-900">HSN-wise Summary of Outward Supplies (Table 12)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">HSN Code</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Description</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">UQC</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total Quantity</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total Value</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Taxable Value</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">CGST Rate</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">CGST Amount</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">SGST Rate</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">SGST Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockHSNData.map((hsn, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-mono font-medium">{hsn.hsn}</td>
                <td className="px-3 py-2">{hsn.description}</td>
                <td className="px-3 py-2">{hsn.uqc}</td>
                <td className="px-3 py-2 text-right">{hsn.total_quantity}</td>
                <td className="px-3 py-2 text-right">₹{hsn.total_value.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-right">₹{hsn.taxable_value.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-right">{hsn.cgst_rate}%</td>
                <td className="px-3 py-2 text-right">₹{hsn.cgst_amount.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-right">{hsn.sgst_rate}%</td>
                <td className="px-3 py-2 text-right">₹{hsn.sgst_amount.toLocaleString('en-IN')}</td>
              </tr>
            ))}
            <tr className="bg-blue-50 font-semibold">
              <td colSpan={4} className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right">₹{mockHSNData.reduce((s, h) => s + h.total_value, 0).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right">₹{mockHSNData.reduce((s, h) => s + h.taxable_value, 0).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2"></td>
              <td className="px-3 py-2 text-right">₹{mockHSNData.reduce((s, h) => s + h.cgst_amount, 0).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2"></td>
              <td className="px-3 py-2 text-right">₹{mockHSNData.reduce((s, h) => s + h.sgst_amount, 0).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSalesRegister = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="font-semibold text-gray-900">Sales Register (Tax Invoice Details)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Invoice No.</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Customer Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">GSTIN</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Place of Supply</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Taxable Value</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">CGST</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">SGST</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">IGST</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockSalesRegister.map((sale, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-3 py-2">{new Date(sale.date).toLocaleDateString('en-IN')}</td>
                <td className="px-3 py-2 font-medium">{sale.invoice_no}</td>
                <td className="px-3 py-2">{sale.customer_name}</td>
                <td className="px-3 py-2 font-mono text-xs">{sale.gstin || 'N/A'}</td>
                <td className="px-3 py-2">{sale.place_of_supply}</td>
                <td className="px-3 py-2 text-right">₹{sale.taxable_value.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-right">₹{sale.cgst.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-right">₹{sale.sgst.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-right">₹{sale.igst.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-right font-medium">₹{sale.total.toLocaleString('en-IN')}</td>
              </tr>
            ))}
            <tr className="bg-blue-50 font-semibold">
              <td colSpan={5} className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right">₹{mockSalesRegister.reduce((s, i) => s + i.taxable_value, 0).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right">₹{mockSalesRegister.reduce((s, i) => s + i.cgst, 0).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right">₹{mockSalesRegister.reduce((s, i) => s + i.sgst, 0).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right">₹{mockSalesRegister.reduce((s, i) => s + i.igst, 0).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right">₹{mockSalesRegister.reduce((s, i) => s + i.total, 0).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPurchaseRegister = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="font-semibold text-gray-900">Purchase Register (Input Tax Credit Details)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Invoice No.</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Vendor Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">GSTIN</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Place of Supply</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Taxable Value</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">CGST (ITC)</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">SGST (ITC)</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">IGST (ITC)</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockPurchaseRegister.map((purchase, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-3 py-2">{new Date(purchase.date).toLocaleDateString('en-IN')}</td>
                <td className="px-3 py-2 font-medium">{purchase.invoice_no}</td>
                <td className="px-3 py-2">{purchase.vendor_name}</td>
                <td className="px-3 py-2 font-mono text-xs">{purchase.gstin}</td>
                <td className="px-3 py-2">{purchase.place_of_supply}</td>
                <td className="px-3 py-2 text-right">₹{purchase.taxable_value.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-right text-green-600">₹{purchase.cgst.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-right text-green-600">₹{purchase.sgst.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-right text-green-600">₹{purchase.igst.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-right font-medium">₹{purchase.total.toLocaleString('en-IN')}</td>
              </tr>
            ))}
            <tr className="bg-green-50 font-semibold">
              <td colSpan={5} className="px-3 py-2">Total ITC Available</td>
              <td className="px-3 py-2 text-right">₹{mockPurchaseRegister.reduce((s, i) => s + i.taxable_value, 0).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right text-green-700">₹{mockPurchaseRegister.reduce((s, i) => s + i.cgst, 0).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right text-green-700">₹{mockPurchaseRegister.reduce((s, i) => s + i.sgst, 0).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right text-green-700">₹{mockPurchaseRegister.reduce((s, i) => s + i.igst, 0).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right">₹{mockPurchaseRegister.reduce((s, i) => s + i.total, 0).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTaxLiability = () => (
    <div className="space-y-6">
      {/* Tax Liability Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Tax Liability Ledger</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Output Tax (Sales)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sales (Taxable):</span>
                <span className="font-medium">₹145,230</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CGST Collected:</span>
                <span className="font-medium text-red-600">₹12,300</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SGST Collected:</span>
                <span className="font-medium text-red-600">₹12,300</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IGST Collected:</span>
                <span className="font-medium text-red-600">₹0</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-semibold">
                <span>Total Output Tax:</span>
                <span className="text-red-600">₹24,600</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Input Tax Credit (Purchases)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Purchases (Taxable):</span>
                <span className="font-medium">₹98,450</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CGST Paid:</span>
                <span className="font-medium text-green-600">₹8,350</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SGST Paid:</span>
                <span className="font-medium text-green-600">₹8,350</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IGST Paid:</span>
                <span className="font-medium text-green-600">₹0</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-semibold">
                <span>Total Input Tax:</span>
                <span className="text-green-600">₹16,700</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Net Tax Liability */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Net Tax Payable to Government</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">CGST Payable</p>
            <p className="text-2xl font-bold text-blue-600">₹3,950</p>
            <p className="text-xs text-gray-500 mt-1">₹12,300 - ₹8,350</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">SGST Payable</p>
            <p className="text-2xl font-bold text-blue-600">₹3,950</p>
            <p className="text-xs text-gray-500 mt-1">₹12,300 - ₹8,350</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Tax Payable</p>
            <p className="text-3xl font-bold text-blue-600">₹7,900</p>
            <p className="text-xs text-gray-500 mt-1">Monthly Liability</p>
          </div>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Payment Instructions for CA</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Pay ₹3,950 as CGST to Central Government</li>
          <li>• Pay ₹3,950 as SGST to State Government (Tamil Nadu)</li>
          <li>• Due Date: 20th of next month</li>
          <li>• File GSTR-3B with payment challan details</li>
        </ul>
      </div>
    </div>
  );

  const reportTypes = [
    { id: 'gstr1', label: 'GSTR-1', description: 'Outward Supplies' },
    { id: 'gstr3b', label: 'GSTR-3B', description: 'Monthly Return' },
    { id: 'hsn-summary', label: 'HSN Summary', description: 'Table 12' },
    { id: 'sales-register', label: 'Sales Register', description: 'Tax Invoice Details' },
    { id: 'purchase-register', label: 'Purchase Register', description: 'ITC Details' },
    { id: 'tax-liability', label: 'Tax Liability', description: 'Net Payable' }
  ];

  const renderReport = () => {
    switch (selectedReport) {
      case 'gstr1': return renderGSTR1();
      case 'gstr3b': return renderGSTR3B();
      case 'hsn-summary': return renderHSNSummary();
      case 'sales-register': return renderSalesRegister();
      case 'purchase-register': return renderPurchaseRegister();
      case 'tax-liability': return renderTaxLiability();
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tax Reports for CA/Auditor</h2>
        <p className="text-gray-600 text-sm mt-1">GST Returns & Tax Compliance Reports</p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id as ReportType)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedReport === report.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FileText size={20} className={selectedReport === report.id ? 'text-blue-600' : 'text-gray-400'} />
            <p className={`text-sm font-medium mt-2 ${
              selectedReport === report.id ? 'text-blue-600' : 'text-gray-900'
            }`}>
              {report.label}
            </p>
            <p className="text-xs text-gray-500 mt-1">{report.description}</p>
          </button>
        ))}
      </div>

      {/* Date Range and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
            >
              <Download size={18} />
              Export Excel
            </button>
            <button
              onClick={handlePrint}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-medium flex items-center gap-2"
            >
              <Printer size={18} />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Store Details Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900">Thirukumaran Angadi</h3>
          <p className="text-sm text-gray-600">Mettupalayam, Tamil Nadu - 641301</p>
          <p className="text-sm text-gray-600">GSTIN: 33XXXXX1234X1ZX (Update in Settings)</p>
          <p className="text-sm text-gray-600 mt-2">
            Period: {new Date(dateRange.from).toLocaleDateString('en-IN')} to {new Date(dateRange.to).toLocaleDateString('en-IN')}
          </p>
        </div>
      </div>

      {/* Report Content */}
      <div>{renderReport()}</div>

      {/* Footer Notes */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Important Notes for CA:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• All amounts are in Indian Rupees (₹)</li>
          <li>• Reports generated from system data - verify with actual invoices</li>
          <li>• GSTIN validation required before filing returns</li>
          <li>• Keep backup of all tax invoices for 6 years</li>
          <li>• File GSTR-1 by 11th and GSTR-3B by 20th of next month</li>
        </ul>
      </div>
    </div>
  );
};

export default TaxReports;