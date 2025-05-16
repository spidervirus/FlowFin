import { pdf } from '@react-pdf/renderer';
import { Invoice } from '@/types/invoices';
import { InvoicePDF } from '@/components/invoices/InvoicePDF';
import { ReactElement } from 'react';

export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
}

export async function generateInvoicePDF(invoice: Invoice, companyInfo: CompanyInfo): Promise<Blob> {
  const element = InvoicePDF({ invoice, companyInfo });
  const blob = await pdf(element).toBlob();
  return blob;
}

export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} 