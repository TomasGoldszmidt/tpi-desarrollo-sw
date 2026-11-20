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

// Para algo que ya pasó: "Hoy · 10:00", "Ayer · 19:00" o "sáb 7 nov · 20:00".
// ahora se recibe de afuera (en milisegundos) para que el resultado no dependa del render.
export function formatCuando(iso, ahora) {
  const dia = formatDia(iso);
  if (dia === formatDia(new Date(ahora).toISOString())) return `Hoy · ${formatHora(iso)}`;
  if (dia === formatDia(new Date(ahora - 24 * 60 * 60 * 1000).toISOString())) return `Ayer · ${formatHora(iso)}`;
  return formatFecha(iso);
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

// Entradas que quedan de un tipo: 1 → "1 disponible"; 5 → "5 disponibles".
export function formatDisponibles(disponibles) {
  return disponibles === 1 ? '1 disponible' : `${disponibles} disponibles`;
}

// Fecha y hora elegidas como hora argentina → ISO en UTC, para mandar al backend.
// dia: { anio, mes (0-11), dia }; hora: { hora, minuto }.
export function fechaArgentinaISO(dia, hora) {
  const utc = Date.UTC(dia.anio, dia.mes, dia.dia, hora.hora, hora.minuto);
  return new Date(utc - OFFSET_ARGENTINA_MS).toISOString();
}

// { anio: 2027, mes: 2, dia: 15 } → "lun 15 mar 2027".
export function formatDiaElegido(dia) {
  return `${formatDia(fechaArgentinaISO(dia, { hora: 12, minuto: 0 }))} ${dia.anio}`;
}

// { hora: 19, minuto: 0 } → "19:00".
export function formatHoraElegida(hora) {
  return `${dosDigitos(hora.hora)}:${dosDigitos(hora.minuto)}`;
}
