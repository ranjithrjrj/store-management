// FILE PATH: components/TaxReports.tsx
// Beautiful Modern GST Tax Reports - Teal & Gold Theme with Enhanced Analytics

'use client';
import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Calendar, TrendingUp, TrendingDown, 
  DollarSign, Users, CheckCircle, AlertTriangle, Package
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Badge, LoadingSpinner, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

const TaxReports = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [salesData, setSalesData] = useState<any[]>([]);
  const [purchaseData, setPurchaseData] = useState<any[]>([]);
  const [returnsData, setReturnsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaxData();
  }, [month]);

  async function loadTaxData() {
    try {
      setLoading(true);

      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      const endDate = `${year}-${monthNum}-${lastDay}`;

      // Load sales invoices
      const { data: sales } = await supabase
        .from('sales_invoices')
        .select(`
          invoice_number,
          invoice_date,
          customer_name,
          customer_gstin,
          subtotal,
          cgst_amount,
          sgst_amount,
          igst_amount,
          total_amount
        `)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate)
        .order('invoice_date');

      // Load purchase invoices (updated table name)
      const { data: purchases } = await supabase
        .from('purchase_invoices')
        .select(`
          invoice_number,
          invoice_date,
          vendor_name,
          vendor_gstin,
          subtotal,
          cgst_amount,
          sgst_amount,
          igst_amount,
          total_amount
        `)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate)
        .order('invoice_date');

      // Load returns (for credit notes)
      const { data: returns } = await supabase
        .from('returns')
        .select(`
          return_number,
          return_date,
          customer_name,
          subtotal,
          cgst_amount,
          sgst_amount,
          igst_amount,
          total_amount
        `)
        .gte('return_date', startDate)
        .lte('return_date', endDate)
        .order('return_date');

      setSalesData(sales || []);
      setPurchaseData(purchases || []);
      setReturnsData(returns || []);
    } catch (err: any) {
      console.error('Error loading tax data:', err);
      toast.error('Failed to load', 'Could not load tax reports.');
    } finally {
      setLoading(false);
    }
  }

  // Calculate sales totals
  const salesTotals = {
    b2b: salesData.filter(s => s.customer_gstin).length,
    b2c: salesData.filter(s => !s.customer_gstin).length,
    taxable: salesData.reduce((sum, s) => sum + (s.subtotal || 0), 0),
    cgst: salesData.reduce((sum, s) => sum + (s.cgst_amount || 0), 0),
    sgst: salesData.reduce((sum, s) => sum + (s.sgst_amount || 0), 0),
    igst: salesData.reduce((sum, s) => sum + (s.igst_amount || 0), 0),
    total: salesData.reduce((sum, s) => sum + (s.total_amount || 0), 0)
  };

  // Calculate purchase totals
  const purchaseTotals = {
    count: purchaseData.length,
    taxable: purchaseData.reduce((sum, p) => sum + (p.subtotal || 0), 0),
    cgst: purchaseData.reduce((sum, p) => sum + (p.cgst_amount || 0), 0),
    sgst: purchaseData.reduce((sum, p) => sum + (p.sgst_amount || 0), 0),
    igst: purchaseData.reduce((sum, p) => sum + (p.igst_amount || 0), 0),
    total: purchaseData.reduce((sum, p) => sum + (p.total_amount || 0), 0)
  };

  // Calculate returns totals (Credit Notes)
  const returnsTotals = {
    count: returnsData.length,
    taxable: returnsData.reduce((sum, r) => sum + (r.subtotal || 0), 0),
    cgst: returnsData.reduce((sum, r) => sum + (r.cgst_amount || 0), 0),
    sgst: returnsData.reduce((sum, r) => sum + (r.sgst_amount || 0), 0),
    igst: returnsData.reduce((sum, r) => sum + (r.igst_amount || 0), 0),
    total: returnsData.reduce((sum, r) => sum + (r.total_amount || 0), 0)
  };

  // Calculate GST totals
  const totalSalesGST = salesTotals.cgst + salesTotals.sgst + salesTotals.igst;
  const totalPurchaseGST = purchaseTotals.cgst + purchaseTotals.sgst + purchaseTotals.igst;
  const totalReturnsGST = returnsTotals.cgst + returnsTotals.sgst + returnsTotals.igst;
  
  // Net GST Liability = Output GST - Input GST - Returns GST (Credit)
  const netGSTLiability = totalSalesGST - totalPurchaseGST - totalReturnsGST;

  // Calculate GST by rate slabs
  const calculateGSTByRate = (data: any[]) => {
    const rates: { [key: number]: { taxable: number; gst: number; count: number } } = {};
    
    data.forEach(item => {
      const taxable = item.subtotal || 0;
      const gst = (item.cgst_amount || 0) + (item.sgst_amount || 0) + (item.igst_amount || 0);
      const rate = taxable > 0 ? Math.round((gst / taxable) * 100) : 0;
      
      if (!rates[rate]) rates[rate] = { taxable: 0, gst: 0, count: 0 };
      rates[rate].taxable += taxable;
      rates[rate].gst += gst;
      rates[rate].count += 1;
    });
    
    return Object.entries(rates)
      .map(([rate, data]) => ({ rate: Number(rate), ...data }))
      .sort((a, b) => b.taxable - a.taxable);
  };

  const salesByRate = calculateGSTByRate(salesData);
  const purchasesByRate = calculateGSTByRate(purchaseData);

  const downloadGSTR1 = () => {
    if (salesData.length === 0) {
      toast.warning('No data', 'No sales data available for this period.');
      return;
    }

    const csv = [
      ['GSTR-1 Sales Register (Outward Supplies)', '', '', '', '', '', '', ''],
      [`Tax Period: ${month}`, '', '', '', '', '', '', ''],
      [`Generated: ${new Date().toLocaleString('en-IN')}`, '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['Invoice No', 'Date', 'Customer', 'GSTIN', 'Type', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total'],
      ...salesData.map(s => [
        s.invoice_number,
        s.invoice_date,
        s.customer_name || 'Walk-in Customer',
        s.customer_gstin || 'N/A',
        s.customer_gstin ? 'B2B' : 'B2C',
        s.subtotal.toFixed(2),
        (s.cgst_amount || 0).toFixed(2),
        (s.sgst_amount || 0).toFixed(2),
        (s.igst_amount || 0).toFixed(2),
        s.total_amount.toFixed(2)
      ]),
      ['', '', '', '', '', '', '', '', ''],
      ['', '', '', '', 'TOTAL', salesTotals.taxable.toFixed(2), salesTotals.cgst.toFixed(2), salesTotals.sgst.toFixed(2), salesTotals.igst.toFixed(2), salesTotals.total.toFixed(2)],
      ['', '', '', '', '', '', '', '', ''],
      ['Summary:', '', '', '', '', '', '', '', ''],
      ['B2B Invoices:', salesTotals.b2b.toString(), '', '', '', '', '', '', ''],
      ['B2C Invoices:', salesTotals.b2c.toString(), '', '', '', '', '', '', ''],
      ['Total GST Collected:', '', '', '', '', totalSalesGST.toFixed(2), '', '', '']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_${month}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Downloaded!', 'GSTR-1 report has been downloaded.');
  };

  const downloadGSTR2 = () => {
    if (purchaseData.length === 0) {
      toast.warning('No data', 'No purchase data available for this period.');
      return;
    }

    const csv = [
      ['GSTR-2 Purchase Register (Inward Supplies)', '', '', '', '', '', '', ''],
      [`Tax Period: ${month}`, '', '', '', '', '', '', ''],
      [`Generated: ${new Date().toLocaleString('en-IN')}`, '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['Invoice No', 'Date', 'Vendor', 'GSTIN', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total'],
      ...purchaseData.map(p => [
        p.invoice_number,
        p.invoice_date,
        p.vendor_name || 'N/A',
        p.vendor_gstin || 'N/A',
        p.subtotal.toFixed(2),
        (p.cgst_amount || 0).toFixed(2),
        (p.sgst_amount || 0).toFixed(2),
        (p.igst_amount || 0).toFixed(2),
        p.total_amount.toFixed(2)
      ]),
      ['', '', '', '', '', '', '', ''],
      ['', '', '', 'TOTAL', purchaseTotals.taxable.toFixed(2), purchaseTotals.cgst.toFixed(2), purchaseTotals.sgst.toFixed(2), purchaseTotals.igst.toFixed(2), purchaseTotals.total.toFixed(2)],
      ['', '', '', '', '', '', '', ''],
      ['Summary:', '', '', '', '', '', '', ''],
      ['Total Purchase Records:', purchaseTotals.count.toString(), '', '', '', '', '', ''],
      ['Total Input Tax Credit (ITC):', '', '', '', totalPurchaseGST.toFixed(2), '', '', '']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR2_${month}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Downloaded!', 'GSTR-2 report has been downloaded.');
  };

  const downloadGSTR3B = () => {
    const csv = [
      ['GSTR-3B Summary Return', '', '', ''],
      [`Tax Period: ${month}`, '', '', ''],
      [`Generated: ${new Date().toLocaleString('en-IN')}`, '', '', ''],
      ['', '', '', ''],
      ['Section', 'Description', 'Amount', ''],
      ['', '', '', ''],
      ['3.1 - Outward Supplies', '', '', ''],
      ['', 'Taxable Value', salesTotals.taxable.toFixed(2), ''],
      ['', 'Total Tax (CGST+SGST+IGST)', totalSalesGST.toFixed(2), ''],
      ['', '', '', ''],
      ['4 - Input Tax Credit', '', '', ''],
      ['', 'ITC Available (CGST+SGST+IGST)', totalPurchaseGST.toFixed(2), ''],
      ['', '', '', ''],
      ['5 - Net Tax Payable', '', '', ''],
      ['', 'Total Output Tax', totalSalesGST.toFixed(2), ''],
      ['', 'Less: ITC', '-' + totalPurchaseGST.toFixed(2), ''],
      ['', 'Less: Credit Notes', '-' + totalReturnsGST.toFixed(2), ''],
      ['', 'Net Tax Liability', netGSTLiability.toFixed(2), ''],
      ['', 'Status', netGSTLiability >= 0 ? 'PAYABLE' : 'REFUNDABLE', ''],
      ['', '', '', ''],
      ['Breakup:', '', '', ''],
      ['', 'CGST', (salesTotals.cgst - purchaseTotals.cgst - returnsTotals.cgst).toFixed(2), ''],
      ['', 'SGST', (salesTotals.sgst - purchaseTotals.sgst - returnsTotals.sgst).toFixed(2), ''],
      ['', 'IGST', (salesTotals.igst - purchaseTotals.igst - returnsTotals.igst).toFixed(2), '']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR3B_${month}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Downloaded!', 'GSTR-3B summary has been downloaded.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl mb-4">
            <LoadingSpinner size="lg" />
          </div>
          <p className="text-slate-700 font-medium">Loading GST reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md">
                <FileText className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">GST Tax Reports</h1>
                <p className="text-slate-600 mt-1">GST compliance & filing reports</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={downloadGSTR1} 
                variant="secondary" 
                size="md" 
                icon={<Download size={18} />}
                className="shadow-md"
              >
                GSTR-1
              </Button>
              <Button 
                onClick={downloadGSTR2} 
                variant="secondary" 
                size="md" 
                icon={<Download size={18} />}
                className="shadow-md"
              >
                GSTR-2
              </Button>
              <Button 
                onClick={downloadGSTR3B} 
                variant="primary" 
                size="md" 
                icon={<Download size={18} />}
                className="bg-gradient-to-r from-teal-600 to-teal-700 shadow-md"
              >
                GSTR-3B
              </Button>
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Calendar size={20} className="text-teal-600" />
              <span>Tax Period:</span>
            </div>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <div className="flex-1"></div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">Filing Deadline:</span> {new Date(month + '-20').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Summary Cards - 5 Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-md border border-green-100 p-4 hover:shadow-lg transition-all hover:scale-105">
            <div className="text-center">
              <div className="inline-flex p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl mb-2">
                <TrendingUp className="text-white" size={20} />
              </div>
              <p className="text-lg font-bold text-slate-900">₹{(totalSalesGST / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-600 mt-1">Output GST</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4 hover:shadow-lg transition-all hover:scale-105">
            <div className="text-center">
              <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-2">
                <TrendingDown className="text-white" size={20} />
              </div>
              <p className="text-lg font-bold text-slate-900">₹{(totalPurchaseGST / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-600 mt-1">Input ITC</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-orange-100 p-4 hover:shadow-lg transition-all hover:scale-105">
            <div className="text-center">
              <div className="inline-flex p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl mb-2">
                <Package className="text-white" size={20} />
              </div>
              <p className="text-lg font-bold text-slate-900">₹{(totalReturnsGST / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-600 mt-1">Credit Notes</p>
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all hover:scale-105 ${netGSTLiability >= 0 ? 'border-amber-100' : 'border-green-100'}`}>
            <div className="text-center">
              <div className={`inline-flex p-3 rounded-xl mb-2 ${netGSTLiability >= 0 ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-green-500 to-green-600'}`}>
                <DollarSign className="text-white" size={20} />
              </div>
              <p className={`text-lg font-bold ${netGSTLiability >= 0 ? 'text-amber-700' : 'text-green-700'}`}>₹{(Math.abs(netGSTLiability) / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-600 mt-1">Net Liability</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4 hover:shadow-lg transition-all hover:scale-105">
            <div className="text-center">
              <div className="inline-flex p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mb-2">
                <Users className="text-white" size={20} />
              </div>
              <p className="text-lg font-bold text-slate-900">{salesTotals.b2b}</p>
              <p className="text-xs text-slate-600 mt-1">B2B Sales</p>
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <p className="text-sm text-slate-600 mb-1">Sales Invoices</p>
            <p className="text-2xl font-bold text-slate-900">{salesData.length}</p>
            <p className="text-xs text-slate-500 mt-1">B2B: {salesTotals.b2b} • B2C: {salesTotals.b2c}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <p className="text-sm text-slate-600 mb-1">Purchase Invoices</p>
            <p className="text-2xl font-bold text-slate-900">{purchaseTotals.count}</p>
            <p className="text-xs text-slate-500 mt-1">For ITC claim</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <p className="text-sm text-slate-600 mb-1">Credit Notes</p>
            <p className="text-2xl font-bold text-slate-900">{returnsTotals.count}</p>
            <p className="text-xs text-slate-500 mt-1">Return transactions</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <p className="text-sm text-slate-600 mb-1">Compliance Status</p>
            <div className="flex items-center gap-2 mt-1">
              {netGSTLiability >= 0 ? (
                <>
                  <AlertTriangle className="text-amber-600" size={20} />
                  <span className="text-sm font-semibold text-amber-700">Payment Due</span>
                </>
              ) : (
                <>
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-sm font-semibold text-green-700">Credit Available</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Net GST Liability - Highlighted */}
        <div className={`rounded-xl shadow-lg overflow-hidden ${netGSTLiability >= 0 ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'}`}>
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Net GST Liability for {new Date(month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
                <p className="text-sm text-slate-700 mb-2">
                  Output GST (₹{totalSalesGST.toLocaleString('en-IN')}) - Input ITC (₹{totalPurchaseGST.toLocaleString('en-IN')}) - Credit Notes (₹{totalReturnsGST.toLocaleString('en-IN')})
                </p>
                <Badge variant={netGSTLiability >= 0 ? 'warning' : 'success'} size="md">
                  {netGSTLiability >= 0 ? '💰 PAYABLE TO GOVERNMENT' : '✅ CREDIT/REFUNDABLE'}
                </Badge>
              </div>
              <div className="text-right">
                <p className={`text-5xl font-bold ${netGSTLiability >= 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  ₹{Math.abs(netGSTLiability).toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-slate-600 mt-2">
                  {netGSTLiability >= 0 ? 'To be paid by 20th of next month' : 'Available as input tax credit'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed GST Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Output GST (Sales) */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Output GST (Sales)</h3>
              <p className="text-sm text-green-100">Tax collected on outward supplies</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Transaction Types */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2 uppercase">Transaction Types</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-3 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border border-teal-200">
                    <p className="text-2xl font-bold text-teal-700">{salesTotals.b2b}</p>
                    <p className="text-xs text-teal-600 mt-1">B2B Sales</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <p className="text-2xl font-bold text-blue-700">{salesTotals.b2c}</p>
                    <p className="text-xs text-blue-600 mt-1">B2C Sales</p>
                  </div>
                </div>
              </div>

              {/* GST Components */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Taxable Value</span>
                  <span className="font-semibold text-slate-900">₹{salesTotals.taxable.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">CGST</span>
                  <span className="font-semibold text-slate-900">₹{salesTotals.cgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">SGST</span>
                  <span className="font-semibold text-slate-900">₹{salesTotals.sgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">IGST</span>
                  <span className="font-semibold text-slate-900">₹{salesTotals.igst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-green-200">
                  <span className="font-bold text-slate-900">Total Output GST</span>
                  <span className="font-bold text-green-700">₹{totalSalesGST.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Input ITC (Purchases) */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Input Tax Credit (ITC)</h3>
              <p className="text-sm text-blue-100">Tax paid on inward supplies</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2 uppercase">Purchase Records</p>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <p className="text-3xl font-bold text-blue-700">{purchaseTotals.count}</p>
                  <p className="text-xs text-blue-600 mt-1">Total invoices eligible for ITC</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Taxable Value</span>
                  <span className="font-semibold text-slate-900">₹{purchaseTotals.taxable.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">CGST</span>
                  <span className="font-semibold text-slate-900">₹{purchaseTotals.cgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">SGST</span>
                  <span className="font-semibold text-slate-900">₹{purchaseTotals.sgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">IGST</span>
                  <span className="font-semibold text-slate-900">₹{purchaseTotals.igst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-blue-200">
                  <span className="font-bold text-slate-900">Total ITC Available</span>
                  <span className="font-bold text-blue-700">₹{totalPurchaseGST.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Notes (Returns) */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Credit Notes</h3>
              <p className="text-sm text-orange-100">GST reversal on returns</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2 uppercase">Return Transactions</p>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                  <p className="text-3xl font-bold text-orange-700">{returnsTotals.count}</p>
                  <p className="text-xs text-orange-600 mt-1">Credit notes issued</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Taxable Value</span>
                  <span className="font-semibold text-slate-900">₹{returnsTotals.taxable.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">CGST</span>
                  <span className="font-semibold text-slate-900">₹{returnsTotals.cgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">SGST</span>
                  <span className="font-semibold text-slate-900">₹{returnsTotals.sgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">IGST</span>
                  <span className="font-semibold text-slate-900">₹{returnsTotals.igst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-orange-200">
                  <span className="font-bold text-slate-900">Total GST Reversed</span>
                  <span className="font-bold text-orange-700">₹{totalReturnsGST.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GST by Rate Slabs */}
        {salesByRate.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Rate */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">Sales by GST Rate</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {salesByRate.map((rate, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-purple-900">{rate.rate}% GST</span>
                        <Badge variant="primary" size="sm">{rate.count} invoices</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Taxable:</span>
                          <span className="font-semibold">₹{rate.taxable.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">GST:</span>
                          <span className="font-semibold text-purple-700">₹{rate.gst.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Purchases by Rate */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">Purchases by GST Rate</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {purchasesByRate.map((rate, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-indigo-900">{rate.rate}% GST</span>
                        <Badge variant="primary" size="sm">{rate.count} invoices</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Taxable:</span>
                          <span className="font-semibold">₹{rate.taxable.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">ITC:</span>
                          <span className="font-semibold text-indigo-700">₹{rate.gst.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filing Instructions */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
            <h3 className="text-xl font-bold text-white">📋 GST Filing Instructions & Deadlines</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-green-900 mb-2">GSTR-1 (Sales)</h4>
                <p className="text-sm text-green-800 mb-2">Report of outward supplies</p>
                <p className="text-xs text-green-700">📅 Due: 11th of next month</p>
                <p className="text-xs text-green-600 mt-2">Contains: B2B, B2C sales with invoice details</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-blue-900 mb-2">GSTR-2 (Purchases)</h4>
                <p className="text-sm text-blue-800 mb-2">Report of inward supplies</p>
                <p className="text-xs text-blue-700">📅 Use for ITC reconciliation</p>
                <p className="text-xs text-blue-600 mt-2">Contains: Purchase invoices for ITC claim</p>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                <h4 className="font-bold text-amber-900 mb-2">GSTR-3B (Summary)</h4>
                <p className="text-sm text-amber-800 mb-2">Monthly summary return</p>
                <p className="text-xs text-amber-700">📅 Due: 20th of next month</p>
                <p className="text-xs text-amber-600 mt-2">File with payment of net liability</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2">⚠️ Important Notes:</h4>
              <ul className="space-y-1 text-sm text-slate-700">
                <li>✓ These reports are auto-generated from your transactions</li>
                <li>✓ Always verify data accuracy before filing on GST portal</li>
                <li>✓ Maintain proper invoice records and supporting documents</li>
                <li>✓ Late filing attracts penalty of ₹50/day (₹20/day for nil returns)</li>
                <li>✓ Ensure timely payment to avoid interest charges (18% p.a.)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Report Footer */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <div className="text-sm text-slate-600 text-center">
            📊 GST Report for <span className="font-semibold">{new Date(month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span> • Generated on <span className="font-semibold">{new Date().toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxReports;
