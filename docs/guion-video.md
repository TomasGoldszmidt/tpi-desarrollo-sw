# Guion del video

**Flujo elegido:** la compra de entradas (caso de uso 12): el comprador elige un evento, un tipo de entrada y la cantidad, sin superar el cupo disponible, y la compra queda reservada. Empieza con la sesión ya iniciada y termina en la reserva; el login y el pago quedan afuera para ir más a fondo en este flujo.

**Duración objetivo:** ~8:45 (el enunciado pide entre 5 y 10). La conclusión sobre la IA es la parte más importante: tiene 2:30 y no se recorta. Si un ensayo pasa de 9:30, aplicar "Para acortar" del final.

**Formato:** el código se muestra **a la par del flujo**. En cada paso se hace la acción en la app y enseguida se abre el código que la resuelve. Lo de "decir" son ideas para contar con tus palabras, no un texto para leer.

| Parte | Qué cubre de la consigna | Tiempo |
|---|---|---|
| 0. Presentación | Contexto, arquitectura y el flujo elegido | 0:30 |
| 1. El evento y sus entradas | Interfaz, front-end y back-end | 1:15 |
| 2. Elegir el tipo y la cantidad | Interfaz y front-end | 1:15 |
| 3. Qué pasa al reservar | Back-end, de la ruta a la persistencia | 2:00 |
| 4. Dos compradores a la vez | Interfaz, front-end y back-end (el caso de error) | 1:15 |
| 5. Conclusión sobre la IA | Ventajas, desventajas, dificultades, aprendizajes y valoración | 2:30 |

---

## Antes de grabar

- [ ] **Pantalla partida:** el emulador a un costado y VS Code ocupando el resto. Subir el tamaño de letra del editor (`Ctrl` + `+`) para que se lea en el video, y cerrar las barras laterales que no se usan.
- [ ] Reiniciar el backend (`npm run dev` en `backend/`), así el seed arranca limpio: VIP del Festival con 100 disponibles y Backstage agotado.
- [ ] **Iniciar sesión antes de grabar** como Paredes (`paredes@gmail.com` / `paredes1234`) y dejar la app en el Catálogo. Expo Go muestra un botón flotante con un engranaje que puede tapar algún botón: tenerlo en cuenta al encuadrar.
- [ ] **Swagger listo para el paso 4:** abrir <http://localhost:3000/api-docs>, **Authorize** con `4` (Blanco, otro comprador), y en `POST /compras` → **Try it out** dejar escrito este body, sin ejecutarlo:
  ```json
  { "eventoId": 3, "tipoEntradaId": 2, "cantidad": 98 }
  ```
  (3 es el Festival de Verano y 2 su entrada VIP.)
- [ ] Dejar abiertas estas pestañas en VS Code, en el orden en que aparecen:

  | # | Archivo | Qué se muestra |
  |---|---|---|
  | 1 | `mobile/src/app/eventos/[id].js` | el botón "Comprar · desde" y cuándo se deshabilita |
  | 2 | `backend/src/domain/evento.js` | `detalleEvento`: las disponibles de cada tipo |
  | 3 | `backend/src/domain/tipoEntrada.js` | `calcularDisponibles` y `hayCupoPara` |
  | 4 | `mobile/src/app/eventos/[id]/comprar.js` | `conCupo`, `cantidadValida`, `enElMaximo` y `reservar` |
  | 5 | `mobile/src/api/compras.js` y `mobile/src/api/client.js` | `crearCompra`, el header `X-User-Id` y el error del backend |
  | 6 | `backend/src/routes/compraRoutes.js` | `POST /compras` con `requireUsuario` |
  | 7 | `backend/src/controllers/compraController.js` | `create` |
  | 8 | `backend/src/domain/compra.js` | `comprar` y `ESTADOS_QUE_OCUPAN_CUPO` |
  | 9 | `backend/src/persistence/repositories/compraRepository.js` y `schemas.js` | `create` y el `@typedef` de `Compra` |
  | 10 | `backend/src/http/middlewares/errorHandler.js` | cómo un error llega como `{ "error": "mensaje" }` |
  | 11 | `backend/test/domain.test.js` | el `describe('comprar')` |

  Para saltar a una función: `Ctrl` + `Shift` + `O` y escribir su nombre.
- [ ] Ensayar el recorrido una vez y **volver a reiniciar el backend e iniciar sesión** antes de grabar: lo que se compra en el ensayo queda en memoria.

---

## 0. Presentación · ~0:30

**Pantalla:** la app en el Catálogo y, al lado, el árbol de carpetas de VS Code.

**Decir:**
- AI Ticket It: venta de entradas para eventos, con compradores y organizadores. El flujo que elegí es la compra de entradas: elegir el tipo y la cantidad sin superar el cupo. Ya tengo la sesión iniciada como un comprador.
- Backend en Node + Express 5, en capas: `routes` → `controllers` → `domain` → `persistence/repositories`. App en React Native con Expo: cada archivo de `src/app/` es una pantalla. Todo se desarrolló con Claude Code.

---

## 1. El evento y sus entradas · ~1:15

**App:** buscar "verano" → **Festival de Verano**. En el detalle, las entradas: General con 1000 disponibles, VIP con 100 y **Backstage Agotado**. Abajo, el botón **Comprar · desde $ 90.000**.

