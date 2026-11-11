import { useCallback, useRef } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getFavoritos } from '../../api/favoritos.js';
import { useUsuario } from '../../context/UsuarioContext.js';
import { useFavoritos } from '../../context/FavoritosContext.js';
import { useCarga } from '../../hooks/useCarga.js';
import { EventoCard } from '../../components/EventoCard.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { Seccion } from '../../components/Seccion.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Los eventos favoritos del usuario: los próximos por fecha y, al final, los ya realizados.
export default function Favoritos() {
  const { usuario } = useUsuario();
  const { esFavorito } = useFavoritos();
  const pedir = useCallback(() => getFavoritos(usuario.id), [usuario.id]);
  const { data: eventos, loading, error, recargar } = useCarga(pedir);

  // Se vuelve a pedir al volver a la pestaña, así aparecen los que se marcaron en el
  // catálogo o en el detalle. La primera vez ya lo pide useCarga.
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

  // Al quitar el corazón acá, el evento sale de la lista sin esperar a volver a pedirla.
  const vigentes = eventos ? eventos.filter((evento) => esFavorito(evento.id)) : [];

  return (
    <Seccion titulo="Favoritos">
      {error || !eventos ? (
        <EstadoCarga loading={loading} error={error} onRetry={recargar} mensaje="Cargando tus favoritos…" />
      ) : (
        <SectionList
          sections={separarPorFecha(vigentes)}
          keyExtractor={(evento) => String(evento.id)}
          renderSectionHeader={({ section }) => <Text style={styles.seccion}>{section.titulo}</Text>}
          renderItem={({ item, section }) => (
            <EventoCard
              evento={item}
              realizado={section.realizados}
              onPress={() => router.push(`/eventos/${item.id}`)}
            />
          )}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={recargar} colors={[colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="heart-outline" size={36} color={colors.textMuted} />
              <Text style={styles.vacioTitulo}>Todavía no guardaste eventos</Text>
              <Text style={styles.vacioTexto}>Tocá el corazón de un evento para encontrarlo acá.</Text>
              <Pressable style={styles.boton} onPress={() => router.navigate('/catalogo')}>
                <Text style={styles.botonTexto}>Explorar eventos</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </Seccion>
  );
}

// La API los devuelve ordenados por fecha: primero los próximos y al final los ya realizados.
function separarPorFecha(eventos) {
  const ahora = Date.now();
  const proximos = eventos.filter((evento) => new Date(evento.fecha).getTime() >= ahora);
  const realizados = eventos.filter((evento) => new Date(evento.fecha).getTime() < ahora);
  return [
    { titulo: 'Próximos', realizados: false, data: proximos },
    { titulo: 'Ya realizados', realizados: true, data: realizados },
  ].filter((seccion) => seccion.data.length > 0);
}

const styles = StyleSheet.create({
  seccion: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  vacio: {
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.xs,
  },
  vacioTitulo: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  vacioTexto: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
  boton: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  botonTexto: {
    color: colors.primaryText,
    fontSize: fontSize.body,
  },
});
