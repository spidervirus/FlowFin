import { pdf } from "@react-pdf/renderer";
import { PaymentWithInvoice } from "@/types/payments";
import { PaymentReceipt } from "@/components/payments/PaymentReceipt";
import { ReactElement } from "react";

export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  website?: string;
  taxId?: string;
}

export async function generatePaymentReceipt(
  payment: PaymentWithInvoice,
  companyInfo: CompanyInfo
): Promise<Blob> {
  const element = PaymentReceipt({ payment, companyInfo });
  const blob = await pdf(element).toBlob();
  return blob;
}

export function downloadReceipt(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} 