import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getMisCompras } from '../../api/compras.js';
import { useUsuario } from '../../context/UsuarioContext.js';
import { usePaginado } from '../../hooks/usePaginado.js';
import { CompraCard } from '../../components/CompraCard.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { FiltroEstados } from '../../components/FiltroEstados.js';
import { PieLista } from '../../components/PieLista.js';
import { estiloEstado } from '../../components/EstadoBadge.js';
import { Seccion } from '../../components/Seccion.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Compras por página: se pide la siguiente al acercarse al final de la lista.
const LIMITE = 10;

// El chat con el organizador, directo desde la lista (sin pasar por el detalle).
function abrirChat(compra) {
  const { organizador } = compra.evento;
  router.push({
    pathname: '/compras/[id]/chat',
    params: {
      id: compra.id,
      evento: compra.evento.nombre,
      con: `${organizador.nombre} ${organizador.apellido}`,
    },
  });
}

// Caso de uso 1: las compras del usuario activo, con el estado bien diferenciado
// y los días que faltan para el evento si están confirmadas. Vienen de a páginas y ya
// ordenadas por importancia (primero por estado; lo resuelve el backend), con cuántas hay
// en cada estado para los chips. Cada compra trae al organizador, para el aviso de mensajes.
export default function MisCompras() {
  const { usuario } = useUsuario();
  // Estado elegido en los chips (null = Todas). Se mantiene al recargar y al volver a la pestaña.
  const [estado, setEstado] = useState(null);
  const pedirPagina = useCallback(
    (pagina) => getMisCompras({ estado, pagina, limite: LIMITE }),
    [estado],
  );
  // Otro chip arranca de nuevo desde la página 1.
  const {
    items: compras, total, hayMas, extra, loading, recargando, error, cargandoMas, errorMas, cargarMas, recargar,
  } = usePaginado(pedirPagina);

  // Se vuelve a pedir cada vez que se vuelve a la pestaña, así se ven los cambios
  // después de comprar, pagar o cancelar. La primera vez ya lo pide usePaginado.
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
      {extra.cantidades && extra.cantidades.todas > 0 ? (
        <FiltroEstados cantidades={extra.cantidades} elegido={estado} onElegir={setEstado} />
      ) : null}
      {(loading && !recargando) || error || !compras ? (
        <EstadoCarga loading={loading} error={error} onRetry={recargar} mensaje="Cargando tus compras…" />
      ) : (
        <FlatList
          data={compras}
          keyExtractor={(compra) => String(compra.id)}
          renderItem={({ item }) => (
            <CompraCard
              compra={item}
              usuario={usuario}
              organizador={item.evento.organizador}
              onPress={() => router.push(`/compras/${item.id}`)}
              onChat={() => abrirChat(item)}
            />
          )}
          onEndReached={cargarMas}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl refreshing={recargando} onRefresh={recargar} colors={[colors.primary]} />
          }
          ListFooterComponent={
            <PieLista
              cargandoMas={cargandoMas}
              errorMas={errorMas}
              hayMas={hayMas}
              varias={total > LIMITE}
              onReintentar={cargarMas}
              cargando="Cargando más compras…"
              fin={`Ya viste las ${total} compras`}
            />
          }
          // Con el filtro en Todas (estado null) no hay estado del que leer el plural,
          // así que ese caso va al vacío de "sin compras".
          ListEmptyComponent={
            estado !== null ? (
              // Hay compras, pero ninguna en el estado elegido (ej: se pagó la única pendiente).
              <View style={styles.vacio}>
                <Text style={styles.vacioTitulo}>No tenés compras {estiloEstado(estado).enPlural}</Text>
                <Text style={styles.vacioTexto}>Cambiá el filtro para ver las demás.</Text>
                <Pressable style={styles.boton} onPress={() => setEstado(null)}>
                  <Text style={styles.botonTexto}>Ver todas</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.vacio}>
                <Ionicons name="ticket-outline" size={36} color={colors.textMuted} />
                <Text style={styles.vacioTitulo}>Todavía no compraste entradas</Text>
                <Text style={styles.vacioTexto}>Cuando compres, vas a ver acá el estado de cada compra.</Text>
                <Pressable style={styles.boton} onPress={() => router.navigate('/catalogo')}>
                  <Text style={styles.botonTexto}>Explorar eventos</Text>
                </Pressable>
              </View>
            )
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
