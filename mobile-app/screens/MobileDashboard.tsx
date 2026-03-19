import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { colors, borderRadius, spacing } from '../theme';

export default function MobileDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSeniorAlerts() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/senior-alerts");
        if (!res.ok) throw new Error("Erro ao buscar alertas sênior");
        const data = await res.json();
        setAlerts(data);
      } catch (err) {
        setError(err.message || "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    fetchSeniorAlerts();
    const interval = setInterval(fetchSeniorAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Painel de Controle</Text>
      {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 24 }} />}
      {error && <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>}
      {alerts.map(alert => (
        <View key={alert.id} style={styles.card}>
          <Text style={styles.nome}>{alert.passengerName || "Passageiro"}, {alert.passengerAge || "-"}</Text>
          <Text style={styles.status}>{alert.status}</Text>
          <Text style={styles.rota}>{alert.route || alert.flightInfo || ""}</Text>
          <Text style={styles.acao}>{alert.message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Ligar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Áudio</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>WhatsApp</Text></TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: spacing.md, color: colors.primary },
  card: { backgroundColor: colors.card, borderRadius, padding: spacing.md, marginBottom: spacing.sm, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6 },
  nome: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  status: { fontSize: 14, color: colors.primary, marginBottom: 4 },
  rota: { fontSize: 14, color: colors.secondary },
  acao: { fontSize: 14, color: colors.danger, marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  button: { backgroundColor: colors.primary, borderRadius: 8, padding: spacing.sm, marginHorizontal: 4 },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
});
