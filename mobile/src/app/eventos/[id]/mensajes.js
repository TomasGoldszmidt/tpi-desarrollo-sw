import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getEvento, getVentasEvento } from '../../../api/eventos.js';
import { useUsuario } from '../../../context/UsuarioContext.js';
import { useCarga } from '../../../hooks/useCarga.js';
import { usePaginado } from '../../../hooks/usePaginado.js';
import { Conversacion } from '../../../components/Conversacion.js';
import { PantallaCarga } from '../../../components/PantallaCarga.js';
import { PieLista } from '../../../components/PieLista.js';
import { EstadoCarga } from '../../../components/EstadoCarga.js';
import { ConversacionFila } from '../../../components/mensajes/ConversacionFila.js';
import { CabeceraChat } from '../../../components/mensajes/CabeceraChat.js';
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
