import { FiltroChips } from './FiltroChips.js';
import { ORDEN_ESTADOS, estiloEstado } from './EstadoBadge.js';

// Chips para filtrar compras por estado: "Todas" y un chip por cada estado que aparece en
// las compras, con su cantidad. El elegido toma los colores de su badge.
// elegido es un EstadoCompra o null (Todas). Si el elegido se queda sin compras,
// su chip se sigue mostrando con 0 para que se entienda por qué la lista está vacía.
export function FiltroEstados({ compras, elegido, onElegir }) {
  const cantidades = new Map();
  for (const compra of compras) {
    cantidades.set(compra.estado, (cantidades.get(compra.estado) ?? 0) + 1);
  }
  const estados = ORDEN_ESTADOS.filter((estado) => cantidades.has(estado) || estado === elegido);

  const opciones = [
    { valor: null, texto: 'Todas', cantidad: compras.length },
    ...estados.map((estado) => {
      const { plural, fondo, color, borde } = estiloEstado(estado);
      return {
        valor: estado,
        texto: plural,
        cantidad: cantidades.get(estado) ?? 0,
        punto: borde,
        estiloActivo: { backgroundColor: fondo, color },
      };
    }),
  ];

  return <FiltroChips opciones={opciones} elegido={elegido} onElegir={onElegir} />;
}
