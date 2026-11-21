import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { pagarCompra } from '../../api/compras.js';
import { useAvisos } from '../../context/AvisosContext.js';
import { Boton } from '../Boton.js';
import { CargaEncima } from '../CargaEncima.js';
import { EstadoBadge } from '../EstadoBadge.js';
import { Aviso } from '../Aviso.js';
import { Pasos } from '../Pasos.js';
import { formatFecha, formatPrecio } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Paso 3: las entradas quedaron reservadas (la compra está PENDIENTE). "Pagar ahora" paga
// y lleva al detalle de la compra; "Pagar más tarde", a Mis compras. No se vuelve al formulario.
export function Reserva({ compra, evento }) {
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
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    lineHeight: 18,
  },
  opcionNombre: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  pie: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.background,
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
