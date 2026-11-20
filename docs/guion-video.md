# Guion del video

**Flujo elegido:** la compra de entradas (caso de uso 12): el comprador elige un evento, un tipo de entrada y la cantidad, sin superar el cupo disponible, y la compra queda reservada. Empieza con la sesión ya iniciada y termina en la reserva; el login y el pago quedan afuera para ir más a fondo en este flujo.

**Duración objetivo:** ~8:45 (el enunciado pide entre 5 y 10). La conclusión sobre la IA es la parte más importante: tiene 2:30 y no se recorta. Si un ensayo pasa de 9:30, aplicar "Para acortar" del final. Los textos **Decir** suman ~1080 palabras: unos 7:45 a ritmo normal, y el resto son las pausas para tocar la app y abrir el código.

**Formato:** el código se muestra **a la par del flujo**. En cada paso se hace la acción en la app y enseguida se abre el código que la resuelve. Los bloques **Decir** son un texto base, en el orden en que va la pantalla: sirve para ensayar, y al grabar conviene decirlo con tus palabras.

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
- [ ] **Iniciar sesión antes de grabar** como Paredes (`paredes@gmail.com` / `paredes1234`) y dejar la app en el Catálogo. Si se guarda un archivo de la app mientras tanto, Expo la recarga y hay que volver a iniciar sesión. Expo Go muestra un botón flotante con un engranaje que puede tapar algún botón: tenerlo en cuenta al encuadrar.
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
- [ ] Recontar los números de la conclusión (días, tests) por si cambiaron.

---

## 0. Presentación · ~0:30

**Pantalla:** la app en el Catálogo y, al lado, el árbol de carpetas de VS Code.

**Decir:**
> Hola, soy Tomas. Esto es AI Ticket It, una plataforma de venta de entradas para eventos. El flujo que elegí es la compra: cómo un comprador elige un tipo de entrada y una cantidad sin pasarse del cupo. Ya tengo la sesión iniciada.
>
> El backend es Node con Express, en capas: rutas, controladores, dominio y persistencia en memoria. La app es React Native con Expo. Todo lo desarrollé con Claude Code.

---

## 1. El evento y sus entradas · ~1:15

**App:** buscar "verano" → **Festival de Verano**. En el detalle, las entradas: General con 1000 disponibles, VIP con 100 y **Backstage Agotado**. Abajo, el botón **Comprar · desde $ 90.000**.

**Decir (en la app):**
> Busco el Festival de Verano y entro al detalle. Acá el comprador ya ve los tres tipos de entrada con su precio y cuántas quedan de cada uno: General tiene mil, VIP cien, y el Backstage está agotado.

**Frontend · `eventos/[id].js`:**

**Decir:**
> En la pantalla del evento, el botón de comprar muestra el precio más barato entre los tipos que todavía tienen lugar, y se deshabilita en tres casos: si el evento está agotado, si ya se realizó, o si el que mira es el organizador.

**Backend · `evento.js: detalleEvento` y `tipoEntrada.js: calcularDisponibles`:**

**Decir:**
> Estos números vienen del backend: `detalleEvento` le agrega a cada tipo sus disponibles. Y las disponibles no se guardan: `calcularDisponibles` las calcula cada vez, como el cupo menos las entradas de las compras que ocupan lugar. Así no hay un contador que se desincronice.

---

## 2. Elegir el tipo y la cantidad · ~1:15

**App:** **Comprar · desde $ 90.000**. Mostrar que el Backstage no se puede tocar. Elegir **VIP** y subir a 3 con el "+": "3 × $ 180.000" y el total $ 540.000. **No reservar todavía.**

**Decir (en la app):**
> Toco comprar. Arriba están los pasos: elegir las entradas, reservarlas y pagarlas; este flujo llega hasta la reserva. El Backstage aparece como agotado y no se puede elegir. Elijo VIP y subo la cantidad a tres: la pantalla me muestra el total, quinientos cuarenta mil pesos.

**Frontend · `comprar.js`:**

**Decir:**
> En el código, `conCupo` deja elegir solo los tipos con disponibles. `cantidadValida` hace que la cantidad nunca supere lo que queda, y en el tope, `enElMaximo` deshabilita el más y muestra "Máximo".
>
> El total de acá es solo para mostrar: el que vale lo calcula el backend. La pantalla ayuda a no equivocarse, pero no decide, porque lo que trajo puede quedar viejo mientras elijo. Eso lo muestro en un momento.

---

## 3. Qué pasa al reservar · ~2:00

Seguir el pedido de punta a punta, **antes** de tocar Reservar, abriendo cada archivo a medida que se nombra.

**Decir (`comprar.js: reservar`, `api/compras.js` y `client.js`):**
> Antes de reservar, sigo el pedido de punta a punta. `reservar` llama a `crearCompra`: un POST a `/compras` con el evento, el tipo y la cantidad. El comprador no va en el cuerpo: el cliente HTTP lo agrega en el header `X-User-Id`.

**Decir (`compraRoutes.js`):**
> En el backend, la ruta pasa primero por `requireUsuario`, que lee ese header y responde 401 si falta o si el usuario no existe.

**Decir (`compraController.js: create`):**
> El controlador valida la forma: ids válidos y una cantidad entera de al menos uno; si no, 400. Después llama al dominio y, si sale bien, responde 201 con el header `Location` de la compra nueva.

**Decir (`compra.js: comprar`):**
> Las reglas del negocio están en el dominio, en `comprar`: que el evento y el tipo existan, que el evento no se haya realizado y que el organizador no compre en su propio evento. Y `hayCupoPara`, el método del diagrama de clases: si no alcanza, 409 diciendo cuántas quedan. El total también se calcula acá.

