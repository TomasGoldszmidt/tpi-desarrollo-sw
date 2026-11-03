# Persistencia

Persistencia **en memoria, orientada a documentos**. Cada entidad se analiza y se implementa por separado con la skill `/persistencia`. El orden de la tabla sigue las dependencias: primero las entidades que otras referencian.

## Estado

| # | Entidad | Estado | Decisión |
|---|---|---|---|
| 1 | Usuario | implementada | Colección propia `usuarios` |
| 2 | Categoria | implementada | Colección propia `categorias` (solo lectura, la carga el seed) |
| 3 | Evento | implementada | Colección propia `eventos` |
| 4 | TipoEntrada | implementada | Embebida en `Evento.tiposEntrada` (se decidió con Evento) |
| 5 | Compra | implementada | Colección propia `compras` |
| 6 | EstadoCompra | no se persiste | Constante en código (`domain/estadoCompra.js`), se decidió con Compra |
| 7 | CambioEstadoCompra | implementada | Embebida en `Compra.historial` (se decidió con Compra) |
| 8 | Mensaje | implementada | Embebida en `Compra.mensajes` (se decidió con Compra) |
| 9 | Resenia | implementada | Colección propia `resenias` |

Estados posibles: `pendiente` · `analizada` (esperando ok) · `implementada` · `no se persiste`.

## Base común

`backend/src/persistence/collection.js`, clase `Collection`:
- Guarda los documentos en un `Map` y genera ids numéricos incrementales por colección.
- Métodos: `insert`, `findById`, `findAll(filter?)`, `update` y `delete`.
- Devuelve copias con `structuredClone`, así nadie modifica el estado por fuera del repositorio.
- Ignora el `id` que venga en los datos: no se puede elegir ni pisar.

`backend/src/persistence/schemas.js` tiene la estructura de todos los documentos, con un `@typedef` de JSDoc por entidad. Es la referencia en el código; este archivo explica el porqué de cada decisión.

`backend/src/persistence/seed.js` carga los datos de ejemplo al iniciar el servidor desde `src/index.js`.

## Decisiones

### Usuario · colección `usuarios`

**Por qué colección propia:** tiene identidad y lo referencian Evento (organizador), Compra (comprador), Mensaje, CambioEstadoCompra y Resenia. Si se embebiera, habría copias duplicadas que se pueden desincronizar.

**Documento:**
```json
{ "id": 1, "nombre": "Lucía", "apellido": "Fernández", "favoritos": [3, 7] }
```

| Relación | Decisión | Motivo |
|---|---|---|
| favoritos → Evento[] | Referencia (array de ids) | El evento cambia (cupo, datos); una copia quedaría vieja |
| organizador de eventos | Se guarda en Evento (`organizadorId`) | Evita mantener la relación en los dos lados |
| reputación del organizador | Se calcula, no se persiste | Es el promedio de sus reseñas; guardarla aparte podría desincronizarse |

**Repositorio** (`backend/src/persistence/repositories/usuarioRepository.js`):
- `create`
- `findById`
- `findAll`, para la selección de usuario activo
- `addFavorito` y `removeFavorito`, que no generan duplicados

**Decisiones aprobadas:**
- Sin campo `rol`: un usuario es organizador si tiene eventos creados.
- Sin login: en la app se elige el usuario activo de una lista.
- Los favoritos se guardan aunque ningún caso de uso los pida. Las pantallas de favoritos quedan para el final si sobra tiempo.
- Ids numéricos incrementales.
- **Se descartó Mongoose:** necesita un servidor MongoDB y el enunciado pide persistencia en memoria. `mongodb-memory-server` lo habría hecho posible, pero una colección propia con `Map` alcanza y no suma dependencias.

**Seed:** Lucía Fernández y Martín Gómez como organizadores; Sofía Pérez y Juan Rodríguez como compradores.

