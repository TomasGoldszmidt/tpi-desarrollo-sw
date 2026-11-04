# Prueba integral en el celular

Recorrido de los 12 casos de uso del enunciado en el emulador. Está ordenado para hacerse **de corrido y sobre el seed recién cargado**: cada parte usa lo que dejó la anterior.

**Antes de empezar:** reiniciar el backend (`npm run dev` en `backend/`) para que el seed vuelva a su estado inicial, y abrir la app. Los días son relativos al arranque del backend.

En cada caso, anotar ✅ o ❌. Si algo falla o se ve mal, alcanza con una línea que diga qué pasó.

**Resultado (2026-11-03):** recorrida completa en el emulador. Pasaron todos los casos después de resolver los bugs 2 y 3 de la tabla del final.

---

## Parte A · Lucía organiza (casos 4 y 2)

Elegir a **Lucía Fernández** en "¿Quién usa la app?".

### A1. Crear evento con validaciones (caso 4)
1. Mis eventos → **Crear evento** → tocar **Crear evento** sin completar nada.
   - Esperado: los campos vacíos se marcan en rojo con su aviso abajo y el pie dice "Completá los campos marcados en rojo".
2. Completar: nombre "Meetup de prueba", una descripción, categoría **Conferencias**, una fecha futura, una hora y un lugar. Agregar un link de imagen que no empiece con http.
   - Esperado: aparece el aviso "El link tiene que empezar con http:// o https://".
3. Cargar dos tipos de entrada: "General", $1000, cupo 50, y "Primera fila", $5000, **cupo 2**. Probar antes un precio o un cupo inválido (vacío, 0 o negativo).
   - Esperado: el aviso aparece debajo del campo que está mal.
4. **Crear evento**.
   - Esperado: se crea y aparece en Mis eventos.

| A1 | Resultado |
|---|---|
| | |

### A2. Ventas sin compras (caso 2)
1. Mis eventos → Meetup de prueba.
   - Esperado: la imagen o el bloque gris, General 50 y Primera fila 2 disponibles, y "Todavía nadie compró entradas para este evento."
2. Volver → **Festival de Verano**.
   - Esperado: las dos imágenes (se deslizan), Backstage **Agotado** y una compra Confirmada de Juan.

| A2 | Resultado |
|---|---|
| | |

---

## Parte B · Sofía compra (casos 1, 3, 11, 10, 12, 5, 7, 8 y 9)

Tocar el avatar (arriba a la derecha) y elegir a **Sofía Pérez**.

### B1. Mis compras (caso 1)
- Esperado, de la más nueva a la más vieja:
  - **Bernarda Alba**: Pendiente de pago.
  - **Noche de Rock**: Confirmada, con los días que faltan (~20).
  - **Acústico en el Gran Rex**: Utilizada.
  - **Noche de Stand-up**: Utilizada.
- Solo la Confirmada muestra los días restantes. Cada estado se distingue bien por su color.
- Noche de Rock tiene borde verde y abajo dice "Lucía te respondió · Sí, chica, la revisan en la puerta." Las demás, sin aviso.

| B1 | Resultado |
|---|---|
| | |

### B2. Búsqueda, categorías y orden (casos 3 y 11)
En Catálogo:
1. Sin filtros. Esperado: solo los eventos futuros, ordenados por fecha: Bernarda Alba, Amistoso, Noche de Rock, Festival de Verano y Meetup de prueba (según la fecha que le pusiste). Los pasados (Acústico y Stand-up) no aparecen.
2. Buscar "rock". Esperado: solo Noche de Rock.
3. Buscar "BERNARDA" (en mayúsculas). Esperado: Bernarda Alba.
4. Buscar "san martin" (sin tilde). Esperado: Bernarda Alba, por el lugar que muestra la tarjeta (Teatro San Martín).
5. Buscar "zzz". Esperado: "No hay eventos para esta búsqueda" y **Limpiar filtros** vuelve a la lista completa.
6. Filtros → categoría **Teatro** → Ver resultados. Esperado: solo Bernarda Alba, con el filtro visible arriba y una forma de quitarlo.
7. Filtros → Ordenar por **Precio**. Esperado: de menor a mayor precio desde: Meetup ($1000), Amistoso ($15.000), Bernarda ($20.000), Rock ($45.000) y Festival ($90.000).
8. Ordenar por **Puntaje**. Esperado: primero los eventos de Lucía (4.5) y al final los de Martín, que no tiene reseñas todavía.

