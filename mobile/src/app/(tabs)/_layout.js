import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Redirect, Tabs, router } from 'expo-router';
import { useUsuario } from '../../context/UsuarioContext.js';
import { Avatar } from '../../components/Avatar.js';
import { MenuCuenta } from '../../components/MenuCuenta.js';
import { Campana } from '../../components/Campana.js';
import { useNotificaciones } from '../../context/NotificacionesContext.js';
import { useLayout } from '../../hooks/useLayout.js';
import { LogoConMarca } from '../../components/LogoConMarca.js';
import { TabIcon } from '../../components/TabIcon.js';
import { colors, spacing, TOQUE_MINIMO } from '../../theme.js';

// Ícono de cada pestaña: lleno cuando está elegida, de línea cuando no.
function icono(lleno, linea) {
  return function tabBarIcon(props) {
    return <TabIcon lleno={lleno} linea={linea} {...props} />;
  };
}

// Pestañas de la app, visibles para todos: cualquier usuario puede comprar y organizar.
// En teléfono y tablet vertical van abajo; en tablet horizontal (900 o más) pasan a una
// barra a la izquierda.
export default function TabsLayout() {
  const { usuario, cerrarSesion } = useUsuario();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { actualizar } = useNotificaciones();
  const { esAncho } = useLayout();

  // Sin sesión (se cerró, o se recargó la app) se vuelve a iniciar sesión.
  if (!usuario) {
    return <Redirect href="/" />;
  }

  function ir(ruta) {
    setMenuAbierto(false);
    router.push(ruta);
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
          tabBarPosition: esAncho ? 'left' : 'bottom',
          tabBarVariant: esAncho ? 'material' : 'uikit',
          tabBarActiveTintColor: colors.primaryText,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarActiveBackgroundColor: esAncho ? colors.primarySoft : undefined,
          tabBarLabelStyle: styles.etiqueta,
          tabBarStyle: esAncho ? styles.barraLateral : styles.barra,
          headerTitleAlign: 'left',
          headerShadowVisible: false,
          headerStyle: styles.header,
          headerTitle: () => <LogoConMarca />,
          headerRight: () => (
            <View style={styles.derecha}>
              <Campana />
              <Pressable
                style={styles.cuenta}
                onPress={() => setMenuAbierto(true)}
                accessibilityRole="button"
                accessibilityLabel={`Tu cuenta (${usuario.nombre} ${usuario.apellido})`}
              >
                <Avatar usuario={usuario} size={34} />
              </Pressable>
            </View>
          ),
        }}
      >
        <Tabs.Screen name="catalogo" options={{ title: 'Catálogo', tabBarIcon: icono('search', 'search-outline') }} />
        <Tabs.Screen name="favoritos" options={{ title: 'Favoritos', tabBarIcon: icono('heart', 'heart-outline') }} />
        <Tabs.Screen name="compras" options={{ title: 'Mis compras', tabBarIcon: icono('ticket', 'ticket-outline') }} />
        <Tabs.Screen name="eventos" options={{ title: 'Mis eventos', tabBarIcon: icono('calendar', 'calendar-outline') }} />
      </Tabs>
      {menuAbierto ? (
        <MenuCuenta
          usuario={usuario}
          onEditarPerfil={() => ir('/perfil')}
          onVerResenias={() => ir(`/usuarios/${usuario.id}/resenias`)}
          onCerrarSesion={salir}
          onCerrar={() => setMenuAbierto(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  derecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  cuenta: {
    width: TOQUE_MINIMO,
    height: TOQUE_MINIMO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etiqueta: {
    fontSize: 12,
  },
  barra: {
    borderTopColor: colors.borderSoft,
  },
  barraLateral: {
    borderRightColor: colors.borderSoft,
    width: 104,
  },
});
