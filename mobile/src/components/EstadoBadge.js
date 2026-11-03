import { StyleSheet, Text } from 'react-native';

// Texto y colores de cada EstadoCompra, para que se distingan de un vistazo.
const ESTADOS = {
  PENDIENTE: { texto: 'Pendiente de pago', fondo: '#FAEEDA', color: '#633806' },
  CONFIRMADA: { texto: 'Confirmada', fondo: '#EAF3DE', color: '#27500A' },
  UTILIZADA: { texto: 'Utilizada', fondo: '#F1EFE8', color: '#444441' },
  CANCELADA: { texto: 'Cancelada', fondo: '#FCEBEB', color: '#791F1F' },
  REEMBOLSADA: { texto: 'Reembolsada', fondo: '#EEEDFE', color: '#3C3489' },
};

// Los estados en los que la compra ya no vale: la tarjeta se muestra apagada.
export const ESTADOS_INACTIVOS = ['CANCELADA', 'REEMBOLSADA'];

export function EstadoBadge({ estado }) {
  const { texto, fondo, color } = ESTADOS[estado];
  return <Text style={[styles.badge, { backgroundColor: fondo, color }]}>{texto}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
});
