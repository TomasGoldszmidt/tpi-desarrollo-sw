import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EstadoBadge, ESTADOS_INACTIVOS } from './EstadoBadge.js';
import { AvisoMensaje, estiloEsperando, mensajeSinResponder } from './AvisoMensaje.js';
import { formatDiasRestantes, formatFecha, formatPrecio } from '../format.js';
import { colors, fontSize, spacing } from '../theme.js';

// Una compra del comprador (CompraDetalle de la API): estado, evento, entradas y total.
// Si el organizador escribió último, abajo avisa que respondió. Sin su nombre, dice "El organizador".
export function CompraCard({ compra, usuario, organizador, onPress }) {
  const confirmada = compra.estado === 'CONFIRMADA';
  const inactiva = ESTADOS_INACTIVOS.includes(compra.estado);
  const sinResponder = mensajeSinResponder(compra, usuario);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        sinResponder && estiloEsperando,
        inactiva && styles.inactiva,
        pressed && styles.presionada,
      ]}
      onPress={onPress}
    >
      <View style={styles.arriba}>
        <EstadoBadge estado={compra.estado} />
        {confirmada ? (
          <Text style={[styles.dias, compra.diasRestantes === null && styles.diasPasado]}>
            {formatDiasRestantes(compra.diasRestantes)}
          </Text>
        ) : null}
      </View>
      <Text style={styles.nombre}>{compra.evento.nombre}</Text>
      <Text style={styles.meta}>
        {formatFecha(compra.evento.fecha)} · {compra.tipoEntrada.nombre} × {compra.cantidad}
      </Text>
      <View style={styles.abajo}>
        <Text style={styles.meta}>{compra.estado === 'PENDIENTE' ? 'Pagala para confirmarla' : ''}</Text>
        <Text style={styles.total}>{formatPrecio(compra.total)}</Text>
      </View>
      {sinResponder ? (
        <AvisoMensaje
          texto={`${organizador ? organizador.nombre : 'El organizador'} te respondió`}
          mensaje={sinResponder.mensaje}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 2,
  },
  inactiva: {
    opacity: 0.6,
  },
  presionada: {
    backgroundColor: colors.primarySoft,
  },
  arriba: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dias: {
    color: colors.primaryText,
    fontSize: fontSize.small,
    fontWeight: 'bold',
  },
  diasPasado: {
    color: colors.textMuted,
    fontWeight: 'normal',
  },
  nombre: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  abajo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
});
