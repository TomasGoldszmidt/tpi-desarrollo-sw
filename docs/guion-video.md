# Guion del video

**Flujo elegido:** el ciclo de la compra, comprar → pagar → usar → reseñar (casos de uso 12, 1 y 9, con el 2 del lado del organizador).

**Duración objetivo:** ~8:45 (el enunciado pide entre 5 y 10). Los tiempos de cada parte suman eso; si un ensayo pasa de 9:30, aplicar "Para acortar" del final.

**Formato:** el código se muestra **a la par del flujo**. En cada paso se hace la acción en la app y enseguida se abre el código que la resuelve: primero la pantalla (frontend) y después el endpoint y el dominio (backend). Lo de "decir" son ideas para contar con tus palabras, no un texto para leer.

| Parte | Qué cubre de la consigna | Tiempo |
|---|---|---|
| 0. Presentación | Contexto y arquitectura | 0:45 |
| 1. Reservar | Interfaz, front-end y back-end | 2:00 |
| 2. Pagar | Interfaz, front-end y back-end | 1:30 |
| 3. Usar | Interfaz y back-end (organizador) | 1:00 |
| 4. Reseñar | Interfaz, front-end y back-end | 1:00 |
| 5. Skills | Cómo se trabajó con la IA | 1:00 |
| 6. Conclusión | Ventajas, desventajas, dificultades, aprendizajes y valoración | 1:30 |

---

## Antes de grabar

- [ ] **Pantalla partida:** el emulador a un costado y VS Code ocupando el resto. Subir el tamaño de letra del editor (`Ctrl` + `+`) para que se lea en el video, y cerrar las barras laterales que no se usan.
- [ ] Reiniciar el backend (`npm run dev` en `backend/`), así el seed arranca limpio.
- [ ] Abrir la app en el emulador, en la pantalla "Iniciá sesión". Expo Go muestra un botón flotante con un engranaje (sus herramientas) que puede tapar algún botón de la app: tenerlo en cuenta al encuadrar.
- [ ] Dejar abiertas estas pestañas en VS Code, en el orden en que aparecen:

  | # | Archivo | Qué se muestra |
  |---|---|---|
  | 1 | `mobile/src/app/eventos/[id]/comprar.js` | `cantidadValida`, el "+" deshabilitado, el "Agotado" y `reservar` |
  | 2 | `mobile/src/api/client.js` | el header `X-User-Id` y el error del backend |
  | 3 | `backend/src/routes/compraRoutes.js` | las rutas de compras |
  | 4 | `backend/src/controllers/compraController.js` | `create` y `changeEstado` |
  | 5 | `backend/src/domain/compra.js` | `comprar`, `TRANSICIONES` y `actualizarEstado` |
  | 6 | `backend/src/domain/tipoEntrada.js` | `calcularDisponibles` y `hayCupoPara` |
  | 7 | `backend/src/persistence/schemas.js` | el `@typedef` de `Compra` |
  | 8 | `mobile/src/app/compras/[id].js` | las acciones según el estado y el rol, y `ejecutar` |
  | 9 | `backend/src/domain/resenia.js` | `crearResenia` |

  Para saltar a una función: `Ctrl` + `Shift` + `O` y escribir su nombre.
- [ ] Ensayar el recorrido una vez y **volver a reiniciar el backend** antes de grabar: lo que se compra en el ensayo queda en memoria.

---

## 0. Presentación y arquitectura · ~0:45

**Pantalla:** la app en "Iniciá sesión" y, al lado, el árbol de carpetas de VS Code.

**Decir:**
- Qué es AI Ticket It: venta de entradas, con compradores y organizadores. Se entra con email y contraseña, o se crea una cuenta.
- Backend en Node + Express 5, en capas: `routes` → `controllers` → `domain` → `persistence/repositories`. Los repositorios solo guardan y consultan; las reglas de negocio están en el dominio. Persistencia en memoria, orientada a documentos.
- App en React Native con Expo y Expo Router: cada archivo de `src/app/` es una pantalla.
- Todo se desarrolló con Claude Code. El flujo es el ciclo de una compra: la sigo en la app y voy mostrando el código de cada paso.