| B2 | Resultado |
|---|---|
| | |

### B3. Reseñas del organizador (caso 10)
1. Abrir **Noche de Rock**. Esperado: organizadora Lucía con 4.5 y 2 reseñas. Al entrar, "Reseñas de sus eventos" muestra la de Sofía (5) y la de Juan (4), las dos del Acústico.
2. Abrir **Amistoso**. Esperado: Martín, con "Todavía no tiene reseñas".

| B3 | Resultado |
|---|---|
| | |

### B4. Comprar respetando el cupo (caso 12)
1. **Festival de Verano** → comprar. Esperado: Backstage aparece **Agotado** y no se puede elegir.
2. Elegir **General**, subir a 2. Esperado: el total es $180.000 → **Confirmar compra** → pantalla de éxito → **Ver mi compra** muestra Pendiente de pago.
3. **Pagar $180.000**. Esperado: pasa a Confirmada, con ~60 días restantes, y suma el cambio al historial.
4. **Meetup de prueba** → comprar **Primera fila**. Esperado: el botón "+" se frena en 2 ("de 2 disponibles"). Confirmar con 2 y dejarla pendiente.
5. Volver a comprar en el Meetup. Esperado: Primera fila figura Agotado.

| B4 | Resultado |
|---|---|
| | |

### B5. Chat del comprador (caso 5)
1. Mis compras → **Noche de Rock** → chat. Esperado: la conversación del seed (la pregunta de la mochila y la respuesta de Lucía).
2. Enviar "¿A qué hora abren las puertas?". Esperado: aparece al instante, el teclado no tapa el campo y la vista previa del detalle muestra el último mensaje.
3. Volver a Mis compras. Esperado: Noche de Rock ya no tiene el aviso, porque ahora espera la respuesta de Lucía.

| B5 | Resultado |
|---|---|
| | |

### B6. Cancelar y pedir reembolso (casos 7 y 8)
1. **Bernarda Alba** (pendiente) → **Cancelar compra** → confirmar. Esperado: Cancelada, sin botones.
2. **Noche de Rock** (confirmada) → **Cancelar y pedir reembolso** → confirmar. Esperado: Reembolsada.
3. Volver a abrir el chat de Noche de Rock y mandar otro mensaje. Esperado: se puede, porque el chat va "en cualquier momento".
4. **Acústico** y **Stand-up** (utilizadas). Esperado: no tienen botón de cancelar (regla del caso 8).

| B6 | Resultado |
|---|---|
| | |

### B7. Reseñar (caso 9)
1. **Acústico** → esperado: "Tu reseña" con las 5 estrellas que ya tenía, sin formulario.
2. **Noche de Stand-up** → "¿Cómo estuvo el evento?" → 4 estrellas y un comentario → **Publicar reseña**. Esperado: queda como "Tu reseña".
3. Catálogo → Amistoso. Esperado: Martín ahora tiene 4 y 1 reseña.

| B7 | Resultado |
|---|---|
| | |

---

## Parte C · Lucía responde y revisa las ventas (casos 6 y 2)

Cambiar a **Lucía**.

