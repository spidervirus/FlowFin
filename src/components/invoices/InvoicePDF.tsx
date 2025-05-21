import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
// import { Invoice } from '@/types/invoices'; // Keep original import for reference or if it should be used
import { formatCurrency } from '@/lib/utils';

// Define a more inclusive Invoice type for this component's props
interface PDFInvoiceType {
  invoice_number: string;
  date: string | Date;
  due_date: string | Date;
  client_name?: string;
  client_email?: string;
  client_address?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  subtotal: number;
  tax_amount?: number;
  tax_rate?: number;
  discount_amount?: number;
  total_amount: number;
  notes?: string;
  payment_terms?: string;
  // Include other fields from the original Invoice type that are used, if known
  // For example, if the linter showed other base fields, they should be here too.
  [key: string]: any; // Allow other properties to avoid breaking if base Invoice type is richer
}

interface InvoicePDFProps {
  invoice: PDFInvoiceType; // Use the locally defined inclusive type
  companyInfo: {
    name: string;
    address: string;
    email: string;
    phone: string;
  };
}

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderBottomStyle: 'solid',
    paddingVertical: 8,
  },
  col4: {
    flex: 4,
  },
  col2: {
    flex: 2,
  },
  col1: {
    flex: 1,
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    fontWeight: 'bold',
  },
  totals: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 4,
  },
  totalLabel: {
    width: 100,
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
  },
  bold: {
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#666',
    fontSize: 10,
  },
});

export function InvoicePDF({ invoice, companyInfo }: InvoicePDFProps) {
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
          </View>
          <View>
            <Text style={styles.bold}>Invoice #{invoice.invoice_number}</Text>
            <Text>Date: {new Date(invoice.date).toLocaleDateString()}</Text>
            <Text>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Bill To */}
        {(invoice.client_name || invoice.client_email || invoice.client_address) && (
        <View style={styles.section}>
          <Text style={styles.bold}>Bill To:</Text>
            {invoice.client_name && <Text>{invoice.client_name}</Text>}
            {invoice.client_email && <Text>{invoice.client_email}</Text>}
            {invoice.client_address && <Text>{invoice.client_address}</Text>}
        </View>
        )}

        {/* Items Table */}
        <View style={styles.section}>
          <View style={[styles.row, styles.tableHeader]}>
            <Text style={styles.col4}>Description</Text>
            <Text style={styles.col1}>Qty</Text>
            <Text style={styles.col2}>Unit Price</Text>
            <Text style={styles.col2}>Amount</Text>
          </View>
          {(invoice.items || []).map((item: any, index: number) => (
            <View key={index} style={styles.row}>
              <Text style={styles.col4}>{item.description}</Text>
              <Text style={styles.col1}>{item.quantity}</Text>
              <Text style={styles.col2}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.col2}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {(invoice.tax_amount ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.tax_rate}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.tax_amount ?? 0)}</Text>
            </View>
          )}
          {(invoice.discount_amount ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={styles.totalValue}>-{formatCurrency(invoice.discount_amount ?? 0)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.bold]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.total_amount)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.bold}>Notes:</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        {/* Payment Terms */}
        {invoice.payment_terms && (
          <View style={styles.section}>
            <Text style={styles.bold}>Payment Terms:</Text>
            <Text>{invoice.payment_terms}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your business!
        </Text>
      </Page>
    </Document>
  );
} 