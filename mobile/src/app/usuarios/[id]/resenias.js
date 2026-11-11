import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getReseniasOrganizador, getUsuario } from '../../../api/usuarios.js';
import { useCarga } from '../../../hooks/useCarga.js';
import { usePaginado } from '../../../hooks/usePaginado.js';
import { Avatar } from '../../../components/Avatar.js';
import { Estrellas } from '../../../components/Estrellas.js';
import { PantallaCarga } from '../../../components/Carga.js';
import { EstadoCarga } from '../../../components/EstadoCarga.js';
import { PieLista } from '../../../components/PieLista.js';
import { ReseniaItem } from '../../../components/ReseniaItem.js';
import { formatPuntaje } from '../../../format.js';
import { colors, fontSize, spacing } from '../../../theme.js';

// Reseñas por página: se pide la siguiente al acercarse al final de la lista.
const LIMITE = 10;

// Caso de uso 10: todas las reseñas de los eventos de un organizador, con su promedio.
// Se abre desde el detalle de un evento y se puede reusar desde cualquier pantalla.
// La cabecera (organizador y promedio) se pide una vez; las reseñas, de a páginas.
export default function ReseniasOrganizador() {
  const { id } = useLocalSearchParams();
  const pedirOrganizador = useCallback(() => getUsuario(id), [id]);
  const cabecera = useCarga(pedirOrganizador);
  const pedirResenias = useCallback((pagina) => getReseniasOrganizador(id, { pagina, limite: LIMITE }), [id]);
  const lista = usePaginado(pedirResenias);

  const organizador = cabecera.data;
  const resenias = lista.items;
  const error = cabecera.error ?? lista.error;
  const { recargar: recargarCabecera } = cabecera;
  const { recargar: recargarLista } = lista;
  const recargar = useCallback(() => {
    recargarCabecera();
    recargarLista();
  }, [recargarCabecera, recargarLista]);

  if ((cabecera.loading && !organizador) || (lista.loading && !resenias)) {
    return <PantallaCarga mensaje="Cargando las reseñas…" />;
  }
  if (error || !organizador || !resenias) {
    return (
      <View style={styles.centrado}>
        <EstadoCarga loading={cabecera.loading || lista.loading} error={error} onRetry={recargar} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.pantalla}
      contentContainerStyle={styles.contenido}
      data={resenias}
      keyExtractor={(resenia) => String(resenia.id)}
      renderItem={({ item }) => <ReseniaItem resenia={item} />}
      onEndReached={lista.cargarMas}
      // Las reseñas son cortas: con 0.5 (medio alto de pantalla) la primera página ya quedaba
      // "cerca del final" al abrir y se pedía la segunda sin scrollear.
      onEndReachedThreshold={0.1}
      refreshControl={
        <RefreshControl refreshing={lista.recargando} onRefresh={recargar} colors={[colors.primary]} />
      }
      ListFooterComponent={
        <PieLista
          cargandoMas={lista.cargandoMas}
          errorMas={lista.errorMas}
          hayMas={lista.hayMas}
          varias={lista.total > LIMITE}
          onReintentar={lista.cargarMas}
          cargando="Cargando más reseñas…"
          fin={`Ya viste las ${lista.total} reseñas`}
        />
      }
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
