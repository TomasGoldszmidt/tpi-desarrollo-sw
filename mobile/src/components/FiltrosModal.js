import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Boton } from './Boton.js';
import { colors, fontSize, spacing, TOQUE_MINIMO } from '../theme.js';

// Los valores de orden que acepta GET /eventos. El primero es el de por defecto.
export const ORDENES = [
  { valor: 'fecha', etiqueta: 'Fecha', detalle: 'Los más próximos primero' },
  { valor: 'precio', etiqueta: 'Precio', detalle: 'Los más baratos primero' },
  { valor: 'puntaje', etiqueta: 'Puntaje del organizador', detalle: 'Los mejor reseñados primero' },
];

// Rangos rápidos de precio (precioMin y precioMax de GET /eventos). El primero es "sin filtro".
export const PRECIOS = [
  { valor: 'cualquiera', etiqueta: 'Cualquiera' },
  { valor: 'hasta10', etiqueta: 'Hasta $ 10.000', precioMax: 10000 },
  { valor: 'de10a25', etiqueta: '$ 10.000 a $ 25.000', precioMin: 10000, precioMax: 25000 },
  { valor: 'mas25', etiqueta: 'Más de $ 25.000', precioMin: 25000 },
];

// Hoja de abajo para ordenar el catálogo y filtrar por precio (la categoría está en los
// chips de la pantalla). Trabaja sobre una copia y solo la aplica con "Ver resultados";
// cerrarla la descarta. Se monta cada vez que se abre, así arranca de lo vigente.
export function FiltrosModal({ filtros, onAplicar, onCerrar }) {
  const insets = useSafeAreaInsets();
  const [orden, setOrden] = useState(filtros.orden);
  const [precio, setPrecio] = useState(filtros.precio);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar} accessibilityLabel="Cerrar" />
      <View style={[styles.hoja, { paddingBottom: spacing.lg + insets.bottom }]} accessibilityViewIsModal>
        <View style={styles.agarre} />
        <View style={styles.encabezado}>
          <Text style={styles.titulo}>Ordenar y filtrar</Text>
          <Pressable style={styles.cerrar} onPress={onCerrar} accessibilityRole="button" accessibilityLabel="Cerrar">
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <OpcionesOrden orden={orden} onElegir={setOrden} />

        <Text style={styles.etiqueta}>Precio de la entrada</Text>
        <OpcionesPrecio precio={precio} onElegir={setPrecio} />

        <View style={styles.botones}>
          <Boton
            titulo="Limpiar"
            variante="texto"
            onPress={() => {
              setOrden(ORDENES[0].valor);
              setPrecio(PRECIOS[0].valor);
            }}
          />
          <Boton titulo="Ver resultados" onPress={() => onAplicar({ orden, precio })} style={styles.aplicar} />
        </View>
      </View>
    </Modal>
  );
}

// También los usa el panel lateral del catálogo en tablet horizontal.
export function OpcionesOrden({ orden, onElegir }) {
  return (
    <View accessibilityRole="radiogroup">
      <Text style={styles.etiqueta}>Ordenar por</Text>
      {ORDENES.map((opcion, i) => {
        const elegida = orden === opcion.valor;
        return (
          <Pressable
            key={opcion.valor}
            style={[styles.opcion, i === ORDENES.length - 1 && styles.sinBorde]}
            onPress={() => onElegir(opcion.valor)}
            accessibilityRole="radio"
            accessibilityState={{ checked: elegida }}
          >
            <View style={styles.opcionTextos}>
              <Text style={[styles.opcionTexto, elegida && styles.negrita]}>{opcion.etiqueta}</Text>
              <Text style={styles.detalle}>{opcion.detalle}</Text>
            </View>
            <Ionicons
              name={elegida ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={elegida ? colors.primary : colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export function OpcionesPrecio({ precio, onElegir }) {
  return (
    <View style={styles.chips}>
      {PRECIOS.map((opcion) => {
        const elegida = precio === opcion.valor;
        return (
          <Pressable
            key={opcion.valor}
            style={[styles.chip, elegida && styles.chipElegido]}
            onPress={() => onElegir(opcion.valor)}
            hitSlop={4}
            accessibilityRole="radio"
            accessibilityState={{ checked: elegida }}
          >
            <Text style={[styles.chipTexto, elegida && styles.chipTextoElegido]}>{opcion.etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 28, 0.45)',
  },
  hoja: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  agarre: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginVertical: spacing.sm,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: 'bold',
  },
  cerrar: {
    width: TOQUE_MINIMO,
    height: TOQUE_MINIMO,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  etiqueta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  sinBorde: {
    borderBottomWidth: 0,
  },
  opcionTextos: {
    flex: 1,
  },
  opcionTexto: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  negrita: {
    fontWeight: 'bold',
  },
  detalle: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
  },
  chipElegido: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTexto: {
    color: colors.text,
    fontSize: fontSize.small,
  },
  chipTextoElegido: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  botones: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  aplicar: {
    flex: 1,
  },
});