---

## 1. Reservar (caso 12) · ~2:00

**App:** iniciar sesión como **Paredes** (`paredes@gmail.com` / `paredes1234`) → Catálogo → buscar "verano" (el festival no aparece en la primera pantalla) → **Festival de Verano** → **Comprar · desde $ 90.000**.
- Mostrar el **Backstage Agotado**, que no se puede elegir.
- Elegir **General** y subir a 2 con el "+": el total pasa a $ 180.000.

**Frontend · `comprar.js`:**
- `cantidadValida` nunca supera las disponibles del tipo elegido, y el "+" se deshabilita al llegar al tope.
- Un tipo sin disponibles se muestra "Agotado" y queda deshabilitado.
- `reservar` llama a `crearCompra`; si el backend rechaza por cupo, muestra su mensaje y vuelve a pedir las disponibles.
- **Decir:** las disponibles las calcula el backend; la pantalla solo las respeta.

**App:** **Reservar 2 entradas** → "Tus entradas están reservadas", con la compra **Pendiente de pago**.

**Frontend · `client.js`:** el cliente HTTP manda el usuario activo en el header `X-User-Id`. Si el backend responde con error, la pantalla muestra su mensaje tal cual.

**Backend:**
- `compraRoutes.js`: `POST /compras` para comprar. Las acciones sobre una compra son subrecursos: `/pago`, `/utilizacion`, `/cancelacion`.
- `compraController.create`: valida la forma del pedido (ids, cantidad ≥ 1), llama al dominio y responde **201** con el header `Location`.
- `compra.js: comprar`: el evento existe y no se realizó, el organizador no puede comprar en su propio evento, y `hayCupoPara`.
- `tipoEntrada.js`: `hayCupoPara` es el método del diagrama de clases. `calcularDisponibles` no se guarda, se calcula con las compras que ocupan cupo.
- **Decir:** una compra **pendiente ya ocupa cupo** (por eso la pantalla dice "reservadas"), para que dos personas no compren la última entrada y la segunda se entere recién al pagar. Las canceladas y reembolsadas liberan el lugar.

---

## 2. Pagar (caso 1) · ~1:30

**App:** **Pagar ahora $ 180.000**. Se abre el detalle de la compra: **Confirmada**, con los días que faltan (60), y el historial con "Reservada" y "Pagada", los dos por vos.

**Frontend · `compras/[id].js`:**
- Los botones dependen del estado y del rol: ahora que está confirmada, el comprador ve "Cancelar y pedir reembolso"; si estuviera pendiente vería Pagar y Cancelar, y el organizador ve "Marcar como utilizada".
- `ejecutar` muestra la carga encima, llama al backend y después **vuelve a pedir la compra**, en lugar de cambiar el estado a mano.

**Backend:**
- `compraController`: pagar es una línea, `changeEstado(() => CONFIRMADA)`. Marcar como utilizada y cancelar usan la misma función.
- `compra.js: TRANSICIONES`: cada cambio de estado es una fila con desde, hacia, quién puede y con qué condición. PENDIENTE → CONFIRMADA lo hace el comprador antes del evento.
- `actualizarEstado` (el método del diagrama): valida la transición (409), quién la pide (403) y la fecha (409), y graba el estado junto con el historial.
- `schemas.js: Compra`: la compra lleva embebidos el historial y el chat, y guarda `total`, porque es lo que se pagó aunque después cambie el precio.

**App:** atrás → pestaña **Mis compras**. Los estados se distinguen por color e ícono, con un chip por estado y su cantidad; las pendientes van primero. Tocar el chip **Confirmadas** para ver el Festival con "Faltan 60 días".

---

## 3. Usar (organizador, casos 2 y 9) · ~1:00

**App:** avatar → **Cerrar sesión** → entrar como **Dilollo** (`dilollo@gmail.com` / `dilollo1234`) → Mis eventos → chip **Realizados** → **Noche de Stand-up**.
- Las ventas: lo recaudado, las entradas disponibles por tipo (118 de 120) y el estado de cada compra, con chips para filtrar.
- Entrar a la compra de **Blanco** (Confirmada) → **Marcar como utilizada** → **Marcar**. Queda **Utilizada**.

