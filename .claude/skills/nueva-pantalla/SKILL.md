---
name: nueva-pantalla
description: Diseña e implementa UNA pantalla de la app mobile de AI Ticket It (Expo) - arma un boceto visual con datos reales del seed y un análisis breve, frena hasta que el usuario apruebe el boceto y recién con el ok escribe la pantalla, su navegación y las llamadas a la API, y la prueba en el emulador con /probar-caso-de-uso. Usar con "/nueva-pantalla <pantalla>" o "/nueva-pantalla siguiente", o cuando el usuario pida crear o modificar una pantalla.
---

# Nueva pantalla

Lo que el usuario aprueba es **cómo se ve y cómo se usa la pantalla**: por eso el análisis gira alrededor de un boceto. Se trabaja **una pantalla por invocación**, y no se escribe código de la app hasta que el boceto esté aprobado.

Archivos de apoyo:
- [referencia-dominio.md](../persistencia/referencia-dominio.md): casos de uso del enunciado. Leerlo siempre.
- `backend/src/docs/openapi.yaml`: los endpoints que existen, con sus parámetros, respuestas y errores.
- `backend/src/persistence/seed.js`: los datos para el boceto y la prueba.
- `docs/bocetos/`: los bocetos ya aprobados, para mantener el mismo estilo.
- `mobile/AGENTS.md` y `mobile/src/`: convenciones de Expo y lo que ya existe (componentes, cliente HTTP, contexto).
- `TAREAS.md`, sección 3: qué pantallas faltan.

## Paso 0 · Elegir la pantalla

- Si el usuario nombró una, usar esa. Con "siguiente", tomar el primer ítem sin marcar de la sección 3 de `TAREAS.md`.
- Leer el código de `mobile/src/` para reusar componentes y funciones de la API, y no duplicar.
- Si la pantalla necesita un endpoint que no existe o un dato que la API no devuelve, decirlo en el análisis: no se inventa del lado de la app ni se modifica el backend en silencio (eso va por `/nuevo-endpoint`).

## Paso 1 · Boceto

Un mockup en HTML de la pantalla como se vería en el celular:

- **Tamaño de celular:** ~380px de ancho, con la barra de título de la navegación y, si corresponde, las pestañas de abajo.
- **Datos reales del seed:** eventos, precios, usuarios y estados que existen, con los campos calculados como los devuelve la API (`disponibles`, `diasRestantes`, puntaje). Nada de "Lorem ipsum" ni "Evento 1".
- **Estados que importan:** el principal y, cuando aplique, cargando, vacío y error (ej: "Mis compras" sin compras, un tipo de entrada sin cupo, el mensaje de un 409). Se muestran uno al lado del otro.
- **Dentro del celular, solo lo que ve el usuario:** nada de status HTTP (409, 404), endpoints, nombres de código ni explicaciones ("la pantalla vuelve a pedir…"). Cada estado (error, vacío, sin cupo) se dibuja como la pantalla real en ese estado; lo técnico va en las notas de afuera o en el análisis.
- **Anotaciones:** cada elemento tocable (botón, filtro, tarjeta) lleva una nota numerada al costado con adónde lleva o qué endpoint llama.
- **Estilo coherente** con los bocetos anteriores de `docs/bocetos/` y con `mobile/src/theme.js` si ya existe. Componentes que se puedan hacer con React Native puro (sin librerías de UI).

Mostrarlo **dentro de la conversación** con la herramienta de visualización inline si está disponible; si no, abrir el HTML en el panel del navegador. Guardarlo en `docs/bocetos/<pantalla>.html` (nombre en kebab-case: `catalogo.html`, `detalle-compra.html`), autocontenido y sin dependencias externas.

## Paso 2 · Análisis breve y FRENAR

Debajo del boceto, con este formato:

```markdown
## Pantalla: <nombre>
**Caso de uso:** número y texto del caso de referencia-dominio.md
**Ruta:** archivo en src/app/ · desde dónde se llega · parámetros
**Usuario activo:** requerido (rol) | público
**Endpoints:** tabla (método y ruta · cuándo se llama · qué se usa de la respuesta)
**Acciones:** lista numerada, igual que las notas del boceto (qué toca el usuario · qué pasa · errores posibles y cómo se muestran)
**Archivos a crear o modificar:** lista
**Dudas / alternativas:** lo que el usuario debería decidir
```

**No escribir código de la app hasta que el usuario apruebe el boceto.** Si pide cambios ("el filtro arriba", "sacá el puntaje"), rehacer el boceto, sobrescribir el HTML y volver a mostrarlo hasta que lo apruebe.

