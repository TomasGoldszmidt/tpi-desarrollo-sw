import { useEffect, useState } from 'react';
import { Dimensions, Keyboard } from 'react-native';

// Alto del teclado mientras está abierto (0 si está cerrado). En Android, con la pantalla
// de borde a borde, el sistema no achica la pantalla al abrir el teclado y KeyboardAvoidingView
// no alcanza: la pantalla deja abajo un espacio de este alto para que el campo de texto quede a la vista.
export function useAlturaTeclado() {
  const [altura, setAltura] = useState(0);

  useEffect(() => {
    // Se mide desde donde empieza el teclado hasta el borde de la pantalla: el alto que informa
    // el evento no incluye la barra de navegación de abajo, y el campo quedaba tapado en parte.
    const alAbrir = Keyboard.addListener('keyboardDidShow', (e) =>
      setAltura(Dimensions.get('screen').height - e.endCoordinates.screenY),
    );
    const alCerrar = Keyboard.addListener('keyboardDidHide', () => setAltura(0));
    return () => {
      alAbrir.remove();
      alCerrar.remove();
    };
  }, []);

  return altura;
}
