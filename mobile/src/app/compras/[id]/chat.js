import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { enviarMensaje, getMensajes } from '../../../api/compras.js';
import { useUsuario } from '../../../context/UsuarioContext.js';
import { useAlturaTeclado } from '../../../hooks/useAlturaTeclado.js';
import { useCarga } from '../../../hooks/useCarga.js';
import { PantallaCarga } from '../../../components/Carga.js';
import { EstadoCarga } from '../../../components/EstadoCarga.js';
import { formatDia, formatHora } from '../../../format.js';
import { colors, fontSize, spacing } from '../../../theme.js';

// Cada cuánto se vuelven a pedir los mensajes mientras el chat está abierto. El backend
// no tiene tiempo real (websockets): la app pregunta cada tanto si hay mensajes nuevos.
const INTERVALO_MS = 5000;

// Casos de uso 5 y 6: el chat de una compra entre el comprador y el organizador del evento.
// Recibe el nombre del evento y de con quién se chatea desde el detalle de la compra.
export default function Chat() {
  const { id, evento, con } = useLocalSearchParams();
  const { usuario } = useUsuario();
  const insets = useSafeAreaInsets();
  const alturaTeclado = useAlturaTeclado();
  const pedir = useCallback(() => getMensajes(id), [id]);
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

  async function enviar() {
    const mensaje = texto.trim();
    if (!mensaje) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await enviarMensaje(id, mensaje);
      setTexto('');
      recargar();
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

  // Con el teclado abierto, la pantalla deja abajo su alto para que la entrada quede a la vista.
  return (
    <View style={[styles.pantalla, { paddingBottom: alturaTeclado }]}>
      <View style={styles.cabecera}>
        <Text style={styles.evento}>{evento}</Text>
        <Text style={styles.con}>Chat con {con}</Text>
      </View>
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
  cabecera: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  evento: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  con: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
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
