import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Регистрируем шрифт
Font.register({
  family: 'Roboto',
  src: '/fonts/Roboto-Regular.ttf',
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 12,
    padding: 40,
  },
  logo: {
    width: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1 solid #000',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  colDate: { width: '20%' },
  colIn: { width: '20%', textAlign: 'right' },
  colOut: { width: '20%', textAlign: 'right' },
  colDesc: { width: '40%' },
});

export default function PDFReport({ report }: { report: any }) {
  const { period, totals, items } = report;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Image src="/images/logo.png" style={styles.logo} />

        <Text style={styles.title}>Отчёт по счёту click4tip</Text>

        <Text>
          Период: {new Date(period.from).toLocaleDateString()} —{' '}
          {new Date(period.to).toLocaleDateString()}
        </Text>

        <Text>Остаток на начало периода: {(totals.startBalance / 100).toFixed(2)}</Text>
        <Text>Зачисления: {(totals.totalIn / 100).toFixed(2)}</Text>
        <Text>Списания: {(totals.totalOut / 100).toFixed(2)}</Text>
        <Text>Остаток на конец периода: {(totals.endBalance / 100).toFixed(2)}</Text>

        <View style={{ marginTop: 20 }}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>Дата</Text>
            <Text style={styles.colIn}>Зачисление</Text>
            <Text style={styles.colOut}>Списание</Text>
            <Text style={styles.colDesc}>Описание</Text>
          </View>

          {items.map((item: any) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDate}>
                {new Date(item.created * 1000).toLocaleDateString()}
              </Text>

              <Text style={styles.colIn}>
                {item.direction === 'in' ? (item.amount / 100).toFixed(2) : ''}
              </Text>

              <Text style={styles.colOut}>
                {item.direction === 'out' ? (item.amount / 100).toFixed(2) : ''}
              </Text>

              <Text style={styles.colDesc}>{item.description ?? ''}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
