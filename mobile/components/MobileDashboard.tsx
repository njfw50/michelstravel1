
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";

export default function MobileDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSeniorAlerts() {
      try {
        setLoading(true);
        setError(null);
        // Ajuste a URL conforme seu backend
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
    // Opcional: polling a cada 30s
    const interval = setInterval(fetchSeniorAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Painel de Controle Mobile</Text>
      {loading && <ActivityIndicator size="large" color="#2F63F5" style={{ marginVertical: 24 }} />}
      {error && <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text>}
      {alerts.map(alert => (
        <View key={alert.id} style={styles.card}>
          <Text style={styles.nome}>{alert.passengerName || "Passageiro"}, {alert.passengerAge || "-"}</Text>
          <Text style={styles.status}>{alert.status}</Text>
          <Text style={styles.rota}>{alert.route || alert.flightInfo || ""}</Text>
          <Text style={styles.acao}>{alert.message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button}><Text>Ligar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button}><Text>Áudio</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button}><Text>WhatsApp</Text></TouchableOpacity>
          </View>
        </View>
      ))}
      {/* Adicione bookings, voice escalations, deals, etc. com fetchs reais */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F7FF', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6 },
  nome: { fontSize: 18, fontWeight: 'bold' },
  status: { fontSize: 14, color: '#2F63F5', marginBottom: 4 },
  rota: { fontSize: 14, color: '#60708D' },
  acao: { fontSize: 14, color: '#E53E3E', marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { backgroundColor: '#2F63F5', borderRadius: 8, padding: 8, marginHorizontal: 4 },
});
