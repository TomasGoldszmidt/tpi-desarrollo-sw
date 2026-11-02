# Referencia del dominio (enunciado AI Ticket It, 2C 2026)

Transcripción del diagrama tentativo de clases y de los casos de uso del enunciado. El diagrama es *tentativo*: se puede adaptar si hay una justificación.

## Diagrama de clases

| Clase | Atributos | Métodos |
|---|---|---|
| **Usuario** | nombre: String · apellido: String · favoritos: Evento[] | |
| **Categoria** | nombre: String · descripcion: String | |
| **Evento** | nombre: String · descripcion: String · categoria: Categoria · fecha: DateTime · tiposEntrada: TipoEntrada[] · multimedia: String[] · organizador: Usuario | `tuPrecioEstaEntre(Int, Int): Boolean` |
| **TipoEntrada** | nombre: String · descripcion: String · precio: Double · cupo: Int | `hayCupoPara(Int): Boolean` |
| **Compra** | comprador: Usuario · evento: Evento · tipoEntrada: TipoEntrada · cantidad: Int · total: Double · estado: EstadoCompra · mensajes: Mensaje[] | `actualizarEstado(EstadoCompra): void` |
| **EstadoCompra** (enum) | PENDIENTE · CONFIRMADA · UTILIZADA · CANCELADA · REEMBOLSADA | |
| **CambioEstadoCompra** | compra: Compra · estado: EstadoCompra · quien: Usuario · fechaHora: DateTime | |
| **Mensaje** | usuario: Usuario · mensaje: String · enviado: DateTime | |
| **Resenia** | comprador: Usuario · evento: Evento · detalle: String · puntuacion: Double | |

Relaciones del diagrama:
- Usuario → Evento: `favoritos`, muchos.
- Evento → Usuario: `organizador`.
- Evento → Categoria.
- Evento → TipoEntrada: muchos.
- Compra → Usuario, Evento, TipoEntrada y EstadoCompra.
- Compra → Mensaje: muchos.
- CambioEstadoCompra → Compra, Usuario y EstadoCompra.
- Resenia → Usuario y Evento.

## Casos de uso

1. **Comprador:** ver sus compras, con el estado bien diferenciado y los días que faltan para el evento si la compra está CONFIRMADA.
2. **Organizador:** ver las compras de un evento, con su estado y las entradas que quedan disponibles de cada tipo.
3. **Comprador:** buscar eventos por texto o explorarlos por categoría.
4. **Organizador:** crear un evento con varios tipos de entrada, cada uno con precio y cupo.
5. **Comprador:** enviar mensajes en el chat de una compra, en cualquier momento.
6. **Organizador:** responder mensajes en el chat de una compra, en cualquier momento.
7. **Comprador:** cancelar una compra para obtener el reembolso.
8. **Regla de cancelación:** solo se puede cancelar si la compra no está UTILIZADA y el evento todavía no se realizó.
9. **Reseñas:** cuando la entrada está UTILIZADA, el comprador puede puntuar el evento con un número y dejar un comentario.
10. **Comprador:** ver las reseñas de eventos anteriores en los eventos de cada organizador.
11. **Comprador:** ordenar la búsqueda por precio, por fecha del evento o por puntaje del organizador.
12. **Comprador:** comprar seleccionando un tipo de entrada y una cantidad, sin superar el cupo disponible.

## Requerimientos técnicos relevantes

- La persistencia es **en memoria**.
- La app se ejecuta localmente en un dispositivo mobile.
- El contexto del enunciado menciona "material multimedia" en los eventos y "guardar eventos favoritos".