## Paso 3 · Implementar (solo con ok)

Convenciones de `mobile/` (lo técnico en inglés, lo del dominio en español):

- **Navegación con Expo Router:** cada archivo de `src/app/` es una pantalla y los `_layout.js` definen los navegadores (stack, tabs). Parámetros con `useLocalSearchParams`, navegación con `Link` y `router` de `expo-router`. Lo que no es pantalla va afuera de `src/app/`.
- **Cliente HTTP** en `src/api/client.js`: `fetch` contra `API_URL` (de `src/config.js`), con el header `X-User-Id` del usuario activo cuando lo hay. Si la respuesta no es 2xx, lanza un `Error` con el mensaje de `{ "error": "..." }`, que la pantalla muestra tal cual (ya viene en español). Un archivo por recurso (`api/eventos.js`, `api/compras.js`) con funciones que nombran la operación: `buscarEventos`, `getCompra`, `pagarCompra`.
- **Usuario activo** en `src/context/UsuarioContext.js`: se elige de la lista de `GET /usuarios`, no hay login (igual que el backend).
- **Componentes:** de función con hooks, en `src/components/` cuando se usan en más de una pantalla (`EventoCard`, `EstadoBadge`). Estilos con `StyleSheet` y valores compartidos (colores, espaciados) en `src/theme.js`.
- **Estados de la pantalla:** toda pantalla que carga datos muestra cargando, error (con reintentar) y vacío, como en el boceto. Para pedir los datos usar el hook `src/hooks/useCarga.js` (`{ data, loading, error, recargar }`) en lugar de un `useEffect` propio: ESLint (`react-hooks/set-state-in-effect`) rechaza los `setState` sincrónicos dentro de un efecto. Mientras se vuelve a pedir, `data` conserva lo anterior y `loading` es `true`. La carga se muestra como en `docs/bocetos/carga.html`:
  - Al abrir una pantalla sin datos todavía: `PantallaCarga` (`src/components/Carga.js`) con un mensaje ("Cargando el evento…").
  - Dentro de una pantalla abierta (buscar, filtrar, reintentar): `EstadoCarga` con `mensaje` en el lugar de la lista; el error, con el mismo componente.
  - Al confirmar una acción (comprar, pagar, cancelar): `CargaEncima` cubriendo la pantalla ("Confirmando tu compra…").
- **Teclado:** en Android la pantalla es de borde a borde y `KeyboardAvoidingView` no corre el contenido. En las pantallas con un campo de texto abajo (como el chat), usar `src/hooks/useAlturaTeclado.js` y dejar ese alto como `paddingBottom`.
- **Nada técnico en la app:** ni URLs, ni el backend, ni status. Los errores de conexión y los inesperados ya los traduce `api/client.js`; los del backend vienen en español. Después de una acción (pagar, cancelar) se vuelven a pedir los datos al backend en lugar de modificar el estado a mano.
- **Fechas y precios** se formatean en un solo lugar (`src/format.js`), en es-AR.
- JavaScript, sin TypeScript. ES Modules.
- **Dependencias:** solo con `npx expo install` y **avisando antes**. Hoy falla por un conflicto de `react-dom` (dependencia opcional de la versión web de Expo Router), así que se instala con `npx expo install <paquete> -- --legacy-peer-deps`. Antes de usar una API de Expo o de React Native, consultar la documentación de la versión instalada (`https://docs.expo.dev/versions/v<major>.0.0/`), no la de memoria.
- **Al editar un archivo que la app está mostrando, agregar primero el import y después el uso:** Fast Refresh toma cada edición por separado, y si el uso llega antes que el import aparece un error en pantalla ("Property 'x' doesn't exist").
- La pantalla tiene que **respetar el boceto aprobado**. Si al implementar algo no se puede hacer igual, frenar y avisar.

## Paso 4 · Probar y cerrar

1. `npx expo lint` en `mobile/`, sin errores.
1. Recorrer cada proceso de la pantalla (cargar, recargar, cada acción y lo que se vuelve a pedir después) y confirmar que muestra su carga y que nunca queda a la vista un estado viejo. Los estados se muestran con `EstadoBadge`, nunca con texto escrito a mano.
2. Ejecutar `/probar-caso-de-uso` en el emulador: el caso feliz y cada error o estado del boceto (vacío, sin cupo, el mensaje de error de la API). Comparar la captura del emulador con el boceto y mostrar las dos.
3. Marcar la casilla en `TAREAS.md` si el ítem quedó completo.
4. Proponer el commit (código + boceto) y sugerir `/registrar-ia`, sobre todo si el usuario cambió el boceto.
