# Persistencia

Persistencia **en memoria, orientada a documentos**. Cada entidad se analiza y se implementa por separado con la skill `/persistencia`. El orden de la tabla sigue las dependencias: primero las entidades que otras referencian.

## Estado

| # | Entidad | Estado | Decisión |
|---|---|---|---|
| 1 | Usuario | implementada | Colección propia `usuarios` |
| 2 | Categoria | implementada | Colección propia `categorias` (solo lectura, la carga el seed) |
| 3 | Evento | implementada | Colección propia `eventos` |
| 4 | TipoEntrada | implementada | Embebida en `Evento.tiposEntrada` (se decidió con Evento) |
| 5 | Compra | pendiente | |
| 6 | EstadoCompra | pendiente | |
| 7 | CambioEstadoCompra | pendiente | |
| 8 | Mensaje | pendiente | |
| 9 | Resenia | pendiente | |

Estados posibles: `pendiente` · `analizada` (esperando ok) · `implementada` · `no se persiste`.

## Base común

`backend/src/persistencia/coleccion.js`, clase `Coleccion`:
- Guarda los documentos en un `Map` y genera ids numéricos incrementales por colección.
- Métodos: `insertar`, `buscarPorId`, `buscarTodos(filtro?)`, `actualizar` y `eliminar`.
- Devuelve copias con `structuredClone`, así nadie modifica el estado por fuera del repositorio.
- Ignora el `id` que venga en los datos: no se puede elegir ni pisar.

`backend/src/persistencia/esquemas.js` tiene la estructura de todos los documentos, con un `@typedef` de JSDoc por entidad. Es la referencia en el código; este archivo explica el porqué de cada decisión.

`backend/src/persistencia/seed.js` carga los datos de ejemplo al iniciar el servidor desde `src/index.js`.

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

**Repositorio** (`backend/src/persistencia/repositorios/usuarioRepository.js`):
- `crear`
- `buscarPorId`
- `buscarTodos`, para la selección de usuario activo
- `agregarFavorito` y `quitarFavorito`, que no generan duplicados

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

**Repositorio** (`backend/src/persistencia/repositorios/categoriaRepository.js`):
- `buscarTodos`, para los filtros del catálogo y el selector
- `buscarPorId`, para validar el `categoriaId` al crear un evento
- `crear`, que solo usa el seed

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

**Repositorio** (`backend/src/persistencia/repositorios/eventoRepository.js`):
- `crear`, que asigna los ids locales de los tipos de entrada y convierte la fecha a `Date`
- `buscarPorId` y `buscarTodos`
- `buscar({ texto, categoriaId })`, ambos opcionales. El texto se busca en el nombre, la descripción y el lugar, sin distinguir mayúsculas ni tildes
- `buscarPorOrganizador`, para las ventas del organizador y sus reseñas
- `buscarPorIds`, para resolver los favoritos

**Decisiones aprobadas:**
- `fecha` es un `Date`: `structuredClone` lo copia y `res.json` lo devuelve como string ISO.
- Se agrega `lugar` (texto libre), que no está en el diagrama: el enunciado menciona consultas sobre "el acceso al lugar". La "ubicación" de los tipos de entrada ya queda en su `nombre`.
- TipoEntrada no tiene colección propia: ningún caso de uso la consulta por separado.
- No se guarda un contador de vendidas: calcularlo en memoria es barato y no se desincroniza.
- El orden (precio, fecha, puntaje), las validaciones de referencias y si se ocultan los eventos pasados van en el dominio.
- No hay `actualizar` ni `eliminar`: ningún caso de uso los pide.

**Seed:** 6 eventos con fechas relativas al arranque.
- Lucía: rock (+20 días), teatro (+5), festival (+60, con un tipo Backstage de cupo 2 para agotar con el seed de Compra) y acústico (−15 días, pasado).
- Martín: partido (+10) y stand-up (−30 días, pasado).
- Conferencias queda sin eventos.
