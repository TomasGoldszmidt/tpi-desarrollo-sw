# Conclusión sobre el uso de IA

Conclusión del video. Sale de lo anotado en `docs/registro-ia.md`: 81 entradas a lo largo de 7 días de trabajo (del 31/10 al 20/11) y 109 commits.

## Cómo trabajé

Usé Claude Code como herramienta principal, pero sin dejarlo ejecutar de corrido. Cada tarea de `TAREAS.md` la dividía en subtareas, la IA me explicaba qué iba a hacer y recién con mi ok la implementaba. Para cada tipo de tarea creé una skill (`/persistencia`, `/nuevo-endpoint`, `/swagger`, `/nueva-pantalla`, `/probar-caso-de-uso` y `/registrar-ia`) que deja escrito ese proceso, con el punto donde tiene que frenar y esperar mi aprobación.

## Ventajas

- **Velocidad en lo repetitivo:** endpoints con sus validaciones, la documentación de Swagger, los tests y las pantallas con sus estados de carga, error y vacío. Lo que más tiempo me hubiera llevado a mano fue lo que más rápido salió.
- **Entender antes de decidir:** muchas veces la usé para preguntar antes de pedir código ("¿qué es ES Modules?", "¿para qué es Expo?", "¿esto lo pide la consigna?"). Así las decisiones las tomé yo, entendiendo el porqué.
- **Las skills mejoran con el uso:** cuando corregía algo, quedaba escrito en la skill y no se repetía en las tareas siguientes. Por ejemplo, que dentro del celular no se muestre nada técnico, o cómo mandar acentos con `curl` en las pruebas.
- **Pruebas que solo no hubiera hecho:** probó cada error con su mensaje real y simuló casos difíciles de provocar a mano, como dos personas comprando la última entrada a la vez.
- **Calidad del diseño:** propuso cosas que mejoraron el código, como escribir las transiciones de estado como una tabla de datos en lugar de varios `if`. Así la regla del enunciado queda a la vista.

## Desventajas

- **Afirma cosas de memoria:** completó requisitos de versión sin verificarlos (puso Node 20 cuando Expo pide 22.13) y dio por cerradas opciones que tenían alternativas simples.
- **No ve lo que no se ve en el código:** los casos de búsqueda que armó usaban textos que no aparecen en la pantalla, y no detectó sola que la estructura de los datos estaba dispersa en varios archivos. Mirar el resultado como revisor sigue siendo tarea mía.
- **Recorta por costo, no por valor:** cuando le pregunté si algo lo pedía la consigna, propuso una versión chica que dejaba afuera justo la parte más importante para el usuario.
- **No revisa sus propias decisiones viejas:** el guion del video siguió con usuarios que ya no existían en el seed después de cambiarlos, y el flujo que había elegido (comprar → pagar → usar → reseñar) eran en realidad varios flujos. Lo mantuvo en cada actualización hasta que se lo marqué.
- **Errores con las herramientas:** dio por buena una prueba que había corrido código viejo, tuvo problemas al manejar el emulador y algunos reemplazos por consola fallaron por las comillas o los saltos de línea de Windows.

## Dificultades

- **El entorno:** la conexión entre el celular y el backend (varias interfaces de red en la PC), Android Studio y el emulador. Las instalaciones gráficas las tuve que hacer yo.
- **Repetir correcciones:** algunas las tuve que marcar dos veces, como el texto técnico en los bocetos, hasta que quedaron escritas como regla en la skill.
- **Saber qué se estaba probando:** con la persistencia en memoria y Expo Go conectado a sesiones viejas, a veces la app no corría el código nuevo o hablaba con un backend viejo.

## No todo conviene hacerlo con la IA

Me di cuenta de que hay algunas cosas que conviene hacer a mano en lugar de con la IA, por una cuestión de tiempo y de tokens. Por ejemplo, para las pruebas del front es más simple pedirle los casos a probar y probarlos yo mismo en el celular, en lugar de pedirle que las haga la IA. Al manejar el emulador suele tener errores, se traba y no tiene el mismo criterio que yo para algunas cosas, y además gasta muchos tokens.

Los tokens son algo muy importante que hay que priorizar: si los gastás innecesariamente, en algunos casos podés perder bastante tiempo y dinero.

