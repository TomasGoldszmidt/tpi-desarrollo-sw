import { useCallback, useRef, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { Boton } from '../components/Boton.js';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getNotificaciones, marcarNotificacionLeida, marcarNotificacionesLeidas } from '../api/notificaciones.js';
import { useUsuario } from '../context/UsuarioContext.js';
import { useNotificaciones } from '../context/NotificacionesContext.js';
import { usePaginado } from '../hooks/usePaginado.js';
import { CargaEncima } from '../components/CargaEncima.js';
import { PantallaCarga } from '../components/PantallaCarga.js';
import { EstadoCarga } from '../components/EstadoCarga.js';
import { PieLista } from '../components/PieLista.js';
import { NotificacionFila } from '../components/notificaciones/NotificacionFila.js';
import { formatCuando } from '../format.js';
import { colors, fontSize, spacing } from '../theme.js';

// Notificaciones por página: las siguientes se piden con "Ver más".
const LIMITE = 10;

// Lo que hicieron otros en las compras y los eventos del usuario. Cada notificación nueva
// se marca como leída al abrirla; el botón de arriba las marca todas. Al volver de lo que
// se abrió, la lista se vuelve a pedir y la que se leyó pasa a Anteriores.
// Vienen de a páginas, con las nuevas primero: las páginas siguientes solo suman Anteriores.
export default function Notificaciones() {
  const { usuario } = useUsuario();
  const { actualizar } = useNotificaciones();
  const pedirPagina = useCallback(async (pagina) => {
    const respuesta = await getNotificaciones(usuario.id, { pagina, limite: LIMITE });
    // "Hoy" y "Ayer" se calculan al pedir, no al dibujar.
    const ahora = Date.now();
    const resultados = respuesta.resultados
      .map((notificacion) => ({ ...notificacion, cuando: formatCuando(notificacion.fecha, ahora) }));
    return { ...respuesta, resultados };
  }, [usuario.id]);
  const {
    items: notificaciones, total, hayMas, extra, loading, recargando, error, cargandoMas, errorMas, cargarMas, recargar,
  } = usePaginado(pedirPagina);

  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [errorMarcar, setErrorMarcar] = useState(null);

  // Al volver de una notificación abierta se vuelve a pedir (la primera vez ya pide useCarga).
  const primeraVez = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeraVez.current) {
        primeraVez.current = false;
        return;
      }
      recargar();
    }, [recargar]),
  );

  // Se abre enseguida y se marca por detrás: si falla (sin conexión), la próxima vez sigue como nueva.
  function abrirNotificacion(notificacion) {
    if (!notificacion.leida) {
      marcarNotificacionLeida(usuario.id, notificacion.id).then(actualizar, () => {});
    }
    abrir(notificacion, usuario);
  }

  async function marcarTodas() {
    setMarcandoTodas(true);
    setErrorMarcar(null);
    try {
      await marcarNotificacionesLeidas(usuario.id);
      recargar();
      actualizar();
    } catch (e) {
      setErrorMarcar(e.message);
    } finally {
      setMarcandoTodas(false);
    }
  }

  if (loading && !notificaciones) {
    return <PantallaCarga mensaje="Cargando tus notificaciones…" />;
  }
  if (error || !notificaciones) {
    return (
      <View style={styles.centrado}>
        <EstadoCarga loading={loading} error={error} onRetry={recargar} />
      </View>
    );
  }

  // Según todas las nuevas, no solo las cargadas.
  const hayNuevas = extra.noLeidas > 0;
  const secciones = [
    { titulo: 'Nuevas', data: notificaciones.filter((notificacion) => !notificacion.leida) },
    { titulo: 'Anteriores', data: notificaciones.filter((notificacion) => notificacion.leida) },
  ].filter((seccion) => seccion.data.length > 0);

  return (
    <View style={styles.pantalla}>
      <SectionList
        style={styles.pantalla}
        contentContainerStyle={styles.contenido}
        sections={secciones}
        keyExtractor={(notificacion) => notificacion.id}
        ListHeaderComponent={
          <View>
            <Stack.Screen
              options={{
                // "Marcar todas" es una acción chica de la barra de arriba: no empuja la lista.
                headerRight: hayNuevas
                  ? () => (
                    <Boton
                      titulo="Marcar todas"
                      variante="texto"
                      chico
                      icono="checkmark-done"
                      onPress={marcarTodas}
                      disabled={marcandoTodas}
                      accessibilityLabel="Marcar todas como leídas"
                    />
                  )
                  : undefined,
              }}
            />
            <Text style={styles.titulo}>Notificaciones</Text>
            {errorMarcar ? <Text style={styles.error}>{errorMarcar}</Text> : null}
          </View>
        }
        renderSectionHeader={({ section }) => <Text style={styles.seccion}>{section.titulo}</Text>}
        renderItem={({ item }) => (
          <NotificacionFila notificacion={item} onPress={() => abrirNotificacion(item)} />
        )}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={recargando} onRefresh={recargar} colors={[colors.primary]} />}
        ListFooterComponent={
          <PieLista
            cargandoMas={cargandoMas}
            errorMas={errorMas}
            hayMas={hayMas}
            varias={total > LIMITE}
            onVerMas={cargarMas}
            restantes={total - (notificaciones?.length ?? 0)}
            fin={`Ya viste las ${total} notificaciones`}
          />
        }
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Ionicons name="notifications-outline" size={36} color={colors.textMuted} />
            <Text style={styles.vacioTitulo}>No tenés notificaciones</Text>
            <Text style={styles.vacioTexto}>
              Acá vas a ver los mensajes y los cambios de tus compras y de tus eventos.
            </Text>
          </View>
        }
      />
      {marcandoTodas ? <CargaEncima mensaje="Marcando como leídas…" /> : null}
    </View>
  );
}

// Cada notificación abre lo que la originó: el chat, la compra o las reseñas.
function abrir(notificacion, usuario) {
  if (notificacion.tipo === 'RESENIA') {
    router.push(`/usuarios/${usuario.id}/resenias`);
  } else if (notificacion.tipo === 'MENSAJE') {
    router.push({
      pathname: '/compras/[id]/chat',
      params: {
        id: notificacion.compra.id,
        evento: notificacion.evento.nombre,
        con: `${notificacion.de.nombre} ${notificacion.de.apellido}`,
      },
    });
  } else {
    router.push(`/compras/${notificacion.compra.id}`);
  }
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: spacing.lg,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  titulo: {
    color: colors.text,
    fontSize: fontSize.headline,
    fontWeight: 'bold',
  },
  marcarTodas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  marcarTodasTexto: {
    color: colors.primaryText,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  error: {
    backgroundColor: '#FCEBEB',
    color: '#791F1F',
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.sm,
    fontSize: fontSize.body,
    overflow: 'hidden',
  },
  seccion: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  vacio: {
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.xs,
  },
  vacioTitulo: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  vacioTexto: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
});
