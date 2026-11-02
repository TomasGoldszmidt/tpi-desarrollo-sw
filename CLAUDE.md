# AI Ticket It

TP individual de DDS (UTN FRBA, 2C 2026): plataforma de venta de entradas para eventos, desarrollada con IA como herramienta principal. El enunciado está en el PDF de la raíz (no versionado) y transcripto en `.claude/skills/persistencia/referencia-dominio.md`. Las tareas están en `TAREAS.md`.

## Forma de trabajo

- Dividir cada tarea de `TAREAS.md` en subtareas. Antes de cada una, explicar qué se va a hacer y **esperar el ok** del usuario. Responder una duda no equivale a dar el ok.
- Hay una skill por cada tipo de tarea. Las que deciden algo (ej: `/persistencia`) entregan un análisis y frenan hasta la aprobación.
- Al terminar cada subtarea: marcar la casilla en `TAREAS.md`, registrar en `docs/registro-ia.md` y commitear.

## Skills

| Skill | Cuándo usarla |
|---|---|
| `/persistencia <Entidad>` | Para persistir una entidad: analiza, frena hasta el ok e implementa |
| `/nuevo-endpoint <MÉTODO /ruta>` | Para crear o modificar un endpoint: analiza, frena hasta el ok, implementa, documenta y prueba |
| `/swagger` | **Cada vez que se crea, modifica o elimina un endpoint**, en el mismo commit |
| `/probar-caso-de-uso` | Después de implementar un endpoint o una pantalla |
| `/registrar-ia` | Al cerrar cada subtarea |

## Convenciones

- **Backend:** Node + Express 5, con **ES Modules** (`import`/`export`, con `.js` en los imports relativos).
- **Nombres:** lo técnico en inglés (carpetas como `persistence/`, `domain/`, `routes/`, `controllers/`; archivos, clases y métodos como `Collection`, `findById`, `create`) y lo del dominio en español (entidades, campos y estados: `Compra`, `fechaHora`, `EstadoCompra.PENDIENTE`). Se combinan así: `compraRepository.findByComprador`.
- **Persistencia en memoria, orientada a documentos:**
  - `backend/src/persistence/collection.js` guarda los documentos en un `Map`, con ids numéricos incrementales, y devuelve copias.
  - La estructura de cada documento está en `backend/src/persistence/schemas.js`, con un `@typedef` de JSDoc por entidad.
  - Un repositorio por colección en `repositories/<entidad>Repository.js`, tipado con esos esquemas.
  - Los datos de ejemplo están en `seed.js`.
  - Las decisiones de cada entidad están en `docs/persistencia.md`.
  - Los repositorios solo guardan y consultan; las reglas de negocio van en el dominio.
- **API:** capas `routes/` → `controllers/` → `domain/` → `persistence/repositories/`, con errores y validaciones en `http/` (detalle en la skill `nuevo-endpoint`). El usuario activo viaja en el header `X-User-Id` y los errores responden `{ "error": "mensaje" }`. Documentada en `backend/src/docs/openapi.yaml` y servida en `/api-docs`.
- **Mobile:** Expo SDK 58 con la plantilla en blanco, en JavaScript. Seguir `mobile/AGENTS.md`: instalar paquetes con `npx expo install` y consultar la documentación de la versión instalada. La URL del backend se arma en `mobile/src/config.js`.
- No agregar dependencias sin avisar.

## Cómo levantar

1. Backend, en `backend/`: `npm run dev`. Queda escuchando en `0.0.0.0:3000`, con Swagger en `http://localhost:3000/api-docs`.
2. Abrir el emulador Android (AVD `Pixel_8`) desde Android Studio.
3. App, en `mobile/`, con PowerShell:
   ```
   $env:ANDROID_HOME = 'C:\Users\pc\AppData\Local\Android\Sdk'; $env:REACT_NATIVE_PACKAGER_HOSTNAME = '192.168.1.10'; npx expo start --android
   ```
   `192.168.1.10` es la IP de la PC en la LAN. Si cambia, verificarla con `ipconfig`.