**Ids:** se evaluó cambiar a UUID y se mantuvieron numéricos.
- El choque de ids entre colecciones (el usuario 1 y el evento 1) solo pasaría por un bug de programación: cada repositorio busca en su propia colección y las referencias se validan antes de usarse.
- Que un UUID no se pueda adivinar no aporta nada sin login.
- Los ids numéricos son más legibles para probar y para mostrar en el video.

### Categoria · colección `categorias`

**Por qué colección propia:**
- La necesitan los filtros del catálogo (caso de uso 3) y el selector al crear un evento (caso de uso 4).
- Todos los eventos la referencian; si se embebiera, el nombre y la descripción se repetirían en cada uno.
- Se descartó dejarla como constante en código: en el diagrama es una clase con atributos, no un enum, y con un repositorio queda igual que las demás entidades.

**Documento:**
```json
{ "id": 1, "nombre": "Música", "descripcion": "Recitales, conciertos y shows en vivo" }
```

| Relación | Decisión | Motivo |
|---|---|---|
| Evento → Categoria | Referencia (`categoriaId` en el evento) | Compartida por muchos eventos; filtrar es comparar ids |

**Repositorio** (`backend/src/persistence/repositories/categoriaRepository.js`):
- `findAll`, para los filtros del catálogo y el selector
- `findById`, para validar el `categoriaId` al crear un evento
- `create`, que solo usa el seed

**Decisiones aprobadas:**
- Solo lectura para la API: ningún caso de uso pide crear, editar ni borrar categorías.
- No se valida que el nombre sea único, porque solo crea categorías el seed.
- El ícono, si se quiere, lo elige el front según el nombre; no se persiste.

**Seed:** Música, Teatro, Deportes, Festivales y Conferencias, sacadas del contexto del enunciado. Al cargar los eventos, una categoría va a quedar sin eventos para probar la búsqueda sin resultados.

### Evento · colección `eventos`

**Por qué colección propia:**
- Tiene identidad y ciclo de vida propios: lo crea un organizador (caso de uso 4).
- Se consulta solo en la búsqueda y el catálogo (casos de uso 3 y 11).
- Lo referencian Usuario (`favoritos`), Compra y Resenia.

**Documento:**
```js
{
  id: 1,
  nombre: "Noche de Rock Nacional",
  descripcion: "Las bandas clásicas del rock argentino en un solo escenario",
  lugar: "Estadio Obras, Av. del Libertador 7395, CABA",
  categoriaId: 1,
  organizadorId: 1,
  fecha: new Date("2026-11-23T00:00:00.000Z"),
  multimedia: ["https://picsum.photos/seed/rock/800/400"],
  tiposEntrada: [
    { id: 1, nombre: "Campo", descripcion: "De pie, frente al escenario", precio: 45000, cupo: 500 },
    { id: 2, nombre: "Platea", descripcion: "Asiento numerado", precio: 80000, cupo: 200 }
  ]
}
```

| Relación | Decisión | Motivo |
|---|---|---|
| categoria → Categoria | Referencia (`categoriaId`) | Compartida por muchos eventos |
| organizador → Usuario | Referencia (`organizadorId`) | Decidido en Usuario: la relación se guarda de este lado |
| tiposEntrada → TipoEntrada[] | Embebe, con id local 1..n | Se definen al crear el evento, no existen sin él, siempre se leen con él y son pocos. Compra lo referencia con `eventoId` + `tipoEntradaId` |
| multimedia → String[] | Embebe (URLs) | Valores simples sin identidad |
| entradas disponibles por tipo | Se calcula | `cupo` menos las compras activas de ese tipo; guardarlo aparte se podría desincronizar |
| precio para ordenar | Se calcula | Mínimo de `tiposEntrada[].precio` |
| puntaje del organizador | Se calcula | Decidido en Usuario: promedio de sus reseñas |

