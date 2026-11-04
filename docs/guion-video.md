# Guion del video

**Flujo elegido:** el ciclo de la compra, comprar → pagar → usar → reseñar (casos de uso 12, 1 y 9, con el 2 del lado del organizador).

**Duración objetivo:** ~9 minutos (el enunciado pide entre 5 y 10). Cada bloque tiene qué se ve en pantalla y qué decir. Lo de "decir" son ideas para contar con tus palabras, no un texto para leer.

---

## Antes de grabar

- [ ] Reiniciar el backend (`npm run dev` en `backend/`), así el seed arranca limpio.
- [ ] Abrir el emulador y la app con Expo, en la pantalla "¿Quién usa la app?".
- [ ] Abrir Swagger en el navegador: <http://localhost:3000/api-docs>.
- [ ] Dejar abiertos en el editor, en este orden:
  1. `backend/src/routes/compraRoutes.js`
  2. `backend/src/controllers/compraController.js`
  3. `backend/src/domain/compra.js` (`comprar` y la tabla `TRANSICIONES`)
  4. `backend/src/domain/tipoEntrada.js` (`hayCupoPara`)
  5. `backend/src/domain/resenia.js` (`crearResenia`)
  6. `backend/src/persistence/schemas.js` (el `@typedef` de `Compra`)
  7. `mobile/src/app/eventos/[id]/comprar.js`
  8. `mobile/src/app/compras/[id].js`
  9. `mobile/src/api/client.js`
  10. `.claude/skills/` y `docs/registro-ia.md`
- [ ] Ensayar el recorrido una vez y **volver a reiniciar el backend** antes de grabar: lo que se compra en el ensayo queda en memoria.

---

## 1. Presentación · ~0:30

**Pantalla:** la app en "¿Quién usa la app?".

**Decir:**
- Qué es AI Ticket It: venta de entradas, con compradores y organizadores.
- Stack: backend en Node + Express 5 con persistencia en memoria, y app en React Native con Expo.
- Todo se desarrolló con Claude Code. El flujo que voy a mostrar es el ciclo de una compra, desde que se compra hasta que se reseña.

---

## 2. Recorrido en la app · ~2:30

### 2.1 Comprar (caso 12)
**Pantalla:** elegir a **Sofía** → Catálogo → **Festival de Verano** → comprar.

- Mostrar que **Backstage** figura **Agotado** y no se puede elegir.
- Elegir **General**, subir a 2 con el "+" y mostrar que el total se actualiza ($ 180.000).
- **Confirmar compra** → **Ver mi compra**: queda **Pendiente de pago**.

**Decir:** el cupo se valida en el backend; una compra pendiente ya reserva lugar, para que dos personas no compren la última entrada.

### 2.2 Pagar (caso 1)
**Pantalla:** en el detalle, **Pagar $ 180.000**.

- Pasa a **Confirmada** y el historial suma el cambio, con quién lo hizo y cuándo.
- Ir a **Mis compras**: los estados se distinguen por color y la confirmada muestra cuántos días faltan (~60).

### 2.3 Usar (lado del organizador, caso 2)
**Pantalla:** avatar → **Martín** → Mis eventos → **Noche de Stand-up** (ya realizado).

- Mostrar las ventas: estado de cada compra y entradas disponibles por tipo.
- Entrar a la compra de **Juan** (Confirmada) → **Marcar como utilizada** → confirmar. Queda **Utilizada**.

**Decir:** una compra nueva no se puede marcar como utilizada hasta el día del evento, por eso uso una compra del seed de un evento que ya pasó. Es una de las reglas de la tabla de transiciones que muestro después.

### 2.4 Reseñar (caso 9)
**Pantalla:** avatar → **Juan** → Mis compras → **Noche de Stand-up** → 5 estrellas y un comentario → **Publicar reseña**.

- Queda como "Tu reseña".
- Catálogo → **Amistoso** (también es de Martín): el organizador ahora tiene puntaje y la reseña aparece en "Reseñas de sus eventos" (caso 10).

**Decir:** solo puede reseñar quien tiene la compra Utilizada, y una sola vez por evento.

