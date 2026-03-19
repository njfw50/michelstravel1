
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface Booking {
  id: string;
  customer_name: string;
  destination: string;
  created_at: string;
  status: string;
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/mobile/bookings', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        // Espera-se resposta: { success: true, data: Booking[] }
        setBookings(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError('Erro ao carregar reservas.');
        setLoading(false);
      });
  }, []);

  if (loading) return <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 32 }} />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reservas</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.customer}>{item.customer_name}</Text>
            <Text style={styles.destination}>{item.destination}</Text>
            <Text style={styles.date}>{item.created_at}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma reserva encontrada.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 16 },
  card: { backgroundColor: theme.colors.card, padding: 16, borderRadius: 8, marginBottom: 12 },
  customer: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },
  destination: { fontSize: 16, color: theme.colors.secondary },
  date: { fontSize: 14, color: theme.colors.muted },
  status: { fontSize: 14, color: theme.colors.info },
  error: { color: theme.colors.error, marginTop: 32, textAlign: 'center' },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: 32 },
});
