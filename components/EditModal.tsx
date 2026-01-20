import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceData, Currency } from '../types';
import { X, Save, Calculator } from 'lucide-react';

interface EditModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
}

const EditModal: React.FC<EditModalProps> = ({ invoice, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<InvoiceData | null>(null);

  useEffect(() => {
    if (invoice) {
      setFormData({
        vendor_name: invoice.vendor_name,
        tax_id: invoice.tax_id,
        invoice_date: invoice.invoice_date,
        invoice_number: invoice.invoice_number,
        currency: invoice.currency,
        subtotal: invoice.subtotal,
        tax_rate: invoice.tax_rate,
        tax_amount: invoice.tax_amount,
        grand_total: invoice.grand_total,
      });
    }
  }, [invoice]);

  if (!isOpen || !invoice || !formData) return null;

  const handleChange = (field: keyof InvoiceData, value: string | number) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleSave = () => {
    if (formData) {
      onSave({ ...invoice, ...formData });
      onClose();
    }
  };

  const calculateTax = () => {
      const sub = Number(formData.subtotal || 0);
      const rate = Number(formData.tax_rate || 0);
      const taxAmt = Number((sub * (rate / 100)).toFixed(2));
      const total = Number((sub + taxAmt).toFixed(2));
      setFormData(prev => prev ? ({ ...prev, tax_amount: taxAmt, grand_total: total }) : null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Edit Invoice</h3>
            <p className="text-sm text-slate-500 mt-1">ID: {invoice.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {invoice.validationMessage && (
           <div className="mx-6 mt-6 p-3 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-200 flex items-start gap-2">
             <Calculator className="w-5 h-5 flex-shrink-0" />
             {invoice.validationMessage}
           </div>
        )}

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
             <h4 className="font-semibold text-slate-900 border-b pb-2">Header Info</h4>
             
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
               <input 
                 type="text" 
                 value={formData.vendor_name || ''} 
                 onChange={(e) => handleChange('vendor_name', e.target.value)}
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number</label>
               <input 
                 type="text" 
                 value={formData.invoice_number || ''} 
                 onChange={(e) => handleChange('invoice_number', e.target.value)}
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Date (YYYY-MM-DD)</label>
               <input 
                 type="text" 
                 value={formData.invoice_date || ''} 
                 onChange={(e) => handleChange('invoice_date', e.target.value)}
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
               />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID / VKN</label>
               <input 
                 type="text" 
                 value={formData.tax_id || ''} 
                 onChange={(e) => handleChange('tax_id', e.target.value)}
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
               />
             </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 border-b pb-2">Financials</h4>
            
            <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                   <select 
                      value={formData.currency} 
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   >
                     {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                   <input 
                     type="number" 
                     value={formData.tax_rate} 
                     onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value))}
                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Subtotal (Matrah)</label>
               <input 
                 type="number" 
                 value={formData.subtotal} 
                 onChange={(e) => handleChange('subtotal', parseFloat(e.target.value))}
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Tax Amount (KDV)</label>
               <input 
                 type="number" 
                 value={formData.tax_amount} 
                 onChange={(e) => handleChange('tax_amount', parseFloat(e.target.value))}
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Grand Total</label>
               <input 
                 type="number" 
                 value={formData.grand_total} 
                 onChange={(e) => handleChange('grand_total', parseFloat(e.target.value))}
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
               />
             </div>

             <button 
                onClick={calculateTax}
                className="w-full py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
             >
                <Calculator className="w-4 h-4" />
                Auto-Recalculate Totals
             </button>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-xl transition-all flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;