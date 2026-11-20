# Guion del video

**Flujo elegido:** comprar una entrada, desde que el comprador inicia sesión hasta que la paga: iniciar sesión → buscar el evento → elegir la entrada y reservar → pagar (casos de uso 3, 12 y 1).

**Duración objetivo:** ~8:45 (el enunciado pide entre 5 y 10). Si un ensayo pasa de 9:30, aplicar "Para acortar" del final.

**Formato:** el código se muestra **a la par del flujo**. En cada paso se hace la acción en la app y enseguida se abre el código que la resuelve: primero la pantalla (frontend) y después el endpoint y el dominio (backend). Lo de "decir" son ideas para contar con tus palabras, no un texto para leer.

| Parte | Qué cubre de la consigna | Tiempo |
|---|---|---|
| 0. Presentación | Contexto y arquitectura | 0:30 |
| 1. Iniciar sesión | Interfaz, front-end y back-end | 1:15 |
| 2. Buscar el evento | Interfaz, front-end y back-end | 1:00 |
| 3. Elegir la entrada y reservar | Interfaz, front-end y back-end | 2:00 |
| 4. Pagar | Interfaz, front-end y back-end | 1:30 |
| 5. La compra en Mis compras | Interfaz | 0:30 |
| 6. Skills | Cómo se trabajó con la IA | 0:45 |
| 7. Conclusión | Ventajas, desventajas, dificultades, aprendizajes y valoración | 1:15 |

---

## Antes de grabar

- [ ] **Pantalla partida:** el emulador a un costado y VS Code ocupando el resto. Subir el tamaño de letra del editor (`Ctrl` + `+`) para que se lea en el video, y cerrar las barras laterales que no se usan.
- [ ] Reiniciar el backend (`npm run dev` en `backend/`), así el seed arranca limpio.
- [ ] Abrir la app en el emulador, en la pantalla "Iniciá sesión". Expo Go muestra un botón flotante con un engranaje (sus herramientas) que puede tapar algún botón de la app: tenerlo en cuenta al encuadrar.
- [ ] Dejar abiertas estas pestañas en VS Code, en el orden en que aparecen:

  | # | Archivo | Qué se muestra |
  |---|---|---|
  | 1 | `mobile/src/app/index.js` | `ingresar`: valida los campos, llama al backend y guarda la cuenta |
  | 2 | `mobile/src/context/UsuarioContext.js` y `mobile/src/api/client.js` | el usuario activo y el header `X-User-Id` |
  | 3 | `backend/src/controllers/sesionController.js` y `backend/src/domain/cuenta.js` | `POST /sesiones`, `iniciarSesion` y `verificarContrasenia` |
  | 4 | `backend/src/domain/evento.js` | `buscarEventos` y `COMPARADORES` |
  | 5 | `mobile/src/app/eventos/[id]/comprar.js` | `cantidadValida`, el "Agotado", `reservar` y `Reserva.pagar` |
  | 6 | `backend/src/controllers/compraController.js` | `create` y `changeEstado` |
  | 7 | `backend/src/domain/compra.js` | `comprar`, `TRANSICIONES` y `actualizarEstado` |
  | 8 | `backend/src/domain/tipoEntrada.js` | `calcularDisponibles` y `hayCupoPara` |

  Para saltar a una función: `Ctrl` + `Shift` + `O` y escribir su nombre.
- [ ] Ensayar el recorrido una vez y **volver a reiniciar el backend** antes de grabar: lo que se compra en el ensayo queda en memoria.

---

## 0. Presentación y arquitectura · ~0:30

**Pantalla:** la app en "Iniciá sesión" y, al lado, el árbol de carpetas de VS Code.

**Decir:**
- AI Ticket It: venta de entradas, con compradores y organizadores. Voy a mostrar cómo un comprador compra una entrada, desde que inicia sesión hasta que la paga.
- Backend en Node + Express 5, en capas: `routes` → `controllers` → `domain` → `persistence/repositories`. Las reglas de negocio están en el dominio y la persistencia es en memoria.
- App en React Native con Expo y Expo Router: cada archivo de `src/app/` es una pantalla. Todo se desarrolló con Claude Code.

