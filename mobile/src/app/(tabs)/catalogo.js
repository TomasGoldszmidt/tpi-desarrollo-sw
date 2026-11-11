import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { buscarEventos } from '../../api/eventos.js';
import { getCategorias } from '../../api/categorias.js';
import { useCarga } from '../../hooks/useCarga.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { EventoCard } from '../../components/EventoCard.js';
import { FiltrosModal, ORDENES } from '../../components/FiltrosModal.js';
import { Seccion } from '../../components/Seccion.js';
import { colors, fontSize, spacing } from '../../theme.js';

const ORDEN_POR_DEFECTO = ORDENES[0].valor;
// Espera después de la última tecla antes de buscar, para no pedir por cada letra.
const ESPERA_BUSQUEDA_MS = 500;

// Casos de uso 3 y 11: buscar eventos por texto o categoría y ordenarlos.
export default function Catalogo() {
  const [texto, setTexto] = useState('');
  const [textoBuscado, setTextoBuscado] = useState('');
  const [filtros, setFiltros] = useState({ categoriaId: null, orden: ORDEN_POR_DEFECTO });
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTextoBuscado(texto), ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(timer);
  }, [texto]);

  const { data: categorias } = useCarga(getCategorias);
  const pedirEventos = useCallback(
    () => buscarEventos({ texto: textoBuscado, ...filtros, limite: 50 }).then((pagina) => pagina.resultados),
    [textoBuscado, filtros],
  );
  const { data: eventos, loading, error, recargar } = useCarga(pedirEventos);

  // Los filtros activos se muestran como etiquetas debajo del buscador; tocarlas los quita.
  // Ordenar por fecha no cuenta: es el orden por defecto.
  const categoria = categorias?.find((c) => c.id === filtros.categoriaId);
  const activos = [];
  if (categoria) {
    activos.push({ clave: 'categoria', etiqueta: categoria.nombre, quitar: { categoriaId: null } });
  }
  if (filtros.orden !== ORDEN_POR_DEFECTO) {
    const orden = ORDENES.find((o) => o.valor === filtros.orden);
    activos.push({ clave: 'orden', etiqueta: orden.etiqueta, quitar: { orden: ORDEN_POR_DEFECTO } });
  }

  function limpiarTodo() {
    setTexto('');
    setTextoBuscado('');
    setFiltros({ categoriaId: null, orden: ORDEN_POR_DEFECTO });
  }

  return (
    <Seccion titulo="Catálogo">
      <View style={styles.barra}>
        <View style={styles.buscador}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Buscar eventos, lugares…"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={() => setTextoBuscado(texto)}
          />
          {texto ? (
            <Pressable onPress={() => setTexto('')} accessibilityLabel="Borrar búsqueda" hitSlop={8}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          style={[styles.botonFiltros, activos.length > 0 && styles.botonFiltrosActivo]}
          onPress={() => setFiltrosAbiertos(true)}
          accessibilityLabel="Filtros"
        >
          <Ionicons name="options-outline" size={20} color={activos.length > 0 ? '#FFFFFF' : colors.textSecondary} />
          {activos.length > 0 ? (
            <View style={styles.contador}>
              <Text style={styles.contadorTexto}>{activos.length}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {activos.length > 0 ? (
        <View style={styles.activos}>
          {activos.map((filtro) => (
            <Pressable
              key={filtro.clave}
              style={styles.activo}
              onPress={() => setFiltros({ ...filtros, ...filtro.quitar })}
              accessibilityLabel={`Quitar filtro ${filtro.etiqueta}`}
            >
              <Text style={styles.activoTexto}>{filtro.etiqueta}</Text>
              <Ionicons name="close" size={14} color={colors.primaryText} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {loading || error || !eventos ? (
        <EstadoCarga loading={loading} error={error} onRetry={recargar} mensaje="Buscando eventos…" />
      ) : (
        <FlatList
          data={eventos}
          keyExtractor={(evento) => String(evento.id)}
          renderItem={({ item }) => (
            <EventoCard evento={item} onPress={() => router.push(`/eventos/${item.id}`)} />
          )}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Text style={styles.vacioTitulo}>No hay eventos para esta búsqueda</Text>
              <Text style={styles.vacioTexto}>Probá con otro texto o con otros filtros.</Text>
              <Pressable style={styles.botonLimpiar} onPress={limpiarTodo}>
                <Text style={styles.botonLimpiarTexto}>Limpiar filtros</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {filtrosAbiertos ? (
        <FiltrosModal
          categorias={categorias ?? []}
          filtros={filtros}
          onAplicar={(nuevos) => {
            setFiltros(nuevos);
            setFiltrosAbiertos(false);
          }}
          onCerrar={() => setFiltrosAbiertos(false)}
        />
      ) : null}
    </Seccion>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  buscador: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.body,
    paddingVertical: spacing.sm,
  },
  botonFiltros: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  botonFiltrosActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  contador: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  contadorTexto: {
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: 'bold',
  },
  activos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  activo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  activoTexto: {
    color: colors.primaryText,
    fontSize: fontSize.small,
  },
  vacio: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.xs,
  },
  vacioTitulo: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  vacioTexto: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  botonLimpiar: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  botonLimpiarTexto: {
    color: colors.primaryText,
    fontSize: fontSize.body,
  },
});
