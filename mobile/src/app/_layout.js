import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UsuarioProvider, useUsuario } from '../context/UsuarioContext.js';
import { FavoritosProvider } from '../context/FavoritosContext.js';
import { NotificacionesProvider } from '../context/NotificacionesContext.js';
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

// Los favoritos y las notificaciones dependen del usuario: con key, al cambiar de sesión
// arrancan de cero.
function ConFavoritos({ children }) {
  const { usuario } = useUsuario();
  const key = usuario?.id ?? 'sin-sesion';
  return (
    <FavoritosProvider key={`favoritos-${key}`}>
      <NotificacionesProvider key={`notificaciones-${key}`}>{children}</NotificacionesProvider>
    </FavoritosProvider>
  );
}

export default function RootLayout() {
  return (
    <UsuarioProvider>
      <ConFavoritos>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="registro" options={conHeader} />
          <Stack.Screen name="perfil" options={conHeader} />
          <Stack.Screen name="notificaciones" options={conHeader} />
          <Stack.Screen name="eventos/nuevo" options={conHeader} />
          <Stack.Screen name="eventos/[id]" options={conHeader} />
          <Stack.Screen name="eventos/[id]/comprar" options={conHeader} />
          <Stack.Screen name="eventos/[id]/ventas" options={conHeader} />
          <Stack.Screen name="usuarios/[id]/resenias" options={conHeader} />
          <Stack.Screen name="compras/[id]" options={conHeader} />
          <Stack.Screen name="compras/[id]/chat" options={conHeader} />
        </Stack>
      </ConFavoritos>
      <StatusBar style="dark" />
    </UsuarioProvider>
  );
}
