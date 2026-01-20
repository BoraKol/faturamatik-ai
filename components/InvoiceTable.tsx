import React, { useState } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { Edit2, AlertCircle, CheckCircle, FileText, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface InvoiceTableProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
  onExport: () => void;
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onEdit, onView, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(inv => 
    (inv.vendor_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (inv.invoice_number?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-500" />
          Recent Invoices
        </h3>
        <div className="flex gap-2">
           <input 
            type="text" 
            placeholder="Search vendor or ID..." 
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Vendor</th>
              <th className="px-6 py-3 font-medium">Invoice No</th>
              <th className="px-6 py-3 font-medium text-right">Subtotal</th>
              <th className="px-6 py-3 font-medium text-right">Tax</th>
              <th className="px-6 py-3 font-medium text-right">Total</th>
              <th className="px-6 py-3 font-medium text-center">Status</th>
              <th className="px-6 py-3 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                  No invoices found. Upload one to get started.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr 
                  key={inv.id} 
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onView(inv)}
                >
                  <td className="px-6 py-3 text-slate-600">
                    {inv.invoice_date || '-'}
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-800">
                    {inv.vendor_name || 'Unknown Vendor'}
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {inv.invoice_number || '-'}
                  </td>
                  <td className="px-6 py-3 text-right text-slate-600">
                    {inv.subtotal?.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right text-slate-600">
                    {inv.tax_amount?.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-slate-800">
                    {inv.grand_total?.toFixed(2)} <span className="text-xs font-normal text-slate-400">{inv.currency}</span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${inv.status === InvoiceStatus.VALID ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}
                    `}>
                      {inv.status === InvoiceStatus.VALID ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      )}
                      {inv.status === InvoiceStatus.VALID ? 'Valid' : 'Review'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onView(inv); }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(inv); }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Invoice"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;