---

## 3. Backend · ~2:30

### 3.1 Capas y rutas
**Pantalla:** `compraRoutes.js`.

**Decir:**
- Capas: `routes` → `controllers` → `domain` → `persistence/repositories`. Los repositorios solo guardan y consultan, y las reglas están en el dominio.
- Rutas REST: `POST /compras` para comprar, y cada acción es un subrecurso: `/pago`, `/utilizacion`, `/cancelacion`. Todas piden el usuario activo en el header `X-User-Id`.

### 3.2 Comprar y el cupo
**Pantalla:** `compraController.create` → `compra.js: comprar` → `tipoEntrada.js: hayCupoPara`.

**Decir:**
- El controlador valida la forma del pedido (ids, cantidad ≥ 1) y llama al dominio.
- `comprar` valida las reglas: el evento existe, no ya se realizó, el organizador no compra en su propio evento, y `hayCupoPara`, que es el método del diagrama de clases.
- `calcularDisponibles` no se guarda: se calcula con las compras que ocupan cupo (pendiente, confirmada o utilizada). Las canceladas y reembolsadas liberan el lugar.
- Responde **201** con el header `Location`.

### 3.3 La tabla de transiciones
**Pantalla:** `compra.js: TRANSICIONES` y `actualizarEstado`.

**Decir:**
- Cada cambio de estado es una fila: desde, hacia, quién puede y con qué condición. PENDIENTE → CONFIRMADA (el comprador, antes del evento), CONFIRMADA → UTILIZADA (el organizador, desde el día del evento), y las dos cancelaciones.
- `actualizarEstado` es el `actualizarEstado` del diagrama: valida la transición (409), quién la pide (403) y la fecha (409), y graba el estado junto con el historial.
- Pagar y marcar como utilizada son una línea cada uno en el controlador, porque reusan esta función.

### 3.4 Persistencia y reseña
**Pantalla:** `schemas.js` (Compra) y `resenia.js: crearResenia`.

**Decir:**
- En memoria y orientada a documentos: la compra lleva embebidos el historial de estados y el chat, y guarda `total` porque es lo que se pagó aunque después cambie el precio.
- `crearResenia` busca una compra UTILIZADA del comprador para ese evento, y rechaza una segunda reseña.

### 3.5 Errores, en Swagger
**Pantalla:** Swagger. Con el botón **Authorize**, cargar `3` (Sofía) como usuario activo.

- `POST /compras` con el Backstage del Festival (`eventoId` 3, `tipoEntradaId` 3, `cantidad` 1) → **409** "No hay cupo suficiente: quedan 0 entradas".
- `POST /compras/{id}/pago` sobre la compra que ya pagaste en la app → **409** "No se puede pasar de CONFIRMADA a CONFIRMADA".

**Decir:** todos los errores responden `{ "error": "mensaje" }` en español, y la app los muestra tal cual.

---

## 4. Frontend · ~1:30

**Pantalla:** `comprar.js` → `compras/[id].js` → `api/client.js`.

**Decir:**
- Expo Router: cada archivo de `src/app/` es una pantalla. El usuario activo está en un contexto y el cliente HTTP lo manda en `X-User-Id`.
- En `comprar.js` la cantidad nunca supera las disponibles: el "+" se frena y, si mientras tanto otro compró, baja sola. Si el backend rechaza por cupo, se muestra su mensaje y se vuelve a pedir el evento.
- En `compras/[id].js` los botones dependen del estado y del rol: Pagar o Cancelar para el comprador, Marcar como utilizada para el organizador, y el formulario de reseña cuando la compra está utilizada. Después de cada acción se vuelve a pedir la compra al backend en lugar de cambiar el estado a mano.
- Toda pantalla tiene sus estados de carga, error con Reintentar y vacío.

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

- **Para acortar (a ~6 min):** sacar Swagger (3.5) y mostrar solo `comprar` y `TRANSICIONES` del backend.
- **Para alargar:** mostrar la cancelación de la compra de Bernarda (Cancelada) y la de Noche de Rock (Reembolsada), que usan la misma tabla de transiciones.
