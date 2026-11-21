import { useCallback, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { cancelarCompra, getCompra, marcarUtilizada, pagarCompra } from '../../api/compras.js';
import { getEvento } from '../../api/eventos.js';
import { crearResenia } from '../../api/resenias.js';
import { useUsuario } from '../../context/UsuarioContext.js';
import { useAvisos } from '../../context/AvisosContext.js';
import { useCarga } from '../../hooks/useCarga.js';
import { useLayout } from '../../hooks/useLayout.js';
import { Avatar } from '../../components/Avatar.js';
import { Boton } from '../../components/Boton.js';
import { CargaEncima } from '../../components/CargaEncima.js';
import { PantallaCarga } from '../../components/PantallaCarga.js';
import { Conversacion } from '../../components/Conversacion.js';
import { EstadoBadge } from '../../components/EstadoBadge.js';
import { Etiqueta } from '../../components/Etiqueta.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { Estrellas } from '../../components/Estrellas.js';
import { Aviso } from '../../components/Aviso.js';
import { ReseniaForm } from '../../components/ReseniaForm.js';
import { formatDia, formatDiasRestantes, formatFecha, formatPrecio } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Cómo se cuenta cada cambio de estado en el historial, con su ícono y colores.
const HISTORIAL = {
  PENDIENTE: { texto: 'Reservada', icono: 'ticket-outline', fondo: '#FAEEDA', color: '#633806' },
  CONFIRMADA: { texto: 'Pagada', icono: 'checkmark', fondo: '#EAF3DE', color: '#27500A' },
  UTILIZADA: { texto: 'Utilizada', icono: 'checkmark-done', fondo: '#F1EFE8', color: '#444441' },
  CANCELADA: { texto: 'Cancelada', icono: 'close', fondo: '#FCEBEB', color: '#791F1F' },
  REEMBOLSADA: { texto: 'Reembolsada', icono: 'arrow-undo-outline', fondo: '#EEEDFE', color: '#3C3489' },
};

// Detalle de una compra (casos de uso 5 a 9): una tarjeta con forma de entrada (estado,
// evento, entradas y total), la acción que corresponde (una sola principal; cancelar va en
// rojo y pide confirmación), la reseña, el chat y el historial con quién hizo cada cambio.
// En tablet horizontal el chat queda abierto a la derecha.
export default function DetalleCompra() {
  const { id } = useLocalSearchParams();
  const { usuario } = useUsuario();
  const avisos = useAvisos();
  const { esAncho } = useLayout();
  const insets = useSafeAreaInsets();
  const pedir = useCallback(async () => {
    const compra = await getCompra(id);
    // La imagen del evento va arriba de la tarjeta.
    const evento = await getEvento(compra.evento.id);
    // Se calcula al pedirla y no al dibujar, que tiene que dar siempre lo mismo.
    const realizado = new Date(compra.evento.fecha).getTime() <= Date.now();
    return { compra, imagen: evento.multimedia[0] ?? null, realizado };
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

  const { compra, imagen, realizado } = data;
  const { organizador } = compra.evento;
  const esComprador = usuario?.id === compra.comprador.id;
  const esOrganizador = usuario?.id === compra.evento.organizadorId;
  // Con quién se chatea: el comprador habla con el organizador y viceversa.
  const otro = esComprador ? organizador : compra.comprador;

  // Corre una acción con el velo de carga, avisa abajo si salió bien y vuelve a pedir la compra.
  async function ejecutar(mensaje, accion, exito) {
    setProcesando(mensaje);
    setErrorAccion(null);
    try {
      await accion();
      avisos.mostrar(exito);
      recargar();
    } catch (e) {
      setErrorAccion(e.message);
    } finally {
      setProcesando(null);
    }
  }

  function confirmarPago() {
    const { tipoEntrada, cantidad } = compra;
    Alert.alert(
      `¿Pagar ${formatPrecio(compra.total)}?`,
      `${tipoEntrada.nombre} × ${cantidad} para ${compra.evento.nombre}. La compra queda confirmada.`,
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Pagar', onPress: () => ejecutar('Procesando el pago…', () => pagarCompra(compra.id), 'Pagaste tu compra. ¡Que lo disfrutes!') },
      ],
    );
  }

  function confirmarCancelacion(pagada) {
    Alert.alert(
      pagada ? '¿Cancelar y pedir el reembolso?' : '¿Cancelar la compra?',
      pagada ? `Se te devuelven ${formatPrecio(compra.total)} y se liberan las entradas.` : 'Se liberan las entradas.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Cancelar compra',
          style: 'destructive',
          onPress: () =>
            ejecutar('Cancelando la compra…', () => cancelarCompra(compra.id), pagada ? 'Cancelaste la compra. Te devolvemos el total.' : 'Cancelaste la compra.'),
        },
      ],
    );
  }

  function confirmarUtilizacion() {
    const { comprador, tipoEntrada, cantidad } = compra;
    Alert.alert(
      '¿Marcar como utilizada?',
      `${comprador.nombre} ${comprador.apellido} ya usó sus entradas (${tipoEntrada.nombre} × ${cantidad}). Después no se puede cancelar y ${comprador.nombre} va a poder dejar su reseña.`,
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Marcar', onPress: () => ejecutar('Marcando la entrada…', () => marcarUtilizada(compra.id), 'Marcaste la entrada como utilizada.') },
      ],
    );
  }

  // Acciones según el estado y quién mira. Solo se paga o se cancela antes del evento; si ya
  // pasó, un aviso explica por qué no hay botones. El backend igual valida cada regla.
  let principal = null;
  let peligro = null;
  let aviso = null;
  if (esComprador && realizado && compra.estado === 'PENDIENTE') {
    aviso = 'El evento ya se realizó: esta compra ya no se puede pagar ni cancelar.';
  } else if (esComprador && realizado && compra.estado === 'CONFIRMADA') {
    aviso = 'El evento ya se realizó: esta compra ya no se puede cancelar.';
  } else if (esComprador && compra.estado === 'PENDIENTE') {
    principal = { titulo: `Pagar ${formatPrecio(compra.total)}`, onPress: confirmarPago };
    peligro = { titulo: 'Cancelar compra', onPress: () => confirmarCancelacion(false) };
  } else if (esComprador && compra.estado === 'CONFIRMADA') {
    peligro = { titulo: 'Cancelar y pedir reembolso', onPress: () => confirmarCancelacion(true) };
    aviso = `Si cancelás, se te devuelven ${formatPrecio(compra.total)}. Podés hacerlo hasta el día del evento.`;
  }
  // El organizador marca la entrada como utilizada desde el día del evento: diasRestantes
  // es 0 el mismo día y null si ya pasó. Antes, el pie explica desde cuándo se va a poder.
  if (esOrganizador && compra.estado === 'CONFIRMADA') {
    if (compra.diasRestantes === 0 || compra.diasRestantes === null) {
      principal = { titulo: 'Marcar como utilizada', onPress: confirmarUtilizacion };
    } else {
      aviso = 'Vas a poder marcarla como utilizada desde el día del evento.';
    }
  }

  const ultimo = compra.mensajes.at(-1);
  const autorUltimo = ultimo && (ultimo.usuarioId === organizador.id ? organizador : compra.comprador);
  const quien = (usuarioId) => {
    if (usuarioId === usuario?.id) return 'por vos';
    const persona = usuarioId === compra.comprador.id ? compra.comprador : organizador;
    return `por ${persona.nombre} ${persona.apellido}`;
  };

  const abrirChat = () =>
    router.push({
      pathname: '/compras/[id]/chat',
      params: { id: compra.id, evento: compra.evento.nombre, con: `${otro.nombre} ${otro.apellido}` },
    });

  const detalle = (
    <View style={[styles.pantalla, esAncho && styles.panelDetalle]}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.entrada}>
          {imagen ? <Image source={{ uri: imagen }} style={styles.imagen} /> : <View style={styles.imagen} />}
          <View style={styles.entradaArriba}>
            <View style={styles.estadoFila}>
              <EstadoBadge estado={compra.estado} />
              {compra.estado === 'CONFIRMADA' && compra.diasRestantes !== null ? (
                <Etiqueta texto={formatDiasRestantes(compra.diasRestantes)} fondo={colors.primarySofter} color={colors.primaryText} />
              ) : null}
            </View>
            <Text style={styles.nombre}>{compra.evento.nombre}</Text>
            <Text style={styles.meta}>{formatFecha(compra.evento.fecha)} · {compra.evento.lugar}</Text>
            {!esComprador ? (
              <Text style={styles.meta}>
                Comprador: {compra.comprador.nombre} {compra.comprador.apellido}
              </Text>
            ) : null}
          </View>
          <View style={styles.entradaAbajo}>
            <View>
              <Text style={styles.cap}>Entradas</Text>
              <Text style={styles.fuerte}>
                {compra.tipoEntrada.nombre} × {compra.cantidad}
              </Text>
            </View>
            <View style={styles.derecha}>
              <Text style={styles.cap}>{compra.estado === 'PENDIENTE' ? 'Total a pagar' : 'Total'}</Text>
              <Text style={styles.total}>{formatPrecio(compra.total)}</Text>
            </View>
          </View>
        </View>

        {esComprador && compra.estado === 'UTILIZADA' ? (
          <>
            <Text style={styles.seccion}>{compra.resenia ? 'Tu reseña' : '¿Cómo estuvo el evento?'}</Text>
            {compra.resenia ? (
              <View style={styles.caja}>
                <Estrellas valor={compra.resenia.puntuacion} size={18} />
                <Text style={styles.reseniaTexto}>{compra.resenia.detalle}</Text>
              </View>
            ) : (
              <ReseniaForm
                onPublicar={(resenia) =>
                  ejecutar('Publicando tu reseña…', () => crearResenia({ eventoId: compra.evento.id, ...resenia }), 'Publicaste tu reseña. ¡Gracias!')
                }
              />
            )}
          </>
        ) : null}

        {!esAncho ? (
          <>
            <Text style={styles.seccion}>
              Chat con {otro.nombre} {otro.apellido}
            </Text>
            <Pressable style={({ pressed }) => [styles.caja, styles.chat, pressed && styles.presionado]} onPress={abrirChat} accessibilityRole="button">
              <Avatar usuario={otro} size={36} />
              <View style={styles.chatInfo}>
                {ultimo ? (
                  <>
                    <Text style={styles.texto} numberOfLines={1}>
                      <Text style={styles.fuerte}>{autorUltimo.id === usuario?.id ? 'Vos' : autorUltimo.nombre}:</Text> {ultimo.mensaje}
                    </Text>
                    <Text style={styles.cap}>{formatDia(ultimo.enviado)}</Text>
                  </>
                ) : (
                  <Text style={styles.meta}>Todavía no hay mensajes. Escribí si tenés alguna consulta.</Text>
                )}
              </View>
              {compra.mensajesNoLeidos > 0 ? (
                <View style={styles.contador}>
                  <Text style={styles.contadorTexto}>{compra.mensajesNoLeidos}</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              )}
            </Pressable>
          </>
        ) : null}

        <Text style={styles.seccion}>Historial</Text>
        <View style={styles.caja}>
          {[...compra.historial].reverse().map((cambio, i) => {
            const estilo = HISTORIAL[cambio.estado];
            return (
              <View key={`${cambio.estado}-${cambio.fechaHora}`} style={[styles.cambio, i > 0 && styles.cambioSeparado]}>
                <View style={[styles.cambioIcono, { backgroundColor: estilo.fondo }]}>
                  <Ionicons name={estilo.icono} size={14} color={estilo.color} />
                </View>
                <View>
                  <Text style={styles.texto}>
                    <Text style={styles.fuerte}>{estilo.texto}</Text> {quien(cambio.usuarioId)}
                  </Text>
                  <Text style={styles.cap}>{formatFecha(cambio.fechaHora)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {principal || peligro || aviso || errorAccion ? (
        <View style={[styles.pie, { paddingBottom: spacing.md + (esAncho ? 0 : insets.bottom) }]}>
          <Aviso>{errorAccion}</Aviso>
          {principal ? <Boton titulo={principal.titulo} onPress={principal.onPress} /> : null}
          {peligro ? <Boton titulo={peligro.titulo} variante="peligro" onPress={peligro.onPress} /> : null}
          {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.pantalla, esAncho && styles.fila]}>
      {detalle}
      {esAncho ? (
        <View style={styles.panelChat}>
          <Conversacion
            key={compra.id}
            compraId={compra.id}
            onEnviado={recargar}
            encabezado={
              <View style={styles.chatEncabezado}>
                <Avatar usuario={otro} size={36} />
                <View>
                  <Text style={styles.fuerte}>
                    {otro.nombre} {otro.apellido}
                  </Text>
                  <Text style={styles.cap}>{esComprador ? 'Organizador' : 'Comprador'}</Text>
                </View>
              </View>
            }
          />
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
    backgroundColor: colors.surface,
  },
  fila: {
    flexDirection: 'row',
  },
  panelDetalle: {
    flex: 0,
    width: 480,
    borderRightWidth: 1,
    borderRightColor: colors.borderSoft,
  },
  panelChat: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  contenido: {
    padding: spacing.lg,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  entrada: {
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  imagen: {
    width: '100%',
    height: 96,
    backgroundColor: colors.borderSoft,
  },
  entradaArriba: {
    padding: spacing.lg,
    gap: 2,
  },
  estadoFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  entradaAbajo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.borderSoft,
    borderStyle: 'dashed',
  },
  derecha: {
    alignItems: 'flex-end',
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
  cap: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  texto: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  fuerte: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  total: {
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
    marginBottom: spacing.sm,
  },
  caja: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    padding: spacing.md + 2,
    gap: spacing.xs,
  },
  reseniaTexto: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: 21,
  },
  chat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
  },
  presionado: {
    backgroundColor: colors.primarySofter,
  },
  chatInfo: {
    flex: 1,
    gap: 2,
  },
  contador: {
    minWidth: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  contadorTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cambio: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  cambioSeparado: {
    marginTop: spacing.md,
  },
  cambioIcono: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pie: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.background,
  },
  aviso: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 18,
  },
});
