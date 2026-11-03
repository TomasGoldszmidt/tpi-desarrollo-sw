import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getReseniasOrganizador, getUsuario } from '../../../api/usuarios.js';
import { useCarga } from '../../../hooks/useCarga.js';
import { Avatar } from '../../../components/Avatar.js';
import { Estrellas } from '../../../components/Estrellas.js';
import { PantallaCarga } from '../../../components/Carga.js';
import { EstadoCarga } from '../../../components/EstadoCarga.js';
import { ReseniaItem } from '../../../components/ReseniaItem.js';
import { formatPuntaje } from '../../../format.js';
import { colors, fontSize, spacing } from '../../../theme.js';

// Caso de uso 10: todas las reseñas de los eventos de un organizador, con su promedio.
// Se abre desde el detalle de un evento y se puede reusar desde cualquier pantalla.
export default function ReseniasOrganizador() {
  const { id } = useLocalSearchParams();
  const pedir = useCallback(
    () => Promise.all([getUsuario(id), getReseniasOrganizador(id)]),
    [id],
  );
  const { data, loading, error, recargar } = useCarga(pedir);

  if (loading && !data) {
    return <PantallaCarga mensaje="Cargando las reseñas…" />;
  }
  if (error || !data) {
    return (
      <View style={styles.centrado}>
        <EstadoCarga loading={loading} error={error} onRetry={recargar} />
      </View>
    );
  }

  const [organizador, resenias] = data;

  return (
    <FlatList
      style={styles.pantalla}
      contentContainerStyle={styles.contenido}
      data={resenias}
      keyExtractor={(resenia) => String(resenia.id)}
      renderItem={({ item }) => <ReseniaItem resenia={item} />}
      ListHeaderComponent={
        <View style={styles.cabecera}>
          <View style={styles.persona}>
            <Avatar usuario={organizador} size={48} />
            <View>
              <Text style={styles.nombre}>
                {organizador.nombre} {organizador.apellido}
              </Text>
              <Text style={styles.subtitulo}>Reseñas de sus eventos</Text>
            </View>
          </View>
          {organizador.puntaje !== null ? (
            <View style={styles.promedio}>
              <Text style={styles.promedioNumero}>{formatPuntaje(organizador.puntaje)}</Text>
              <Estrellas valor={organizador.puntaje} size={18} />
              <Text style={styles.subtitulo}>
                {organizador.cantidadResenias} {organizador.cantidadResenias === 1 ? 'reseña' : 'reseñas'}
              </Text>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={<Text style={styles.vacio}>Todavía no tiene reseñas.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: spacing.lg,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  cabecera: {
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  persona: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nombre: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  promedio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  promedioNumero: {
    color: colors.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  vacio: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    textAlign: 'center',
    paddingTop: spacing.xl,
  },
});
