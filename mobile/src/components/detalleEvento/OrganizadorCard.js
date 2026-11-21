import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Avatar } from '../Avatar.js';
import { Boton } from '../Boton.js';
import { Estrellas } from '../Estrellas.js';
import { formatDia, formatPuntaje } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

// El organizador con su puntaje, la reseña más reciente y el enlace a todas sus reseñas.
// Sin reseñas no hay enlace, para no llevar a una pantalla vacía.
export function OrganizadorCard({ organizador, ultimaResenia }) {
  const { puntaje, cantidadResenias } = organizador;
  const verResenias = () => router.push(`/usuarios/${organizador.id}/resenias`);
  return (
    <View style={styles.caja}>
      <Pressable
        style={styles.organizadorFila}
        onPress={cantidadResenias > 0 ? verResenias : undefined}
        disabled={cantidadResenias === 0}
        accessibilityRole={cantidadResenias > 0 ? 'button' : undefined}
      >
        <Avatar usuario={organizador} size={44} />
        <View style={styles.flexible}>
          <Text style={styles.tipoNombre}>
            {organizador.nombre} {organizador.apellido}
          </Text>
          {puntaje === null ? (
            <Text style={styles.tipoDescripcion}>Todavía no tiene reseñas</Text>
          ) : (
            <Text style={styles.tipoDescripcion}>
              <Text style={styles.estrella} accessibilityLabel={`${formatPuntaje(puntaje)} de 5`}>★ {formatPuntaje(puntaje)}</Text>
              {' · '}{cantidadResenias} {cantidadResenias === 1 ? 'reseña' : 'reseñas'} de eventos anteriores
            </Text>
          )}
        </View>
        {cantidadResenias > 0 ? <Ionicons name="chevron-forward" size={20} color={colors.primary} /> : null}
      </Pressable>

      {ultimaResenia ? (
        <View style={styles.muestra}>
          <View style={styles.muestraArriba}>
            <Text style={styles.muestraAutor}>{ultimaResenia.comprador.nombre} {ultimaResenia.comprador.apellido}</Text>
            <Estrellas valor={ultimaResenia.puntuacion} size={13} />
          </View>
          <Text style={styles.tipoDescripcion}>
            {ultimaResenia.evento.nombre} · {formatDia(ultimaResenia.evento.fecha)}
          </Text>
          <Text style={styles.muestraTexto}>{ultimaResenia.detalle}</Text>
        </View>
      ) : null}

      {cantidadResenias > 0 ? (
        <Boton
          titulo={cantidadResenias === 1 ? 'Ver la reseña' : `Ver las ${cantidadResenias} reseñas`}
          variante="texto"
          chico
          onPress={verResenias}
          style={styles.verResenias}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flexible: {
    flex: 1,
  },
  caja: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.xs,
  },
  tipoNombre: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  tipoDescripcion: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  organizadorFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
  },
  estrella: {
    color: colors.starText,
    fontWeight: 'bold',
  },
  muestra: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: spacing.md,
    gap: 2,
  },
  muestraArriba: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muestraAutor: {
    color: colors.text,
    fontSize: fontSize.small,
    fontWeight: 'bold',
  },
  muestraTexto: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  verResenias: {
    marginLeft: -spacing.md,
  },
});
