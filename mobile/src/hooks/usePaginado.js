import { useCallback, useEffect, useRef, useState } from 'react';

// Como useCarga, pero para los listados que el backend devuelve de a páginas
// ({ resultados, pagina, limite, total, hayMas }). pedirPagina(n) es una función async
// que pide la página n; pasarla con useCallback: cuando cambia (otra búsqueda, otros
// filtros) se arranca de nuevo desde la página 1.
// - items: lo cargado hasta ahora (null hasta que llega la primera página).
// - cargarMas: pide la página siguiente (para FlatList.onEndReached). No hace nada si
//   no hay más, si ya está pidiendo una o si la primera página todavía no llegó.
// - recargar: vuelve a la página 1 sin borrar lo que se ve (recargando = true).
// - errorMas: si falló una página que no es la primera; cargarMas la vuelve a pedir.
export function usePaginado(pedirPagina) {
  const [intento, setIntento] = useState(0);
  // La última respuesta, con el pedido y el intento a los que corresponde.
  const [lista, setLista] = useState(null);
  // El pedido de página siguiente en curso: evita pedir dos veces la misma página si
  // onEndReached se dispara seguido.
  const pidiendoMas = useRef(null);

  // Los setState van en los callbacks de la promesa (regla react-hooks/set-state-in-effect).
  useEffect(() => {
    let vigente = true;
    pedirPagina(1).then(
      (respuesta) => {
        if (!vigente) return;
        pidiendoMas.current = null;
        setLista({
          pedirPagina,
          intento,
          items: respuesta.resultados,
          pagina: 1,
          total: respuesta.total,
          hayMas: respuesta.hayMas,
          error: null,
          cargandoMas: false,
          errorMas: null,
        });
      },
      (e) => {
        if (!vigente) return;
        setLista((anterior) => ({
          ...(anterior ?? { items: null, pagina: 0, total: 0, hayMas: false, cargandoMas: false, errorMas: null }),
          pedirPagina,
          intento,
          error: e.message,
        }));
      },
    );
    return () => {
      vigente = false;
    };
  }, [pedirPagina, intento]);

  const vigente = lista !== null && lista.pedirPagina === pedirPagina;
  const loading = !vigente || lista.intento !== intento;

  const cargarMas = useCallback(() => {
    if (loading || lista.error || !lista.hayMas || pidiendoMas.current) return;
    const pedido = {};
    pidiendoMas.current = pedido;
    const terminar = () => {
      if (pidiendoMas.current === pedido) pidiendoMas.current = null;
    };
    const siguiente = lista.pagina + 1;
    // Si mientras tanto se arrancó otra búsqueda o se recargó, la respuesta se descarta.
    const esDeEstaLista = (actual) => actual.pedirPagina === lista.pedirPagina && actual.intento === lista.intento;
    setLista((actual) => ({ ...actual, cargandoMas: true, errorMas: null }));
    pedirPagina(siguiente).then(
      (respuesta) => {
        terminar();
        setLista((actual) => {
          if (!esDeEstaLista(actual)) return actual;
          // Si entre página y página apareció un elemento nuevo, el corte se corre: se
          // descartan los que ya estaban.
          const ids = new Set(actual.items.map((item) => item.id));
          return {
            ...actual,
            items: [...actual.items, ...respuesta.resultados.filter((item) => !ids.has(item.id))],
            pagina: siguiente,
            total: respuesta.total,
            hayMas: respuesta.hayMas,
            cargandoMas: false,
          };
        });
      },
      (e) => {
        terminar();
        setLista((actual) => {
          if (!esDeEstaLista(actual)) return actual;
          return { ...actual, cargandoMas: false, errorMas: e.message };
        });
      },
    );
  }, [loading, lista, pedirPagina]);

  // Estable entre renders, para poder usarla en useFocusEffect.
  const recargar = useCallback(() => setIntento((n) => n + 1), []);

  return {
    items: lista?.items ?? null,
    total: lista?.total ?? 0,
    hayMas: lista?.hayMas ?? false,
    loading,
    // Se está volviendo a pedir la misma lista (tirar para recargar): se puede seguir mostrando.
    recargando: loading && vigente,
    error: loading ? null : lista.error,
    cargandoMas: !loading && lista.cargandoMas,
    errorMas: loading ? null : lista.errorMas,
    cargarMas,
    recargar,
  };
}
