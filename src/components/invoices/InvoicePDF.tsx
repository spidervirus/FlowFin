import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Invoice } from '@/types/invoices';
import { formatCurrency } from '@/lib/utils';

interface InvoicePDFProps {
  invoice: Invoice;
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
        <View style={styles.section}>
          <Text style={styles.bold}>Bill To:</Text>
          <Text>{invoice.client_name}</Text>
          <Text>{invoice.client_email}</Text>
          <Text>{invoice.client_address}</Text>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <View style={[styles.row, styles.tableHeader]}>
            <Text style={styles.col4}>Description</Text>
            <Text style={styles.col1}>Qty</Text>
            <Text style={styles.col2}>Unit Price</Text>
            <Text style={styles.col2}>Amount</Text>
          </View>
          {invoice.items.map((item, index) => (
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
          {invoice.tax_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.tax_rate}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.tax_amount)}</Text>
            </View>
          )}
          {invoice.discount_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={styles.totalValue}>-{formatCurrency(invoice.discount_amount)}</Text>
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