import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { enviarMensaje, getMensajes, marcarMensajesLeidos } from '../api/compras.js';
import { useUsuario } from '../context/UsuarioContext.js';
import { useNotificaciones } from '../context/NotificacionesContext.js';
import { useAlturaTeclado } from '../hooks/useAlturaTeclado.js';
import { useCarga } from '../hooks/useCarga.js';
import { Burbuja } from './Burbuja.js';
import { CargaEncima } from './CargaEncima.js';
import { PantallaCarga } from './PantallaCarga.js';
import { EstadoCarga } from './EstadoCarga.js';
import { formatDia } from '../format.js';
import { colors, fontSize, spacing } from '../theme.js';

// Cada cuánto se vuelven a pedir los mensajes mientras el chat está abierto. El backend
// no tiene tiempo real (websockets): la app pregunta cada tanto si hay mensajes nuevos.
const INTERVALO_MS = 5000;
// Largo máximo de un mensaje (lo valida también el backend) y desde cuándo se muestra el contador.
const LARGO_MAXIMO = 500;
const LARGO_AVISO = 400;

// Casos de uso 5 y 6: el chat de una compra entre el comprador y el organizador del evento.
// Lo usan la pantalla de chat y, en pantallas anchas, el panel derecho de los mensajes
// del evento. encabezado: lo que va arriba de los mensajes (cada uno arma el suyo).
// onEnviado: para que la pantalla que lo contiene actualice lo suyo después de enviar.
// onLeido: después de marcar el chat como leído (la bandeja de mensajes apaga el punto).
// Al cambiar de compra, montarlo con key = compraId para que arranque de cero.
export function Conversacion({ compraId, encabezado, onEnviado, onLeido }) {
  const { usuario } = useUsuario();
  const notificaciones = useNotificaciones();
  const insets = useSafeAreaInsets();
  const alturaTeclado = useAlturaTeclado();
  const pedir = useCallback(() => getMensajes(compraId), [compraId]);
  // La primera carga va con useCarga (spinner, error y reintentar). Las consultas
  // automáticas van aparte y solo tocan el estado si llegó algo nuevo: una consulta sin
  // novedades no redibuja nada, así no le quita tiempo al teclado mientras se escribe.
  const { data: cargados, loading, error, recargar } = useCarga(pedir);
  const [actualizados, setActualizados] = useState(null);
  const [sinConexion, setSinConexion] = useState(false);
  const mensajes = actualizados ?? cargados;
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const lista = useRef(null);

  // Los últimos mensajes mostrados, para comparar sin volver a crear actualizar.
  const mostrados = useRef(null);
  useEffect(() => {
    mostrados.current = mensajes;
  }, [mensajes]);

  const actualizar = useCallback(() => {
    getMensajes(compraId).then(
      (data) => {
        setSinConexion(false);
        if (!mismosMensajes(mostrados.current, data)) setActualizados(data);
      },
      () => setSinConexion(true),
    );
  }, [compraId]);

  // Solo mientras la pantalla está visible: al salir se corta el intervalo.
  useFocusEffect(
    useCallback(() => {
      const intervalo = setInterval(actualizar, INTERVALO_MS);
      return () => clearInterval(intervalo);
    }, [actualizar]),
  );

  // Memorizados para que tipear (que redibuja el componente) no redibuje toda la lista.
  const items = useMemo(() => (mensajes ? conSeparadores(mensajes) : []), [mensajes]);
  const usuarioId = usuario?.id;
  const renderItem = useCallback(
    ({ item }) =>
      item.dia ? (
        <Text style={styles.dia}>{item.dia}</Text>
      ) : (
        <Burbuja mensaje={item.mensaje} propio={item.mensaje.autor.id === usuarioId} />
      ),
    [usuarioId],
  );
  const bajarAlFinal = useCallback(() => lista.current?.scrollToEnd({ animated: false }), []);

  // Abrir el chat lo deja leído. Mientras está abierto, cada vez que llega un mensaje del
  // otro se vuelve a marcar. Después se actualizan la campana y la pantalla que lo contiene.
  // Si falla (sin conexión) no se avisa: la próxima vez que llegue algo se reintenta.
  const marcados = useRef(0);
  useEffect(() => {
    if (!mensajes || !usuario) return;
    const delOtro = mensajes.filter((mensaje) => mensaje.autor.id !== usuario.id).length;
    if (delOtro <= marcados.current) return;
    marcados.current = delOtro;
    marcarMensajesLeidos(compraId).then(() => {
      notificaciones?.actualizar();
      onLeido?.();
    }, () => {
      marcados.current = 0;
    });
  }, [mensajes, usuario, compraId, notificaciones, onLeido]);

  async function enviar() {
    const mensaje = texto.trim();
    if (!mensaje) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await enviarMensaje(compraId, mensaje);
      setTexto('');
      actualizar();
      onEnviado?.();
    } catch (e) {
      setErrorEnvio(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (loading && !mensajes) {
    return <PantallaCarga mensaje="Cargando el chat…" />;
  }
  if (!mensajes) {
    return (
      <View style={styles.centrado}>
        <EstadoCarga loading={loading} error={error} onRetry={recargar} />
      </View>
    );
  }

  // Con el teclado abierto, deja abajo su alto para que la entrada quede a la vista.
  return (
    <View style={[styles.pantalla, { paddingBottom: alturaTeclado }]}>
      {encabezado}
      {/* Si falla un pedido de los automáticos se sigue mostrando lo último que llegó. */}
      {sinConexion ? <Text style={styles.sinConexion}>Sin conexión. Reintentando…</Text> : null}

      <FlatList
        ref={lista}
        style={styles.lista}
        contentContainerStyle={styles.listaContenido}
        data={items}
        keyExtractor={claveDe}
        renderItem={renderItem}
        // Al abrir y cada vez que llega un mensaje, se baja hasta el último.
        onContentSizeChange={bajarAlFinal}
        ListEmptyComponent={<Text style={styles.vacio}>Todavía no hay mensajes. Escribí el primero.</Text>}
      />

      <View style={[styles.entrada, { paddingBottom: spacing.sm + (alturaTeclado > 0 ? 0 : insets.bottom) }]}>
        {errorEnvio ? <Text style={styles.errorEnvio}>{errorEnvio}</Text> : null}
        {/* Cerca del límite se ve cuánto queda. */}
        {texto.length > LARGO_AVISO ? <Text style={styles.contador}>{texto.length}/{LARGO_MAXIMO}</Text> : null}
        <View style={styles.fila}>
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribí un mensaje…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={LARGO_MAXIMO}
            accessibilityLabel="Mensaje"
          />
          <Pressable
            style={[styles.enviar, (!texto.trim() || enviando) && styles.enviarApagado]}
            onPress={enviar}
            disabled={!texto.trim() || enviando}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            accessibilityState={{ disabled: !texto.trim() || enviando }}
          >
            {enviando ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="send" size={20} color={texto.trim() ? '#FFFFFF' : colors.textMuted} />
            )}
          </Pressable>
        </View>
      </View>
      {enviando ? <CargaEncima mensaje="Enviando tu mensaje…" /> : null}
    </View>
  );
}

// Los mensajes solo se agregan al final: alcanza con comparar cuántos hay y el último.
function mismosMensajes(antes, ahora) {
  if (!antes || antes.length !== ahora.length) return false;
  if (ahora.length === 0) return true;
  const a = antes[antes.length - 1];
  const b = ahora[ahora.length - 1];
  return a.enviado === b.enviado && a.autor.id === b.autor.id && a.mensaje === b.mensaje;
}

function claveDe(item) {
  return item.clave;
}

// Intercala el día ("vie 30 oct") cada vez que cambia entre un mensaje y el siguiente.
function conSeparadores(mensajes) {
  const items = [];
  let diaAnterior = null;
  mensajes.forEach((mensaje, i) => {
    const dia = formatDia(mensaje.enviado);
    if (dia !== diaAnterior) {
      items.push({ clave: `dia-${dia}`, dia });
      diaAnterior = dia;
    }
    items.push({ clave: `msg-${i}`, mensaje });
  });
  return items;
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
  sinConexion: {
    backgroundColor: '#FAEEDA',
    color: '#633806',
    fontSize: fontSize.small,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  lista: {
    backgroundColor: colors.background,
  },
  listaContenido: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  dia: {
    alignSelf: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.caption,
    backgroundColor: colors.surface,
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    marginVertical: spacing.xs,
  },
  vacio: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    textAlign: 'center',
    paddingTop: spacing.xl,
  },
  entrada: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  errorEnvio: {
    color: colors.danger,
    fontSize: fontSize.small,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxHeight: 120,
    color: colors.text,
    fontSize: fontSize.body,
    backgroundColor: colors.surface,
  },
  enviar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enviarApagado: {
    backgroundColor: colors.disabled,
  },
  contador: {
    alignSelf: 'flex-end',
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
});
