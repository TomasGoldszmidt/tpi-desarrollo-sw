import * as compraRepository from '../persistence/repositories/compraRepository.js';
import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import { comprar, detalleCompra, actualizarEstado, estadoAlCancelar, puedeVer } from '../domain/compra.js';
import { EstadoCompra } from '../domain/estadoCompra.js';
import { ForbiddenError, NotFoundError } from '../http/errors.js';
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

// Pago, utilización y cancelación son el mismo cambio de estado con otro destino; las reglas
// están en el dominio. `destino` recibe la compra porque al cancelar depende de su estado.
function changeEstado(destino) {
  return async (req, res) => {
    const compra = findCompra(req);
    const evento = eventoRepository.findById(compra.eventoId);
    const actualizada = actualizarEstado(compra, evento, destino(compra), req.usuario);
    res.status(200).json(toDetalle(actualizada));
  };
}

// Caso de uso 1: las compras del usuario activo como comprador, de la más reciente a la más vieja.
export async function list(req, res) {
  const fechaDeCompra = (compra) => compra.historial[0].fechaHora;
  const compras = compraRepository.findByComprador(req.usuario.id)
    .sort((a, b) => fechaDeCompra(b) - fechaDeCompra(a));
  res.status(200).json(compras.map(toDetalle));
}

export async function getById(req, res) {
  const compra = findCompra(req);
  const evento = eventoRepository.findById(compra.eventoId);
  if (!puedeVer(compra, evento, req.usuario)) throw new ForbiddenError('No podés ver esta compra');
  res.status(200).json(toDetalle(compra));
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

export const pay = changeEstado(() => EstadoCompra.CONFIRMADA);
export const markUtilizada = changeEstado(() => EstadoCompra.UTILIZADA);
// PENDIENTE → CANCELADA, CONFIRMADA → REEMBOLSADA (casos de uso 7 y 8).
export const cancel = changeEstado(estadoAlCancelar);