**Repositorio** (`backend/src/persistence/repositories/eventoRepository.js`):
- `create`, que asigna los ids locales de los tipos de entrada y convierte la fecha a `Date`
- `findById` y `findAll`
- `search({ texto, categoriaId })`, ambos opcionales. El texto se busca en el nombre, la descripción y el lugar, sin distinguir mayúsculas ni tildes
- `findByOrganizador`, para las ventas del organizador y sus reseñas
- `findByIds`, para resolver los favoritos

**Decisiones aprobadas:**
- `fecha` es un `Date`: `structuredClone` lo copia y `res.json` lo devuelve como string ISO.
- Se agrega `lugar` (texto libre), que no está en el diagrama: el enunciado menciona consultas sobre "el acceso al lugar". La "ubicación" de los tipos de entrada ya queda en su `nombre`.
- TipoEntrada no tiene colección propia: ningún caso de uso la consulta por separado.
- No se guarda un contador de vendidas: calcularlo en memoria es barato y no se desincroniza.
- El orden (precio, fecha, puntaje), las validaciones de referencias y si se ocultan los eventos pasados van en el dominio.
- No hay `update` ni `delete`: ningún caso de uso los pide.

**Seed:** 6 eventos con fechas relativas al arranque.
- Lucía: rock (+20 días), teatro (+5), festival (+60, con un tipo Backstage de cupo 2 para agotar con el seed de Compra) y acústico (−15 días, pasado).
- Martín: partido (+10) y stand-up (−30 días, pasado).
- Conferencias queda sin eventos.

### Compra · colección `compras`

**Por qué colección propia:**
- Tiene identidad y ciclo de vida propios: se crea, se paga, se usa y se cancela.
- Se consulta sola desde dos lados: las compras del comprador (caso de uso 1) y las de un evento (caso de uso 2).
- Las entradas disponibles de cada tipo se calculan a partir de las compras (casos de uso 2 y 12).

**Documento:**
```js
{
  id: 1,
  compradorId: 3,
  eventoId: 1,
  tipoEntradaId: 1,
  cantidad: 2,
  total: 90000,
  estado: "CONFIRMADA",
  historial: [
    { estado: "PENDIENTE",  usuarioId: 3, fechaHora: new Date("2026-10-28T17:00:00Z") },
    { estado: "CONFIRMADA", usuarioId: 3, fechaHora: new Date("2026-10-28T18:00:00Z") }
  ],
  mensajes: [
    { usuarioId: 3, mensaje: "¿Se puede entrar con mochila?", enviado: new Date("2026-10-29T13:00:00Z") },
    { usuarioId: 1, mensaje: "Sí, chica, la revisan en la puerta.", enviado: new Date("2026-10-29T14:00:00Z") }
  ]
}
```

| Relación | Decisión | Motivo |
|---|---|---|
| comprador → Usuario | Referencia (`compradorId`) | Tiene vida propia y es compartido |
| evento → Evento | Referencia (`eventoId`) | Tiene vida propia; filtrar por evento es comparar ids |
| tipoEntrada → TipoEntrada | Referencia (`tipoEntradaId`, local al evento) | Decidido en Evento: se busca con `eventoId` + `tipoEntradaId` |
| estado → EstadoCompra | String de la constante `EstadoCompra` | Es un enum, no se persiste |
| historial → CambioEstadoCompra[] | Embebe | No existe sin la compra, se lee con ella y es corto. El campo `compra` del diagrama sobra |
| mensajes → Mensaje[] | Embebe | El chat es de cada compra y solo se lee en su detalle |
| total | Se guarda | Es lo que se pagó y lo que se reembolsa; no debe cambiar si cambia el precio |

**Repositorio** (`backend/src/persistence/repositories/compraRepository.js`):
- `create`, que arranca en `PENDIENTE` con el primer registro del historial y sin mensajes
- `findById`, para el detalle, el chat y las acciones
- `findByComprador`, para "Mis compras" y para comprobar la compra UTILIZADA antes de reseñar
- `findByEvento`, para las ventas del organizador y las entradas disponibles
- `addCambioEstado`, que actualiza `estado` y agrega el registro al historial en una sola escritura
- `addMensaje`

