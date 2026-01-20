import React from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { X, FileText, Calendar, Hash, Building2, CreditCard, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ invoice, isOpen, onClose }) => {
  if (!isOpen || !invoice) return null;

  const formatDate = (ts: number) => {
    try {
      return format(new Date(ts), 'PPP p');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all scale-100">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Invoice Details
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-wider">{invoice.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border ${
            invoice.status === InvoiceStatus.VALID 
              ? 'bg-green-50 border-green-100 text-green-800' 
              : 'bg-amber-50 border-amber-100 text-amber-800'
          }`}>
            <div className="flex items-start gap-3">
               {invoice.status === InvoiceStatus.VALID ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <AlertTriangle className="w-5 h-5 mt-0.5" />}
               <div>
                 <h4 className="font-semibold text-sm uppercase tracking-wide">
                   {invoice.status === InvoiceStatus.VALID ? 'Math Verified' : 'Review Required'}
                 </h4>
                 {invoice.validationMessage && (
                   <p className="text-xs mt-1 opacity-90">{invoice.validationMessage}</p>
                 )}
               </div>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Vendor
                  </label>
                  <p className="font-semibold text-slate-800 text-lg">{invoice.vendor_name || 'Unknown'}</p>
                  {invoice.tax_id && <p className="text-sm text-slate-500">Tax ID: {invoice.tax_id}</p>}
               </div>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Hash className="w-3.5 h-3.5" /> Invoice No
                  </label>
                  <p className="font-medium text-slate-800">{invoice.invoice_number || 'N/A'}</p>
               </div>
               <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Date
                  </label>
                  <p className="font-medium text-slate-800">{invoice.invoice_date || 'N/A'}</p>
               </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
               <CreditCard className="w-3.5 h-3.5" /> Financials
            </label>
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium text-slate-800">
                {invoice.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600">
                Tax {invoice.tax_rate ? `(${invoice.tax_rate}%)` : ''}
              </span>
              <span className="font-medium text-slate-800">
                {invoice.tax_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-end">
              <span className="text-slate-900 font-bold">Total</span>
              <span className="text-xl font-bold text-blue-600">
                {invoice.grand_total?.toLocaleString(undefined, { style: 'currency', currency: invoice.currency || 'TRY' })}
              </span>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex flex-col gap-1">
             <div className="flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Original File: <span className="text-slate-600 font-medium">{invoice.filename}</span>
             </div>
             <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Uploaded: {formatDate(invoice.uploadTimestamp)}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailModal;