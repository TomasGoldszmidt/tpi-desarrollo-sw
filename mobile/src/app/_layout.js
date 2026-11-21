import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UsuarioProvider } from '../context/UsuarioContext.js';
import { AvisosProvider } from '../context/AvisosContext.js';
import { ConFavoritos } from '../components/ConFavoritos.js';
import { LogoConMarca } from '../components/LogoConMarca.js';
import { colors } from '../theme.js';

// Header de las pantallas que se abren por encima de las pestañas: flecha para volver y el logo.
const conHeader = {
  headerShown: true,
  headerTintColor: colors.primary,
  headerBackButtonDisplayMode: 'minimal',
  headerTitleAlign: 'left',
  headerTitle: () => <LogoConMarca />,
};

export default function RootLayout() {
  return (
    <UsuarioProvider>
      <AvisosProvider>
      <ConFavoritos>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="registro" options={conHeader} />
          <Stack.Screen name="perfil" options={conHeader} />
          <Stack.Screen name="notificaciones" options={conHeader} />
          <Stack.Screen name="eventos/nuevo" options={conHeader} />
          <Stack.Screen name="eventos/[id]" options={conHeader} />
          <Stack.Screen name="eventos/[id]/comprar" options={conHeader} />
          <Stack.Screen name="eventos/[id]/ventas" options={conHeader} />
          <Stack.Screen name="eventos/[id]/mensajes" options={conHeader} />
          <Stack.Screen name="usuarios/[id]/resenias" options={conHeader} />
          <Stack.Screen name="compras/[id]" options={conHeader} />
          <Stack.Screen name="compras/[id]/chat" options={conHeader} />
        </Stack>
      </ConFavoritos>
      </AvisosProvider>
      <StatusBar style="dark" />
    </UsuarioProvider>
  );
}
