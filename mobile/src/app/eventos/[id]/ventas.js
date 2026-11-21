import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getEvento, getVentasEvento } from '../../../api/eventos.js';
import { useCarga } from '../../../hooks/useCarga.js';
import { usePaginado } from '../../../hooks/usePaginado.js';
import { useLayout } from '../../../hooks/useLayout.js';
import { Boton } from '../../../components/Boton.js';
import { PantallaCarga } from '../../../components/PantallaCarga.js';
import { EstadoCarga } from '../../../components/EstadoCarga.js';
import { FiltroEstados } from '../../../components/FiltroEstados.js';
import { PieLista } from '../../../components/PieLista.js';
import { DisponiblesFila } from '../../../components/ventas/DisponiblesFila.js';
import { VentaCard } from '../../../components/ventas/VentaCard.js';
import { VentaFila } from '../../../components/ventas/VentaFila.js';
import { useUsuario } from '../../../context/UsuarioContext.js';
import { formatFecha, formatPrecio } from '../../../format.js';
import { colors, fontSize, spacing, TOQUE_MINIMO } from '../../../theme.js';

// Compras por página: las siguientes se piden con "Ver más".
const LIMITE = 10;

// Caso de uso 2: las ventas de un evento para su organizador. Arriba, un encabezado compacto
// con el resumen (recaudado y entradas vendidas) y las disponibles de cada tipo con su barra;
// abajo, las compras con chips por estado. "Mensajes" en la barra lleva la cantidad sin leer.
// En tablet horizontal el resumen queda a la izquierda y las compras en una tabla.
export default function VentasEvento() {
  const { id } = useLocalSearchParams();
  const { usuario } = useUsuario();
  const { esAncho } = useLayout();
  // Chip elegido (null = Todas).
  const [estado, setEstado] = useState(null);
  const pedirEvento = useCallback(async () => {
    const [evento, bandeja] = await Promise.all([getEvento(id), getVentasEvento(id, { conMensajes: true, limite: 1 })]);
    return { evento, noLeidas: bandeja.noLeidas };
  }, [id]);
  const cabecera = useCarga(pedirEvento);
  const pedirCompras = useCallback((pagina) => getVentasEvento(id, { estado, pagina, limite: LIMITE }), [id, estado]);
  const ventas = usePaginado(pedirCompras);

  const { recargar: recargarEvento } = cabecera;
  const { recargar: recargarCompras } = ventas;
  const recargar = useCallback(() => {
    recargarEvento();
    recargarCompras();
  }, [recargarEvento, recargarCompras]);
  const compras = ventas.items;
  const error = cabecera.error ?? ventas.error;
  const loading = cabecera.loading || ventas.loading;

  // Al volver de una compra o del chat se vuelve a pedir todo.
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

  if ((cabecera.loading && !cabecera.data) || (ventas.loading && !compras)) {
    return <PantallaCarga mensaje="Cargando las ventas…" />;
  }
  if (error || !cabecera.data || !compras) {
    return (
      <View style={styles.centrado}>
        <EstadoCarga loading={loading} error={error} onRetry={recargar} />
      </View>
    );
  }

  const { evento, noLeidas } = cabecera.data;
  const { resumen, cantidades } = ventas.extra;
  const lugar = evento.lugar.split(',')[0];
  const abrirMensajes = () => router.push(`/eventos/${evento.id}/mensajes`);

  const encabezado = (
    <>
      <Text style={styles.etiqueta}>Ventas</Text>
      <Text style={styles.nombre}>{evento.nombre}</Text>
      <Text style={styles.meta}>
        {formatFecha(evento.fecha)} · {lugar}
      </Text>
      {resumen ? (
        <View style={styles.resumen}>
          <View style={[styles.dato, styles.datoVerde]}>
            <Text style={styles.datoEtiqueta}>Recaudado</Text>
            <Text style={styles.datoNumero}>{formatPrecio(resumen.recaudado)}</Text>
          </View>
          <View style={styles.dato}>
            <Text style={styles.datoEtiqueta}>Entradas vendidas</Text>
            <Text style={styles.datoNumero}>{resumen.vendidas}</Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.seccion}>Disponibles</Text>
      <View style={styles.tipos}>
        {evento.tiposEntrada.map((tipo) => (
          <DisponiblesFila key={tipo.id} tipo={tipo} />
        ))}
      </View>
    </>
  );

  const listaCompras = (
    <>
      <Text style={[styles.seccion, esAncho && styles.seccionAncho]}>Compras · {cantidades?.todas ?? ventas.total}</Text>
      {cantidades && cantidades.todas > 0 ? (
        <FiltroEstados cantidades={cantidades} elegido={estado} onElegir={setEstado} sangria={esAncho ? spacing.xl : spacing.lg} />
      ) : null}
      {compras.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioTexto}>
            {estado ? 'No hay compras en este estado.' : 'Todavía nadie compró entradas para este evento.'}
          </Text>
        </View>
      ) : esAncho ? (
        <View>
          <View style={[styles.filaTabla, styles.encabezadoTabla]}>
            <Text style={[styles.th, styles.colComprador]}>Comprador</Text>
            <Text style={[styles.th, styles.colEntradas]}>Entradas</Text>
            <Text style={[styles.th, styles.colFecha]}>Fecha</Text>
            <Text style={[styles.th, styles.colEstado]}>Estado</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
          </View>
          {compras.map((compra) => (
            <VentaFila key={compra.id} compra={compra} usuario={usuario} onPress={() => router.push(`/compras/${compra.id}`)} />
          ))}
        </View>
      ) : (
        compras.map((compra) => (
          <VentaCard key={compra.id} compra={compra} usuario={usuario} onPress={() => router.push(`/compras/${compra.id}`)} />
        ))
      )}
      <PieLista
        cargandoMas={ventas.cargandoMas}
        errorMas={ventas.errorMas}
        hayMas={ventas.hayMas}
        varias={ventas.total > LIMITE}
        onVerMas={ventas.cargarMas}
        restantes={ventas.total - compras.length}
        fin={`Ya viste las ${ventas.total} compras`}
      />
    </>
  );

  const botonMensajes = (
    <Pressable style={styles.botonMensajes} onPress={abrirMensajes} accessibilityRole="button" accessibilityLabel={noLeidas > 0 ? `Mensajes, ${noLeidas} sin leer` : 'Mensajes'}>
      <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
      {noLeidas > 0 ? (
        <View style={styles.contador}>
          <Text style={styles.contadorTexto}>{noLeidas}</Text>
        </View>
      ) : null}
    </Pressable>
  );

  const refresco = <RefreshControl refreshing={loading} onRefresh={recargar} colors={[colors.primary]} />;

  if (esAncho) {
    return (
      <View style={styles.ancho}>
        <ScrollView style={styles.panel} contentContainerStyle={styles.panelContenido}>
          {encabezado}
          <Boton
            titulo={noLeidas > 0 ? `Mensajes · ${noLeidas} sin leer` : 'Mensajes'}
            variante="secundario"
            icono="chatbubbles-outline"
            onPress={abrirMensajes}
            style={styles.mensajesAncho}
          />
        </ScrollView>
        <ScrollView style={styles.principal} contentContainerStyle={styles.principalContenido} refreshControl={refresco}>
          {listaCompras}
        </ScrollView>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerRight: () => botonMensajes }} />
      <ScrollView style={styles.pantalla} contentContainerStyle={styles.contenido} refreshControl={refresco}>
        {encabezado}
        {listaCompras}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: spacing.lg,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  etiqueta: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nombre: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: 'bold',
    marginTop: 2,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  resumen: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  dato: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  datoVerde: {
    backgroundColor: colors.primarySofter,
  },
  datoEtiqueta: {
    color: colors.textSecondary,
    fontSize: fontSize.caption,
  },
  datoNumero: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: 'bold',
  },
  seccion: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  seccionAncho: {
    marginTop: 0,
  },
  tipos: {
    gap: spacing.md,
  },
  vacio: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
  },
  vacioTexto: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
  botonMensajes: {
    width: TOQUE_MINIMO,
    height: TOQUE_MINIMO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contador: {
    position: 'absolute',
    top: 4,
    right: 0,
    minWidth: 19,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
  },
  contadorTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  ancho: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  panel: {
    width: 360,
    flexGrow: 0,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.borderSoft,
  },
  panelContenido: {
    padding: spacing.xl,
  },
  mensajesAncho: {
    marginTop: spacing.xl,
  },
  principal: {
    flex: 1,
  },
  principalContenido: {
    padding: spacing.xl,
    maxWidth: 900,
  },
  filaTabla: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  encabezadoTabla: {
    minHeight: 36,
    borderBottomColor: colors.border,
  },
  th: {
    color: colors.textSecondary,
    fontSize: fontSize.caption,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colComprador: {
    flex: 2.2,
  },
  colEntradas: {
    flex: 1.4,
  },
  colFecha: {
    flex: 1.2,
  },
  colEstado: {
    flex: 1.6,
  },
  colTotal: {
    flex: 1.1,
    textAlign: 'right',
  },
});
