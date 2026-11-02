# Persistencia

Persistencia **en memoria, orientada a documentos**. Cada entidad se analiza y se implementa por separado con la skill `/persistencia`. El orden de la tabla sigue las dependencias: primero las entidades que otras referencian.

## Estado

| # | Entidad | Estado | Decisión |
|---|---|---|---|
| 1 | Usuario | implementada | Colección propia `usuarios` |
| 2 | Categoria | pendiente | |
| 3 | Evento | pendiente | |
| 4 | TipoEntrada | pendiente | |
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

**Repositorio** (`backend/src/persistencia/repositorios/usuarioRepositorio.js`):
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
