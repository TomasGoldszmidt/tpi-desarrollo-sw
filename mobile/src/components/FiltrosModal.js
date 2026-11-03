import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing } from '../theme.js';

// Los valores de orden que acepta GET /eventos. El primero es el de por defecto.
export const ORDENES = [
  { valor: 'fecha', etiqueta: 'Fecha', detalle: 'Fecha (más próximos)' },
  { valor: 'precio', etiqueta: 'Precio', detalle: 'Precio (más baratos)' },
  { valor: 'puntaje', etiqueta: 'Puntaje', detalle: 'Puntaje del organizador' },
];

// Modal de filtros del catálogo: categoría y orden. Trabaja sobre una copia de los
// filtros y solo los aplica con "Ver resultados"; cerrarlo los descarta.
// Se monta cada vez que se abre, así la copia arranca de los filtros vigentes.
export function FiltrosModal({ categorias, filtros, onAplicar, onCerrar }) {
  const [categoriaId, setCategoriaId] = useState(filtros.categoriaId);
  const [orden, setOrden] = useState(filtros.orden);

  function limpiar() {
    setCategoriaId(null);
    setOrden(ORDENES[0].valor);
  }

  const opcionesCategoria = [{ id: null, nombre: 'Todas' }, ...categorias];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar} accessibilityLabel="Cerrar filtros" />
      <View style={styles.hoja}>
        <View style={styles.encabezado}>
          <Text style={styles.titulo}>Filtros</Text>
          <Pressable onPress={onCerrar} accessibilityLabel="Cerrar filtros" hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.etiqueta}>Categoría</Text>
        <View style={styles.categorias}>
          {opcionesCategoria.map((categoria) => {
            const elegida = categoria.id === categoriaId;
            return (
              <Pressable
                key={categoria.id ?? 'todas'}
                style={[styles.categoria, elegida && styles.categoriaElegida]}
                onPress={() => setCategoriaId(categoria.id)}
              >
                <Text style={[styles.categoriaTexto, elegida && styles.categoriaTextoElegida]}>
                  {categoria.nombre}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.etiqueta}>Ordenar por</Text>
        {ORDENES.map((opcion) => (
          <Pressable key={opcion.valor} style={styles.opcion} onPress={() => setOrden(opcion.valor)}>
            <Text style={styles.opcionTexto}>{opcion.detalle}</Text>
            <Ionicons
              name={orden === opcion.valor ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={orden === opcion.valor ? colors.primary : colors.textMuted}
            />
          </Pressable>
        ))}

        <View style={styles.botones}>
          <Pressable style={styles.boton} onPress={limpiar}>
            <Text style={styles.botonTexto}>Limpiar</Text>
          </Pressable>
          <Pressable style={[styles.boton, styles.botonPrincipal]} onPress={() => onAplicar({ categoriaId, orden })}>
            <Text style={[styles.botonTexto, styles.botonTextoPrincipal]}>Ver resultados</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(44, 44, 42, 0.45)',
  },
  hoja: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titulo: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  etiqueta: {
    color: colors.textMuted,
    fontSize: fontSize.small,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  categorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoria: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  categoriaElegida: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoriaTexto: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  categoriaTextoElegida: {
    color: '#FFFFFF',
  },
  opcion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  opcionTexto: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  botones: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  boton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
  },
  botonPrincipal: {
    backgroundColor: colors.primary,
  },
  botonTexto: {
    color: colors.primaryText,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  botonTextoPrincipal: {
    color: '#FFFFFF',
  },
});
