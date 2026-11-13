import { useWindowDimensions } from 'react-native';
import { breakpoints } from '../theme.js';

// Qué tamaño de pantalla hay: 'telefono' (menos de 600), 'tablet' (600 a 899) o 'ancho'
// (900 o más). columnas es cuántas tarjetas entran por fila en los listados.
export function useLayout() {
  const { width } = useWindowDimensions();
  let tamanio = 'telefono';
  if (width >= breakpoints.ancho) tamanio = 'ancho';
  else if (width >= breakpoints.tablet) tamanio = 'tablet';
  return {
    width,
    tamanio,
    esTelefono: tamanio === 'telefono',
    esAncho: tamanio === 'ancho',
    columnas: tamanio === 'telefono' ? 1 : tamanio === 'tablet' ? 2 : 3,
  };
}
