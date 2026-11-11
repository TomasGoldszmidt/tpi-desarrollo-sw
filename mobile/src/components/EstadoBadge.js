import { StyleSheet, Text } from 'react-native';

// Texto y colores de cada EstadoCompra, para que se distingan de un vistazo.
// plural: el nombre del filtro en Mis compras; enPlural: para "No tenés compras …"; borde: el color fuerte del estado
// (borde de la tarjeta y punto del filtro).
const ESTADOS = {
  PENDIENTE: { texto: 'Pendiente de pago', plural: 'Pendientes', enPlural: 'pendientes de pago', fondo: '#FAEEDA', color: '#633806', borde: '#BA7517' },
  CONFIRMADA: { texto: 'Confirmada', plural: 'Confirmadas', enPlural: 'confirmadas', fondo: '#EAF3DE', color: '#27500A', borde: '#639922' },
  UTILIZADA: { texto: 'Utilizada', plural: 'Utilizadas', enPlural: 'utilizadas', fondo: '#F1EFE8', color: '#444441', borde: '#888780' },
  CANCELADA: { texto: 'Cancelada', plural: 'Canceladas', enPlural: 'canceladas', fondo: '#FCEBEB', color: '#791F1F', borde: '#E24B4A' },
  REEMBOLSADA: { texto: 'Reembolsada', plural: 'Reembolsadas', enPlural: 'reembolsadas', fondo: '#EEEDFE', color: '#3C3489', borde: '#7F77DD' },
};

// En el orden del ciclo de una compra.
export const ORDEN_ESTADOS = ['PENDIENTE', 'CONFIRMADA', 'UTILIZADA', 'CANCELADA', 'REEMBOLSADA'];

// Los estados en los que la compra ya no vale: la tarjeta se muestra apagada.
export const ESTADOS_INACTIVOS = ['CANCELADA', 'REEMBOLSADA'];

export function estiloEstado(estado) {
  return ESTADOS[estado];
}

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