**Frontend · `eventos/[id].js`:** el botón dice "desde" el precio más barato con cupo, y se deshabilita si el evento está agotado, ya se realizó o es del propio usuario.

**Backend:**
- `GET /eventos/:id` arma el detalle con `detalleEvento` (`evento.js`), que suma a cada tipo de entrada sus `disponibles`.
- `tipoEntrada.js: calcularDisponibles`: las disponibles **no se guardan**: son el cupo menos las entradas de las compras que ocupan lugar. Así no hay un contador que se pueda desincronizar.

---

## 2. Elegir el tipo y la cantidad · ~1:15

**App:** **Comprar · desde $ 90.000**. Arriba, los pasos (Entradas, Reservar y Pagar); este flujo termina en Reservar. Mostrar que el Backstage no se puede tocar. Elegir **VIP** y subir a 3 con el "+": "3 × $ 180.000" y el total $ 540.000. **No reservar todavía.**

**Frontend · `comprar.js`:**
- `conCupo`: solo los tipos con disponibles se pueden elegir; si el elegido se agota, pasa al primero que tenga lugar.
- `cantidadValida` nunca supera las disponibles, y `enElMaximo` deshabilita el "+" y muestra "Máximo N".
- El total de la pantalla es solo para mostrar: el que vale lo calcula el backend.
- **Decir:** la pantalla ayuda a no equivocarse, pero no es la que decide. Lo que trae del backend puede quedar viejo mientras el usuario elige, y eso lo muestro en el paso 4.

---

## 3. Qué pasa al reservar · ~2:00

Seguir el pedido de punta a punta, **antes** de tocar Reservar:

1. **`comprar.js: reservar`** llama a `crearCompra` (`api/compras.js`), que hace `POST /compras` con `{ eventoId, tipoEntradaId, cantidad }`. `client.js` agrega el header `X-User-Id` con el usuario activo: el comprador nunca va en el body.
2. **`compraRoutes.js`:** `POST /compras` pasa por `requireUsuario`, que lee ese header y responde **401** si falta o el usuario no existe. Un método que no existe en la ruta responde **405**.
3. **`compraController.create`:** valida la **forma** del pedido: ids válidos y cantidad entera ≥ 1 (**400**). Llama al dominio y responde **201** con el header `Location: /compras/:id`.
4. **`compra.js: comprar`:** las **reglas del negocio**:
   - el evento y el tipo de entrada existen (400);
   - el organizador no puede comprar en su propio evento, porque se mezclarían los roles en el chat y en las ventas (409);
   - el evento no se realizó (409);
   - `hayCupoPara`, el método del diagrama de clases: si no alcanza, "No hay cupo suficiente: quedan N entradas" (409);
   - el `total` lo calcula el backend: precio × cantidad.
5. **`ESTADOS_QUE_OCUPAN_CUPO`:** la compra arranca **PENDIENTE** y ya ocupa lugar. **Decir:** si solo ocuparan las pagadas, dos personas podrían reservar la última entrada y la segunda se enteraría recién al pagar.
6. **`compraRepository.create` y `schemas.js`:** se guarda en memoria, como documento, con el historial embebido desde el primer estado. `total` se guarda aunque se pueda calcular, porque es lo que se paga aunque después cambie el precio.
7. **`domain.test.js`** (opcional, ~15 s): el `describe('comprar')` prueba cada regla con su status y su mensaje; corren con `npm test`.

---

## 4. Dos compradores a la vez · ~1:15

**Decir:** ahora simulo que otra persona compra mientras yo elijo.

**Swagger:** ejecutar el `POST /compras` preparado (Blanco compra 98 VIP) → **201**. Quedan 2.

**App:** sin tocar nada más, **Reservar 3 entradas** → aparece "No hay cupo suficiente: quedan 2 entradas", las VIP pasan a "2 disponibles" y la cantidad baja sola a 2, con "Máximo 2".

**Código:**
- `compra.js: comprar`: `hayCupoPara` volvió a contar con las compras de ese momento y rechazó con **409**.
- `errorHandler.js`: todos los errores responden `{ "error": "mensaje" }` con su status, y el mensaje ya está en español para mostrarlo.
- `client.js` lanza ese mensaje tal cual, y `comprar.js: reservar` lo muestra y llama a `recargar`: vuelve a pedir el evento, y `cantidadValida` ajusta la cantidad a lo que queda.

**App:** **Reservar 2 entradas** → "Tus entradas están reservadas": VIP × 2, $ 360.000, **Pendiente de pago**. **Decir:** acá termina el flujo; el pago es otro paso, que se puede hacer ahora o más tarde desde Mis compras.

---

## 5. Conclusión sobre el uso de IA · ~2:30

**Pantalla:** la cámara, o `docs/conclusion-ia.md` y la carpeta `.claude/skills/`.

Es la parte más importante: decir con tus palabras los puntos de "Para decir en el video" del final de `docs/conclusion-ia.md`, con un ejemplo concreto en cada uno. Ahí están ordenados con el tiempo de cada uno.

---

## Si sobra o falta tiempo

- **Para acortar (a ~7:30):** en el paso 1 mostrar solo la app, y en el paso 3 saltear los tests y el repositorio. La conclusión no se recorta.
- **Para alargar:** en el paso 3, mostrar en Swagger un pedido con `cantidad: 0` → **400** "El campo cantidad tiene que ser como mínimo 1", para que se vea la diferencia entre una validación de forma (controlador) y una regla de negocio (dominio).
