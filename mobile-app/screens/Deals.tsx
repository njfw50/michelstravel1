
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface Deal {
  id: string;
  headline: string;
  description: string;
  price_value: number;
  currency: string;
  departure_date: string;
  return_date?: string;
}

export default function Deals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/public/flight-deals')
      .then((res) => res.json())
      .then((data) => {
        setDeals(data.deals || []);
        setLoading(false);
      })
      .catch((err) => {
        setError('Erro ao carregar ofertas.');
        setLoading(false);
      });
  }, []);

  if (loading) return <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 32 }} />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ofertas</Text>
      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.dealTitle}>{item.headline}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.price}>{item.currency} {item.price_value?.toFixed(2)}</Text>
            <Text style={styles.validUntil}>Saída: {item.departure_date}{item.return_date ? ` | Volta: ${item.return_date}` : ''}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma oferta encontrada.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 16 },
  card: { backgroundColor: theme.colors.card, padding: 16, borderRadius: 8, marginBottom: 12 },
  dealTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },
  description: { fontSize: 16, color: theme.colors.secondary },
  price: { fontSize: 16, color: theme.colors.success, fontWeight: 'bold' },
  validUntil: { fontSize: 14, color: theme.colors.muted },
  error: { color: theme.colors.error, marginTop: 32, textAlign: 'center' },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: 32 },
});
