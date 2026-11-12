import { useCallback, useRef } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getEvento, getVentasEvento } from '../../../api/eventos.js';
import { useCarga } from '../../../hooks/useCarga.js';
import { usePaginado } from '../../../hooks/usePaginado.js';
import { PantallaCarga } from '../../../components/Carga.js';
import { EstadoCarga } from '../../../components/EstadoCarga.js';
import { EstadoBadge, ESTADOS_INACTIVOS } from '../../../components/EstadoBadge.js';
import { Galeria } from '../../../components/Galeria.js';
import { PieLista } from '../../../components/PieLista.js';
import { AvisoMensaje, estiloEsperando, mensajeNoLeido } from '../../../components/AvisoMensaje.js';
import { useUsuario } from '../../../context/UsuarioContext.js';
import { formatDia, formatFecha, formatPrecio } from '../../../format.js';
import { colors, fontSize, spacing } from '../../../theme.js';

// Compras por página: las siguientes se piden con "Ver más".
const LIMITE = 10;

// Caso de uso 2: las compras de un evento con su estado y las entradas que quedan
// disponibles de cada tipo. Solo la ve el organizador. El evento se pide una vez; las
// compras, de a páginas con un botón "Ver más" (la lista va dentro del ScrollView).
export default function VentasEvento() {
  const { id } = useLocalSearchParams();
  const { usuario } = useUsuario();
  const pedirEvento = useCallback(() => getEvento(id), [id]);
  const cabecera = useCarga(pedirEvento);
  const pedirCompras = useCallback((pagina) => getVentasEvento(id, { pagina, limite: LIMITE }), [id]);
  const ventas = usePaginado(pedirCompras);

  const { recargar: recargarEvento } = cabecera;
  const { recargar: recargarCompras } = ventas;
  const recargar = useCallback(() => {
    recargarEvento();
    recargarCompras();
  }, [recargarEvento, recargarCompras]);
  const evento = cabecera.data;
  const compras = ventas.items;
  const error = cabecera.error ?? ventas.error;
  const loading = cabecera.loading || ventas.loading;

  // Al volver del detalle de una compra se vuelven a pedir el evento y las ventas
  // (desde las primeras 10). La primera vez ya lo piden useCarga y usePaginado.
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

  if ((cabecera.loading && !evento) || (ventas.loading && !compras)) {
    return <PantallaCarga mensaje="Cargando las ventas…" />;
  }
  if (error || !evento || !compras) {
    return (
      <View style={styles.centrado}>
        <EstadoCarga loading={loading} error={error} onRetry={recargar} />
      </View>
    );
  }

  // Del lugar se muestra solo el nombre, sin la dirección.
  const lugar = evento.lugar.split(',')[0];

  return (
    <ScrollView
      style={styles.pantalla}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={recargar} colors={[colors.primary]} />}
    >
      <Galeria imagenes={evento.multimedia} />
      <View style={styles.contenido}>
        <Text style={styles.etiqueta}>Ventas</Text>
        <Text style={styles.nombre}>{evento.nombre}</Text>
        <Text style={styles.meta}>
          {formatFecha(evento.fecha)} · {lugar}
        </Text>

        <Text style={styles.seccion}>Entradas disponibles</Text>
        {evento.tiposEntrada.map((tipo) => (
          <DisponiblesFila key={tipo.id} tipo={tipo} />
        ))}

        <View style={styles.seccionFila}>
          <Text style={[styles.seccion, styles.seccionTitulo]}>Compras ({ventas.total})</Text>
          {/* Todas las conversaciones del evento juntas, sin entrar compra por compra. */}
          <Pressable style={styles.verMensajes} onPress={() => router.push(`/eventos/${evento.id}/mensajes`)}>
            <Text style={styles.verMensajesTexto}>Ver mensajes</Text>
          </Pressable>
        </View>
        {compras.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioTexto}>Todavía nadie compró entradas para este evento.</Text>
          </View>
        ) : (
          compras.map((compra) => (
            <VentaCard key={compra.id} compra={compra} usuario={usuario} onPress={() => router.push(`/compras/${compra.id}`)} />
          ))
        )}
        <PieLista
          conBoton
          cargandoMas={ventas.cargandoMas}
          errorMas={ventas.errorMas}
          hayMas={ventas.hayMas}
          varias={ventas.total > LIMITE}
          onReintentar={ventas.cargarMas}
          restantes={ventas.total - compras.length}
          fin={`Ya viste las ${ventas.total} compras`}
        />
      </View>
    </ScrollView>
  );
}

