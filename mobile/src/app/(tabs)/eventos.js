import { useCallback, useRef, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getEventosOrganizador } from '../../api/usuarios.js';
import { useUsuario } from '../../context/UsuarioContext.js';
import { usePaginado } from '../../hooks/usePaginado.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { FiltroChips } from '../../components/FiltroChips.js';
import { PieLista } from '../../components/PieLista.js';
import { Seccion } from '../../components/Seccion.js';
import { estiloEsperando } from '../../components/AvisoMensaje.js';
import { formatFecha } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Eventos por página: las siguientes se piden con "Ver más".
const LIMITE = 10;

// Casos de uso 2 y 4: los eventos que organiza el usuario activo, para entrar a las
// ventas de cada uno, y el botón para crear uno nuevo. Vienen de a páginas, primero los
// próximos y después los realizados, con chips para filtrarlos (los cuenta el backend).
export default function Eventos() {
  const { usuario } = useUsuario();
  // Chip elegido (null = Todos). Se mantiene al recargar y al volver a la pestaña.
  const [filtro, setFiltro] = useState(null);
  const pedirPagina = useCallback(async (pagina) => {
    const respuesta = await getEventosOrganizador(usuario.id, { filtro, pagina, limite: LIMITE });
    // Si ya se realizó se calcula al pedir y no al dibujar, que tiene que dar siempre lo mismo.
    const ahora = Date.now();
    const resultados = respuesta.resultados
      .map((evento) => ({ ...evento, realizado: new Date(evento.fecha).getTime() < ahora }));
    return { ...respuesta, resultados };
  }, [usuario.id, filtro]);
  // Otro chip arranca de nuevo desde la página 1.
  const {
    items: eventos, total, hayMas, extra, loading, recargando, error, cargandoMas, errorMas, cargarMas, recargar,
  } = usePaginado(pedirPagina);

  // Se vuelve a pedir al volver a la pestaña, así aparece un evento recién creado y se
  // actualizan los chats con mensajes nuevos. La primera vez ya lo pide usePaginado.
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
      {extra.cantidades && extra.cantidades.todos > 0 ? (
        <FiltroChips opciones={opcionesFiltro(extra.cantidades, filtro)} elegido={filtro} onElegir={setFiltro} />
      ) : null}
      {(loading && !recargando) || error || !eventos ? (
        <EstadoCarga loading={loading} error={error} onRetry={recargar} mensaje="Cargando tus eventos…" />
      ) : (
        <FlatList
          data={eventos}
          keyExtractor={(evento) => String(evento.id)}
          renderItem={({ item }) => (
            <EventoFila
              evento={item}
              realizado={item.realizado}
              onPress={() => router.push(`/eventos/${item.id}/ventas`)}
            />
          )}
          refreshControl={<RefreshControl refreshing={recargando} onRefresh={recargar} colors={[colors.primary]} />}
          ListFooterComponent={
            <PieLista
              cargandoMas={cargandoMas}
              errorMas={errorMas}
              hayMas={hayMas}
              varias={total > LIMITE}
              onVerMas={cargarMas}
              restantes={total - (eventos?.length ?? 0)}
              fin={`Ya viste los ${total} eventos`}
            />
          }
          ListEmptyComponent={
            filtro ? (
              <View style={styles.vacio}>
                <Text style={styles.vacioTexto}>No tenés eventos con este filtro.</Text>
                <Pressable style={styles.botonVerTodos} onPress={() => setFiltro(null)}>
                  <Text style={styles.botonVerTodosTexto}>Ver todos</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.vacio}>
                <Text style={styles.vacioTexto}>Todavía no organizaste ningún evento.</Text>
              </View>
            )
          }
        />
      )}
    </Seccion>
  );
}

// Los chips, con las cantidades que manda el backend. "Con mensajes nuevos" solo aparece
// si hay alguno o si está elegido.
function opcionesFiltro(cantidades, elegido) {
  const opciones = [
    { valor: null, texto: 'Todos', cantidad: cantidades.todos },
    { valor: 'proximos', texto: 'Próximos', cantidad: cantidades.proximos },
    { valor: 'realizados', texto: 'Ya realizados', cantidad: cantidades.realizados },
  ];
  if (cantidades.conMensajesNuevos > 0 || elegido === 'conMensajesNuevos') {
    opciones.push({
      valor: 'conMensajesNuevos',
      texto: 'Con mensajes nuevos',
      cantidad: cantidades.conMensajesNuevos,
      punto: colors.danger,
      puntoActivo: '#FFFFFF',
    });
  }
  return opciones;
}

function EventoFila({ evento, realizado, onPress }) {
  // Del lugar se muestra solo el nombre, sin la dirección.
  const lugar = evento.lugar.split(',')[0];
  // Compras del evento con mensajes que el organizador no leyó (lo calcula el backend).
  const { conMensajesNoLeidos } = evento;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        conMensajesNoLeidos > 0 && estiloEsperando,
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
        {conMensajesNoLeidos > 0 ? (
          <View style={styles.pendientes}>
            <View style={styles.punto} />
            <Text style={styles.pendientesTexto}>
              {conMensajesNoLeidos === 1 ? '1 chat con mensajes nuevos' : `${conMensajesNoLeidos} chats con mensajes nuevos`}
            </Text>
          </View>
        ) : null}
      </View>
      {/* Abre los mensajes del evento sin pasar por Ventas; el número es cuántos chats tienen mensajes nuevos. */}
      <Pressable
        style={styles.mensajes}
        onPress={() => router.push(`/eventos/${evento.id}/mensajes`)}
        hitSlop={6}
        accessibilityLabel={conMensajesNoLeidos > 0 ? `Mensajes, ${conMensajesNoLeidos} con mensajes nuevos` : 'Mensajes'}
      >
        <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
        {conMensajesNoLeidos > 0 ? (
          <View style={styles.numero}>
            <Text style={styles.numeroTexto}>{conMensajesNoLeidos}</Text>
          </View>
        ) : null}
      </Pressable>
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
    marginBottom: spacing.md,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: fontSize.body,
    fontWeight: 'bold',
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
  mensajes: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
  },
  numero: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#E24B4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
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
  botonVerTodos: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  botonVerTodosTexto: {
    color: colors.primaryText,
    fontSize: fontSize.body,
  },
});
