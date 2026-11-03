import { Pressable, StyleSheet, View } from 'react-native';
import { Redirect, Tabs, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useUsuario } from '../../context/UsuarioContext.js';
import { Avatar } from '../../components/Avatar.js';
import { Logo, Marca } from '../../components/Logo.js';
import { colors, spacing } from '../../theme.js';

// Pestañas de la app, visibles para todos: cualquier usuario puede comprar y organizar.
export default function TabsLayout() {
  const { usuario } = useUsuario();

  // Sin usuario activo (ej: se recargó la app) se vuelve a elegir.
  if (!usuario) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
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
          <Pressable
            style={styles.usuario}
            onPress={() => router.replace('/')}
            accessibilityLabel={`Cambiar de usuario (${usuario.nombre} ${usuario.apellido})`}
          >
            <Avatar usuario={usuario} />
          </Pressable>
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
  );
}

const styles = StyleSheet.create({
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  usuario: {
    marginRight: spacing.lg,
  },
});
