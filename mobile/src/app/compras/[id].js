import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { cancelarCompra, getCompra, pagarCompra } from '../../api/compras.js';
import { crearResenia } from '../../api/resenias.js';
import { getUsuario } from '../../api/usuarios.js';
import { useUsuario } from '../../context/UsuarioContext.js';
import { useCarga } from '../../hooks/useCarga.js';
import { CargaEncima, PantallaCarga } from '../../components/Carga.js';
import { EstadoBadge } from '../../components/EstadoBadge.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { Estrellas } from '../../components/Estrellas.js';
import { ReseniaForm } from '../../components/ReseniaForm.js';
import { formatDia, formatDiasRestantes, formatFecha, formatPrecio } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Cómo se cuenta cada cambio de estado en el historial.
const HISTORIAL = {
  PENDIENTE: 'Comprada',
  CONFIRMADA: 'Pagada',
  UTILIZADA: 'Utilizada',
  CANCELADA: 'Cancelada',
  REEMBOLSADA: 'Reembolsada',
};

// Detalle de una compra (casos de uso 5 a 9): estado, entradas, acciones del comprador
// (pagar, cancelar, reseñar), la vista previa del chat y el historial.
export default function DetalleCompra() {
  const { id } = useLocalSearchParams();
  const { usuario } = useUsuario();
  const insets = useSafeAreaInsets();
  const pedir = useCallback(async () => {
    const compra = await getCompra(id);
    // La compra trae solo el id del organizador: su nombre va en el chat.
    const organizador = await getUsuario(compra.evento.organizadorId);
    return { compra, organizador };
  }, [id]);
  const { data, loading, error, recargar } = useCarga(pedir);
  const [procesando, setProcesando] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  // Al volver del chat se vuelve a pedir, así la vista previa muestra los mensajes nuevos.
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

  if (loading && !data) {
    return <PantallaCarga mensaje="Cargando tu compra…" />;
  }
  if (error || !data) {
    return (
      <View style={styles.centrado}>
        <EstadoCarga loading={loading} error={error} onRetry={recargar} />
      </View>
    );
  }

  const { compra, organizador } = data;
  const esComprador = usuario?.id === compra.comprador.id;
  // Con quién se chatea: el comprador habla con el organizador y viceversa.
  const otro = esComprador ? organizador : compra.comprador;

  // Corre una acción con el velo de carga y después vuelve a pedir la compra.
  async function ejecutar(mensaje, accion) {
    setProcesando(mensaje);
    setErrorAccion(null);
    try {
      await accion();
      recargar();
    } catch (e) {
      setErrorAccion(e.message);
    } finally {
      setProcesando(null);
    }
  }

  function confirmarCancelacion(pagada) {
    Alert.alert(
      pagada ? '¿Cancelar y pedir el reembolso?' : '¿Cancelar la compra?',
      pagada ? `Se te devuelven ${formatPrecio(compra.total)} y se liberan las entradas.` : 'Se liberan las entradas.',
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Cancelar compra', style: 'destructive', onPress: () => ejecutar('Cancelando la compra…', () => cancelarCompra(compra.id)) },
      ],
    );
  }

  // Acciones del comprador según el estado. Una compra pagada solo se cancela antes del evento
  // (diasRestantes es null si ya pasó); el backend igual valida cada regla.
  const acciones = [];
  if (esComprador && compra.estado === 'PENDIENTE') {
    acciones.push({ texto: `Pagar ${formatPrecio(compra.total)}`, onPress: () => ejecutar('Procesando el pago…', () => pagarCompra(compra.id)) });
    acciones.push({ texto: 'Cancelar compra', peligro: true, onPress: () => confirmarCancelacion(false) });
  }
  if (esComprador && compra.estado === 'CONFIRMADA' && compra.diasRestantes !== null) {
    acciones.push({ texto: 'Cancelar y pedir reembolso', peligro: true, onPress: () => confirmarCancelacion(true) });
  }

  const ultimo = compra.mensajes.at(-1);
  const autorUltimo = ultimo && (ultimo.usuarioId === organizador.id ? organizador : compra.comprador);

  return (
    <View style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.arriba}>
          <EstadoBadge estado={compra.estado} />
          {compra.estado === 'CONFIRMADA' ? <Text style={styles.dias}>{formatDiasRestantes(compra.diasRestantes)}</Text> : null}
        </View>
        <Text style={styles.nombre}>{compra.evento.nombre}</Text>
        <Text style={styles.meta}>{formatFecha(compra.evento.fecha)}</Text>
        <Text style={styles.meta}>{compra.evento.lugar}</Text>
        {!esComprador ? (
          <Text style={styles.meta}>
            Comprador: {compra.comprador.nombre} {compra.comprador.apellido}
          </Text>
        ) : null}

        <View style={styles.caja}>
          <View style={styles.linea}>
            <Text style={styles.texto}>
              {compra.tipoEntrada.nombre} × {compra.cantidad}
            </Text>
            <Text style={styles.texto}>{formatPrecio(compra.tipoEntrada.precio * compra.cantidad)}</Text>
          </View>
          <View style={[styles.linea, styles.lineaTotal]}>
            <Text style={styles.total}>Total</Text>
            <Text style={styles.total}>{formatPrecio(compra.total)}</Text>
          </View>
        </View>

        {esComprador && compra.estado === 'UTILIZADA' ? (
          <>
            <Text style={styles.seccion}>{compra.resenia ? 'Tu reseña' : '¿Cómo estuvo el evento?'}</Text>
            {compra.resenia ? (
              <View style={styles.caja}>
                <Estrellas valor={compra.resenia.puntuacion} size={18} />
                <Text style={[styles.texto, styles.reseniaTexto]}>{compra.resenia.detalle}</Text>
              </View>
            ) : (
              <ReseniaForm
                onPublicar={(resenia) =>
                  ejecutar('Publicando tu reseña…', () => crearResenia({ eventoId: compra.evento.id, ...resenia }))
                }
              />
            )}
          </>
        ) : null}

        <Text style={styles.seccion}>
          Chat con {otro.nombre} {otro.apellido}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.chat, pressed && styles.presionado]}
          onPress={() =>
            router.push({
              pathname: '/compras/[id]/chat',
              params: { id: compra.id, evento: compra.evento.nombre, con: `${otro.nombre} ${otro.apellido}` },
            })
          }
        >
          <View style={styles.chatInfo}>
            {ultimo ? (
              <>
                <Text style={styles.texto} numberOfLines={1}>
                  <Text style={styles.autor}>{autorUltimo.nombre}:</Text> {ultimo.mensaje}
                </Text>
                <Text style={styles.meta}>
                  {compra.mensajes.length} {compra.mensajes.length === 1 ? 'mensaje' : 'mensajes'} · {formatDia(ultimo.enviado)}
                </Text>
              </>
            ) : (
              <Text style={styles.meta}>Todavía no hay mensajes. Escribí si tenés alguna consulta.</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>

        <Text style={styles.seccion}>Historial</Text>
        {compra.historial.map((cambio) => (
          <View key={`${cambio.estado}-${cambio.fechaHora}`} style={styles.cambio}>
            <View style={styles.punto} />
            <Text style={styles.meta}>
              {HISTORIAL[cambio.estado]} · {formatFecha(cambio.fechaHora)}
            </Text>
          </View>
        ))}
      </ScrollView>

      {acciones.length > 0 || errorAccion ? (
        <View style={[styles.pie, { paddingBottom: spacing.md + insets.bottom }]}>
          {errorAccion ? <Text style={styles.error}>{errorAccion}</Text> : null}
          {acciones.map((accion) => (
            <Pressable
              key={accion.texto}
              style={[styles.boton, accion.peligro && styles.botonPeligro]}
              onPress={accion.onPress}
            >
              <Text style={[styles.botonTexto, accion.peligro && styles.botonTextoPeligro]}>{accion.texto}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* El velo sigue hasta que llega la compra actualizada, para no mostrar el estado viejo. */}
      {procesando || loading ? <CargaEncima mensaje={procesando ?? 'Actualizando tu compra…'} /> : null}
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
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  contenido: {
    padding: spacing.lg,
  },
  arriba: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dias: {
    color: colors.primaryText,
    fontSize: fontSize.small,
    fontWeight: 'bold',
  },
  nombre: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  texto: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  caja: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  linea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineaTotal: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  total: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  reseniaTexto: {
    lineHeight: 20,
  },
  seccion: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  chat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  presionado: {
    backgroundColor: colors.primarySoft,
  },
  chatInfo: {
    flex: 1,
    gap: 2,
  },
  autor: {
    fontWeight: 'bold',
  },
  cambio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
  },
  pie: {
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  error: {
    backgroundColor: '#FCEBEB',
    color: '#791F1F',
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.body,
    overflow: 'hidden',
  },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  botonPeligro: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonTextoPeligro: {
    color: '#791F1F',
  },
});
