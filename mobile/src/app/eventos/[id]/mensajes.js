import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getEvento, getVentasEvento } from '../../../api/eventos.js';
import { useUsuario } from '../../../context/UsuarioContext.js';
import { useCarga } from '../../../hooks/useCarga.js';
import { usePaginado } from '../../../hooks/usePaginado.js';
import { Avatar } from '../../../components/Avatar.js';
import { Conversacion } from '../../../components/Conversacion.js';
import { PantallaCarga } from '../../../components/Carga.js';
import { PieLista } from '../../../components/PieLista.js';
import { EstadoCarga } from '../../../components/EstadoCarga.js';
import { EstadoBadge } from '../../../components/EstadoBadge.js';
import { tieneNoLeidos } from '../../../components/AvisoMensaje.js';
import { formatDia } from '../../../format.js';
import { colors, fontSize, spacing } from '../../../theme.js';

// Desde este ancho la lista y el chat se ven lado a lado (tablet o celular en horizontal).
const ANCHO_DIVIDIDO = 700;
// Conversaciones por página: las siguientes se piden con "Ver más".
const LIMITE = 10;

// Los mensajes de un evento, para su organizador: una conversación por compra con
// mensajes. Primero las que tienen mensajes sin leer y después la más reciente (el orden
// y la cuenta de sin leer vienen del backend). Se cargan de a 10 con "Ver más".
// En pantallas angostas, tocar una abre el chat; en anchas, el chat se ve a la derecha.
export default function MensajesEvento() {
  const { id } = useLocalSearchParams();
  const { usuario } = useUsuario();
  const { width } = useWindowDimensions();
  const dividido = width >= ANCHO_DIVIDIDO;

  const pedirEvento = useCallback(() => getEvento(id), [id]);
  const cabecera = useCarga(pedirEvento);
  const pedirConversaciones = useCallback(
    (pagina) => getVentasEvento(id, { conMensajes: true, pagina, limite: LIMITE }),
    [id],
  );
  const bandeja = usePaginado(pedirConversaciones);

  const { recargar: recargarEvento } = cabecera;
  const { recargar: recargarBandeja } = bandeja;
  const recargar = useCallback(() => {
    recargarEvento();
    recargarBandeja();
  }, [recargarEvento, recargarBandeja]);
  const evento = cabecera.data;
  const conversaciones = bandeja.items;
  const error = cabecera.error ?? bandeja.error;
  const loading = cabecera.loading || bandeja.loading;
  // La conversación abierta a la derecha (solo en pantallas anchas).
  const [elegidaId, setElegidaId] = useState(null);

  // Al volver de un chat se vuelve a pedir, así se actualizan el último mensaje y el orden.
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

  if ((cabecera.loading && !evento) || (bandeja.loading && !conversaciones)) {
    return <PantallaCarga mensaje="Cargando los mensajes…" />;
  }
  if (error || !evento || !conversaciones) {
    return (
      <View style={styles.centrado}>
        <EstadoCarga loading={loading} error={error} onRetry={recargar} />
      </View>
    );
  }

  const sinLeer = bandeja.extra.noLeidas ?? 0;
  // En pantallas anchas, si no se eligió ninguna (o ya no está), se abre la primera.
  const elegida = conversaciones.find((compra) => compra.id === elegidaId) ?? conversaciones[0];

  function abrir(compra) {
    if (dividido) {
      setElegidaId(compra.id);
      return;
    }
    router.push({
      pathname: '/compras/[id]/chat',
      params: { id: compra.id, evento: evento.nombre, con: `${compra.comprador.nombre} ${compra.comprador.apellido}` },
    });
  }

  const lista = (
    <FlatList
      style={dividido ? styles.listaDividida : styles.pantalla}
      contentContainerStyle={styles.contenido}
      data={conversaciones}
      keyExtractor={(compra) => String(compra.id)}
      ListHeaderComponent={
        <View style={styles.encabezado}>
          <Text style={styles.etiqueta}>Mensajes</Text>
          <Text style={styles.nombre}>{evento.nombre}</Text>
          {bandeja.total > 0 ? (
            <Text style={styles.resumen}>
              {bandeja.total === 1 ? '1 conversación' : `${bandeja.total} conversaciones`}
              {sinLeer > 0 ? ` · ${sinLeer} sin leer` : ''}
            </Text>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <ConversacionFila
          compra={item}
          usuario={usuario}
          elegida={dividido && item.id === elegida?.id}
          onPress={() => abrir(item)}
        />
      )}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={recargar} colors={[colors.primary]} />}
      ListFooterComponent={
        <PieLista
          cargandoMas={bandeja.cargandoMas}
          errorMas={bandeja.errorMas}
          hayMas={bandeja.hayMas}
          varias={bandeja.total > LIMITE}
          onVerMas={bandeja.cargarMas}
          restantes={bandeja.total - conversaciones.length}
          fin={`Ya viste las ${bandeja.total} conversaciones`}
        />
      }
      ListEmptyComponent={
        <View style={styles.vacio}>
          <Text style={styles.vacioTitulo}>Todavía nadie te escribió</Text>
          <Text style={styles.vacioTexto}>Cuando un comprador te escriba, vas a ver la conversación acá.</Text>
        </View>
      }
    />
  );

  if (!dividido) return lista;

  return (
    <View style={styles.dividida}>
      {lista}
      <View style={styles.panel}>
        {elegida ? (
          <Conversacion
            key={elegida.id}
            compraId={elegida.id}
            onEnviado={recargar}
            // Al leerla se fija como elegida: si no, al reordenarse la lista se abriría
            // (y se marcaría como leída) otra conversación sin que la toquen.
            onLeido={() => {
              setElegidaId(elegida.id);
              recargar();
            }}
            encabezado={<CabeceraChat compra={elegida} />}
          />
        ) : (
          <View style={styles.centrado}>
            <Text style={styles.vacioTexto}>Elegí una conversación para verla acá.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ConversacionFila({ compra, usuario, elegida, onPress }) {
  const ultimo = compra.mensajes.at(-1);
  const propio = ultimo.usuarioId === usuario.id;
  const noLeida = tieneNoLeidos(compra);
  return (
    <Pressable
      style={({ pressed }) => [styles.fila, elegida && styles.filaElegida, pressed && styles.presionada]}
      onPress={onPress}
    >
      <Avatar usuario={compra.comprador} size={40} />
      <View style={styles.filaInfo}>
        <View style={styles.filaArriba}>
          <Text style={styles.comprador} numberOfLines={1}>
            {compra.comprador.nombre} {compra.comprador.apellido}
          </Text>
          <Text style={styles.fecha}>{formatDia(ultimo.enviado)}</Text>
        </View>
        <View style={styles.filaArriba}>
          <Text style={[styles.ultimo, noLeida && styles.ultimoEspera]} numberOfLines={1}>
            {propio ? 'Vos: ' : ''}
            {ultimo.mensaje}
          </Text>
          {noLeida ? <View style={styles.punto} /> : null}
        </View>
        <View style={styles.compra}>
          <EstadoBadge estado={compra.estado} chico />
          <Text style={styles.detalle}>
            {compra.tipoEntrada.nombre} × {compra.cantidad}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// Arriba del chat en la vista dividida: con quién, qué compró y el acceso a la compra.
function CabeceraChat({ compra }) {
  return (
    <View style={styles.cabecera}>
      <Avatar usuario={compra.comprador} size={32} />
      <View style={styles.filaInfo}>
        <Text style={styles.comprador}>
          {compra.comprador.nombre} {compra.comprador.apellido}
        </Text>
        <Text style={styles.detalle}>
          {compra.tipoEntrada.nombre} × {compra.cantidad}
        </Text>
      </View>
      <EstadoBadge estado={compra.estado} />
      <Pressable onPress={() => router.push(`/compras/${compra.id}`)} hitSlop={12} accessibilityRole="button">
        <Text style={styles.verCompra}>Ver compra</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  dividida: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  listaDividida: {
    width: '38%',
    minWidth: 300,
    maxWidth: 420,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  panel: {
    flex: 1,
  },
  contenido: {
    padding: spacing.lg,
  },
  encabezado: {
    marginBottom: spacing.sm,
  },
  etiqueta: {
    color: colors.textMuted,
    fontSize: fontSize.small,
  },
  nombre: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: 'bold',
  },
  resumen: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    marginTop: 2,
  },
  fila: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  filaElegida: {
    backgroundColor: colors.primarySoft,
  },
  presionada: {
    opacity: 0.7,
  },
  filaInfo: {
    flex: 1,
    gap: 2,
  },
  filaArriba: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  comprador: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  fecha: {
    color: colors.textMuted,
    fontSize: 11,
  },
  ultimo: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  ultimoEspera: {
    color: colors.text,
    fontWeight: 'bold',
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  compra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  detalle: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  verCompra: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: 'bold',
  },
  vacio: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.xs,
  },
  vacioTitulo: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  vacioTexto: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
});