// Un tipo de entrada con cuántas quedan de su cupo; la barra muestra lo vendido.
function DisponiblesFila({ tipo }) {
  const vendidas = tipo.cupo - tipo.disponibles;
  return (
    <View style={styles.tipo}>
      <View>
        <Text style={styles.tipoNombre}>{tipo.nombre}</Text>
        <Text style={styles.meta}>{formatPrecio(tipo.precio)}</Text>
      </View>
      <View style={styles.tipoDerecha}>
        {tipo.disponibles === 0 ? (
          <Text style={styles.agotado}>Agotado</Text>
        ) : (
          <Text style={styles.disponibles}>
            {tipo.disponibles} de {tipo.cupo}
          </Text>
        )}
        <View style={styles.barra}>
          <View style={[styles.barraVendida, { width: `${(vendidas / tipo.cupo) * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

// Una compra del evento: estado, comprador, entradas y total. Abre el detalle con el chat.
// Si el comprador escribió algo que el organizador no leyó, abajo lo avisa.
function VentaCard({ compra, usuario, onPress }) {
  const inactiva = ESTADOS_INACTIVOS.includes(compra.estado);
  const noLeido = mensajeNoLeido(compra, usuario);
  // El primer cambio del historial es la creación de la compra.
  const creada = compra.historial[0].fechaHora;
  const mensajes = compra.mensajes.length;
  let detalle = `${compra.tipoEntrada.nombre} × ${compra.cantidad}`;
  if (mensajes > 0) detalle += mensajes === 1 ? ' · 1 mensaje' : ` · ${mensajes} mensajes`;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        noLeido && estiloEsperando,
        inactiva && styles.inactiva,
        pressed && styles.presionada,
      ]}
      onPress={onPress}
    >
      <View style={styles.fila}>
        <EstadoBadge estado={compra.estado} />
        <Text style={styles.meta}>{formatDia(creada)}</Text>
      </View>
      <Text style={styles.comprador}>
        {compra.comprador.nombre} {compra.comprador.apellido}
      </Text>
      <View style={styles.fila}>
        <Text style={styles.meta}>{detalle}</Text>
        <Text style={styles.total}>{formatPrecio(compra.total)}</Text>
      </View>
      {noLeido ? (
        <AvisoMensaje texto={`${compra.comprador.nombre} te escribió`} mensaje={noLeido.mensaje} />
      ) : null}
    </Pressable>
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
  etiqueta: {
    color: colors.primaryText,
    fontSize: fontSize.small,
    fontWeight: 'bold',
  },
  nombre: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: 'bold',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  seccion: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  seccionFila: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  seccionTitulo: {
    flex: 1,
  },
  verMensajes: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  verMensajesTexto: {
    color: colors.primaryText,
    fontSize: fontSize.small,
    fontWeight: 'bold',
  },
  tipo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tipoNombre: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  tipoDerecha: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  disponibles: {
    color: colors.primaryText,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  agotado: {
    backgroundColor: '#FCEBEB',
    color: '#791F1F',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  barra: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F1EFE8',
    overflow: 'hidden',
  },
  barraVendida: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 2,
  },
  inactiva: {
    opacity: 0.6,
  },
  presionada: {
    backgroundColor: colors.primarySoft,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comprador: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  total: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: 'bold',
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
});