## Aprendizajes

- **Pedir el plan antes de que ejecute.** El análisis con su punto de frenado me dio control sin tener que acordarme de pedirlo cada vez.
- **Lo que corrijo dos veces tiene que quedar escrito**, en la skill, en `CLAUDE.md` o en la memoria. Si no, la IA lo vuelve a hacer en la sesión siguiente.
- **Hacerla verificar contra el enunciado y contra el código.** Muchas de sus "dudas" ya tenían respuesta en la consigna, y varias de sus afirmaciones cambiaron cuando las chequeó.
- **En el frontend, aprobar cómo se ve y no la lista de archivos.** Un boceto con datos reales me dejó corregir el diseño cuando todavía no costaba nada.
- **Las recomendaciones se discuten.** Cuando cuestioné un argumento suyo, lo revisó. Preguntar el porqué antes de aceptar vale la pena.
- **El orden de las tareas importa.** Hacer primero el dominio con tests hizo que los endpoints fueran casi solo conectar piezas, y preparar bien el seed al principio hizo que cada pantalla se probara en minutos.

## Valoración personal

**Productividad:** en siete días de trabajo llegué a un backend con 97 tests, una API documentada y una app con todos los casos de uso del enunciado. Sin IA me hubiera llevado bastante más tiempo. Igual, la ganancia no es automática: depende de darle contexto, revisar lo que hace y no dejarla trabajar de corrido. En las tareas en que la dejé manejar sola cosas como el emulador, perdí tiempo y tokens.

**Calidad:** creo que el resultado es mejor que lo que hubiera hecho solo en el mismo tiempo, sobre todo en los casos borde, los mensajes de error y la documentación. Pero la calidad salió de la combinación: la IA propone y yo reviso. Varias de las mejoras más importantes salieron de preguntas mías ("¿esto lo pide la consigna?", "¿es un buen patrón?") o de probar la app yo mismo.

La IA no reemplaza el criterio: lo vuelve más importante, porque produce rápido tanto lo bueno como lo que hay que corregir.

---

## Para decir en el video (~2:30)

Es la parte más importante del video. Cada punto lleva un ejemplo concreto; mejor contarlo con tus palabras que leerlo.

1. **Cómo la usé (~0:25):** Claude Code con aprobación paso a paso: la IA explica qué va a hacer y recién con mi ok lo hace. Mostrar la carpeta `.claude/skills/`: una skill por tipo de tarea, con el punto donde frena. *Ejemplo:* `/nuevo-endpoint` me presentó el análisis de `POST /compras` (errores, status y reglas) antes de escribir código.
2. **Ventajas (~0:30):** velocidad en lo repetitivo (validaciones, Swagger, tests), entender antes de decidir y pruebas que solo no hubiera hecho. *Ejemplo:* la carrera por el cupo del paso 4 la probó la IA, combinando el emulador con una compra por la API en el medio. Y la regla de que una compra pendiente ya ocupe lugar me la explicó antes de que la aprobara.
3. **Desventajas (~0:30):** afirma cosas de memoria, no ve lo que no está en el código y no revisa sus decisiones viejas. *Ejemplos:* puso Node 20 cuando Expo pedía 22.13, y el guion de este video seguía con usuarios que ya no existían y con un flujo demasiado largo, hasta que se lo marqué.
4. **Dificultades (~0:20):** el entorno (red, emulador, Expo Go conectado a un servidor viejo) y saber qué se estaba probando con la persistencia en memoria. Algunas correcciones las tuve que repetir hasta escribirlas como regla en una skill.
5. **No todo conviene hacerlo con la IA (~0:20):** las pruebas en el celular me convino hacerlas yo; manejando el emulador se traba, no tiene mi criterio y gasta muchos tokens, que son tiempo y plata.
6. **Aprendizajes (~0:20):** pedir el plan antes de que ejecute, que lo que corrijo dos veces quede escrito, y hacerla verificar contra el enunciado y contra el código.
7. **Valoración (~0:25):** en siete días llegué a 97 tests, una API documentada y todos los casos de uso: mucho más productivo. La calidad salió de la combinación, la IA propone y yo reviso. La IA no reemplaza el criterio: lo vuelve más importante, porque produce rápido tanto lo bueno como lo que hay que corregir.
