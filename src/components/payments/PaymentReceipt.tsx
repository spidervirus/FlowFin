"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { PaymentWithInvoice } from "@/types/payments";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface PaymentReceiptProps {
  payment: PaymentWithInvoice;
  companyInfo: {
    name: string;
    address: string;
    email: string;
    phone: string;
    website?: string;
    taxId?: string;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  companyInfo: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderBottomStyle: "solid",
  },
  label: {
    width: 150,
    fontWeight: "bold",
  },
  value: {
    flex: 1,
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#666",
    fontSize: 10,
  },
});

export function PaymentReceipt({ payment, companyInfo }: PaymentReceiptProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.title}>{companyInfo.name}</Text>
            <Text>{companyInfo.address}</Text>
            <Text>{companyInfo.email}</Text>
            <Text>{companyInfo.phone}</Text>
            {companyInfo.website && <Text>{companyInfo.website}</Text>}
            {companyInfo.taxId && <Text>Tax ID: {companyInfo.taxId}</Text>}
          </View>
          <View>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              Payment Receipt
            </Text>
            <Text>Date: {format(new Date(payment.payment_date), "PPP")}</Text>
            {payment.reference_number && (
              <Text>Ref: {payment.reference_number}</Text>
            )}
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>
            Payment Details
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice Number</Text>
            <Text style={styles.value}>
              {payment.invoice?.invoice_number || "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Client Name</Text>
            <Text style={styles.value}>
              {payment.invoice?.client_name || "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>
              {payment.payment_method.replace("_", " ").toUpperCase()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount Paid</Text>
            <Text style={styles.value}>{formatCurrency(payment.amount)}</Text>
          </View>
          {payment.bank_account && (
            <View style={styles.row}>
              <Text style={styles.label}>Bank Account</Text>
              <Text style={styles.value}>{payment.bank_account}</Text>
            </View>
          )}
          {payment.check_number && (
            <View style={styles.row}>
              <Text style={styles.label}>Check Number</Text>
              <Text style={styles.value}>{payment.check_number}</Text>
            </View>
          )}
          {payment.transaction?.reference && (
            <View style={styles.row}>
              <Text style={styles.label}>Transaction Reference</Text>
              <Text style={styles.value}>{payment.transaction.reference}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {payment.notes && (
          <View style={styles.section}>
            <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>
              Notes
            </Text>
            <Text>{payment.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          This is an official receipt of payment. Thank you for your business.
        </Text>
      </Page>
    </Document>
  );
} 