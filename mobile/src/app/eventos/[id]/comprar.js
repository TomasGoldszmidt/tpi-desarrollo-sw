import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getEvento } from '../../../api/eventos.js';
import { crearCompra } from '../../../api/compras.js';
import { useCarga } from '../../../hooks/useCarga.js';
import { CargaEncima, PantallaCarga } from '../../../components/Carga.js';
import { EstadoBadge } from '../../../components/EstadoBadge.js';
import { EstadoCarga } from '../../../components/EstadoCarga.js';
import { formatFecha, formatPrecio } from '../../../format.js';
import { colors, fontSize, spacing } from '../../../theme.js';

// Caso de uso 12: comprar eligiendo un tipo de entrada y una cantidad, sin superar el cupo.
// Al confirmar, la misma pantalla muestra la compra hecha.
export default function Comprar() {
  const { id } = useLocalSearchParams();
  const pedir = useCallback(() => getEvento(id), [id]);
  const { data: evento, loading, error, recargar } = useCarga(pedir);
  const insets = useSafeAreaInsets();

  const [tipoId, setTipoId] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [errorCompra, setErrorCompra] = useState(null);
  const [compra, setCompra] = useState(null);

  if (compra) {
    return <CompraHecha compra={compra} evento={evento} />;
  }

  if (loading && !evento) {
    return <PantallaCarga mensaje="Cargando las entradas…" />;
  }
  if (error || !evento) {
    return (
      <View style={styles.centrado}>
        <EstadoCarga loading={loading} error={error} onRetry={recargar} />
      </View>
    );
  }

  // Si el tipo elegido se quedó sin cupo (o todavía no se eligió), vale el primero con cupo.
  // La cantidad nunca supera las disponibles: si bajaron, baja con ellas.
  const conCupo = evento.tiposEntrada.filter((tipo) => tipo.disponibles > 0);
  const tipo = conCupo.find((t) => t.id === tipoId) ?? conCupo[0];
  const cantidadValida = tipo ? Math.min(cantidad, tipo.disponibles) : 0;

  async function confirmar() {
    setEnviando(true);
    setErrorCompra(null);
    try {
      setCompra(await crearCompra({ eventoId: evento.id, tipoEntradaId: tipo.id, cantidad: cantidadValida }));
    } catch (e) {
      // Si fue por cupo, las disponibles cambiaron: se vuelven a pedir.
      setErrorCompra(e.message);
      recargar();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.nombre}>{evento.nombre}</Text>
        <Text style={styles.meta}>
          {formatFecha(evento.fecha)} · {evento.lugar.split(',')[0]}
        </Text>

        <Text style={styles.seccion}>Tipo de entrada</Text>
        {evento.tiposEntrada.map((opcion) => {
          const agotado = opcion.disponibles === 0;
          const elegido = opcion.id === tipo?.id;
          return (
            <Pressable
              key={opcion.id}
              style={[styles.opcion, elegido && styles.opcionElegida, agotado && styles.opcionAgotada]}
              onPress={() => setTipoId(opcion.id)}
              disabled={agotado}
            >
              <Ionicons
                name={elegido ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={elegido ? colors.primary : colors.textMuted}
              />
              <View style={styles.opcionInfo}>
                <Text style={styles.opcionNombre}>{opcion.nombre}</Text>
                <Text style={styles.meta}>{agotado ? 'Agotado' : `${opcion.disponibles} disponibles`}</Text>
              </View>
              <Text style={styles.precio}>{formatPrecio(opcion.precio)}</Text>
            </Pressable>
          );
        })}

        {tipo ? (
          <>
            <Text style={styles.seccion}>Cantidad</Text>
            <View style={styles.cantidad}>
              <BotonCantidad
                icono="remove"
                onPress={() => setCantidad(cantidadValida - 1)}
                disabled={cantidadValida <= 1}
                label="Una entrada menos"
              />
              <Text style={styles.cantidadNumero}>{cantidadValida}</Text>
              <BotonCantidad
                icono="add"
                onPress={() => setCantidad(cantidadValida + 1)}
                disabled={cantidadValida >= tipo.disponibles}
                label="Una entrada más"
              />
              <Text style={styles.meta}>de {tipo.disponibles} disponibles</Text>
            </View>

            <View style={styles.total}>
              <Text style={styles.totalTexto}>Total</Text>
              <Text style={styles.totalTexto}>{formatPrecio(tipo.precio * cantidadValida)}</Text>
            </View>
            <Text style={styles.meta}>
              {cantidadValida} × {formatPrecio(tipo.precio)}. La compra queda pendiente de pago.
            </Text>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.pie, { paddingBottom: spacing.md + insets.bottom }]}>
        {errorCompra ? <Text style={styles.error}>{errorCompra}</Text> : null}
        <Pressable
          style={[styles.boton, (!tipo || enviando) && styles.botonApagado]}
          onPress={confirmar}
          disabled={!tipo || enviando}
        >
          {enviando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.botonTexto}>{tipo ? 'Confirmar compra' : 'Agotado'}</Text>
          )}
        </Pressable>
      </View>
      {enviando ? <CargaEncima mensaje="Confirmando tu compra…" /> : null}
      {!enviando && loading ? <CargaEncima mensaje="Actualizando las entradas…" /> : null}
    </View>
  );
}

