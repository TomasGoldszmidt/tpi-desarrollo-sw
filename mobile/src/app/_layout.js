import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UsuarioProvider } from '../context/UsuarioContext.js';
import { Logo, Marca } from '../components/Logo.js';
import { colors, spacing } from '../theme.js';

// Header de las pantallas que se abren por encima de las pestañas: flecha para volver y el logo.
const conHeader = {
  headerShown: true,
  headerTintColor: colors.primary,
  headerBackButtonDisplayMode: 'minimal',
  headerTitleAlign: 'left',
  headerTitle: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Logo />
      <Marca />
    </View>
  ),
};

export default function RootLayout() {
  return (
    <UsuarioProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="eventos/[id]" options={conHeader} />
        <Stack.Screen name="eventos/[id]/comprar" options={conHeader} />
        <Stack.Screen name="usuarios/[id]/resenias" options={conHeader} />
      </Stack>
      <StatusBar style="dark" />
    </UsuarioProvider>
  );
}