**Decir:** una compra nueva no se puede marcar como utilizada hasta el día del evento, por eso uso una compra del seed de un evento que ya pasó.

**Código:** `compra.js: TRANSICIONES`, la fila CONFIRMADA → UTILIZADA: solo la hace el organizador y desde el día del evento. Es la misma tabla del paso anterior; en la pantalla es el mismo detalle de compra, con otro botón por el rol.

---

## 4. Reseñar (casos 9 y 10) · ~1:00

**App:** avatar → **Cerrar sesión** → entrar como **Blanco** (`blanco@gmail.com` / `blanco1234`) → Mis compras → chip **Utilizadas** → **Noche de Stand-up** → 5 estrellas y un comentario → **Publicar reseña**. Queda como "Tu reseña".

**Código:**
- `compras/[id].js`: el formulario de reseña aparece solo cuando la compra está Utilizada.
- `resenia.js: crearResenia`: busca una compra UTILIZADA del comprador para ese evento y rechaza una segunda reseña.

**App:** Catálogo → buscar "amistoso" → **Amistoso** (también es de Dilollo): el organizador pasó de "Sin reseñas" a "★ 5 · 1 reseña", y el comentario aparece en su tarjeta.

---

## 5. Skills y cómo ayudaron · ~1:00

**Pantalla:** la carpeta `.claude/skills/` y una skill abierta (por ejemplo `nuevo-endpoint/SKILL.md`, en el "Paso 2 · Entregar el análisis y FRENAR").

**Decir:** creé una skill por tipo de tarea. Las que deciden algo primero analizan y frenan hasta que yo apruebo. Elegir dos o tres ejemplos de la tabla, no todos:

| Skill | Ejemplo concreto de este flujo |
|---|---|
| `/persistencia` | Para Compra propuso el historial y el chat embebidos y guardar `total`. Fue una sola decisión que resolvió cuatro entidades del diagrama |
| `/nuevo-endpoint` | Analizó pagar y utilizar como subrecursos (`/pago`, `/utilizacion`) en lugar de un `PATCH` con el estado, y planteó que el organizador no pueda comprar en su evento |
| `/nueva-pantalla` | El boceto de la compra se corrigió antes de escribir código. Le marqué dos veces que mostraba cosas técnicas ("409") dentro del celular, y la regla quedó escrita en la skill |
| `/probar-caso-de-uso` | Probó la carrera por el cupo: Paredes eligiendo 3 VIP en el emulador mientras Blanco compraba 98 por la API |
| `/swagger` y `/registrar-ia` | Cada endpoint quedó documentado en el mismo commit, y cada subtarea anotada en `docs/registro-ia.md`, de donde sale la conclusión |

**Decir:** la ventaja de las skills es que una corrección queda escrita y se aplica en las tareas que siguen, en lugar de repetirla en cada conversación.

---

## 6. Conclusión sobre el uso de IA · ~1:30

**Pantalla:** `docs/conclusion-ia.md`, o la cámara.

Decir con tus palabras los seis puntos de "Para decir en el video" del final de `docs/conclusion-ia.md`: cómo la usé, ventajas, desventajas, dificultades, qué no conviene hacer con la IA y la valoración sobre productividad y calidad.

---

## Si sobra o falta tiempo

- **Para acortar (a ~7 min):** en el paso 3 mostrar solo la app, porque la tabla de transiciones ya se vio, y en el paso 5 quedarse con un solo ejemplo.
- **Para alargar:**
  - **Swagger (~20 s), al final del paso 2:** abrir <http://localhost:3000/api-docs>, **Authorize** con `3` (Paredes) y hacer `POST /compras/{id}/pago` sobre la compra recién pagada → **409** "No se puede pasar de CONFIRMADA a CONFIRMADA". **Decir:** es la tabla de transiciones rechazando un paso que no existe, y todos los errores responden `{ "error": "mensaje" }`.
  - Cancelar la compra de Bernarda (queda Cancelada) y la de Noche de Rock (queda Reembolsada), y mostrar que `estadoAlCancelar` elige entre las dos filas de la misma tabla.
