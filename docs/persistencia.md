# Persistencia

Persistencia **en memoria, orientada a documentos**. Cada entidad se analiza y se implementa por separado con la skill `/persistencia`. El orden de la tabla sigue las dependencias: primero las entidades que otras referencian.

## Estado

| # | Entidad | Estado | Decisión |
|---|---|---|---|
| 1 | Usuario | pendiente | |
| 2 | Categoria | pendiente | |
| 3 | Evento | pendiente | |
| 4 | TipoEntrada | pendiente | |
| 5 | Compra | pendiente | |
| 6 | EstadoCompra | pendiente | |
| 7 | CambioEstadoCompra | pendiente | |
| 8 | Mensaje | pendiente | |
| 9 | Resenia | pendiente | |

Estados posibles: `pendiente` · `analizada` (esperando ok) · `implementada` · `no se persiste`.

## Decisiones

<!-- Una sección por entidad, con el análisis aprobado (forma del documento, relaciones, consultas, seed). -->
