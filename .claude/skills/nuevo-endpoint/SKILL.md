---
name: nuevo-endpoint
description: Analiza e implementa UN endpoint (o un grupo chico del mismo recurso) del backend de AI Ticket It - ruta, controlador, validaciones, reglas de dominio y errores -, presenta el análisis para aprobación y recién con el ok escribe el código, lo documenta con /swagger y lo prueba con /probar-caso-de-uso. Usar con "/nuevo-endpoint <MÉTODO /ruta>" o "/nuevo-endpoint siguiente", o cuando el usuario pida crear o modificar un endpoint.
---

# Nuevo endpoint

Cada endpoint pasa por las mismas capas y responde con el mismo formato, para que la API sea predecible para la app mobile. Se trabaja **un endpoint, o un grupo chico del mismo recurso, por invocación**, con aprobación del usuario antes de escribir código.

Archivos de apoyo:
- [referencia-dominio.md](../persistencia/referencia-dominio.md): diagrama de clases y casos de uso del enunciado. Leerlo siempre.
- `docs/persistencia.md` y `backend/src/persistence/schemas.js`: la forma de los documentos y las consultas que ya existen.
- `TAREAS.md`, sección 2: qué endpoints faltan.

## Paso 0 · Elegir el endpoint

- Si el usuario nombró uno, usar ese. Con "siguiente", tomar el primer ítem sin marcar de la sección 2 de `TAREAS.md` y proponer qué endpoints lo forman.
- Leer el código de `backend/src/` (rutas, controladores, services, dominio, repositorios) para reusar lo que exista y no duplicar.
- Si al endpoint le falta una consulta del repositorio o una regla de dominio, eso entra en el análisis: no se agrega en silencio.

## Paso 1 · Analizar

Definir, justificando contra los casos de uso:

1. **Método y URL (RESTful).** Recursos del dominio en español y en plural (`/eventos`, `/compras/:id/mensajes`); nada de filtros escondidos en la ruta (`/eventos/organizados` no: es `/usuarios/:id/eventos`). Lo que pertenece a otro recurso va anidado bajo él. Una acción que no es CRUD es un sustantivo bajo el recurso: `POST /compras/:id/pago`, `POST /compras/:id/cancelacion`.
2. **Usuario activo.** ¿Necesita saber quién hace el pedido? Si sí, usa `requireUsuario` y toma comprador u organizador de `req.usuario`, **nunca del body**. Catálogo, detalle de evento y categorías son públicos.
3. **Entrada.** Parámetros de path, query y body, con tipo, si son obligatorios y su rango.
4. **Validaciones del controlador** (forma del dato), **función del service** que orquesta el caso de uso y **reglas del dominio** (cupo, estados, permisos). Para cada regla: qué función de `domain/` la resuelve, si ya existe o hay que crearla.
5. **Respuesta exitosa**, con un ejemplo JSON real del seed, incluidos los campos calculados (`disponibles`, `diasRestantes`, …).
6. **Errores posibles**, cada uno con su status y el caso concreto que lo dispara.

## Paso 2 · Entregar el análisis y FRENAR

Presentar el análisis con este formato y **no escribir código hasta que el usuario dé el ok**:

```markdown
## Endpoint: <MÉTODO /ruta>
**Caso de uso:** número y texto del caso de referencia-dominio.md
**Usuario activo:** requerido (rol) | público
**Entrada:** tabla (dónde · campo · tipo · obligatorio · validación)
**Service:** función de services/ que orquesta (existe o nueva)
**Reglas de dominio:** lista (regla · función de domain/ · existe o nueva)
**Respuesta:** status + ```json ... ```
**Errores:** tabla (status · clase · cuándo)
**Archivos a crear o modificar:** lista
**Dudas / alternativas:** lo que el usuario debería decidir
```

Si el usuario corrige algo, ajustar el análisis y volver a presentarlo hasta que lo apruebe.

## Paso 3 · Implementar (solo con ok)

Convenciones de `backend/src/` (lo técnico en inglés, lo del dominio en español):

