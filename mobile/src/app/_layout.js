import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UsuarioProvider } from '../context/UsuarioContext.js';

export default function RootLayout() {
  return (
    <UsuarioProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="dark" />
    </UsuarioProvider>
  );
}
