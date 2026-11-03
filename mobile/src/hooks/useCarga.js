import { useEffect, useState } from 'react';

// Pide datos al backend al montar la pantalla y expone los estados para mostrar
// cargando, error y reintentar. pedir es una función async (ej: getUsuarios);
// pasarla con useCallback si depende de parámetros, así se vuelve a pedir cuando cambian.
export function useCarga(pedir) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  // Los setState van en los callbacks de la promesa y no directo en el efecto
  // (regla react-hooks/set-state-in-effect). Si la pantalla se desmonta o se vuelve
  // a pedir antes de que llegue la respuesta, la respuesta vieja se descarta.
  useEffect(() => {
    let vigente = true;
    pedir()
      .then((resultado) => {
        if (vigente) {
          setData(resultado);
          setError(null);
        }
      })
      .catch((e) => {
        if (vigente) {
          setError(e.message);
        }
      })
      .finally(() => {
        if (vigente) {
          setLoading(false);
        }
      });
    return () => {
      vigente = false;
    };
  }, [pedir, intento]);

  function recargar() {
    setLoading(true);
    setError(null);
    setIntento((n) => n + 1);
  }

  return { data, loading, error, recargar };
}
