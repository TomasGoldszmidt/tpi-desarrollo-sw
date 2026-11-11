# Guion del video

**Flujo elegido:** el ciclo de la compra, comprar → pagar → usar → reseñar (casos de uso 12, 1 y 9, con el 2 del lado del organizador).

**Duración objetivo:** ~9 minutos (el enunciado pide entre 5 y 10).

**Formato:** el código se muestra **a la par del flujo**. En cada paso se hace la acción en la app y enseguida se abre el código que la resuelve: primero la pantalla (frontend) y después el endpoint y el dominio (backend). Lo de "decir" son ideas para contar con tus palabras, no un texto para leer.

---

## Antes de grabar

- [ ] **Pantalla partida:** el emulador a un costado y VS Code ocupando el resto. Subir el tamaño de letra del editor (`Ctrl` + `+`) para que se lea en el video, y cerrar las barras laterales que no se usan.
- [ ] Reiniciar el backend (`npm run dev` en `backend/`), así el seed arranca limpio.
- [ ] Abrir la app en el emulador, en la pantalla "¿Quién usa la app?".
- [ ] Abrir Swagger en el navegador (<http://localhost:3000/api-docs>) para el final del paso 2.
- [ ] Dejar abiertas estas pestañas en VS Code, en el orden en que aparecen:

  | # | Archivo | Qué se muestra |
  |---|---|---|
  | 1 | `mobile/src/app/eventos/[id]/comprar.js` | `cantidadValida`, el "+" deshabilitado y el "Agotado" |
  | 2 | `mobile/src/api/client.js` | el header `X-User-Id` |
  | 3 | `backend/src/routes/compraRoutes.js` | las rutas de compras |
  | 4 | `backend/src/controllers/compraController.js` | `create` y `changeEstado` |
  | 5 | `backend/src/domain/compra.js` | `comprar`, `TRANSICIONES` y `actualizarEstado` |
  | 6 | `backend/src/domain/tipoEntrada.js` | `calcularDisponibles` y `hayCupoPara` |
  | 7 | `mobile/src/app/compras/[id].js` | las acciones según el estado y `ejecutar` |
  | 8 | `backend/src/persistence/schemas.js` | el `@typedef` de `Compra` |
  | 9 | `backend/src/domain/resenia.js` | `crearResenia` |

  Para saltar a una función: `Ctrl` + `Shift` + `O` y escribir su nombre.
- [ ] Ensayar el recorrido una vez y **volver a reiniciar el backend** antes de grabar: lo que se compra en el ensayo queda en memoria.

---

## 0. Presentación y arquitectura · ~1:00

**Pantalla:** la app en "Iniciá sesión" y, al lado, el árbol de carpetas de VS Code.

**Decir:**
- Qué es AI Ticket It: venta de entradas, con compradores y organizadores. Se entra con email y contraseña, o se crea una cuenta.
- Backend en Node + Express 5, en capas: `routes` → `controllers` → `domain` → `persistence/repositories`. Los repositorios solo guardan y consultan; las reglas de negocio están en el dominio. Persistencia en memoria, orientada a documentos.
- App en React Native con Expo y Expo Router: cada archivo de `src/app/` es una pantalla.
- Todo se desarrolló con Claude Code. El flujo es el ciclo de una compra: la sigo en la app y voy mostrando el código de cada paso.

---

## 1. Comprar (caso 12) · ~2:00

**App:** iniciar sesión como **Sofía** (`sofia@aiticketit.com` / `sofia1234`) → Catálogo → **Festival de Verano** → comprar.
- Mostrar el **Backstage Agotado**, que no se puede elegir.
- Elegir **General** y subir a 2 con el "+": el total pasa a $ 180.000.

**Frontend · `comprar.js`:**
- `cantidadValida` nunca supera las disponibles del tipo elegido, y el "+" se deshabilita al llegar al tope.
- Un tipo sin disponibles se muestra "Agotado" y queda deshabilitado.
- **Decir:** las disponibles las calcula el backend; la pantalla solo las respeta.

**App:** **Confirmar compra** → **Ver mi compra**: queda **Pendiente de pago**.

**Frontend · `client.js`:** el cliente HTTP manda el usuario activo en el header `X-User-Id`. Si el backend responde con error, la pantalla muestra su mensaje tal cual.

**Backend:**
- `compraRoutes.js`: `POST /compras` para comprar. Las acciones sobre una compra son subrecursos: `/pago`, `/utilizacion`, `/cancelacion`.
- `compraController.create`: valida la forma del pedido (ids, cantidad ≥ 1), llama al dominio y responde **201** con el header `Location`.
- `compra.js: comprar`: el evento existe y no se realizó, el organizador no puede comprar en su propio evento, y `hayCupoPara`.
- `tipoEntrada.js`: `hayCupoPara` es el método del diagrama de clases. `calcularDisponibles` no se guarda, se calcula con las compras que ocupan cupo.
- **Decir:** una compra **pendiente ya ocupa cupo**, para que dos personas no compren la última entrada y la segunda se entere recién al pagar. Las canceladas y reembolsadas liberan el lugar.

---

## 2. Pagar (caso 1) · ~1:45

**App:** en el detalle, **Pagar $ 180.000**. Pasa a **Confirmada** y el historial suma el cambio, con quién y cuándo.

**Frontend · `compras/[id].js`:**
- Los botones dependen del estado y del rol: con la compra pendiente, el comprador ve Pagar y Cancelar.
- `ejecutar` muestra la carga encima, llama al backend y después **vuelve a pedir la compra**, en lugar de cambiar el estado a mano.

**Backend:**
- `compraController`: pagar es una línea, `changeEstado(() => CONFIRMADA)`. Marcar como utilizada y cancelar usan la misma función.
- `compra.js: TRANSICIONES`: cada cambio de estado es una fila con desde, hacia, quién puede y con qué condición. PENDIENTE → CONFIRMADA lo hace el comprador antes del evento.
- `actualizarEstado` (el método del diagrama): valida la transición (409), quién la pide (403) y la fecha (409), y graba el estado junto con el historial.
- `schemas.js: Compra`: la compra lleva embebidos el historial y el chat, y guarda `total`, porque es lo que se pagó aunque después cambie el precio.

**App:** ir a **Mis compras**. Los estados se distinguen por color y la confirmada muestra cuántos días faltan (~60).

**Swagger (opcional, ~20 s):** con **Authorize**, cargar `3` (Sofía). Hacer `POST /compras/{id}/pago` sobre la compra recién pagada → **409** "No se puede pasar de CONFIRMADA a CONFIRMADA". **Decir:** es la tabla de transiciones rechazando un paso que no existe, y todos los errores responden `{ "error": "mensaje" }`.

---

## 3. Usar (organizador, casos 2 y 9) · ~1:15

**App:** avatar → **Cerrar sesión** → entrar como **Martín** (`martin@aiticketit.com` / `martin1234`) → Mis eventos → **Noche de Stand-up** (ya realizado).
- Las ventas: el estado de cada compra y las entradas disponibles por tipo.
- Entrar a la compra de **Juan** (Confirmada) → **Marcar como utilizada** → confirmar. Queda **Utilizada**.

**Decir:** una compra nueva no se puede marcar como utilizada hasta el día del evento, por eso uso una compra del seed de un evento que ya pasó.

**Código:**
- `compras/[id].js`: el mismo detalle de compra, pero como organizador aparece "Marcar como utilizada" en lugar de Pagar.
- `compra.js: TRANSICIONES`: la fila CONFIRMADA → UTILIZADA, que solo hace el organizador y desde el día del evento. Volver a la tabla del paso anterior muestra que es la misma regla para todo.

---

## 4. Reseñar (casos 9 y 10) · ~1:15

**App:** avatar → **Cerrar sesión** → entrar como **Juan** (`juan@aiticketit.com` / `juan1234`) → Mis compras → **Noche de Stand-up** → 5 estrellas y un comentario → **Publicar reseña**. Queda como "Tu reseña".

**Código:**
- `compras/[id].js`: el formulario de reseña aparece solo cuando la compra está Utilizada.
- `resenia.js: crearResenia`: busca una compra UTILIZADA del comprador para ese evento y rechaza una segunda reseña.

**App:** Catálogo → **Amistoso** (también es de Martín): el organizador ahora tiene puntaje y la reseña aparece en "Reseñas de sus eventos".

---

## 5. Skills y cómo ayudaron · ~1:30

**Pantalla:** la carpeta `.claude/skills/` y una skill abierta (por ejemplo `nueva-pantalla/SKILL.md`).

**Decir:** creé una skill por tipo de tarea. Las que deciden algo primero analizan y frenan hasta que yo apruebo.

| Skill | Ejemplo concreto de este flujo |
|---|---|
| `/persistencia` | Para Compra propuso el historial y el chat embebidos y guardar `total`. Fue una sola decisión que resolvió cuatro entidades del diagrama |
| `/nuevo-endpoint` | Analizó pagar y utilizar como subrecursos (`/pago`, `/utilizacion`) en lugar de un `PATCH` con el estado, y planteó que el organizador no pueda comprar en su evento |
| `/swagger` | Cada endpoint que se creaba o cambiaba quedaba documentado en el mismo commit |
| `/nueva-pantalla` | El boceto de la compra se corrigió antes de escribir código. Le marqué dos veces que mostraba cosas técnicas ("409") dentro del celular, y la regla quedó escrita en la skill |
| `/probar-caso-de-uso` | Probó la carrera por el cupo: Sofía eligiendo 3 VIP en el emulador mientras Juan compraba 98 por la API |
| `/registrar-ia` | Cada subtarea quedó anotada en `docs/registro-ia.md`, con lo que salió bien y lo que hubo que corregir. De ahí sale la conclusión |

**Decir:** la ventaja de las skills es que una corrección queda escrita y se aplica en las tareas que siguen, en lugar de repetirla en cada conversación.

---

## 6. Conclusión sobre el uso de IA · ~1:30

**Pantalla:** `docs/conclusion-ia.md`.

El enunciado pide ventajas, desventajas, dificultades, aprendizajes y una valoración personal sobre productividad y calidad. Se arma en la subtarea siguiente, "Redactar conclusión sobre el uso de IA", a partir del registro.

---

## Si sobra o falta tiempo

- **Para acortar (a ~6 min):** sacar Swagger (paso 2), y en el paso 3 mostrar solo la app, porque la fila de la tabla ya se vio.
- **Para alargar:** cancelar la compra de Bernarda (queda Cancelada) y la de Noche de Rock (queda Reembolsada), y mostrar que `estadoAlCancelar` elige entre las dos filas de la misma tabla.
