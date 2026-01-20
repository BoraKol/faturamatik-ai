import { Invoice, InvoiceStatus, InvoiceData } from "../types";

const STORAGE_KEY = 'invoicely_data_v1';

export const saveInvoice = (invoice: Invoice): void => {
  const current = getInvoices();
  const updated = [invoice, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getInvoices = (): Invoice[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const updateInvoice = (updatedInvoice: Invoice): void => {
  const current = getInvoices();
  const index = current.findIndex(inv => inv.id === updatedInvoice.id);
  if (index !== -1) {
    // Re-validate math on update
    const validation = validateMath(updatedInvoice);
    current[index] = { ...updatedInvoice, status: validation.status, validationMessage: validation.message };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
};

export const deleteInvoice = (id: string): void => {
  const current = getInvoices();
  const updated = current.filter(inv => inv.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const validateMath = (data: InvoiceData): { status: InvoiceStatus, message?: string } => {
  // Logic check: abs((subtotal + tax_amount) - grand_total) < 0.01
  const calculatedTotal = (data.subtotal || 0) + (data.tax_amount || 0);
  const diff = Math.abs(calculatedTotal - (data.grand_total || 0));

  if (diff < 0.05) { // Allow small floating point margin
    return { status: InvoiceStatus.VALID };
  } else {
    return { 
      status: InvoiceStatus.REVIEW_REQUIRED, 
      message: `Math mismatch: Subtotal (${data.subtotal}) + Tax (${data.tax_amount}) != Total (${data.grand_total}). Diff: ${diff.toFixed(2)}` 
    };
  }
};

export const exportToCSV = (invoices: Invoice[]): void => {
  const headers = ['ID', 'Vendor', 'Date', 'Invoice No', 'Tax ID', 'Currency', 'Subtotal', 'Tax Rate', 'Tax Amount', 'Total', 'Status'];
  const rows = invoices.map(inv => [
    inv.id,
    `"${inv.vendor_name || ''}"`,
    inv.invoice_date || '',
    `"${inv.invoice_number || ''}"`,
    inv.tax_id || '',
    inv.currency,
    inv.subtotal,
    inv.tax_rate,
    inv.tax_amount,
    inv.grand_total,
    inv.status
  ]);

  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n" 
    + rows.map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};