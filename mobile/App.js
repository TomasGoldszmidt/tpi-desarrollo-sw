import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View } from 'react-native';
import { API_URL } from './src/config';

// Pantalla temporal para verificar la conexión celular ↔ backend.
export default function App() {
  const [estado, setEstado] = useState('Conectando...');

  async function probarConexion() {
    setEstado('Conectando...');
    try {
      const respuesta = await fetch(`${API_URL}/health`);
      const datos = await respuesta.json();
      setEstado(`Conectado: ${JSON.stringify(datos)}`);
    } catch (error) {
      setEstado(`Error: ${error.message}`);
    }
  }

  useEffect(() => {
    probarConexion();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>AI Ticket It</Text>
      <Text>Backend: {API_URL}</Text>
      <Text style={styles.estado}>{estado}</Text>
      <Button title="Reintentar" onPress={probarConexion} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  estado: {
    fontSize: 16,
    textAlign: 'center',
  },
});
