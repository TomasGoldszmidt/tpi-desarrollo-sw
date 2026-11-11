import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Redirect, Tabs, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useUsuario } from '../../context/UsuarioContext.js';
import { Avatar } from '../../components/Avatar.js';
import { MenuCuenta } from '../../components/MenuCuenta.js';
import { Campana } from '../../components/Campana.js';
import { useNotificaciones } from '../../context/NotificacionesContext.js';
import { Logo, Marca } from '../../components/Logo.js';
import { colors, spacing } from '../../theme.js';

// Pestañas de la app, visibles para todos: cualquier usuario puede comprar y organizar.
export default function TabsLayout() {
  const { usuario, cerrarSesion } = useUsuario();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { actualizar } = useNotificaciones();

  // Sin sesión (se cerró, o se recargó la app) se vuelve a iniciar sesión.
  if (!usuario) {
    return <Redirect href="/" />;
  }

  function editarPerfil() {
    setMenuAbierto(false);
    router.push('/perfil');
  }

  function salir() {
    setMenuAbierto(false);
    cerrarSesion();
  }

  return (
    <>
      <Tabs
        // Al entrar a una pestaña se vuelve a preguntar por notificaciones nuevas.
        screenListeners={{ focus: actualizar }}
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          headerTitleAlign: 'left',
          headerTitle: () => (
            <View style={styles.marca}>
              <Logo />
              <Marca />
            </View>
          ),
          headerRight: () => (
            <View style={styles.derecha}>
              <Campana />
              <Pressable
                onPress={() => setMenuAbierto(true)}
                accessibilityLabel={`Tu cuenta (${usuario.nombre} ${usuario.apellido})`}
              >
                <Avatar usuario={usuario} />
              </Pressable>
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="catalogo"
          options={{
            title: 'Catálogo',
            tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="favoritos"
          options={{
            title: 'Favoritos',
            tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="compras"
          options={{
            title: 'Mis compras',
            tabBarIcon: ({ color, size }) => <Ionicons name="ticket-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="eventos"
          options={{
            title: 'Mis eventos',
            tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
          }}
        />
      </Tabs>
      {menuAbierto ? (
        <MenuCuenta
          usuario={usuario}
          onEditarPerfil={editarPerfil}
          onCerrarSesion={salir}
          onCerrar={() => setMenuAbierto(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  derecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginRight: spacing.lg,
  },
});
