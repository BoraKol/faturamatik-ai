export enum Currency {
  TRY = 'TRY',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  UNKNOWN = 'UNKNOWN'
}

export enum InvoiceStatus {
  VALID = 'VALID',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR'
}

export interface InvoiceData {
  vendor_name: string | null;
  tax_id: string | null;
  invoice_date: string | null;
  invoice_number: string | null;
  currency: Currency;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  grand_total: number;
}

export interface Invoice extends InvoiceData {
  id: string;
  filename: string;
  uploadTimestamp: number;
  status: InvoiceStatus;
  validationMessage?: string;
}

export interface DashboardStats {
  totalSpend: number;
  totalTax: number;
  invoiceCount: number;
  reviewCount: number;
}