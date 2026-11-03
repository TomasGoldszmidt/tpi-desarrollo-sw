import { useEffect, useState } from 'react';

// Pide datos al backend al montar la pantalla y expone los estados para mostrar
// cargando, error y reintentar. pedir es una función async (ej: getUsuarios);
// pasarla con useCallback si depende de parámetros, así se vuelve a pedir cuando cambian.
// Mientras se vuelve a pedir (otros filtros, reintentar), data conserva lo anterior
// y loading es true: cada pantalla decide si muestra lo viejo o un spinner.
export function useCarga(pedir) {
  const [intento, setIntento] = useState(0);
  // La última respuesta, con el pedido y el intento a los que corresponde.
  const [resultado, setResultado] = useState(null);

  // Los setState van en los callbacks de la promesa y no directo en el efecto
  // (regla react-hooks/set-state-in-effect). Si la pantalla se desmonta o se vuelve
  // a pedir antes de que llegue la respuesta, la respuesta vieja se descarta.
  useEffect(() => {
    let vigente = true;
    pedir().then(
      (data) => {
        if (vigente) setResultado({ pedir, intento, data, error: null });
      },
      (e) => {
        if (vigente) setResultado((anterior) => ({ pedir, intento, data: anterior?.data ?? null, error: e.message }));
      },
    );
    return () => {
      vigente = false;
    };
  }, [pedir, intento]);

  // Está cargando hasta que llega la respuesta del pedido y el intento actuales.
  const loading = !resultado || resultado.pedir !== pedir || resultado.intento !== intento;

  return {
    data: resultado?.data ?? null,
    loading,
    error: loading ? null : resultado.error,
    recargar: () => setIntento((n) => n + 1),
  };
}