**Decir (`ESTADOS_QUE_OCUPAN_CUPO`):**
> La compra arranca pendiente de pago, pero ya ocupa lugar: si solo ocuparan las pagadas, dos personas podrían reservar la última entrada y la segunda se enteraría al pagar.

**Decir (`compraRepository.js: create` y `schemas.js`):**
> El repositorio la guarda en memoria como un documento, con el historial de estados adentro. El total se guarda porque es lo que se paga, aunque después cambie el precio.

**Decir (`domain.test.js`, opcional, ~15 s):**
> Cada una de estas reglas tiene su test, con el status y el mensaje exactos, y corren con `npm test`.

---

## 4. Dos compradores a la vez · ~1:15

**Swagger:** ejecutar el `POST /compras` preparado (Blanco compra 98 VIP) → **201**.

**Decir:**
> Ahora simulo que otra persona compra mientras yo estoy eligiendo. Desde Swagger, otro comprador se lleva noventa y ocho entradas VIP. Responde 201: la compra se creó, y ahora quedan solo dos.

**App:** sin tocar nada más, **Reservar 3 entradas** → "No hay cupo suficiente: quedan 2 entradas", las VIP pasan a "2 disponibles" y la cantidad baja sola a 2, con "Máximo 2".

**Decir:**
> Vuelvo a la app, que todavía cree que hay cien, y reservo las tres. El backend la rechaza: "No hay cupo suficiente: quedan 2 entradas". Y la pantalla se acomodó sola: las VIP muestran dos disponibles y la cantidad bajó a dos.

**Código · `compra.js`, `errorHandler.js`, `client.js` y `comprar.js: reservar`:**

**Decir:**
> `hayCupoPara` volvió a contar con las compras de ese momento y respondió 409. Todos los errores pasan por este manejador, que responde siempre un objeto con el mensaje en español. El cliente lo lanza tal cual, y `reservar` lo muestra y llama a `recargar`: vuelve a pedir el evento, y `cantidadValida` ajusta la cantidad.

**App:** **Reservar 2 entradas** → "Tus entradas están reservadas": VIP × 2, $ 360.000, **Pendiente de pago**.

**Decir:**
> Reservo las dos que quedan, y listo: las entradas quedan reservadas a mi nombre, pendientes de pago. Acá termina el flujo; el pago es otro paso, que se puede hacer ahora o más tarde desde Mis compras.

---

## 5. Conclusión sobre el uso de IA · ~2:30

**Pantalla:** la cámara. Para el punto 1, mostrar un momento la carpeta `.claude/skills/`.

**Decir (cómo la usé, ~0:25):**
> Para terminar, la reflexión sobre la IA. Usé Claude Code, pero nunca lo dejé trabajar de corrido: primero me explicaba qué iba a hacer y recién con mi ok lo hacía. Ese proceso lo dejé escrito en skills, una por tipo de tarea. Por ejemplo, la de endpoints me presentó el análisis de este POST, con sus errores y reglas, antes de escribir código.

**Decir (ventajas, ~0:30):**
> La ventaja más clara es la velocidad en lo repetitivo: validaciones, documentación, tests. También me sirvió para entender antes de decidir: le preguntaba el porqué y las decisiones las tomaba yo. Y probó cosas que solo no hubiera probado, como la carrera por el cupo que acaban de ver.

**Decir (desventajas, ~0:30):**
> La desventaja es que afirma cosas sin verificarlas: puso que hacía falta Node 20 cuando Expo pedía 22. Y no ve lo que no está en el código: armó pruebas de búsqueda con textos que no aparecen en la pantalla, y dio por buena una prueba que había corrido con código viejo. Hay que revisar todo lo que hace.

**Decir (dificultades, ~0:20):**
> Lo más difícil fue el entorno: conectar el emulador con el backend, y saber qué estaba probando, porque a veces la app seguía conectada a un servidor viejo. Y algunas correcciones las repetí hasta dejarlas escritas como regla en una skill.

**Decir (no todo conviene hacerlo con la IA, ~0:20):**
> También aprendí que no todo conviene hacérselo hacer. Las pruebas en el celular me convino hacerlas yo: manejando el emulador se traba, no tiene mi criterio y gasta muchos tokens, que al final son tiempo y plata.

**Decir (aprendizajes, ~0:20):**
> Me llevo tres cosas: pedirle el plan antes de que ejecute, que lo que le corrijo dos veces quede escrito, y hacerla verificar todo contra el enunciado y contra el código.

**Decir (valoración, ~0:25):**
> En lo personal, fui mucho más productivo: en siete días de trabajo llegué a una API documentada con 98 tests y una app con todos los casos de uso. Pero la calidad salió de la combinación: la IA propone y yo reviso. La IA no reemplaza el criterio: lo vuelve más importante, porque produce rápido tanto lo bueno como lo que hay que corregir. Gracias.

---

## Si sobra o falta tiempo

- **Para acortar (a ~7:30):** en el paso 1 mostrar solo la app, y en el paso 3 saltear los tests y el repositorio. La conclusión no se recorta.
- **Para alargar:** en el paso 3, mostrar en Swagger un pedido con `cantidad: 0` → **400** "El campo cantidad tiene que ser como mínimo 1".
  > **Decir:** este error lo frena el controlador, porque es un problema de forma del pedido. El de cupo, en cambio, lo frena el dominio, porque es una regla del negocio.
