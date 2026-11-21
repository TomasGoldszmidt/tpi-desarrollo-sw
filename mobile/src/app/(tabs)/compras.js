import { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getMisCompras, pagarCompra } from '../../api/compras.js';
import { useUsuario } from '../../context/UsuarioContext.js';
import { useAvisos } from '../../context/AvisosContext.js';
import { usePaginado } from '../../hooks/usePaginado.js';
import { useLayout } from '../../hooks/useLayout.js';
import { Boton } from '../../components/Boton.js';
import { CargaEncima } from '../../components/CargaEncima.js';
import { CompraCard } from '../../components/CompraCard.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { FiltroEstados } from '../../components/FiltroEstados.js';
import { PieLista } from '../../components/PieLista.js';
import { estiloEstado } from '../../components/EstadoBadge.js';
import { Seccion } from '../../components/Seccion.js';
import { formatPrecio } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Compras por página: las siguientes se piden con "Ver más".
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

// Caso de uso 1: las compras del usuario activo, con el estado bien diferenciado (ícono y
// color) y los días que faltan para el evento si están confirmadas. Vienen de a páginas y ya
// ordenadas por importancia, con cuántas hay en cada estado para los chips. Las pendientes
// se pagan desde la tarjeta. En tablet van en dos o tres columnas.
export default function MisCompras() {
  const { usuario } = useUsuario();
  const avisos = useAvisos();
  const { columnas } = useLayout();
  // Estado elegido en los chips (null = Todas). Se mantiene al recargar y al volver a la pestaña.
  const [estado, setEstado] = useState(null);
  const [pagando, setPagando] = useState(false);
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

  function confirmarPago(compra) {
    Alert.alert(
      `¿Pagar ${formatPrecio(compra.total)}?`,
      `${compra.tipoEntrada.nombre} × ${compra.cantidad} para ${compra.evento.nombre}. La compra queda confirmada.`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Pagar',
          onPress: async () => {
            setPagando(true);
            try {
              await pagarCompra(compra.id);
              avisos.mostrar('Pagaste tu compra. ¡Que lo disfrutes!');
              recargar();
            } catch (e) {
              Alert.alert('No pudimos procesar el pago', e.message);
            } finally {
              setPagando(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Seccion titulo="Mis compras">
      {extra.cantidades && extra.cantidades.todas > 0 ? (
        <FiltroEstados cantidades={extra.cantidades} elegido={estado} onElegir={setEstado} />
      ) : null}
      {(loading && !recargando) || error || !compras ? (
        <EstadoCarga loading={loading} error={error} onRetry={recargar} mensaje="Cargando tus compras…" />
      ) : (
        <FlatList
          key={`columnas-${columnas}`}
          data={compras}
          numColumns={columnas}
          columnWrapperStyle={columnas > 1 ? styles.filaGrilla : undefined}
          keyExtractor={(compra) => String(compra.id)}
          renderItem={({ item }) => (
            <View style={columnas > 1 ? [styles.celda, { maxWidth: `${100 / columnas}%` }] : null}>
              <CompraCard
                compra={item}
                usuario={usuario}
                organizador={item.evento.organizador}
                onPress={() => router.push(`/compras/${item.id}`)}
                onChat={() => abrirChat(item)}
                onPagar={() => confirmarPago(item)}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={recargando} onRefresh={recargar} colors={[colors.primary]} />
          }
          ListFooterComponent={
            <PieLista
              cargandoMas={cargandoMas}
              errorMas={errorMas}
              hayMas={hayMas}
              varias={total > LIMITE}
              onVerMas={cargarMas}
              restantes={total - (compras?.length ?? 0)}
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
                <Boton titulo="Ver todas" variante="secundario" chico onPress={() => setEstado(null)} style={styles.centrado} />
              </View>
            ) : (
              <View style={styles.vacio}>
                <Ionicons name="ticket-outline" size={40} color={colors.textMuted} />
                <Text style={styles.vacioTitulo}>Todavía no compraste entradas</Text>
                <Text style={styles.vacioTexto}>Cuando compres, vas a ver acá el estado de cada compra.</Text>
                <Boton titulo="Explorar eventos" variante="secundario" chico onPress={() => router.navigate('/catalogo')} style={styles.centrado} />
              </View>
            )
          }
        />
      )}
      {pagando ? <CargaEncima mensaje="Procesando el pago…" /> : null}
    </Seccion>
  );
}

const styles = StyleSheet.create({
  filaGrilla: {
    gap: spacing.md,
  },
  celda: {
    flex: 1,
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
