import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getFavoritos } from '../../api/favoritos.js';
import { useUsuario } from '../../context/UsuarioContext.js';
import { useFavoritos } from '../../context/FavoritosContext.js';
import { useCarga } from '../../hooks/useCarga.js';
import { useLayout } from '../../hooks/useLayout.js';
import { Boton } from '../../components/Boton.js';
import { Etiqueta } from '../../components/Etiqueta.js';
import { EventoCard } from '../../components/EventoCard.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { Seccion } from '../../components/Seccion.js';
import { formatDiasRestantes } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

const UN_DIA = 24 * 60 * 60 * 1000;

// Días de calendario hasta el evento (hoy es 0).
function diasHasta(fecha, ahora) {
  const dia = (valor) => {
    const d = new Date(valor);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  return Math.round((dia(fecha) - dia(ahora)) / UN_DIA);
}

// Los eventos favoritos del usuario: los próximos por fecha, con los días que faltan, y los
// ya realizados plegados al final. En tablet van en grilla.
export default function Favoritos() {
  const { usuario } = useUsuario();
  const { esFavorito } = useFavoritos();
  const { columnas } = useLayout();
  const [verRealizados, setVerRealizados] = useState(false);
  const pedir = useCallback(async () => {
    const eventos = await getFavoritos(usuario.id);
    // Se calcula al pedir y no al dibujar, que tiene que dar siempre lo mismo.
    const ahora = Date.now();
    return eventos.map((evento) => {
      const realizado = new Date(evento.fecha).getTime() < ahora;
      return { ...evento, realizado, dias: realizado ? null : diasHasta(evento.fecha, ahora) };
    });
  }, [usuario.id]);
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

  if (error || !eventos) {
    return (
      <Seccion titulo="Favoritos">
        <EstadoCarga loading={loading} error={error} onRetry={recargar} mensaje="Cargando tus favoritos…" />
      </Seccion>
    );
  }

  // Al quitar el corazón acá, el evento sale de la lista sin esperar a volver a pedirla.
  const vigentes = eventos.filter((evento) => esFavorito(evento.id));
  const proximos = vigentes.filter((evento) => !evento.realizado);
  const realizados = vigentes.filter((evento) => evento.realizado);

  const grilla = (lista, realizado) => (
    <View style={columnas > 1 ? styles.grilla : null}>
      {lista.map((evento) => (
        <View key={evento.id} style={columnas > 1 ? { width: `${100 / columnas}%`, padding: spacing.sm } : null}>
          <EventoCard
            evento={evento}
            realizado={realizado}
            variante={columnas > 1 ? 'tarjeta' : 'fila'}
            onPress={() => router.push(`/eventos/${evento.id}`)}
            extra={
              evento.dias !== null ? (
                <Etiqueta texto={formatDiasRestantes(evento.dias)} fondo={colors.primarySofter} color={colors.primaryText} />
              ) : null
            }
          />
        </View>
      ))}
    </View>
  );

  return (
    <Seccion titulo="Favoritos">
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={recargar} colors={[colors.primary]} />}
        contentContainerStyle={styles.contenido}
      >
        {vigentes.length === 0 ? (
          <View style={styles.vacio}>
            <Ionicons name="heart-outline" size={40} color={colors.textMuted} />
            <Text style={styles.vacioTitulo}>Todavía no guardaste eventos</Text>
            <Text style={styles.vacioTexto}>Tocá el corazón de un evento para encontrarlo acá.</Text>
            <Boton titulo="Explorar eventos" variante="secundario" chico onPress={() => router.navigate('/catalogo')} style={styles.centrado} />
          </View>
        ) : null}

        {proximos.length > 0 ? (
          <>
            <Text style={styles.seccion}>Próximos · {proximos.length}</Text>
            {grilla(proximos, false)}
          </>
        ) : null}

        {realizados.length > 0 ? (
          <>
            <Pressable
              style={styles.plegable}
              onPress={() => setVerRealizados(!verRealizados)}
              accessibilityRole="button"
              accessibilityState={{ expanded: verRealizados }}
            >
              <Text style={styles.plegableTexto}>
                <Text style={styles.negrita}>Ya realizados</Text> · {realizados.length}
              </Text>
              <Ionicons name={verRealizados ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
            </Pressable>
            {verRealizados ? grilla(realizados, true) : null}
          </>
        ) : null}
      </ScrollView>
    </Seccion>
  );
}

const styles = StyleSheet.create({
  contenido: {
    paddingBottom: spacing.xxl,
  },
  grilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
  seccion: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  plegable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  plegableTexto: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  negrita: {
    color: colors.text,
    fontWeight: 'bold',
  },
  vacio: {
    alignItems: 'center',
    paddingTop: 80,
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
    textAlign: 'center',
  },
  centrado: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
});
