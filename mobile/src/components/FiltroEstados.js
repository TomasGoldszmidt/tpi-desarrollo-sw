import { FiltroChips } from './FiltroChips.js';
import { ORDEN_ESTADOS, estiloEstado } from './EstadoBadge.js';

// Chips para filtrar compras por estado: "Todas" y un chip por cada estado que tiene
// compras, con su cantidad. El elegido toma los colores de su badge.
// cantidades viene del backend ({ todas, PENDIENTE: 1, ... }, solo los estados con alguna):
// cuenta todas las compras, aunque no estén cargadas todas las páginas.
// elegido es un EstadoCompra o null (Todas). Si el elegido se queda sin compras,
// su chip se sigue mostrando con 0 para que se entienda por qué la lista está vacía.
export function FiltroEstados({ cantidades, elegido, onElegir }) {
  const estados = ORDEN_ESTADOS.filter((estado) => cantidades[estado] > 0 || estado === elegido);

  const opciones = [
    { valor: null, texto: 'Todas', cantidad: cantidades.todas },
    ...estados.map((estado) => {
      const { plural, fondo, color, borde } = estiloEstado(estado);
      return {
        valor: estado,
        texto: plural,
        cantidad: cantidades[estado] ?? 0,
        punto: borde,
        estiloActivo: { backgroundColor: fondo, color },
      };
    }),
  ];

  return <FiltroChips opciones={opciones} elegido={elegido} onElegir={onElegir} />;
}
