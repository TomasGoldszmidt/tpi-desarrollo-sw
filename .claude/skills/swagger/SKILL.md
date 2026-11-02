---
name: swagger
description: Documenta en el swagger (backend/src/docs/openapi.yaml, servido en /api-docs) un endpoint del backend de AI Ticket It que se creó, modificó o eliminó. Usar SIEMPRE que cambie un endpoint, o con "/swagger <MÉTODO /ruta>" o "/swagger" a secas para sincronizar todo.
---

# Swagger

El swagger es la referencia de la API para el front y para el video. Tiene que coincidir **exactamente** con el código: si el código cambia, el swagger cambia en el mismo commit.

- Especificación: `backend/src/docs/openapi.yaml` (OpenAPI 3.0.3).
- UI: `http://localhost:3000/api-docs`, servida con `swagger-ui-express` desde `src/app.js`.
- Nodemon reinicia el servidor cuando cambia un `.yaml`.

Esta skill **no frena para pedir aprobación**: documenta lo que ya existe en el código, sin tomar decisiones. Al terminar muestra qué cambió.

## Paso 1 · Identificar qué documentar

- Con argumento (`/swagger POST /compras`): ese endpoint.
- Sin argumento: comparar todas las rutas registradas en `backend/src` con los `paths` del YAML, y listar los endpoints que faltan, los que sobran y los que difieren.
- Leer el código real del endpoint (ruta, controlador, validaciones, respuestas). **Documentar lo que el código hace, no lo que debería hacer.** Si se ve un bug, avisarlo aparte; no se corrige desde esta skill.

## Paso 2 · Escribir en `openapi.yaml`

Por cada endpoint:

- **`tags`**: uno por recurso (`Usuarios`, `Categorias`, `Eventos`, `Compras`, `Resenias`). Si el tag no existe, agregarlo a la lista `tags` de arriba con su descripción.
- **`summary`** en español, corto, en infinitivo ("Crear una compra"), y **`operationId`** igual al nombre del controlador, con la regla de nombres del proyecto (`createCompra`, `payCompra`, `listEventos`).
- **`description`** solo si hay reglas de negocio que conviene saber (ej: "solo se puede cancelar si la compra no está UTILIZADA y el evento no se realizó").
- **`parameters`**: path y query, con tipo, si es obligatorio y un ejemplo.
- **Usuario activo:** si la ruta usa `requireUsuario`, agregar `security: [{ usuarioActivo: [] }]` y la respuesta 401. El esquema `usuarioActivo` (apiKey en el header `X-User-Id`) va en `components/securitySchemes`; si no existe, crearlo. Así Swagger UI muestra el botón **Authorize** para cargar el usuario una vez.
- **`requestBody`**: schema con los `required` reales y un `example` que funcione contra el seed.
- **`responses`**: la respuesta exitosa y **todos los errores** que el código puede devolver (400, 404, 409, …), cada uno con `$ref: '#/components/schemas/Error'` y una descripción del caso.

Schemas:
- Los objetos que se repiten van en `components/schemas` con nombre de entidad (`Usuario`, `Evento`, `Compra`) y se referencian con `$ref`.
- Si una respuesta agrega campos calculados (ej: `disponibles`, `diasRestantes`), documentarlos en el schema de esa respuesta.
- Los ids son **numéricos** (`type: integer`).

Orden: los `paths` agrupados por recurso, en el mismo orden que los tags.

## Paso 3 · Verificar

1. Que el YAML se pueda leer: `node --input-type=module -e "import YAML from 'yaml'; import {readFileSync} from 'node:fs'; YAML.parse(readFileSync('src/docs/openapi.yaml','utf8')); console.log('ok')"` (ejecutado desde `backend/`, donde está instalado `yaml`).
2. Con el backend levantado, que `/api-docs/` responda 200 y que el endpoint aparezca: `curl -s http://localhost:3000/api-docs/swagger-ui-init.js | grep '<ruta>'`.
3. Si el endpoint se puede probar, ejecutar el `example` del swagger con `curl` y confirmar que la respuesta coincide con lo documentado.

## Paso 4 · Reportar

Mostrar una tabla con lo documentado:

| Método | Ruta | Cambio | Respuestas |
|---|---|---|---|
| POST | /compras | agregado | 201, 400, 404, 409 |

Sugerir que el swagger se commitee junto con el endpoint.
