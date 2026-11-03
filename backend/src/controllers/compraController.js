import * as compraRepository from '../persistence/repositories/compraRepository.js';
import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import { comprar, detalleCompra, actualizarEstado } from '../domain/compra.js';
import { EstadoCompra } from '../domain/estadoCompra.js';
import { NotFoundError } from '../http/errors.js';
import { requireId, requireInteger } from '../http/validation.js';

function toDetalle(compra) {
  return detalleCompra(
    compra,
    eventoRepository.findById(compra.eventoId),
    usuarioRepository.findById(compra.compradorId),
  );
}

function findCompra(req) {
  const id = requireId(req.params.id);
  const compra = compraRepository.findById(id);
  if (!compra) throw new NotFoundError(`No existe la compra ${id}`);
  return compra;
}

// Pago y utilización son el mismo cambio de estado con otro destino; las reglas están en el dominio.
function changeEstado(nuevoEstado) {
  return async (req, res) => {
    const compra = findCompra(req);
    const evento = eventoRepository.findById(compra.eventoId);
    const actualizada = actualizarEstado(compra, evento, nuevoEstado, req.usuario);
    res.status(200).json(toDetalle(actualizada));
  };
}

export async function create(req, res) {
  const body = req.body ?? {};
  const datos = {
    eventoId: requireId(body.eventoId, 'eventoId'),
    tipoEntradaId: requireId(body.tipoEntradaId, 'tipoEntradaId'),
    cantidad: requireInteger(body.cantidad, 'cantidad', { min: 1 }),
  };

  const compra = comprar(datos, req.usuario);
  res.status(201).json(toDetalle(compra));
}

export const pay = changeEstado(EstadoCompra.CONFIRMADA);
export const markUtilizada = changeEstado(EstadoCompra.UTILIZADA);
