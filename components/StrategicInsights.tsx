import React, { useMemo } from 'react';
import { Invoice, Currency } from '../types';
import { TrendingUp, TrendingDown, Minus, BarChart3, Users, Percent, Calculator, Lightbulb } from 'lucide-react';

interface StrategicInsightsProps {
  invoices: Invoice[];
}

interface MonthlyData {
  spend: number;
  count: number;
  tax: number;
}

const StrategicInsights: React.FC<StrategicInsightsProps> = ({ invoices }) => {
  const insights = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Previous month calculation
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Group invoices by month and currency
    const monthlyByCurrency: Record<string, { current: MonthlyData; previous: MonthlyData }> = {};
    
    invoices.forEach(inv => {
      const date = new Date(inv.uploadTimestamp);
      const invMonth = date.getMonth();
      const invYear = date.getFullYear();
      const currency = inv.currency || Currency.TRY;
      
      if (!monthlyByCurrency[currency]) {
        monthlyByCurrency[currency] = {
          current: { spend: 0, count: 0, tax: 0 },
          previous: { spend: 0, count: 0, tax: 0 }
        };
      }
      
      if (invMonth === currentMonth && invYear === currentYear) {
        monthlyByCurrency[currency].current.spend += inv.grand_total || 0;
        monthlyByCurrency[currency].current.count += 1;
        monthlyByCurrency[currency].current.tax += inv.tax_amount || 0;
      } else if (invMonth === prevMonth && invYear === prevYear) {
        monthlyByCurrency[currency].previous.spend += inv.grand_total || 0;
        monthlyByCurrency[currency].previous.count += 1;
        monthlyByCurrency[currency].previous.tax += inv.tax_amount || 0;
      }
    });

    // Calculate month-over-month change for primary currency
    const currencies = Object.keys(monthlyByCurrency);
    const primaryCurrency = currencies.length > 0 ? currencies[0] : 'TRY';
    const primaryData = monthlyByCurrency[primaryCurrency] || { current: { spend: 0, count: 0 }, previous: { spend: 0, count: 0 } };
    
    let momChange = 0;
    let momDirection: 'up' | 'down' | 'stable' = 'stable';
    
    if (primaryData.previous.spend > 0) {
      momChange = ((primaryData.current.spend - primaryData.previous.spend) / primaryData.previous.spend) * 100;
      momDirection = momChange > 1 ? 'up' : momChange < -1 ? 'down' : 'stable';
    } else if (primaryData.current.spend > 0) {
      momChange = 100;
      momDirection = 'up';
    }

    // Average spending per invoice
    const avgPerInvoice: Record<string, number> = {};
    Object.entries(monthlyByCurrency).forEach(([curr, data]) => {
      const totalSpend = data.current.spend + data.previous.spend;
      const totalCount = data.current.count + data.previous.count;
      avgPerInvoice[curr] = totalCount > 0 ? totalSpend / totalCount : 0;
    });

    // Tax rate analysis
    let totalTaxRate = 0;
    let taxRateCount = 0;
    let maxTaxRate = 0;
    let minTaxRate = Infinity;
    
    invoices.forEach(inv => {
      if (inv.tax_rate && inv.tax_rate > 0) {
        totalTaxRate += inv.tax_rate;
        taxRateCount += 1;
        maxTaxRate = Math.max(maxTaxRate, inv.tax_rate);
        minTaxRate = Math.min(minTaxRate, inv.tax_rate);
      }
    });
    
    const avgTaxRate = taxRateCount > 0 ? totalTaxRate / taxRateCount : 0;
    if (minTaxRate === Infinity) minTaxRate = 0;

    // Vendor analysis
    const vendorSpend: Record<string, number> = {};
    invoices.forEach(inv => {
      const vendor = inv.vendor_name || 'Bilinmeyen';
      vendorSpend[vendor] = (vendorSpend[vendor] || 0) + (inv.grand_total || 0);
    });
    
    const vendorEntries = Object.entries(vendorSpend).sort((a, b) => b[1] - a[1]);
    const topVendor = vendorEntries[0] || ['Yok', 0];
    const totalSpendAll = Object.values(vendorSpend).reduce((a, b) => a + b, 0);
    const topVendorPercent = totalSpendAll > 0 ? (topVendor[1] / totalSpendAll) * 100 : 0;
    const vendorCount = vendorEntries.length;

    return {
      momChange,
      momDirection,
      primaryCurrency,
      currentSpend: primaryData.current.spend,
      previousSpend: primaryData.previous.spend,
      avgPerInvoice,
      avgTaxRate,
      maxTaxRate,
      minTaxRate,
      topVendor: topVendor[0],
      topVendorPercent,
      vendorCount,
      hasData: invoices.length > 0
    };
  }, [invoices]);

  const formatCurrency = (amount: number, currency: string) => {
    return amount.toLocaleString('tr-TR', { style: 'currency', currency });
  };

  const getMomIcon = () => {
    switch (insights.momDirection) {
      case 'up': return <TrendingUp className="w-5 h-5" />;
      case 'down': return <TrendingDown className="w-5 h-5" />;
      default: return <Minus className="w-5 h-5" />;
    }
  };

  const getMomColor = () => {
    switch (insights.momDirection) {
      case 'up': return 'text-red-600 bg-red-50';
      case 'down': return 'text-green-600 bg-green-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getMomMessage = () => {
    if (!insights.hasData) return 'Henüz fatura verisi yok';
    if (insights.previousSpend === 0 && insights.currentSpend === 0) return 'Bu ay ve geçen ay veri yok';
    if (insights.previousSpend === 0) return 'Geçen ay veri yok, karşılaştırma yapılamıyor';
    
    const changeText = Math.abs(insights.momChange).toFixed(1);
    if (insights.momDirection === 'up') {
      return `Bu ay geçen aya göre harcaman %${changeText} arttı! 📈`;
    } else if (insights.momDirection === 'down') {
      return `Bu ay geçen aya göre harcaman %${changeText} azaldı! 📉`;
    }
    return 'Harcamalarınız stabil seyrediyor';
  };

  if (!insights.hasData) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-slate-200 text-slate-500 rounded-lg">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-semibold text-slate-700">Stratejik Analizler</h4>
        </div>
        <p className="text-slate-500 text-sm">Fatura yükledikçe stratejik analizler burada görünecek.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h4 className="text-lg font-semibold text-slate-800">Stratejik Analizler</h4>
      </div>

      {/* Monthly Comparison - Featured Card */}
      <div className={`rounded-xl p-5 border-2 ${insights.momDirection === 'up' ? 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50' : insights.momDirection === 'down' ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 mb-1">Aylık Karşılaştırma</p>
            <p className={`text-lg font-bold ${insights.momDirection === 'up' ? 'text-red-700' : insights.momDirection === 'down' ? 'text-green-700' : 'text-slate-700'}`}>
              {getMomMessage()}
            </p>
            <div className="mt-3 flex gap-4 text-sm">
              <div>
                <span className="text-slate-500">Bu Ay: </span>
                <span className="font-semibold text-slate-700">{formatCurrency(insights.currentSpend, insights.primaryCurrency)}</span>
              </div>
              <div>
                <span className="text-slate-500">Geçen Ay: </span>
                <span className="font-semibold text-slate-700">{formatCurrency(insights.previousSpend, insights.primaryCurrency)}</span>
              </div>
            </div>
          </div>
          <div className={`p-3 rounded-full ${getMomColor()}`}>
            {getMomIcon()}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Per Invoice */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Calculator className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-slate-500">Fatura Başına Ortalama</p>
          </div>
          <div className="space-y-1">
            {Object.entries(insights.avgPerInvoice).map(([curr, avg]) => (
              <p key={curr} className="text-xl font-bold text-slate-800">
                {formatCurrency(avg, curr)}
              </p>
            ))}
            {Object.keys(insights.avgPerInvoice).length === 0 && (
              <p className="text-xl font-bold text-slate-800">-</p>
            )}
          </div>
        </div>

        {/* Tax Analysis */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-slate-500">Vergi Oranı Analizi</p>
          </div>
          <p className="text-xl font-bold text-slate-800">%{insights.avgTaxRate.toFixed(0)} Ortalama</p>
          <p className="text-xs text-slate-400 mt-1">
            Min: %{insights.minTaxRate} · Max: %{insights.maxTaxRate}
          </p>
        </div>

        {/* Vendor Insights */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-slate-500">Tedarikçi Analizi</p>
          </div>
          <p className="text-lg font-bold text-slate-800 truncate" title={insights.topVendor}>
            {insights.topVendor}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Harcamaların %{insights.topVendorPercent.toFixed(0)}'i · {insights.vendorCount} farklı tedarikçi
          </p>
        </div>
      </div>
    </div>
  );
};

export default StrategicInsights;
