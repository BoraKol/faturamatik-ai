import React, { useMemo } from 'react';
import { Invoice, InvoiceStatus, Currency } from '../types';
import { TurkishLira, DollarSign, Euro, PoundSterling, Coins, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StrategicInsights from './StrategicInsights';

interface DashboardProps {
  invoices: Invoice[];
}

const Dashboard: React.FC<DashboardProps> = ({ invoices }) => {
  const { currencyStats, reviewCount } = useMemo(() => {
    const stats: Record<string, { spend: number; tax: number }> = {};
    let count = 0;

    invoices.forEach((inv) => {
      // Default to TRY if currency is missing or null, but use the actual value if present
      const curr = inv.currency || Currency.TRY;

      if (!stats[curr]) {
        stats[curr] = { spend: 0, tax: 0 };
      }
      stats[curr].spend += inv.grand_total || 0;
      stats[curr].tax += inv.tax_amount || 0;

      if (inv.status === InvoiceStatus.REVIEW_REQUIRED) {
        count += 1;
      }
    });

    return { currencyStats: stats, reviewCount: count };
  }, [invoices]);

  // Normalize Turkish characters to ASCII equivalents
  const normalizeTurkish = (str: string): string => {
    return str
      .replace(/İ/g, 'I')
      .replace(/ı/g, 'i')
      .replace(/Ş/g, 'S')
      .replace(/ş/g, 's')
      .replace(/Ğ/g, 'G')
      .replace(/ğ/g, 'g')
      .replace(/Ü/g, 'U')
      .replace(/ü/g, 'u')
      .replace(/Ö/g, 'O')
      .replace(/ö/g, 'o')
      .replace(/Ç/g, 'C')
      .replace(/ç/g, 'c');
  };

  // Extract a simple key from vendor name for grouping (first significant word)
  const getVendorKey = (name: string): string => {
    if (!name) return 'Bilinmeyen';
    // Normalize Turkish characters and get first word
    const normalized = normalizeTurkish(name.trim().toUpperCase());
    const words = normalized.split(/\s+/);
    // Return first word if it's meaningful (at least 3 chars)
    if (words[0] && words[0].length >= 3) {
      return words[0];
    }
    return normalized;
  };

  // Group by vendor for the chart (Top 5 vendors)
  // Note: For the chart, we are currently mixing currencies in raw numbers for visualization simplicity.
  // In a full production app, you would normalize to a base currency.
  const chartData = useMemo(() => {
    // First, group by vendor key to consolidate similar vendors
    const vendorGroups: Record<string, { name: string; total: number }> = {};

    invoices.forEach(inv => {
      const originalName = inv.vendor_name || 'Bilinmeyen';
      const key = getVendorKey(originalName);

      if (!vendorGroups[key]) {
        // Use the first occurrence's name as the display name
        vendorGroups[key] = { name: originalName, total: 0 };
      }
      vendorGroups[key].total += inv.grand_total;
    });

    return Object.values(vendorGroups)
      .map(({ name, total }) => ({ name, value: total }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [invoices]);

  const activeCurrencies = Object.keys(currencyStats);
  const primaryCurrency = activeCurrencies.length > 0 ? activeCurrencies[0] : 'TRY';

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'USD': return <DollarSign className="w-6 h-6" />;
      case 'EUR': return <Euro className="w-6 h-6" />;
      case 'GBP': return <PoundSterling className="w-6 h-6" />;
      case 'TRY': return <TurkishLira className="w-6 h-6" />;
      default: return <Coins className="w-6 h-6" />;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return amount.toLocaleString(undefined, { style: 'currency', currency: currency });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Spend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full mt-1">
            {activeCurrencies.length === 1 ? getCurrencyIcon(primaryCurrency) : <Coins className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-500 font-medium mb-1">Total Monthly Spend</p>
            {activeCurrencies.length === 0 ? (
              <h3 className="text-2xl font-bold text-slate-800">
                {formatCurrency(0, 'TRY')}
              </h3>
            ) : (
              <div className="space-y-1">
                {activeCurrencies.map(curr => (
                  <h3 key={curr} className="text-2xl font-bold text-slate-800">
                    {formatCurrency(currencyStats[curr].spend, curr)}
                  </h3>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Total Tax */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-full mt-1">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-500 font-medium mb-1">Total Tax (KDV) Payable</p>
            {activeCurrencies.length === 0 ? (
              <h3 className="text-2xl font-bold text-slate-800">
                {formatCurrency(0, 'TRY')}
              </h3>
            ) : (
              <div className="space-y-1">
                {activeCurrencies.map(curr => (
                  <h3 key={curr} className="text-2xl font-bold text-slate-800">
                    {formatCurrency(currencyStats[curr].tax, curr)}
                  </h3>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className={`p-3 rounded-full ${reviewCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending Reviews</p>
            <h3 className="text-2xl font-bold text-slate-800">{reviewCount}</h3>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h4 className="text-lg font-semibold text-slate-800 mb-4">Top Spending by Vendor</h4>
        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                // Note: Tooltip simply shows the number. Since it's mixed currency, we don't force a symbol here.
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Strategic Insights */}
      <StrategicInsights invoices={invoices} />
    </div>
  );
};

export default Dashboard;