### C1. Responder el chat (caso 6)
1. Mis eventos. Esperado: Noche de Rock con borde verde y "1 compra espera tu respuesta"; los demás eventos, sin aviso.
2. Noche de Rock → ventas. Esperado: la compra de Sofía con borde verde y "Sofía espera tu respuesta" con el comienzo de su último mensaje.
3. Entrar a la compra → chat. Esperado: los mensajes de Sofía, incluidos los dos nuevos.
4. Responder "Abren a las 19" y volver. Esperado: el aviso desaparece de las ventas y de Mis eventos.
5. Como Sofía, en Mis compras. Esperado: Noche de Rock vuelve a decir "Lucía te respondió · Abren a las 19", y en el chat aparece la respuesta.

| C1 | Resultado |
|---|---|
| | |

### C2. Ventas con cambios (caso 2)
1. **Noche de Rock**. Esperado: Campo 500 y Platea 200 disponibles (las dos reembolsadas liberaron el lugar). Las compras de Sofía y Juan figuran Reembolsadas.
2. **Festival de Verano**. Esperado: General 998, VIP 100, Backstage Agotado, y la compra nueva de Sofía Confirmada.
3. **Meetup de prueba**. Esperado: Primera fila Agotado (la compra pendiente ocupa lugar), General 50, y la compra de Sofía Pendiente de pago.
4. **Noche de Rock** → compra de Sofía. Esperado: no aparece "Marcar como utilizada" (está reembolsada).

| C2 | Resultado |
|---|---|
| | |

---

## Parte D · Martín marca una entrada como utilizada

Cambiar a **Martín Gómez**.

1. Mis eventos → **Noche de Stand-up** → compra de Juan (Confirmada) → **Marcar como utilizada** → Marcar. Esperado: Utilizada, el cambio a nombre de Martín en el historial y el botón desaparece.
2. Mis eventos → **Amistoso** → la compra cancelada de Juan. Esperado: sin acciones.

| D | Resultado |
|---|---|
| | |

---

## Parte E · Juan reseña lo que acaba de usar (casos 1 y 9)

Cambiar a **Juan Rodríguez**.

1. Mis compras. Esperado: aparecen los cinco estados distintos: Backstage Confirmada (~60 días), Noche de Rock Reembolsada, Amistoso Cancelada, Acústico Utilizada y Stand-up Utilizada.
2. **Stand-up** → reseña de 5 estrellas → Publicar. Esperado: queda "Tu reseña". En el Amistoso, Martín pasa a tener 4.5 y 2 reseñas.

| E | Resultado |
|---|---|
| | |

---

## Parte F · Generales y pulido visual

1. **Sin backend:** frenar el backend y recargar una pantalla. Esperado: el mensaje de error con **Reintentar**. Levantarlo de nuevo y Reintentar.
2. **Cambiar de usuario:** desde el avatar, en cualquier pestaña. Esperado: vuelve a "¿Quién usa la app?" y al elegir otro se ven sus datos.
3. **Visual:** recorrer todas las pantallas buscando textos cortados, cosas tapadas por el teclado, colores o espacios inconsistentes, y botones que no respondan al tocarlos.

| F | Resultado |
|---|---|
| | |

---

## Bugs y detalles encontrados

Se resuelven en la subtarea "Corrección de bugs y pulido visual".

| # | Caso | Qué pasó | Estado |
|---|---|---|---|
| 1 | Preparación | Con otro backend ocupando el puerto 3000, `npm run dev` dice "Servidor escuchando" y se cierra sin avisar: la app seguía usando el backend viejo. | Pendiente |
| 2 | B2 | Los casos de búsqueda usaban textos que no se ven en la tarjeta (descripción y calle). | Resuelto: se cambiaron los casos |
| 3 | B5 / C1 | Un mensaje sin responder no se nota en ninguna lista: hay que entrar a cada compra para verlo. Se marca en Mis compras, Ventas y Mis eventos (boceto `mensajes-sin-responder.html`); las pestañas y el "leído" quedaron afuera. | Resuelto, falta probarlo en el celular |
