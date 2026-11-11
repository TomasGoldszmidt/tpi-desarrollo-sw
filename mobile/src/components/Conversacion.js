import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { enviarMensaje, getMensajes, marcarMensajesLeidos } from '../api/compras.js';
import { useUsuario } from '../context/UsuarioContext.js';
import { useNotificaciones } from '../context/NotificacionesContext.js';
import { useAlturaTeclado } from '../hooks/useAlturaTeclado.js';
import { useCarga } from '../hooks/useCarga.js';
import { CargaEncima, PantallaCarga } from './Carga.js';
import { EstadoCarga } from './EstadoCarga.js';
import { formatDia, formatHora } from '../format.js';
import { colors, fontSize, spacing } from '../theme.js';

// Cada cuánto se vuelven a pedir los mensajes mientras el chat está abierto. El backend
// no tiene tiempo real (websockets): la app pregunta cada tanto si hay mensajes nuevos.
const INTERVALO_MS = 5000;

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
  const { data: mensajes, loading, error, recargar } = useCarga(pedir);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const lista = useRef(null);

  // Solo mientras la pantalla está visible: al salir se corta el intervalo.
  useFocusEffect(
    useCallback(() => {
      const intervalo = setInterval(recargar, INTERVALO_MS);
      return () => clearInterval(intervalo);
    }, [recargar]),
  );

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
      recargar();
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
      {error ? <Text style={styles.sinConexion}>Sin conexión. Reintentando…</Text> : null}

      <FlatList
        ref={lista}
        style={styles.lista}
        contentContainerStyle={styles.listaContenido}
        data={conSeparadores(mensajes)}
        keyExtractor={(item) => item.clave}
        renderItem={({ item }) =>
          item.dia ? (
            <Text style={styles.dia}>{item.dia}</Text>
          ) : (
            <Burbuja mensaje={item.mensaje} propio={item.mensaje.autor.id === usuario?.id} />
          )
        }
        // Al abrir y cada vez que llega un mensaje, se baja hasta el último.
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={<Text style={styles.vacio}>Todavía no hay mensajes. Escribí el primero.</Text>}
      />

      <View style={[styles.entrada, { paddingBottom: spacing.sm + (alturaTeclado > 0 ? 0 : insets.bottom) }]}>
        {errorEnvio ? <Text style={styles.errorEnvio}>{errorEnvio}</Text> : null}
        <View style={styles.fila}>
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribí un mensaje…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.enviar, (!texto.trim() || enviando) && styles.enviarApagado]}
            onPress={enviar}
            disabled={!texto.trim() || enviando}
            accessibilityLabel="Enviar mensaje"
          >
            {enviando ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Ionicons name="send" size={18} color="#FFFFFF" />}
          </Pressable>
        </View>
      </View>
      {enviando ? <CargaEncima mensaje="Enviando tu mensaje…" /> : null}
    </View>
  );
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

// Los mensajes propios van a la derecha en verde; los del otro, a la izquierda con su nombre.
function Burbuja({ mensaje, propio }) {
  return (
    <View style={[styles.burbuja, propio ? styles.propia : styles.ajena]}>
      {!propio ? <Text style={styles.autor}>{mensaje.autor.nombre}</Text> : null}
      <Text style={[styles.mensaje, propio && styles.textoPropio]}>{mensaje.mensaje}</Text>
      <Text style={[styles.hora, propio && styles.textoPropio]}>{formatHora(mensaje.enviado)}</Text>
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
  sinConexion: {
    backgroundColor: '#FAEEDA',
    color: '#633806',
    fontSize: fontSize.small,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  lista: {
    backgroundColor: '#FAFAF7',
  },
  listaContenido: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  dia: {
    alignSelf: 'center',
    color: colors.textMuted,
    fontSize: 11,
    marginVertical: spacing.xs,
  },
  burbuja: {
    maxWidth: '80%',
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  propia: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  ajena: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  autor: {
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: 'bold',
  },
  mensaje: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  textoPropio: {
    color: '#FFFFFF',
  },
  hora: {
    alignSelf: 'flex-end',
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    color: colors.text,
    fontSize: fontSize.body,
  },
  enviar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enviarApagado: {
    opacity: 0.5,
  },
});