---

## 1. Iniciar sesión · ~1:15

**App:** escribir `paredes@gmail.com` con una contraseña equivocada → **Ingresar**: aparece "El email o la contraseña no son correctos.". Corregirla a `paredes1234` → **Ingresar**: entra al catálogo.

**Frontend · `index.js`:**
- `ingresar` primero valida los campos en la pantalla (vacíos o email mal escrito) sin llamar al backend.
- Si están bien, llama a `iniciarSesion` (`POST /sesiones`) y guarda la cuenta con `UsuarioContext`. Con la sesión iniciada, la pantalla redirige sola al catálogo.
- `client.js`: desde ahí, cada pedido manda el id del usuario en el header `X-User-Id`. Si el backend responde con error, la pantalla muestra su mensaje tal cual.

**Backend:**
- `sesionController.create`: valida la forma del email y la contraseña y llama al dominio.
- `cuenta.js: iniciarSesion`: la contraseña nunca se guarda, se guarda un hash con sal (`scrypt`, que viene con Node). `verificarContrasenia` lo recalcula y compara con `timingSafeEqual`.
- **Decir:** el mensaje de error es el mismo si el email no existe o si la contraseña está mal, para no revelar qué emails tienen cuenta. No hay token: para el TP, la app identifica al usuario con el header, y es una decisión que tomé a propósito.

---

## 2. Buscar el evento (caso 3) · ~1:00

**App:** en el catálogo, mostrar las categorías en una fila que se desliza. Escribir "verano" en el buscador → aparece **Festival de Verano**, con el puntaje del organizador y el precio desde $ 90.000.

**Código:**
- `catalogo.js`: el texto, la categoría y el orden viajan como parámetros de `GET /eventos`, de a páginas.
- `evento.js: buscarEventos`: filtra por texto (sin importar tildes ni mayúsculas) y categoría, saca los eventos que ya se realizaron y ordena con `COMPARADORES` (fecha, precio o puntaje del organizador, el caso 11).

---

## 3. Elegir la entrada y reservar (caso 12) · ~2:00

**App:** **Festival de Verano** → **Comprar · desde $ 90.000**.
- Arriba, los tres pasos: Entradas, Reservar y Pagar.
- Mostrar el **Backstage Agotado**, que no se puede elegir.
- Elegir **General** y subir a 2 con el "+": el total pasa a $ 180.000.

**Frontend · `comprar.js`:**
- `cantidadValida` nunca supera las disponibles del tipo elegido, y el "+" se deshabilita al llegar al tope.
- Un tipo sin disponibles se muestra "Agotado" y queda deshabilitado.
- **Decir:** las disponibles las calcula el backend; la pantalla solo las respeta.

**App:** **Reservar 2 entradas** → "Tus entradas están reservadas", con la compra **Pendiente de pago**.

**Frontend · `comprar.js: reservar`:** llama a `crearCompra` (`POST /compras`). Si el backend la rechaza por cupo (alguien compró antes), muestra su mensaje y vuelve a pedir las disponibles.

**Backend:**
- `compraController.create`: valida la forma del pedido (ids, cantidad ≥ 1), llama al dominio y responde **201** con el header `Location`.
- `compra.js: comprar`: el evento existe y no se realizó, el organizador no puede comprar en su propio evento, y `hayCupoPara`. El total lo calcula el backend con el precio actual.
- `tipoEntrada.js`: `hayCupoPara` es el método del diagrama de clases. `calcularDisponibles` no se guarda, se calcula con las compras que ocupan cupo.
- **Decir:** una compra **pendiente ya ocupa cupo** (por eso la pantalla dice "reservadas"), para que dos personas no compren la última entrada y la segunda se entere recién al pagar. Las canceladas y reembolsadas liberan el lugar.

---

## 4. Pagar · ~1:30

