// Formatos de fechas, precios y puntajes en es-AR. Se arman a mano para que
// no dependan del soporte de Intl del motor de JavaScript del celular.

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function dosDigitos(numero) {
  return String(numero).padStart(2, '0');
}

// Los eventos son en Argentina: la hora se muestra siempre en la hora argentina (UTC-3,
// sin horario de verano), sin importar la zona horaria configurada en el celular.
const OFFSET_ARGENTINA_MS = -3 * 60 * 60 * 1000;

// Se corre la fecha 3 horas y se leen los campos UTC, que ya quedan en hora argentina.
function enArgentina(iso) {
  return new Date(new Date(iso).getTime() + OFFSET_ARGENTINA_MS);
}

// "2026-11-07T23:00:00.000Z" → "sáb 7 nov".
export function formatDia(iso) {
  const fecha = enArgentina(iso);
  return `${DIAS[fecha.getUTCDay()]} ${fecha.getUTCDate()} ${MESES[fecha.getUTCMonth()]}`;
}

// "2026-11-07T23:00:00.000Z" → "20:00".
export function formatHora(iso) {
  const fecha = enArgentina(iso);
  return `${dosDigitos(fecha.getUTCHours())}:${dosDigitos(fecha.getUTCMinutes())}`;
}

// "2026-11-07T23:00:00.000Z" → "sáb 7 nov · 20:00".
export function formatFecha(iso) {
  return `${formatDia(iso)} · ${formatHora(iso)}`;
}

// 20000 → "$ 20.000"; los centavos solo se muestran si hay.
export function formatPrecio(precio) {
  const [enteros, decimales] = precio.toFixed(2).split('.');
  const conPuntos = enteros.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decimales === '00' ? `$ ${conPuntos}` : `$ ${conPuntos},${decimales}`;
}

// 4.5 → "4,5"; 4 → "4".
export function formatPuntaje(puntaje) {
  return String(Math.round(puntaje * 10) / 10).replace('.', ',');
}

// "2026-10-20T00:00:00.000Z" → "oct 2026" (en hora argentina).
export function formatMesAnio(iso) {
  const fecha = enArgentina(iso);
  return `${MESES[fecha.getUTCMonth()]} ${fecha.getUTCFullYear()}`;
}

// Caso de uso 1: cuántos días faltan para el evento de una compra CONFIRMADA.
// diasRestantes viene del backend; null significa que el evento ya pasó.
export function formatDiasRestantes(diasRestantes) {
  if (diasRestantes === null) return 'El evento ya pasó';
  if (diasRestantes === 0) return 'Es hoy';
  if (diasRestantes === 1) return 'Falta 1 día';
  return `Faltan ${diasRestantes} días`;
}
