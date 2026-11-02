// Estados por los que pasa una compra. Es un enum: no se persiste como colección,
// las compras guardan el string. Las transiciones válidas se definen en el dominio.
export const EstadoCompra = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  CONFIRMADA: 'CONFIRMADA',
  UTILIZADA: 'UTILIZADA',
  CANCELADA: 'CANCELADA',
  REEMBOLSADA: 'REEMBOLSADA',
});
