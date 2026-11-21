import Ionicons from '@expo/vector-icons/Ionicons';

// Ícono de cada pestaña: lleno cuando está elegida, de línea cuando no.
export function TabIcon({ lleno, linea, color, size, focused }) {
  return <Ionicons name={focused ? lleno : linea} size={size} color={color} />;
}
