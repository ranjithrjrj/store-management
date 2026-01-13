// FILE PATH: components/TaxReports.tsx
// GST Tax Reports with new UI components and theme support

'use client';
import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Badge, LoadingSpinner, useToast } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

const TaxReports = () => {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
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
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      const endDate = `${year}-${monthNum}-${lastDay}`;

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

      const { data: purchases } = await supabase
        .from('purchase_recordings')
        .select(`
          invoice_number,
          invoice_date,
          vendor_name,
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
      toast.error('Failed to load', 'Could not load tax reports.');
    } finally {
      setLoading(false);
    }
  }

  const salesTotals = {
    b2b: salesData.filter(s => s.customer_gstin).length,
    b2c: salesData.filter(s => !s.customer_gstin).length,
    taxable: salesData.reduce((sum, s) => sum + (s.subtotal || 0), 0),
    cgst: salesData.reduce((sum, s) => sum + (s.cgst_amount || 0), 0),
    sgst: salesData.reduce((sum, s) => sum + (s.sgst_amount || 0), 0),
    igst: salesData.reduce((sum, s) => sum + (s.igst_amount || 0), 0),
    total: salesData.reduce((sum, s) => sum + (s.total_amount || 0), 0)
  };

  const purchaseTotals = {
    count: purchaseData.length,
    taxable: purchaseData.reduce((sum, p) => sum + (p.subtotal || 0), 0),
    cgst: purchaseData.reduce((sum, p) => sum + (p.cgst_amount || 0), 0),
    sgst: purchaseData.reduce((sum, p) => sum + (p.sgst_amount || 0), 0),
    igst: purchaseData.reduce((sum, p) => sum + (p.igst_amount || 0), 0),
    total: purchaseData.reduce((sum, p) => sum + (p.total_amount || 0), 0)
  };

  const totalSalesGST = salesTotals.cgst + salesTotals.sgst + salesTotals.igst;
  const totalPurchaseGST = purchaseTotals.cgst + purchaseTotals.sgst + purchaseTotals.igst;
  const netGSTLiability = totalSalesGST - totalPurchaseGST;

  const downloadGSTR1 = () => {
    if (salesData.length === 0) {
      toast.warning('No data', 'No sales data available for this period.');
      return;
    }

    const csv = [
      ['GSTR-1 Sales Register', '', '', '', '', '', ''],
      [`Period: ${month}`, '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['Invoice No', 'Date', 'Customer', 'GSTIN', 'Taxable', 'CGST+SGST', 'IGST', 'Total'],
      ...salesData.map(s => [
        s.invoice_number,
        s.invoice_date,
        s.customer_name || 'Walk-in',
        s.customer_gstin || 'N/A',
        s.subtotal.toFixed(2),
        ((s.cgst_amount || 0) + (s.sgst_amount || 0)).toFixed(2),
        (s.igst_amount || 0).toFixed(2),
        s.total_amount.toFixed(2)
      ]),
      ['', '', '', '', '', '', ''],
      ['', '', '', 'TOTAL', salesTotals.taxable.toFixed(2), (salesTotals.cgst + salesTotals.sgst).toFixed(2), salesTotals.igst.toFixed(2), salesTotals.total.toFixed(2)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_${month}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Downloaded', 'GSTR-1 report has been downloaded.');
  };

  const downloadGSTR2 = () => {
    if (purchaseData.length === 0) {
      toast.warning('No data', 'No purchase data available for this period.');
      return;
    }

    const csv = [
      ['GSTR-2 Purchase Register', '', '', '', '', ''],
      [`Period: ${month}`, '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['Invoice No', 'Date', 'Vendor', 'Taxable', 'CGST+SGST', 'IGST', 'Total'],
      ...purchaseData.map(p => [
        p.invoice_number,
        p.invoice_date,
        p.vendor_name || 'N/A',
        p.subtotal.toFixed(2),
        ((p.cgst_amount || 0) + (p.sgst_amount || 0)).toFixed(2),
        (p.igst_amount || 0).toFixed(2),
        p.total_amount.toFixed(2)
      ]),
      ['', '', '', '', '', ''],
      ['', '', 'TOTAL', purchaseTotals.taxable.toFixed(2), (purchaseTotals.cgst + purchaseTotals.sgst).toFixed(2), purchaseTotals.igst.toFixed(2), purchaseTotals.total.toFixed(2)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR2_${month}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Downloaded', 'GSTR-2 report has been downloaded.');
  };

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GST Tax Reports</h2>
          <p className="text-gray-600 text-sm mt-1">Generate GST compliance reports</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <FileText size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="font-bold text-red-800 mb-2">Failed to Load Tax Reports</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={loadTaxData} variant="primary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GST Tax Reports</h2>
          <p className="text-gray-600 text-sm mt-1">Generate GST compliance reports</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadGSTR1} variant="secondary" size="md" icon={<Download size={18} />}>
            GSTR-1
          </Button>
          <Button onClick={downloadGSTR2} variant="secondary" size="md" icon={<Download size={18} />}>
            GSTR-2
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar size={20} />
            <span className="font-medium">Period:</span>
          </div>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-auto"
          />
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="py-12">
            <LoadingSpinner size="lg" text="Loading tax reports..." />
          </div>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">₹{salesTotals.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{salesData.length} invoices</p>
                </div>
                <div className={`p-3 rounded-lg ${theme.classes.bgPrimaryLight}`}>
                  <TrendingUp size={24} className={theme.classes.textPrimary} />
                </div>
              </div>
            </Card>

            <Card padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Purchases</p>
                  <p className="text-2xl font-bold text-gray-900">₹{purchaseTotals.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{purchaseData.length} records</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <TrendingDown size={24} className="text-blue-600" />
                </div>
              </div>
            </Card>

            <Card padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Output GST</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalSalesGST.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Collected</p>
                </div>
                <div className="p-3 rounded-lg bg-green-100">
                  <DollarSign size={24} className="text-green-600" />
                </div>
              </div>
            </Card>

            <Card padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Input GST</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalPurchaseGST.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Paid</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <DollarSign size={24} className="text-blue-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Net GST Liability */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Net GST Liability</h3>
                <p className="text-sm text-gray-600">
                  Output GST - Input GST = {netGSTLiability >= 0 ? 'Payable' : 'Refundable'}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={netGSTLiability >= 0 ? 'warning' : 'success'} size="lg">
                  {netGSTLiability >= 0 ? 'Payable' : 'Refundable'}
                </Badge>
                <p className={`text-3xl font-bold mt-2 ${netGSTLiability >= 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  ₹{Math.abs(netGSTLiability).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Sales Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Output GST (Sales)</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Transaction Type</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{salesTotals.b2b}</p>
                      <p className="text-xs text-gray-600 mt-1">B2B</p>
                    </div>
                    <div className="flex-1 text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{salesTotals.b2c}</p>
                      <p className="text-xs text-gray-600 mt-1">B2C</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Taxable Value</span>
                    <span className="font-semibold">₹{salesTotals.taxable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">CGST</span>
                    <span className="font-semibold">₹{salesTotals.cgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">SGST</span>
                    <span className="font-semibold">₹{salesTotals.sgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IGST</span>
                    <span className="font-semibold">₹{salesTotals.igst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-900">Total GST</span>
                    <span className={`font-bold ${theme.classes.textPrimary}`}>₹{totalSalesGST.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Input GST (Purchases)</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Total Records</span>
                    <span className="font-bold text-2xl text-gray-900">{purchaseTotals.count}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Taxable Value</span>
                    <span className="font-semibold">₹{purchaseTotals.taxable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">CGST</span>
                    <span className="font-semibold">₹{purchaseTotals.cgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">SGST</span>
                    <span className="font-semibold">₹{purchaseTotals.sgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IGST</span>
                    <span className="font-semibold">₹{purchaseTotals.igst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-900">Total GST</span>
                    <span className="font-bold text-blue-600">₹{totalPurchaseGST.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Instructions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">GST Filing Instructions</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>GSTR-1:</strong> Report of outward supplies - Download and file by 11th of next month</p>
              <p>• <strong>GSTR-2:</strong> Report of inward supplies - Use for ITC reconciliation</p>
              <p>• <strong>GSTR-3B:</strong> Monthly summary return - File by 20th of next month with payment</p>
              <p className="pt-2 text-xs text-gray-500">
                Note: These reports are auto-generated from your transactions. Always verify data before filing.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default TaxReports;