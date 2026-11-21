import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { buscarEventos } from '../../api/eventos.js';
import { getCategorias } from '../../api/categorias.js';
import { useCarga } from '../../hooks/useCarga.js';
import { usePaginado } from '../../hooks/usePaginado.js';
import { useLayout } from '../../hooks/useLayout.js';
import { Boton } from '../../components/Boton.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { EventoCard } from '../../components/EventoCard.js';
import { FiltroChips } from '../../components/FiltroChips.js';
import { PieLista } from '../../components/PieLista.js';
import { FiltrosModal } from '../../components/FiltrosModal.js';
import { ORDENES, OpcionesOrden } from '../../components/OpcionesOrden.js';
import { PRECIOS, OpcionesPrecio } from '../../components/OpcionesPrecio.js';
import { colors, fontSize, spacing } from '../../theme.js';

const ORDEN_POR_DEFECTO = ORDENES[0].valor;
const PRECIO_POR_DEFECTO = PRECIOS[0].valor;
// Espera después de la última tecla antes de buscar, para no pedir por cada letra.
const ESPERA_BUSQUEDA_MS = 500;
// Eventos por página: las siguientes se piden con "Ver más".
const LIMITE = 10;
const FILTROS_INICIALES = { categoriaId: null, orden: ORDEN_POR_DEFECTO, precio: PRECIO_POR_DEFECTO };