**App:** **Pagar ahora $ 180.000**. Se abre el detalle de la compra: **Confirmada**, con "Faltan 60 días", y el historial con "Reservada" y "Pagada", los dos por vos.

**Frontend · `comprar.js: Reserva.pagar`:** llama a `pagarCompra` (`POST /compras/:id/pago`) y abre el detalle de la compra, que la vuelve a pedir al backend en lugar de cambiar el estado a mano. Con "Pagar más tarde" queda pendiente y se paga después desde Mis compras.

**Backend:**
- `compraController`: pagar es una línea, `changeEstado(() => CONFIRMADA)`. Cancelar y marcar como utilizada usan la misma función.
- `compra.js: TRANSICIONES`: cada cambio de estado es una fila con desde, hacia, quién puede y con qué condición. PENDIENTE → CONFIRMADA lo hace el comprador antes del evento.
- `actualizarEstado` (el método del diagrama): valida la transición (409), quién la pide (403) y la fecha (409), y graba el estado junto con el historial.
- **Decir:** las reglas de la consigna (por ejemplo, que no se pueda cancelar una compra utilizada) quedan escritas como filas de esta tabla, en lugar de varios `if`.

---

## 5. La compra en Mis compras (caso 1) · ~0:30

**App:** atrás → pestaña **Mis compras**. Los estados se distinguen por color e ícono, con un chip por estado y su cantidad. Tocar el chip **Confirmadas**: aparece el Festival con "Faltan 60 días".

**Decir:** los días que faltan los calcula el backend (`diasRestantes`) y solo se muestran en las compras confirmadas, como pide el caso de uso.

---

## 6. Skills y cómo ayudaron · ~0:45

**Pantalla:** la carpeta `.claude/skills/` y una skill abierta (por ejemplo `nuevo-endpoint/SKILL.md`, en el "Paso 2 · Entregar el análisis y FRENAR").

**Decir:** creé una skill por tipo de tarea; las que deciden algo primero analizan y frenan hasta que yo apruebo. Elegir dos ejemplos de este flujo:

| Skill | Ejemplo concreto de este flujo |
|---|---|
| `/nuevo-endpoint` | Analizó pagar como subrecurso (`POST /compras/:id/pago`) en lugar de un `PATCH` con el estado, y planteó que el organizador no pueda comprar en su evento |
| `/nueva-pantalla` | El boceto de la compra se corrigió antes de escribir código. Le marqué dos veces que mostraba cosas técnicas ("409") dentro del celular, y la regla quedó escrita en la skill |
| `/probar-caso-de-uso` | Probó la carrera por el cupo: un comprador eligiendo 3 VIP en el emulador mientras otro compraba 98 por la API |
| `/persistencia` | Para Compra propuso el historial embebido y guardar `total`, que es lo que se paga aunque después cambie el precio |

**Decir:** la ventaja de las skills es que una corrección queda escrita y se aplica en las tareas que siguen, en lugar de repetirla en cada conversación.

---

## 7. Conclusión sobre el uso de IA · ~1:15

**Pantalla:** `docs/conclusion-ia.md`, o la cámara.

Decir con tus palabras los seis puntos de "Para decir en el video" del final de `docs/conclusion-ia.md`: cómo la usé, ventajas, desventajas, dificultades, qué no conviene hacer con la IA y la valoración sobre productividad y calidad.

---

## Si sobra o falta tiempo

- **Para acortar (a ~7 min):** en el paso 2 mostrar solo la app, sin código, y en el paso 6 quedarse con un solo ejemplo.
- **Para alargar:**
  - **Swagger (~20 s), al final del paso 4:** abrir <http://localhost:3000/api-docs>, **Authorize** con `3` (Paredes) y hacer `POST /compras/{id}/pago` sobre la compra recién pagada → **409** "No se puede pasar de CONFIRMADA a CONFIRMADA". **Decir:** es la tabla de transiciones rechazando un paso que no existe, y todos los errores responden `{ "error": "mensaje" }`.
  - En el paso 3, mostrar en `client.js` cómo el mensaje de error del backend llega tal cual a la pantalla.
