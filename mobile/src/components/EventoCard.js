import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatFecha, formatPrecio, formatPuntaje } from '../format.js';
import { colors, fontSize, spacing } from '../theme.js';

// Un evento del catálogo (EventoResumen de la API): imagen, categoría, nombre,
// fecha y lugar, puntaje del organizador y precio de la entrada más barata.
export function EventoCard({ evento, onPress }) {
  const { organizador } = evento;
  // Del lugar se muestra solo el nombre, sin la dirección ("Teatro San Martín, Av. Corrientes…").
  const lugar = evento.lugar.split(',')[0];

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.presionada]} onPress={onPress}>
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
        <Text style={styles.meta}>
          {organizador.puntaje === null ? (
            'Sin reseñas'
          ) : (
            <>
              <Text style={styles.estrella}>★ {formatPuntaje(organizador.puntaje)}</Text> ({organizador.cantidadResenias})
            </>
          )}
          {` · ${organizador.nombre} ${organizador.apellido}`}
        </Text>
        <Text style={styles.precio}>Desde {formatPrecio(evento.precioDesde)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  presionada: {
    backgroundColor: colors.primarySoft,
  },
  imagen: {
    width: 76,
    height: 76,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  categoria: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1EFE8',
    color: '#444441',
    borderRadius: 4,
    paddingHorizontal: 6,
    fontSize: 11,
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
  estrella: {
    color: '#BA7517',
  },
  precio: {
    color: colors.primaryText,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
});