// Casos de uso 3 y 11: buscar eventos por texto o categoría y ordenarlos.
// Las categorías están a la vista como chips (un toque), y el orden y el precio en una hoja
// que se abre con "Ordenar". En tablet horizontal todo eso queda en un panel a la izquierda.
export default function Catalogo() {
  const { esAncho, columnas } = useLayout();
  const [texto, setTexto] = useState('');
  const [textoBuscado, setTextoBuscado] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTextoBuscado(texto), ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(timer);
  }, [texto]);

  const { data: categorias } = useCarga(getCategorias);
  const pedirEventos = useCallback(
    (pagina) => {
      const { precioMin, precioMax } = PRECIOS.find((p) => p.valor === filtros.precio);
      return buscarEventos({
        texto: textoBuscado, categoriaId: filtros.categoriaId, orden: filtros.orden, precioMin, precioMax, pagina, limite: LIMITE,
      });
    },
    [textoBuscado, filtros],
  );
  // Otra búsqueda u otros filtros arrancan de nuevo desde la página 1.
  const {
    items: eventos, total, hayMas, loading, recargando, error, cargandoMas, errorMas, cargarMas, recargar,
  } = usePaginado(pedirEventos);

  const orden = ORDENES.find((o) => o.valor === filtros.orden);
  const precio = PRECIOS.find((p) => p.valor === filtros.precio);
  const cambiar = (cambios) => setFiltros((anteriores) => ({ ...anteriores, ...cambios }));

  function limpiarTodo() {
    setTexto('');
    setTextoBuscado('');
    setFiltros(FILTROS_INICIALES);
  }

  const buscador = (
    <View style={styles.buscador}>
      <Ionicons name="search" size={20} color={colors.textMuted} />
      <TextInput
        style={styles.input}
        value={texto}
        onChangeText={setTexto}
        placeholder="Buscar eventos, lugares…"
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        onSubmitEditing={() => setTextoBuscado(texto)}
        accessibilityLabel="Buscar"
      />
      {texto ? (
        <Pressable style={styles.borrar} onPress={() => setTexto('')} accessibilityRole="button" accessibilityLabel="Borrar búsqueda">
          <Ionicons name="close-circle" size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );

  const opcionesCategoria = [{ id: null, nombre: 'Todas' }, ...(categorias ?? [])];

  const lista =
    (loading && !recargando) || error || !eventos ? (
      <EstadoCarga loading={loading} error={error} onRetry={recargar} mensaje="Buscando eventos…" />
    ) : (
      <FlatList
        key={`columnas-${columnas}`}
        data={eventos}
        numColumns={columnas}
        columnWrapperStyle={columnas > 1 ? styles.filaGrilla : undefined}
        contentContainerStyle={styles.listaContenido}
        keyExtractor={(evento) => String(evento.id)}
        renderItem={({ item }) => (
          <View style={columnas > 1 ? [styles.celda, { maxWidth: `${100 / columnas}%` }] : null}>
            <EventoCard
              evento={item}
              variante={columnas > 1 ? 'tarjeta' : 'fila'}
              onPress={() => router.push(`/eventos/${item.id}`)}
            />
          </View>
        )}
        keyboardShouldPersistTaps="handled"
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
          <View style={styles.vacio}>
            <Ionicons name="search-outline" size={36} color={colors.textMuted} />
            <Text style={styles.vacioTitulo}>No hay eventos para esta búsqueda</Text>
            <Text style={styles.vacioTexto}>Probá con otro texto o con otros filtros.</Text>
            <Boton titulo="Limpiar filtros" variante="secundario" chico onPress={limpiarTodo} style={styles.vacioBoton} />
          </View>
        }
      />
    );

  const cantidad = eventos && !loading ? (
    <Text style={styles.cantidad}>
      <Text style={styles.cantidadNumero}>{total}</Text> {total === 1 ? 'evento' : 'eventos'}
    </Text>
  ) : (
    <View />
  );

  // Tablet horizontal: panel de filtros fijo a la izquierda y la grilla a la derecha.
  if (esAncho) {
    return (
      <View style={styles.ancho}>
        <ScrollView style={styles.panel} contentContainerStyle={styles.panelContenido} keyboardShouldPersistTaps="handled">
          {buscador}
          <Text style={styles.panelTitulo}>Categoría</Text>
          {opcionesCategoria.map((categoria) => {
            const elegida = filtros.categoriaId === categoria.id;
            return (
              <Pressable
                key={categoria.id ?? 'todas'}
                style={[styles.categoriaFila, elegida && styles.categoriaFilaElegida]}
                onPress={() => cambiar({ categoriaId: categoria.id })}
                accessibilityRole="radio"
                accessibilityState={{ checked: elegida }}
              >
                <Text style={[styles.categoriaFilaTexto, elegida && styles.categoriaFilaTextoElegida]}>{categoria.nombre}</Text>
              </Pressable>
            );
          })}
          <OpcionesOrden orden={filtros.orden} onElegir={(valor) => cambiar({ orden: valor })} />
          <Text style={styles.panelTitulo}>Precio</Text>
          <OpcionesPrecio precio={filtros.precio} onElegir={(valor) => cambiar({ precio: valor })} />
        </ScrollView>
        <View style={styles.principal}>
          <Text style={[styles.titulo, styles.tituloAncho]}>Catálogo</Text>
          <View style={styles.resumen}>{cantidad}</View>
          {lista}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.pantalla}>
      <View style={styles.arriba}>
        <Text style={styles.titulo}>Catálogo</Text>
        {buscador}
      </View>
      {/* La pantalla no tiene padding: la fila no se estira, pero los chips arrancan alineados con el título. */}
      <FiltroChips
        opciones={opcionesCategoria.map((categoria) => ({ valor: categoria.id, texto: categoria.nombre }))}
        elegido={filtros.categoriaId}
        onElegir={(categoriaId) => cambiar({ categoriaId })}
        sangria={0}
        relleno={spacing.lg}
        style={styles.chips}
      />
      <View style={styles.resumen}>
        {cantidad}
        <Pressable
          style={styles.ordenar}
          onPress={() => setFiltrosAbiertos(true)}
          accessibilityRole="button"
          accessibilityLabel={`Ordenar y filtrar. Orden: ${orden.etiqueta}${precio.precioMin || precio.precioMax ? `. Precio: ${precio.etiqueta}` : ''}`}
        >
          <Ionicons name="swap-vertical" size={18} color={colors.text} />
          <Text style={styles.ordenarTexto}>
            Ordenar: <Text style={styles.negrita}>{orden.etiqueta.split(' ')[0]}</Text>
          </Text>
          {filtros.precio !== PRECIO_POR_DEFECTO ? <View style={styles.puntoFiltro} /> : null}
          <Ionicons name="chevron-down" size={16} color={colors.text} />
        </Pressable>
      </View>
      {filtros.precio !== PRECIO_POR_DEFECTO ? (
        <View style={styles.activos}>
          <Pressable
            style={styles.activo}
            onPress={() => cambiar({ precio: PRECIO_POR_DEFECTO })}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Quitar filtro ${precio.etiqueta}`}
          >
            <Text style={styles.activoTexto}>{precio.etiqueta}</Text>
            <Ionicons name="close" size={14} color={colors.primaryText} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.contenedorLista}>{lista}</View>

      {filtrosAbiertos ? (
        <FiltrosModal
          filtros={filtros}
          onAplicar={(nuevos) => {
            cambiar(nuevos);
            setFiltrosAbiertos(false);
          }}
          onCerrar={() => setFiltrosAbiertos(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  arriba: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  titulo: {
    color: colors.text,
    fontSize: fontSize.headline,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingLeft: spacing.md,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.body,
    paddingVertical: spacing.sm,
  },
  borrar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    marginTop: spacing.md,
    marginBottom: 0,
  },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  cantidad: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  cantidadNumero: {
    color: colors.text,
    fontWeight: 'bold',
  },
  ordenar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    marginRight: -spacing.sm,
  },
  ordenarTexto: {
    color: colors.text,
    fontSize: fontSize.small,
  },
  negrita: {
    fontWeight: 'bold',
  },
  puntoFiltro: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  activos: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  activo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    minHeight: 32,
    paddingHorizontal: spacing.md,
  },
  activoTexto: {
    color: colors.primaryText,
    fontSize: fontSize.small,
  },
  contenedorLista: {
    flex: 1,
  },
  listaContenido: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  filaGrilla: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  celda: {
    flex: 1,
  },
  vacio: {
    alignItems: 'center',
    paddingTop: 48,
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
  },
  vacioBoton: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  ancho: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  panel: {
    width: 288,
    flexGrow: 0,
    borderRightWidth: 1,
    borderRightColor: colors.borderSoft,
  },
  panelContenido: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  panelTitulo: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  categoriaFila: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 10,
  },
  categoriaFilaElegida: {
    backgroundColor: colors.primarySoft,
  },
  categoriaFilaTexto: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  categoriaFilaTextoElegida: {
    color: colors.primaryText,
    fontWeight: 'bold',
  },
  tituloAncho: {
    paddingHorizontal: spacing.lg,
    marginBottom: 0,
  },
  principal: {
    flex: 1,
    paddingTop: spacing.xl,
    maxWidth: 1200,
  },
});
