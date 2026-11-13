import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BotonFavorito } from './BotonFavorito.js';
import { formatFecha, formatPrecio, formatPuntaje } from '../format.js';
import { colors, fontSize, spacing } from '../theme.js';

// Un evento del catálogo (EventoResumen de la API): imagen, categoría, nombre, fecha y
// lugar, organizador con su puntaje y precio de la entrada más barata, con el corazón.
// variante 'fila' (teléfono: imagen chica a la izquierda) o 'tarjeta' (tablet: imagen
// arriba, para las grillas). realizado: el evento ya pasó (en Favoritos), se ve apagado.
// extra: algo para mostrar junto al precio (ej: "Faltan 10 días" en Favoritos).
export function EventoCard({ evento, onPress, realizado = false, variante = 'fila', extra = null }) {
  const { organizador } = evento;
  // Del lugar se muestra solo el nombre, sin la dirección ("Teatro San Martín, Av. Corrientes…").
  const lugar = evento.lugar.split(',')[0];
  const tarjeta = variante === 'tarjeta';

  const organizadorTexto = (
    <Text style={styles.cap} numberOfLines={1}>
      {organizador.puntaje === null ? null : (
        <Text style={styles.estrella} accessibilityLabel={`Puntaje ${formatPuntaje(organizador.puntaje)} de 5`}>
          ★ {formatPuntaje(organizador.puntaje)}{' '}
        </Text>
      )}
      {organizador.nombre} {organizador.apellido}
      {organizador.puntaje === null ? ' · Sin reseñas' : null}
    </Text>
  );

  const info = (
    <View style={[styles.info, tarjeta && styles.infoTarjeta]}>
      <Text style={styles.categoria}>{evento.categoria.nombre}</Text>
      <Text style={styles.nombre} numberOfLines={2}>{evento.nombre}</Text>
      <Text style={styles.meta} numberOfLines={2}>
        {formatFecha(evento.fecha)} · {lugar}
      </Text>
      {tarjeta ? organizadorTexto : null}
      <View style={styles.abajo}>
        {tarjeta ? extra : extra ?? organizadorTexto}
        <Text style={styles.precio}>Desde {formatPrecio(evento.precioDesde)}</Text>
      </View>
    </View>
  );

  if (tarjeta) {
    return (
      <Pressable
        style={({ pressed }) => [styles.tarjeta, pressed && styles.presionada, realizado && styles.realizado]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <View>
          {evento.imagen ? (
            <Image source={{ uri: evento.imagen }} style={styles.imagenTarjeta} />
          ) : (
            <View style={styles.imagenTarjeta} />
          )}
          <View style={styles.corazonTarjeta}>
            <BotonFavorito eventoId={evento.id} />
          </View>
        </View>
        {info}
      </Pressable>
    );
  }

  return (
    <Pressable style={({ pressed }) => [styles.fila, pressed && styles.presionada]} onPress={onPress} accessibilityRole="button">
      <View style={[styles.contenido, realizado && styles.realizado]}>
        {evento.imagen ? <Image source={{ uri: evento.imagen }} style={styles.imagen} /> : <View style={styles.imagen} />}
        {info}
      </View>
      {/* El corazón queda afuera para que no se apague con el evento realizado. */}
      <BotonFavorito eventoId={evento.id} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  presionada: {
    backgroundColor: colors.primarySofter,
  },
  contenido: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  realizado: {
    opacity: 0.55,
  },
  imagen: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: colors.borderSoft,
  },
  tarjeta: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  imagenTarjeta: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.borderSoft,
  },
  corazonTarjeta: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  infoTarjeta: {
    padding: spacing.md,
    paddingTop: spacing.sm + 2,
  },
  categoria: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nombre: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
    lineHeight: 21,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  cap: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  estrella: {
    color: colors.starText,
    fontWeight: 'bold',
  },
  abajo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  precio: {
    marginLeft: 'auto',
    color: colors.primaryText,
    fontSize: fontSize.small,
    fontWeight: 'bold',
  },
});