**Decisiones aprobadas:**
- `EstadoCompra` es una constante congelada en `backend/src/domain/estadoCompra.js`, la primera pieza de la carpeta del dominio.
- Se guarda `estado` además del historial: está en el diagrama y simplifica los filtros. `addCambioEstado` escribe los dos juntos.
- Mensajes e historial no tienen colección propia: ningún caso de uso los consulta fuera de su compra.
- Los mensajes no llevan `id`: nadie los referencia.
- Quedan para el dominio (sección 2): si una PENDIENTE reserva cupo, las transiciones válidas y cuándo una cancelación queda CANCELADA o REEMBOLSADA.

**Seed:** 9 compras, con historiales de fechas coherentes relativas al arranque y el `total` calculado con el precio del tipo de entrada.
- Sofía: rock CONFIRMADA con chat; obra PENDIENTE; acústico y stand-up UTILIZADAS (puede reseñar a Lucía y a Martín).
- Juan: Backstage × 2 CONFIRMADA (agota el cupo de 2); rock REEMBOLSADA y partido CANCELADA (no cuentan para el cupo); acústico UTILIZADA; stand-up CONFIRMADA de un evento pasado (no se puede cancelar).
- La compra REEMBOLSADA pasa directo de CONFIRMADA a REEMBOLSADA. Si el dominio decide otro flujo, hay que ajustar el seed.

### Resenia · colección `resenias`

**Por qué colección propia:**
- Se consulta por fuera de su evento: el caso de uso 10 muestra las reseñas de todos los eventos anteriores de un organizador, y el 11 las promedia por organizador para ordenar la búsqueda.
- Se descartó embeberla en Evento, porque crece con cada asistente y habría que leerla atravesando varios eventos.
- Se descartó embeberla en Compra, porque quedaría escondida dentro de cada compra y el diagrama la modela como entidad propia.

**Documento:**
```js
{ id: 1, compradorId: 3, eventoId: 4, detalle: "Sonido impecable y muy buena organización en la entrada.", puntuacion: 5 }
```

| Relación | Decisión | Motivo |
|---|---|---|
| comprador → Usuario | Referencia (`compradorId`) | Tiene vida propia y es compartido |
| evento → Evento | Referencia (`eventoId`) | Tiene vida propia; las reseñas se buscan por evento |
| organizador | No se guarda: se llega por `evento.organizadorId` | Evita duplicar un dato de Evento |
| puntaje del organizador | Se calcula | Decidido en Usuario: promedio de las reseñas de sus eventos |

**Repositorio** (`backend/src/persistence/repositories/reseniaRepository.js`):
- `create`
- `findByEventos`, para las reseñas de un organizador a partir de `eventoRepository.findByOrganizador`
- `findByCompradorAndEvento`, para no reseñar dos veces el mismo evento
- `findAll`, para calcular de una vez el puntaje de todos los organizadores

**Decisiones aprobadas:**
- Sin `organizadorId`: la consulta en dos pasos es barata en memoria y no duplica datos.
- Sin `compraId`: se sigue el diagrama (comprador + evento), con una reseña por comprador y evento.
- Sin `fecha`: el enunciado no la menciona; alcanza con la fecha del evento.
- El dominio (sección 2) valida que haya una compra UTILIZADA y el rango de la puntuación.

**Seed:** 2 reseñas del acústico (Sofía 5 y Juan 4), así Lucía queda con 4.5 de promedio.
- Sofía no reseñó el stand-up, que tiene UTILIZADA: queda libre para probar crear una reseña.
- Juan no puede reseñar el stand-up, porque su compra está CONFIRMADA.
- Martín queda sin reseñas, para probar el orden por puntaje con un organizador sin puntaje.