- `routes/<entidad>Routes.js`: un `express.Router()` que solo mapea método + URL al controlador. Cada URL se declara con `router.route('/x').get(...).post(...).all(methodNotAllowed)`, así un método no soportado responde 405 con el header `Allow`. `requireUsuario` va **en cada ruta** que lo necesite, nunca con `router.use` (si no, una URL inexistente da 401 en vez de 404). Se monta en `app.js` con `app.use('/<recurso>', <entidad>Routes)`, antes del `errorHandler`.
- `controllers/<entidad>Controller.js`: funciones `async (req, res)` con verbo en inglés (`create`, `getById`, `list`, `pay`, `cancel`).
  - Valida la forma del dato con los helpers de `http/validation.js` (`requireId`, `requireInteger`, `requireString`, …), que lanzan `ValidationError`.
  - Solo HTTP: valida, llama a **un** service y responde. No importa repositorios ni funciones del dominio (solo constantes para validar, como `ORDENES`).
  - Responde con `res.status(...).json(...)`. **Sin `try/catch`**: Express 5 lleva los errores async al `errorHandler`.
- `services/<entidad>Service.js`: un caso de uso por función, con nombres en español (`comprar`, `verCompra`, `ventasDe`). Orquesta: busca en los repositorios (y lanza `NotFoundError` si no existe lo pedido), le pasa los documentos al dominio, guarda lo que el dominio devuelve y arma la respuesta (detalles, paginación con `paginar`). Las búsquedas que se repiten entre services (`buscarUsuario`, `buscarEvento`, `usuariosPorId`) se reusan importándolas del service de su entidad.
- `domain/`: las reglas de negocio y los campos calculados, **puras**: reciben documentos y devuelven el resultado o los datos a guardar, sin importar repositorios. Lanzan `ValidationError`, `ForbiddenError` o `BusinessRuleError`; no conocen `req` ni `res`.
- `http/errors.js`: `AppError` con `status`, y sus subclases:

| Clase | Status | Caso |
|---|---|---|
| `ValidationError` | 400 | Dato faltante o inválido |
| `UnauthorizedError` | 401 | Falta el usuario activo o no existe |
| `ForbiddenError` | 403 | El usuario no tiene permiso sobre ese recurso |
| `NotFoundError` | 404 | No existe el recurso |
| `BusinessRuleError` | 409 | Se viola una regla de negocio |

- `http/middlewares/`: `requireUsuario` (lee el header `X-User-Id`, deja el documento en `req.usuario` o lanza 401) y `errorHandler` (responde `{ "error": "mensaje" }` con el status del error; 404 para rutas inexistentes, 405 con `Allow` para métodos no soportados, 400/413 para errores del body y 500 genérico para lo no previsto, registrándolo en consola).

Respuestas:

| Caso | Status | Cuerpo |
|---|---|---|
| Crear | 201 | El documento creado, con el header `Location` si tiene URL propia (`res.location('/compras/10')`) |
| Consultar o acción (pagar, cancelar) | 200 | El documento actualizado |
| Quitar algo | 204 | Vacío |
| Listado que puede crecer (catálogo, compras, reseñas, notificaciones…) | 200 | Una página: `{ resultados, pagina, limite, total, hayMas }`, con `parsePagina` y `paginar` de `http/pagination.js` (`?pagina=1&limite=10`, límite máximo 50). Los campos propios del listado (ej: `noLeidas`) van como `extra` de `paginar` |
| Listado acotado (categorías, favoritos) | 200 | El array directo, sin envoltorio |

Reglas:

- ES Modules, con `.js` en los imports relativos.
- Mensajes de error en español: la app los muestra al usuario.
- Los campos calculados no se guardan: se calculan en el dominio al responder.
- No agregar dependencias.

## Paso 4 · Documentar, probar y cerrar

1. Ejecutar `/swagger <MÉTODO /ruta>` y commitear el swagger junto con el endpoint.
2. Ejecutar `/probar-caso-de-uso` contra el seed: el caso feliz y **cada error** de la tabla del análisis. Mostrar la salida.
3. Marcar la casilla en `TAREAS.md` si el ítem quedó completo.
4. Proponer el commit y sugerir `/registrar-ia`, sobre todo si el usuario corrigió el análisis.
