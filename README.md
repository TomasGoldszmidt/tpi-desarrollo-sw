# AI Ticket It

Plataforma de venta de entradas para eventos: los compradores buscan eventos, compran, pagan, cancelan, chatean con el organizador y dejan reseñas; los organizadores crean eventos, ven sus ventas, responden el chat y marcan las entradas como utilizadas.

Trabajo práctico individual de Diseño de Sistemas (UTN FRBA, 2C 2026), desarrollado usando IA (Claude Code) como herramienta principal.

## Estructura

| Carpeta | Qué tiene |
|---|---|
| `backend/` | API REST en Node + Express 5 (ES Modules), con persistencia en memoria |
| `mobile/` | App en React Native con Expo SDK 58 y Expo Router (JavaScript) |
| `docs/` | Decisiones de persistencia y registro de uso de IA |
| `.claude/skills/` | Las skills de Claude Code creadas para el TP (ver [Desarrollo con IA](#desarrollo-con-ia)) |

## Requisitos

- **Node.js** 22.13 o superior, o 24.3 o superior: lo pide Expo SDK 58. Se desarrolló con Node 24.
- Para la app, una de estas dos opciones:
  - **Emulador Android**: Android Studio con un dispositivo virtual (se usó un Pixel 8) y la app **Expo Go**, que Expo instala sola la primera vez.
  - **Celular físico** con **Expo Go** instalado desde la tienda, conectado a la **misma red Wi-Fi** que la PC.

## Cómo levantarlo

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Queda escuchando en `http://0.0.0.0:3000` (todas las interfaces, para que lo alcance el celular) y carga los datos de ejemplo. Se reinicia solo al cambiar el código.

- Documentación de la API (Swagger): <http://localhost:3000/api-docs>
- Si el puerto está ocupado (por ejemplo, quedó otro backend abierto), avisa y termina: hay que cerrar el otro.

### 2. App

```bash
cd mobile
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` evita que npm instale las dependencias opcionales de Expo Router que la app no usa (la versión web con `react-dom`, animaciones y gestos), que además chocan en versiones. Así queda igual que la instalación con la que se probó.

La app se conecta al backend usando la misma IP con la que Expo sirve la app (ver `mobile/src/config.js`), así que **no hay que configurar la URL del backend**. Lo único es que Expo anuncie la IP de la PC en la red local:

1. Averiguar la IP de la PC en la LAN (en Windows, `ipconfig` → "Dirección IPv4", por ejemplo `192.168.1.10`).
2. Levantar Expo con esa IP. En PowerShell:

   ```powershell
   $env:REACT_NATIVE_PACKAGER_HOSTNAME = '192.168.1.10'; npx expo start
   ```

   En bash: `REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.10 npx expo start`.

3. Abrir la app:
   - **Emulador Android:** con el emulador abierto, apretar `a` en la terminal de Expo (o usar `npx expo start --android` en el paso 2). Si Expo no encuentra el SDK de Android, definir antes `$env:ANDROID_HOME = 'C:\Users\<usuario>\AppData\Local\Android\Sdk'`.
   - **Celular:** escanear el QR que muestra la terminal con Expo Go (Android) o con la cámara (iOS).

Si la app no llega al backend, revisar que el firewall de Windows permita conexiones entrantes a Node en los puertos 3000 y 8081 en redes privadas. Si hiciera falta, `EXPO_PUBLIC_API_URL=http://<ip>:3000` fuerza otra URL.

## Usuarios y datos de ejemplo

Al abrir la app se inicia sesión con email y contraseña, o se crea una cuenta. Cualquier usuario puede comprar y organizar, y editar su perfil desde el chip con sus iniciales. Después de entrar, la API recibe el usuario activo en el header `X-User-Id`.

| Usuario | Email | Contraseña | Para probar |
|---|---|---|---|
| **Tomas Goldszmidt** | `tomas@gmail.com` | `tomas1234` | Organizador de Noche de Rock, Bernarda Alba, Festival de Verano y el Acústico (pasado, con reseñas: 4.5 de promedio). Tiene ventas en varios estados y el Backstage del Festival agotado. Arranca con 4 notificaciones nuevas y dos preguntas de Blanco sin responder (Noche de Rock y Festival), para probar los mensajes de cada evento |
| **Lautaro Dilollo** | `dilollo@gmail.com` | `dilollo1234` | Organizador del Amistoso y del Stand-up (pasado, sin reseñas). Puede marcar como utilizada la compra de Blanco para el Stand-up. Arranca con 2 notificaciones nuevas |
| **Leandro Paredes** | `paredes@gmail.com` | `paredes1234` | Comprador con una compra de cada tipo: pendiente de pago, confirmada (con chat), utilizada con reseña y utilizada sin reseña. Tiene tres favoritos: el Amistoso, el Festival de Verano y el Acústico (pasado). Arranca con 1 notificación nueva |
| **Lautaro Blanco** | `blanco@gmail.com` | `blanco1234` | Comprador con compras confirmada, reembolsada, cancelada y utilizada |

Las fechas del seed son relativas al momento en que arranca el backend, así que siempre hay eventos próximos y pasados. **Como la persistencia es en memoria, al reiniciar el backend todo vuelve a estos datos.**

Los mensajes de cada evento se ven lado a lado (lista y chat) en pantallas anchas: en el emulador, girarlo a horizontal.

## Tests

```bash
cd backend
npm test
```

Pruebas de dominio y validaciones con `node --test`, sin dependencias (cupo, transiciones de estado, cancelación y reembolso, búsqueda y orden, reseñas, chat).

En la app: `npm run lint` dentro de `mobile/`.

## Arquitectura

- **Backend:** `routes/` → `controllers/` → `domain/` → `persistence/repositories/`. Los controladores validan la entrada (`http/validation.js`); las reglas de negocio están en `domain/` (por ejemplo `hayCupoPara`, `tuPrecioEstaEntre` y las transiciones de estado con historial); los repositorios solo guardan y consultan. Los errores responden `{ "error": "mensaje" }` con su status: 400 si un dato es inválido, 401 sin usuario activo, 403 si no tiene permiso, 404 si no existe, 405 si el método no corresponde y 409 si una regla de negocio no lo permite.
- **Persistencia:** en memoria y orientada a documentos (`persistence/collection.js`, un `Map` por colección). El historial de estados y el chat van embebidos en cada compra. Las decisiones por entidad están en [`docs/persistencia.md`](docs/persistencia.md).
- **App:** pantallas en `mobile/src/app/` (Expo Router, con pestañas Catálogo, Mis compras y Mis eventos), cliente HTTP en `src/api/`, usuario activo en `src/context/UsuarioContext.js` y componentes compartidos en `src/components/`.

## Desarrollo con IA

El proyecto se hizo con Claude Code, dividiendo cada tarea de [`TAREAS.md`](TAREAS.md) en subtareas que se aprobaban antes de implementarse. Para cada tipo de tarea se creó una skill en `.claude/skills/`:

| Skill | Qué hace |
|---|---|
| `/persistencia` | Analiza cómo persistir una entidad, frena hasta el ok e implementa |
| `/nuevo-endpoint` | Analiza un endpoint (ruta, validaciones, reglas, errores), frena hasta el ok, implementa y prueba |
| `/swagger` | Documenta en `openapi.yaml` cada endpoint que cambia |
| `/nueva-pantalla` | Arma un boceto de la pantalla con datos del seed, frena hasta que se aprueba e implementa |
| `/probar-caso-de-uso` | Prueba un caso de uso contra la API y en el emulador |
| `/registrar-ia` | Anota en el registro qué se hizo, qué salió bien y qué hubo que corregir |

- [`docs/registro-ia.md`](docs/registro-ia.md): bitácora de cada subtarea (pedidos, resultados, correcciones y aprendizajes).
