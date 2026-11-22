import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getEvento } from '../../../api/eventos.js';
import { crearCompra } from '../../../api/compras.js';
import { useCarga } from '../../../hooks/useCarga.js';
import { Boton } from '../../../components/Boton.js';
import { CargaEncima } from '../../../components/CargaEncima.js';
import { PantallaCarga } from '../../../components/PantallaCarga.js';
import { EstadoCarga } from '../../../components/EstadoCarga.js';
import { Aviso } from '../../../components/Aviso.js';
import { Pasos } from '../../../components/Pasos.js';
import { Reserva } from '../../../components/comprar/Reserva.js';
import { SelectorCantidad } from '../../../components/comprar/SelectorCantidad.js';
import { TipoEntradaOpcion } from '../../../components/comprar/TipoEntradaOpcion.js';
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
          {evento.tiposEntrada.map((opcion) => (
            <TipoEntradaOpcion key={opcion.id} tipo={opcion} elegido={opcion.id === tipo?.id} onElegir={setTipoId} />
          ))}
        </View>

        {tipo ? (
          <>
            <Text style={styles.seccion}>¿Cuántas?</Text>
            <SelectorCantidad cantidad={cantidadValida} maximo={tipo.disponibles} precio={tipo.precio} onCambiar={setCantidad} />

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
});
