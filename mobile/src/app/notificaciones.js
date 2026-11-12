import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getNotificaciones, marcarNotificacionLeida, marcarNotificacionesLeidas } from '../api/notificaciones.js';
import { useUsuario } from '../context/UsuarioContext.js';
import { useNotificaciones } from '../context/NotificacionesContext.js';
import { usePaginado } from '../hooks/usePaginado.js';
import { CargaEncima, PantallaCarga } from '../components/Carga.js';
import { EstadoCarga } from '../components/EstadoCarga.js';
import { PieLista } from '../components/PieLista.js';
import { formatCuando } from '../format.js';
import { colors, fontSize, spacing } from '../theme.js';

// Notificaciones por página: se pide la siguiente al acercarse al final de la lista.
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
            <Text style={styles.titulo}>Notificaciones</Text>
            {hayNuevas ? (
              <Pressable
                style={({ pressed }) => [styles.marcarTodas, pressed && styles.presionada]}
                onPress={marcarTodas}
                disabled={marcandoTodas}
              >
                <Ionicons name="checkmark-done" size={18} color={colors.primaryText} />
                <Text style={styles.marcarTodasTexto}>Marcar todas como leídas</Text>
              </Pressable>
            ) : null}
            {errorMarcar ? <Text style={styles.error}>{errorMarcar}</Text> : null}
          </View>
        }
        renderSectionHeader={({ section }) => <Text style={styles.seccion}>{section.titulo}</Text>}
        renderItem={({ item }) => (
          <NotificacionFila notificacion={item} onPress={() => abrirNotificacion(item)} />
        )}
        stickySectionHeadersEnabled={false}
        onEndReached={cargarMas}
        // Las filas son cortas: con un umbral más grande la segunda página se pediría al abrir.
        onEndReachedThreshold={0.1}
        refreshControl={<RefreshControl refreshing={recargando} onRefresh={recargar} colors={[colors.primary]} />}
        ListFooterComponent={
          <PieLista
            cargandoMas={cargandoMas}
            errorMas={errorMas}
            hayMas={hayMas}
            varias={total > LIMITE}
            onReintentar={cargarMas}
            cargando="Cargando más notificaciones…"
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

// Ícono y colores de cada tipo; los cambios de estado según el estado nuevo.
const ICONOS = {
  MENSAJE: { nombre: 'chatbubble-outline', fondo: '#E6F1FB', color: '#0C447C' },
  COMPRA: { nombre: 'ticket-outline', fondo: '#EAF3DE', color: '#27500A' },
  CONFIRMADA: { nombre: 'checkmark', fondo: '#EAF3DE', color: '#27500A' },
  UTILIZADA: { nombre: 'checkmark-done', fondo: '#F1EFE8', color: '#444441' },
  CANCELADA: { nombre: 'arrow-undo-outline', fondo: '#FCEBEB', color: '#791F1F' },
  REEMBOLSADA: { nombre: 'arrow-undo-outline', fondo: '#FCEBEB', color: '#791F1F' },
  RESENIA: { nombre: 'star-outline', fondo: '#FAEEDA', color: '#633806' },
};

// El texto de la notificación: las partes en negrita son quién y el evento.
function partes(notificacion) {
  const { tipo, estado, compra } = notificacion;
  const entradas = compra ? `${compra.cantidad} ${compra.tipoEntrada}` : '';
  if (tipo === 'MENSAJE') return ['te escribió sobre', `: “${notificacion.mensaje}”`];
  if (tipo === 'RESENIA') {
    const estrellas = notificacion.puntuacion === 1 ? '1 estrella' : `${notificacion.puntuacion} estrellas`;
    return ['reseñó', ` con ${estrellas}`];
  }
  if (tipo === 'COMPRA') return [`compró ${entradas} para`, ''];
  if (estado === 'CONFIRMADA') return [`pagó ${entradas} para`, ''];
  if (estado === 'CANCELADA') return ['canceló su compra de', ''];
  if (estado === 'REEMBOLSADA') return ['canceló su compra de', ' y se le reembolsó'];
  if (estado === 'UTILIZADA') return ['marcó como utilizada tu compra de', ''];
  return ['cambió la compra de', ''];
}

function NotificacionFila({ notificacion, onPress }) {
  const icono = ICONOS[notificacion.tipo === 'CAMBIO_ESTADO' ? notificacion.estado : notificacion.tipo] ?? ICONOS.COMPRA;
  const [antes, despues] = partes(notificacion);
  const nueva = !notificacion.leida;
  return (
    <Pressable
      style={({ pressed }) => [styles.fila, nueva && styles.nueva, pressed && styles.presionada]}
      onPress={onPress}
    >
      <View style={[styles.icono, { backgroundColor: icono.fondo }]}>
        <Ionicons name={icono.nombre} size={16} color={icono.color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.texto}>
          <Text style={styles.fuerte}>
            {notificacion.de.nombre} {notificacion.de.apellido}
          </Text>{' '}
          {antes} <Text style={styles.fuerte}>{notificacion.evento.nombre}</Text>
          <Text style={notificacion.tipo === 'MENSAJE' ? styles.cita : null}>{despues}</Text>
        </Text>
        <Text style={styles.cuando}>{notificacion.cuando}</Text>
      </View>
      {nueva ? <View style={styles.punto} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: spacing.lg,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  titulo: {
    color: colors.text,
    fontSize: fontSize.title,
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
    color: colors.textMuted,
    fontSize: fontSize.small,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  nueva: {
    backgroundColor: colors.primarySoft,
  },
  presionada: {
    opacity: 0.7,
  },
  icono: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  texto: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: 19,
  },
  fuerte: {
    fontWeight: 'bold',
  },
  cita: {
    color: colors.textSecondary,
  },
  cuando: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    alignSelf: 'center',
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
