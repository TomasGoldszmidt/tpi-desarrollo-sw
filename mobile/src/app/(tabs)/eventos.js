import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getEventosOrganizador } from '../../api/usuarios.js';
import { useUsuario } from '../../context/UsuarioContext.js';
import { usePaginado } from '../../hooks/usePaginado.js';
import { useLayout } from '../../hooks/useLayout.js';
import { Boton } from '../../components/Boton.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { FiltroChips } from '../../components/FiltroChips.js';
import { PieLista } from '../../components/PieLista.js';
import { Seccion } from '../../components/Seccion.js';
import { EventoFila } from '../../components/misEventos/EventoFila.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Eventos por página: las siguientes se piden con "Ver más".
const LIMITE = 10;

// Casos de uso 2 y 4: los eventos que organiza el usuario activo, para entrar a las ventas
// de cada uno, y "Crear" junto al título. Vienen de a páginas, primero los próximos y después
// los realizados (con su etiqueta), con chips para filtrarlos. En tablet van en grilla.
export default function Eventos() {
  const { usuario } = useUsuario();
  const { columnas } = useLayout();
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
    <Seccion
      titulo="Mis eventos"
      accion={<Boton titulo="Crear" icono="add" chico onPress={() => router.push('/eventos/nuevo')} accessibilityLabel="Crear evento" />}
    >
      {extra.cantidades && extra.cantidades.todos > 0 ? (
        <FiltroChips opciones={opcionesFiltro(extra.cantidades, filtro)} elegido={filtro} onElegir={setFiltro} />
      ) : null}
      {(loading && !recargando) || error || !eventos ? (
        <EstadoCarga loading={loading} error={error} onRetry={recargar} mensaje="Cargando tus eventos…" />
      ) : (
        <FlatList
          key={`columnas-${columnas}`}
          data={eventos}
          numColumns={columnas}
          columnWrapperStyle={columnas > 1 ? styles.filaGrilla : undefined}
          keyExtractor={(evento) => String(evento.id)}
          renderItem={({ item }) => (
            <View style={columnas > 1 ? [styles.celda, { maxWidth: `${100 / columnas}%` }] : null}>
              <EventoFila evento={item} onPress={() => router.push(`/eventos/${item.id}/ventas`)} />
            </View>
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
                <Boton titulo="Ver todos" variante="secundario" chico onPress={() => setFiltro(null)} style={styles.centrado} />
              </View>
            ) : (
              <View style={styles.vacio}>
                <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
                <Text style={styles.vacioTitulo}>Todavía no organizaste ningún evento</Text>
                <Text style={styles.vacioTexto}>Creá uno con sus tipos de entrada, precios y cupos.</Text>
                <Boton titulo="Crear evento" icono="add" chico onPress={() => router.push('/eventos/nuevo')} style={styles.centrado} />
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
    { valor: 'realizados', texto: 'Realizados', cantidad: cantidades.realizados },
  ];
  if (cantidades.conMensajesNuevos > 0 || elegido === 'conMensajesNuevos') {
    opciones.push({
      valor: 'conMensajesNuevos',
      texto: 'Con mensajes nuevos',
      cantidad: cantidades.conMensajesNuevos,
      punto: colors.primary,
      puntoActivo: '#FFFFFF',
    });
  }
  return opciones;
}

const styles = StyleSheet.create({
  filaGrilla: {
    gap: spacing.md,
  },
  celda: {
    flex: 1,
  },
  vacio: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.xs,
  },
  vacioTitulo: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  vacioTexto: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
  centrado: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
});
