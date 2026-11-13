import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

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

// Cada estado lleva su ícono: así se distinguen también sin ver los colores.
const ICONOS = {
  PENDIENTE: 'time-outline',
  CONFIRMADA: 'checkmark',
  UTILIZADA: 'checkmark-done',
  CANCELADA: 'close',
  REEMBOLSADA: 'arrow-undo-outline',
};

// chico: dentro de una fila de lista (bandeja de mensajes). Sin alto fijo: con la letra
// grande del celular crece en lugar de cortarse.
export function EstadoBadge({ estado, chico = false }) {
  const { texto, fondo, color } = ESTADOS[estado];
  return (
    <View style={[styles.badge, chico && styles.chico, { backgroundColor: fondo }]}>
      <Ionicons name={ICONOS[estado]} size={chico ? 11 : 13} color={color} />
      <Text style={[styles.texto, chico && styles.textoChico, { color }]}>{texto}</Text>
    </View>
  );
}

// Etiqueta con la misma forma que el estado, para otras marcas ("Realizado", "Agotado").
export function Etiqueta({ texto, fondo, color, icono }) {
  return (
    <View style={[styles.badge, { backgroundColor: fondo }]}>
      {icono ? <Ionicons name={icono} size={13} color={color} /> : null}
      <Text style={[styles.texto, { color }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingVertical: 3,
    paddingLeft: 8,
    paddingRight: 10,
  },
  chico: {
    paddingVertical: 1,
    paddingLeft: 6,
    paddingRight: 8,
  },
  texto: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  textoChico: {
    fontSize: 11,
  },
});
