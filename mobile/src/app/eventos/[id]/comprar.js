import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getEvento } from '../../../api/eventos.js';
import { crearCompra, pagarCompra } from '../../../api/compras.js';
import { useAvisos } from '../../../context/AvisosContext.js';
import { useCarga } from '../../../hooks/useCarga.js';
import { Boton } from '../../../components/Boton.js';
import { CargaEncima, PantallaCarga } from '../../../components/Carga.js';
import { EstadoBadge, Etiqueta } from '../../../components/EstadoBadge.js';
import { EstadoCarga } from '../../../components/EstadoCarga.js';
import { Aviso } from '../../../components/Formulario.js';
import { Pasos } from '../../../components/Pasos.js';
import { formatFecha, formatPrecio } from '../../../format.js';
import { colors, fontSize, spacing } from '../../../theme.js';

// Caso de uso 12: comprar eligiendo un tipo de entrada y una cantidad, sin superar el cupo.
// Los pasos dejan claro que primero se reservan las entradas (la compra queda PENDIENTE y
// ya ocupa el cupo) y después se pagan, ahí mismo o más tarde desde Mis compras.
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
    return <Reserva compra={compra} evento={evento} />;
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
  const enElMaximo = tipo && cantidadValida >= tipo.disponibles;

  async function reservar() {
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
      <Stack.Screen options={{ title: evento.nombre }} />
      <Pasos actual={1} />
      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.nombre}>{evento.nombre}</Text>
        <Text style={styles.meta}>
          {formatFecha(evento.fecha)} · {evento.lugar.split(',')[0]}
        </Text>

        <Text style={styles.seccion}>Elegí el tipo de entrada</Text>
        <View accessibilityRole="radiogroup" style={styles.opciones}>
          {evento.tiposEntrada.map((opcion) => {
            const agotado = opcion.disponibles === 0;
            const elegido = opcion.id === tipo?.id;
            return (
              <Pressable
                key={opcion.id}
                style={[styles.opcion, elegido && styles.opcionElegida, agotado && styles.opcionAgotada]}
                onPress={() => setTipoId(opcion.id)}
                disabled={agotado}
                accessibilityRole="radio"
                accessibilityState={{ checked: elegido, disabled: agotado }}
              >
                <Ionicons
                  name={elegido ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={agotado ? colors.border : elegido ? colors.primary : colors.textMuted}
                />
                <View style={styles.opcionInfo}>
                  <Text style={[styles.opcionNombre, agotado && styles.apagado]}>{opcion.nombre}</Text>
                  <Text style={styles.meta}>
                    {opcion.descripcion}
                    {agotado ? '' : ` · ${opcion.disponibles} disponibles`}
                  </Text>
                </View>
                {agotado ? (
                  <Etiqueta texto="Agotado" fondo={colors.dangerSoft} color={colors.dangerText} />
                ) : (
                  <Text style={styles.precio}>{formatPrecio(opcion.precio)}</Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {tipo ? (
          <>
            <Text style={styles.seccion}>¿Cuántas?</Text>
            <View style={styles.cantidad}>
              <BotonCantidad
                icono="remove"
                onPress={() => setCantidad(cantidadValida - 1)}
                disabled={cantidadValida <= 1}
                label="Una entrada menos"
              />
              <Text style={styles.cantidadNumero} accessibilityLiveRegion="polite">{cantidadValida}</Text>
              <BotonCantidad
                icono="add"
                onPress={() => setCantidad(cantidadValida + 1)}
                disabled={enElMaximo}
                label="Una entrada más"
              />
              <Text style={styles.meta}>
                {enElMaximo ? `Máximo ${tipo.disponibles}` : `${cantidadValida} × ${formatPrecio(tipo.precio)}`}
              </Text>
            </View>

            <View style={styles.info}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoTexto}>
                Al reservar, las entradas quedan apartadas para vos. Las pagás en el paso siguiente o más tarde desde Mis compras.
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.pie, { paddingBottom: spacing.md + insets.bottom }]}>
        <Aviso>{errorCompra}</Aviso>
        {tipo ? (
          <View style={styles.total}>
            <Text style={styles.totalEtiqueta}>Total</Text>
            <Text style={styles.totalNumero}>{formatPrecio(tipo.precio * cantidadValida)}</Text>
          </View>
        ) : null}
        <Boton
          titulo={!tipo ? 'Agotado' : `Reservar ${cantidadValida} ${cantidadValida === 1 ? 'entrada' : 'entradas'}`}
          onPress={reservar}
          disabled={!tipo}
          cargando={enviando}
        />
      </View>
      {enviando ? <CargaEncima mensaje="Reservando tus entradas…" /> : null}
      {!enviando && loading ? <CargaEncima mensaje="Actualizando las entradas…" /> : null}
    </View>
  );
}

function BotonCantidad({ icono, onPress, disabled, label }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.paso, disabled && styles.pasoApagado, pressed && styles.pasoPresionado]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Ionicons name={icono} size={22} color={colors.primaryText} />
    </Pressable>
  );
}

// Paso 3: las entradas quedaron reservadas (la compra está PENDIENTE). "Pagar ahora" paga
// y lleva al detalle de la compra; "Pagar más tarde", a Mis compras. No se vuelve al formulario.
function Reserva({ compra, evento }) {
  const insets = useSafeAreaInsets();
  const avisos = useAvisos();
  const [pagando, setPagando] = useState(false);
  const [errorPago, setErrorPago] = useState(null);
  const { cantidad, tipoEntrada } = compra;

  async function pagar() {
    setPagando(true);
    setErrorPago(null);
    try {
      await pagarCompra(compra.id);
      avisos.mostrar('Pagaste tu compra. ¡Que lo disfrutes!');
      router.dismissAll();
      router.push(`/compras/${compra.id}`);
    } catch (e) {
      setErrorPago(e.message);
      setPagando(false);
    }
  }

  return (
    <View style={styles.pantalla}>
      <Stack.Screen options={{ headerBackVisible: false, gestureEnabled: false }} />
      <Pasos actual={3} />
      <ScrollView contentContainerStyle={styles.hecha}>
        <View style={styles.check}>
          <Ionicons name="checkmark" size={36} color={colors.primary} />
        </View>
        <Text style={styles.hechaTitulo}>Tus entradas están reservadas</Text>
        <Text style={[styles.meta, styles.centradoTexto]}>Nadie más puede comprarlas. Pagalas para confirmar la compra.</Text>

        <View style={styles.entrada}>
          <View style={styles.entradaArriba}>
            <EstadoBadge estado={compra.estado} />
            <Text style={styles.entradaNombre}>{evento.nombre}</Text>
            <Text style={styles.meta}>{formatFecha(evento.fecha)}</Text>
          </View>
          <View style={styles.entradaAbajo}>
            <Text style={styles.opcionNombre}>
              {tipoEntrada.nombre} × {cantidad}
            </Text>
            <Text style={styles.totalNumero}>{formatPrecio(compra.total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.pie, { paddingBottom: spacing.md + insets.bottom }]}>
        <Aviso>{errorPago}</Aviso>
        <Boton titulo={`Pagar ahora ${formatPrecio(compra.total)}`} onPress={pagar} cargando={pagando} />
        <Boton
          titulo="Pagar más tarde"
          variante="texto"
          onPress={() => {
            router.dismissAll();
            router.navigate('/compras');
          }}
        />
        <Text style={[styles.meta, styles.centradoTexto]}>Podés cancelar la reserva sin cargo hasta el día del evento.</Text>
      </View>
      {pagando ? <CargaEncima mensaje="Procesando el pago…" /> : null}
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
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  nombre: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: 'bold',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    lineHeight: 18,
  },
  seccion: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  opciones: {
    gap: spacing.sm + 2,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    padding: spacing.md + 2,
    minHeight: 64,
  },
  opcionElegida: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primarySofter,
  },
  opcionAgotada: {
    backgroundColor: colors.surface,
  },
  opcionInfo: {
    flex: 1,
  },
  opcionNombre: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  apagado: {
    color: colors.textMuted,
  },
  precio: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  cantidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  paso: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoApagado: {
    opacity: 0.35,
  },
  pasoPresionado: {
    backgroundColor: colors.primarySoft,
  },
  cantidadNumero: {
    color: colors.text,
    fontSize: fontSize.headline,
    fontWeight: 'bold',
    minWidth: 28,
    textAlign: 'center',
  },
  info: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  infoTexto: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.small,
    lineHeight: 19,
  },
  pie: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.background,
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalEtiqueta: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  totalNumero: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: 'bold',
  },
  hecha: {
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.sm,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  check: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  hechaTitulo: {
    color: colors.text,
    fontSize: fontSize.headline,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centradoTexto: {
    textAlign: 'center',
  },
  entrada: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    overflow: 'hidden',
  },
  entradaArriba: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  entradaNombre: {
    color: colors.text,
    fontSize: fontSize.large + 2,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  entradaAbajo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.borderSoft,
    borderStyle: 'dashed',
  },
});
