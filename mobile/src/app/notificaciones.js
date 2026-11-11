import { useCallback, useEffect, useRef } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getNotificaciones, marcarNotificacionesLeidas } from '../api/notificaciones.js';
import { useUsuario } from '../context/UsuarioContext.js';
import { useNotificaciones } from '../context/NotificacionesContext.js';
import { useCarga } from '../hooks/useCarga.js';
import { PantallaCarga } from '../components/Carga.js';
import { EstadoCarga } from '../components/EstadoCarga.js';
import { formatCuando } from '../format.js';
import { colors, fontSize, spacing } from '../theme.js';

// Lo que hicieron otros en las compras y los eventos del usuario. Al entrar se marcan
// todas como leídas (la campana vuelve a 0), pero las que eran nuevas siguen resaltadas
// mientras la pantalla está abierta, para que se vea cuáles eran.
export default function Notificaciones() {
  const { usuario } = useUsuario();
  const { actualizar } = useNotificaciones();
  const pedir = useCallback(async () => {
    const lista = await getNotificaciones(usuario.id);
    // "Hoy" y "Ayer" se calculan al pedir, no al dibujar.
    const ahora = Date.now();
    return lista.map((notificacion) => ({ ...notificacion, cuando: formatCuando(notificacion.fecha, ahora) }));
  }, [usuario.id]);
  const { data: notificaciones, loading, error, recargar } = useCarga(pedir);

  // La primera vez que llegan, si había nuevas, se marcan como leídas y se actualiza la campana.
  const marcadas = useRef(false);
  useEffect(() => {
    if (!notificaciones || marcadas.current) return;
    marcadas.current = true;
    if (notificaciones.some((notificacion) => !notificacion.leida)) {
      marcarNotificacionesLeidas(usuario.id).then(actualizar, () => {});
    }
  }, [notificaciones, usuario.id, actualizar]);

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

  const secciones = [
    { titulo: 'Nuevas', data: notificaciones.filter((notificacion) => !notificacion.leida) },
    { titulo: 'Anteriores', data: notificaciones.filter((notificacion) => notificacion.leida) },
  ].filter((seccion) => seccion.data.length > 0);

  return (
    <SectionList
      style={styles.pantalla}
      contentContainerStyle={styles.contenido}
      sections={secciones}
      keyExtractor={(notificacion) => notificacion.id}
      ListHeaderComponent={<Text style={styles.titulo}>Notificaciones</Text>}
      renderSectionHeader={({ section }) => <Text style={styles.seccion}>{section.titulo}</Text>}
      renderItem={({ item }) => (
        <NotificacionFila notificacion={item} onPress={() => abrir(item, usuario)} />
      )}
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={recargar} colors={[colors.primary]} />}
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
