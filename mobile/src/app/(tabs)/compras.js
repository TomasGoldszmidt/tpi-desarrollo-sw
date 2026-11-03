import { useCallback, useRef } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getMisCompras } from '../../api/compras.js';
import { useCarga } from '../../hooks/useCarga.js';
import { CompraCard } from '../../components/CompraCard.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { Seccion } from '../../components/Seccion.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Caso de uso 1: las compras del usuario activo, con el estado bien diferenciado
// y los días que faltan para el evento si están confirmadas.
export default function MisCompras() {
  const { data: compras, loading, error, recargar } = useCarga(getMisCompras);

  // Se vuelve a pedir cada vez que se vuelve a la pestaña, así se ven los cambios
  // después de comprar, pagar o cancelar. La primera vez ya lo pide useCarga.
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

  return (
    <Seccion titulo="Mis compras">
      {error || !compras ? (
        <EstadoCarga loading={loading} error={error} onRetry={recargar} mensaje="Cargando tus compras…" />
      ) : (
        <FlatList
          data={compras}
          keyExtractor={(compra) => String(compra.id)}
          // El detalle de la compra es la subtarea 3.7: hasta entonces la tarjeta no navega.
          renderItem={({ item }) => <CompraCard compra={item} />}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={recargar} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="ticket-outline" size={36} color={colors.textMuted} />
              <Text style={styles.vacioTitulo}>Todavía no compraste entradas</Text>
              <Text style={styles.vacioTexto}>Cuando compres, vas a ver acá el estado de cada compra.</Text>
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

const styles = StyleSheet.create({
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
