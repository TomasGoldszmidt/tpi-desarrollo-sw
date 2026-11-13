// Colores, letra y espaciados compartidos. El verde sale del logo del enunciado.
// Los valores vienen del rediseño aprobado (artefacto "AI Ticket It responsive").
export const colors = {
  brand: '#62C935',
  primary: '#3B6D11',
  primaryText: '#27500A',
  primarySoft: '#EAF3DE',
  // Fondo de lo nuevo o lo elegido (notificaciones sin leer, avisos de mensajes).
  primarySofter: '#F4F9EE',
  danger: '#A32D2D',
  dangerSoft: '#FCEBEB',
  dangerText: '#791F1F',
  text: '#2C2C2A',
  textSecondary: '#5F5E5A',
  // Más oscuro que el anterior (#888780), que no se leía bien en letra chica sobre blanco.
  textMuted: '#6B6A64',
  border: '#D3D1C7',
  borderSoft: '#E4E2DA',
  background: '#FFFFFF',
  // Fondo gris claro de bloques secundarios (buscador, burbujas del otro, paneles).
  surface: '#F7F6F2',
  disabled: '#E6E4DC',
  star: '#BA7517',
  starText: '#8A5A00',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Una sola escala de letra para toda la app.
export const fontSize = {
  caption: 12,
  small: 13,
  body: 15,
  large: 16,
  title: 20,
  headline: 24,
};

// Lo mínimo que mide algo que se toca.
export const TOQUE_MINIMO = 44;

// Anchos de pantalla: teléfono (menos de 600), tablet vertical (600 a 899) y tablet horizontal (900 o más).
export const breakpoints = {
  tablet: 600,
  ancho: 900,
};

// Ancho máximo del contenido en pantallas grandes.
export const ANCHO_MAXIMO = 1200;