function BotonCantidad({ icono, onPress, disabled, label }) {
  return (
    <Pressable
      style={[styles.paso, disabled && styles.pasoApagado]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
    >
      <Ionicons name={icono} size={20} color={colors.primaryText} />
    </Pressable>
  );
}

// La compra recién creada (PENDIENTE). No se puede volver atrás al formulario:
// se sigue al detalle de la compra o al catálogo.
function CompraHecha({ compra, evento }) {
  const insets = useSafeAreaInsets();
  const { cantidad, tipoEntrada } = compra;

  return (
    <View style={styles.pantalla}>
      <Stack.Screen options={{ headerBackVisible: false, gestureEnabled: false }} />
      <View style={styles.hecha}>
        <View style={styles.check}>
          <Ionicons name="checkmark" size={32} color={colors.primary} />
        </View>
        <Text style={styles.hechaTitulo}>
          Compraste {cantidad} {cantidad === 1 ? 'entrada' : 'entradas'} {tipoEntrada.nombre}
        </Text>
        <Text style={styles.meta}>
          {evento.nombre} · {formatFecha(evento.fecha)}
        </Text>
        <View style={styles.pendiente}>
          <EstadoBadge estado={compra.estado} />
        </View>
        <Text style={styles.hechaTotal}>{formatPrecio(compra.total)}</Text>
        <Text style={[styles.meta, styles.centradoTexto]}>
          Las entradas ya están reservadas.{'\n'}Pagá desde el detalle de la compra.
        </Text>
      </View>

      <View style={[styles.pie, { paddingBottom: spacing.md + insets.bottom }]}>
        <Pressable
          style={styles.boton}
          onPress={() => {
            router.dismissAll();
            router.push(`/compras/${compra.id}`);
          }}
        >
          <Text style={styles.botonTexto}>Ver mi compra</Text>
        </Pressable>
        <Pressable
          style={[styles.boton, styles.botonSecundario]}
          onPress={() => {
            router.dismissAll();
            router.navigate('/catalogo');
          }}
        >
          <Text style={[styles.botonTexto, styles.botonTextoSecundario]}>Seguir explorando</Text>
        </Pressable>
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
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  contenido: {
    padding: spacing.lg,
  },
  nombre: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  seccion: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  opcionElegida: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#F6FAF0',
  },
  opcionAgotada: {
    opacity: 0.5,
  },
  opcionInfo: {
    flex: 1,
  },
  opcionNombre: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  precio: {
    color: colors.primaryText,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  cantidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  paso: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoApagado: {
    opacity: 0.35,
  },
  cantidadNumero: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    minWidth: 28,
    textAlign: 'center',
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    marginBottom: spacing.xs,
  },
  totalTexto: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
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
  botonApagado: {
    opacity: 0.5,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonSecundario: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  botonTextoSecundario: {
    color: colors.primaryText,
  },
  hecha: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
  },
  check: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  hechaTitulo: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pendiente: {
    marginTop: spacing.lg,
  },
  hechaTotal: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  centradoTexto: {
    textAlign: 'center',
    lineHeight: 18,
  },
});
