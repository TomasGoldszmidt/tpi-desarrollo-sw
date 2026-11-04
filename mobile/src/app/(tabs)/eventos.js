import { useCallback, useRef } from 'react';
import { Image, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getEventosOrganizador } from '../../api/usuarios.js';
import { useUsuario } from '../../context/UsuarioContext.js';
import { useCarga } from '../../hooks/useCarga.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { Seccion } from '../../components/Seccion.js';
import { estiloEsperando } from '../../components/AvisoMensaje.js';
import { formatFecha } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Casos de uso 2 y 4: los eventos que organiza el usuario activo, para entrar a las
// ventas de cada uno, y el botón para crear uno nuevo.
export default function Eventos() {
  const { usuario } = useUsuario();
  const pedir = useCallback(() => getEventosOrganizador(usuario.id), [usuario.id]);
  const { data: eventos, loading, error, recargar } = useCarga(pedir);

  // Se vuelve a pedir al volver a la pestaña, así aparece un evento recién creado.
  // La primera vez ya lo pide useCarga.
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

  return (
    <Seccion titulo="Mis eventos">
      <Pressable style={styles.boton} onPress={() => router.push('/eventos/nuevo')}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.botonTexto}>Crear evento</Text>
      </Pressable>
      {error || !eventos ? (
        <EstadoCarga loading={loading} error={error} onRetry={recargar} mensaje="Cargando tus eventos…" />
      ) : (
        <SectionList
          sections={separarPorFecha(eventos)}
          keyExtractor={(evento) => String(evento.id)}
          renderSectionHeader={({ section }) => <Text style={styles.seccion}>{section.titulo}</Text>}
          renderItem={({ item, section }) => (
            <EventoFila
              evento={item}
              realizado={section.realizados}
              onPress={() => router.push(`/eventos/${item.id}/ventas`)}
            />
          )}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={recargar} colors={[colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Text style={styles.vacioTexto}>Todavía no organizaste ningún evento.</Text>
            </View>
          }
        />
      )}
    </Seccion>
  );
}

// La API los devuelve ordenados por fecha: primero los próximos y al final los ya realizados.
function separarPorFecha(eventos) {
  const ahora = Date.now();
  const proximos = eventos.filter((evento) => new Date(evento.fecha).getTime() >= ahora);
  const realizados = eventos.filter((evento) => new Date(evento.fecha).getTime() < ahora);
  return [
    { titulo: 'Próximos', realizados: false, data: proximos },
    { titulo: 'Ya realizados', realizados: true, data: realizados },
  ].filter((seccion) => seccion.data.length > 0);
}

function EventoFila({ evento, realizado, onPress }) {
  // Del lugar se muestra solo el nombre, sin la dirección.
  const lugar = evento.lugar.split(',')[0];
  // Compras del evento cuyo chat espera la respuesta del organizador (lo calcula el backend).
  const { sinResponder } = evento;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        sinResponder > 0 && estiloEsperando,
        realizado && styles.realizado,
        pressed && styles.presionada,
      ]}
      onPress={onPress}
    >
      {evento.imagen ? (
        <Image source={{ uri: evento.imagen }} style={styles.imagen} />
      ) : (
        <View style={styles.imagen} />
      )}
      <View style={styles.info}>
        <Text style={styles.categoria}>{evento.categoria.nombre}</Text>
        <Text style={styles.nombre}>{evento.nombre}</Text>
        <Text style={styles.meta}>
          {formatFecha(evento.fecha)} · {lugar}
        </Text>
        {sinResponder > 0 ? (
          <View style={styles.pendientes}>
            <View style={styles.punto} />
            <Text style={styles.pendientesTexto}>
              {sinResponder === 1 ? '1 compra espera tu respuesta' : `${sinResponder} compras esperan tu respuesta`}
            </Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  seccion: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  realizado: {
    opacity: 0.75,
  },
  presionada: {
    backgroundColor: colors.primarySoft,
  },
  imagen: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  categoria: {
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: 'bold',
  },
  nombre: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  pendientes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  pendientesTexto: {
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: 'bold',
  },
  vacio: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
  },
  vacioTexto: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
});
