
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface VoiceEscalation {
  id: string;
  customer_name: string;
  reason: string;
  created_at: string;
  status: string;
}

export default function VoiceEscalations() {
  const [escalations, setEscalations] = useState<VoiceEscalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/mobile/escalations', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        // Espera-se resposta: { success: true, data: VoiceEscalation[] }
        setEscalations(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError('Erro ao carregar escalonamentos de voz.');
        setLoading(false);
      });
  }, []);

  if (loading) return <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 32 }} />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escalonamentos de Voz</Text>
      <FlatList
        data={escalations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.customer}>{item.customer_name}</Text>
            <Text style={styles.issue}>{item.reason}</Text>
            <Text style={styles.date}>{item.created_at}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum escalonamento encontrado.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 16 },
  card: { backgroundColor: theme.colors.card, padding: 16, borderRadius: 8, marginBottom: 12 },
  customer: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },
  issue: { fontSize: 16, color: theme.colors.secondary },
  date: { fontSize: 14, color: theme.colors.muted },
  status: { fontSize: 14, color: theme.colors.info },
  error: { color: theme.colors.error, marginTop: 32, textAlign: 'center' },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: 32 },
});
