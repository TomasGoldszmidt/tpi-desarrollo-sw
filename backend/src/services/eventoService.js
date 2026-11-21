import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as compraRepository from '../persistence/repositories/compraRepository.js';
import * as categoriaRepository from '../persistence/repositories/categoriaRepository.js';
import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import {
  buscarEventos, cantidadesOrganizador, detalleEvento, eventosOrganizados, filtroOrganizador, nuevoEvento,
} from '../domain/evento.js';
import { cantidadConMensajesNoLeidos } from '../domain/compra.js';
import { puntajeDe } from '../domain/resenia.js';
import { NotFoundError, ValidationError } from '../http/errors.js';
import { paginar } from '../http/pagination.js';
import { buscarUsuario, usuariosPorId } from './usuarioService.js';
import { puntajesDeOrganizadores } from './reseniaService.js';

/** @typedef {import('../persistence/schemas.js').Evento} Evento */
/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */
/** @typedef {{ pagina: number, limite: number }} Pagina */

// Lo que necesita el dominio para armar los resúmenes del catálogo, buscado de una vez.
/** @returns {import('../domain/evento.js').ContextoResumenes} */
export function contextoResumenes() {
  return {
    categorias: new Map(categoriaRepository.findAll().map((categoria) => [categoria.id, categoria])),
    usuarios: usuariosPorId(),
    puntajes: puntajesDeOrganizadores(),
  };
}

/** @returns {Evento} */
export function buscarEvento(id) {
  const evento = eventoRepository.findById(id);
  if (!evento) throw new NotFoundError(`No existe el evento ${id}`);
  return evento;
}

/** @param {Evento} evento */
function detalle(evento) {
  const organizador = usuarioRepository.findById(evento.organizadorId);
  return detalleEvento(
    evento,
    compraRepository.findByEvento(evento.id),
    categoriaRepository.findById(evento.categoriaId),
    organizador,
    puntajeDe(organizador, puntajesDeOrganizadores()),
  );
}

export function verEvento(id) {
  return detalle(buscarEvento(id));
}

// Casos de uso 3 y 11. Texto y categoría los busca el repositorio; precio y orden, el dominio.
/** @param {Pagina} pagina */
export function buscarEnCatalogo({ texto, categoriaId, ...filtros }, pagina) {
  const eventos = eventoRepository.search({ texto, categoriaId });
  return paginar(buscarEventos(eventos, filtros, contextoResumenes()), pagina);
}

// Caso de uso 4.
/** @param {Usuario} organizador */
export function crearEvento(datos, organizador, ahora = new Date()) {
  if (!categoriaRepository.findById(datos.categoriaId)) {
    throw new ValidationError(`No existe la categoría ${datos.categoriaId}`);
  }
  return detalle(eventoRepository.create(nuevoEvento(datos, organizador, ahora)));
}

// GET /usuarios/:id/eventos: los eventos que organiza, incluidos los pasados. Cada uno trae
// cuántas compras tienen mensajes que el organizador no leyó. Van de a páginas, con un filtro
// opcional y cuántos hay con cada filtro (los chips de la app).
/** @param {string | undefined} filtro @param {Pagina} pagina */
export function eventosDe(organizadorId, filtro, pagina, ahora = new Date()) {
  const organizador = buscarUsuario(organizadorId);
  const suyos = eventoRepository.findByOrganizador(organizador.id);
  const porId = new Map(suyos.map((evento) => [evento.id, evento]));

  const eventos = eventosOrganizados(suyos, contextoResumenes(), ahora).map((evento) => ({
    ...evento,
    conMensajesNoLeidos: cantidadConMensajesNoLeidos(compraRepository.findByEvento(evento.id), porId.get(evento.id), organizador),
  }));
  const filtrados = eventos.filter((evento) => filtroOrganizador(evento, filtro, ahora));
  return paginar(filtrados, pagina, { cantidades: cantidadesOrganizador(eventos, ahora) });
}
