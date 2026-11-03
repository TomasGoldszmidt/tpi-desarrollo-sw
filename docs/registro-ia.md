# Registro de uso de IA

Bitácora del uso de herramientas de IA durante el desarrollo de AI Ticket It.
Sirve como insumo para la conclusión del video: ventajas, desventajas, dificultades y aprendizajes.

**Herramienta principal:** Claude Code (app de escritorio), modelo Claude Opus 5.5.

**Forma de trabajo:** cada sección de `TAREAS.md` se divide en subtareas. La IA propone qué va a hacer en cada una, yo apruebo, la IA ejecuta y se commitea al terminar.

## Plantilla

```markdown
### AAAA-MM-DD · Título corto
- **Tarea:** ítem de TAREAS.md
- **Herramienta / skill:** Claude Code, skill usada (si aplica)
- **Pedido (prompt):** qué le pedí, resumido
- **Resultado:** qué hizo la IA
- **Bien:** qué salió bien o ahorró tiempo
- **Corregido / problemas:** qué hubo que corregir o qué falló
- **Aprendizaje:** qué me llevo
```

## Entradas

### 2026-10-31 · Planificación del setup
- **Tarea:** 0. Setup técnico inicial
- **Herramienta / skill:** Claude Code
- **Pedido (prompt):** "Arranquemos con la primera tarea de TAREAS.md; dividila en tareas más específicas, decime qué vas a hacer y yo te doy el ok."
- **Resultado:** dividió la sección en 6 subtareas con el detalle de cada una y revisó qué herramientas tenía instaladas (Node 24, npm 11, git).
- **Bien:** el plan paso a paso con aprobación me permitió entender cada decisión antes de que se ejecute.
- **Corregido / problemas:** agregué una tarea que no estaba: crear skills propias para la implementación.
- **Aprendizaje:** conviene pedirle a la IA el plan antes de que ejecute; da control y deja todo documentado.

### 2026-10-31 · Decisiones técnicas: ES Modules y Express 5
- **Tarea:** Inicializar proyecto Node + Express
- **Herramienta / skill:** Claude Code
- **Pedido (prompt):** "¿Qué es ES Modules o CommonJS?"
- **Resultado:** explicó la diferencia con ejemplos y recomendó ES Modules, porque es la misma sintaxis que usa React Native y es el estándar actual. Al instalar, quedó Express 5.
- **Bien:** usar la IA para entender un concepto antes de decidir, y no solo para generar código.
- **Corregido / problemas:** `npm audit` marcó vulnerabilidades en una dependencia de nodemon. La IA propuso no aplicar `audit fix --force`, porque bajaría nodemon a una versión muy vieja y es solo una dependencia de desarrollo.
- **Aprendizaje:** no aceptar a ciegas los "fix" automáticos; hay que evaluar el impacto real.

### 2026-10-31 · Creación de la app con Expo
- **Tarea:** Inicializar proyecto React Native con Expo
- **Herramienta / skill:** Claude Code
- **Pedido (prompt):** "¿Expo para qué es?" y después "dale".
- **Resultado:** creó la app con la plantilla en blanco (Expo SDK 58) y verificó que el bundler levantara.
- **Bien:** la plantilla de Expo trae un `AGENTS.md` con instrucciones para asistentes de IA (por ejemplo, usar `npx expo install` y consultar la documentación de la versión instalada) y activa el plugin oficial de Expo para Claude Code. El framework mismo está pensado para trabajar con IA.
- **Corregido / problemas:** ninguno.
- **Aprendizaje:** los frameworks están empezando a traer contexto para la IA. `AGENTS.md` le avisa que Expo cambia mucho entre versiones y que no confíe en lo que aprendió en su entrenamiento.

### 2026-10-31 · Conexión dispositivo ↔ backend
- **Tarea:** Verificar conexión dispositivo mobile ↔ backend
- **Herramienta / skill:** Claude Code
- **Pedido (prompt):** "Dale, seguí"; después "no veo el QR de expo"; después "no me deja abrirlo, ¿es necesario entrar desde el celu? Probablemente grabe desde la compu".
- **Resultado:**
  - Detectó que la PC tiene varias interfaces de red (VirtualBox, Radmin VPN y la LAN real) y forzó la IP correcta para que Expo no usara una inaccesible.
  - Armó la URL del backend a partir de la IP que expone Expo, en lugar de escribirla a mano.
  - Generó el QR como imagen cuando no lo encontraba en la terminal.
  - Ante el problema con el celular, leyó el enunciado: pide un "dispositivo mobile", no necesariamente físico. Propuso un emulador Android, que además facilita grabar el video.
  - Verificó que el hardware (RAM, disco, virtualización) soportara el emulador, me guió con la instalación de Android Studio y abrió la app en el emulador. Comprobó el resultado con capturas de pantalla tomadas por `adb`.
- **Bien:** consultó el enunciado antes de proponer la alternativa, así la solución cumple con los requisitos.
- **Corregido / problemas:** el celular no pudo abrir la app y no se llegó a diagnosticar por qué. Las instalaciones gráficas (Android Studio, el dispositivo virtual) las tuve que hacer yo.
- **Aprendizaje:** la IA resuelve bien los problemas de entorno si le das contexto, como que voy a grabar desde la PC. Es clave validar sus propuestas contra los requisitos del trabajo.

### 2026-11-02 · Creación de las primeras skills
- **Tarea:** Crear skills base de Claude Code
- **Herramienta / skill:** Claude Code. Es la primera entrada escrita siguiendo la skill `registrar-ia`.
- **Pedido (prompt):** "agregá otra tarea, quiero crearme skills para que me ayude con la implementación" y después "dale, ¿qué skills vamos a crear?".
- **Resultado:**
  - Creó `.claude/skills/registrar-ia`, que agrega entradas a este registro con la plantilla.
  - Creó `.claude/skills/probar-caso-de-uso`, que prueba un caso de uso con curl contra el backend y con capturas del emulador por adb, y reporta una tabla esperado/obtenido.
  - Dejó en TAREAS.md las skills `modelo-dominio`, `nuevo-endpoint` y `nueva-pantalla` para crearlas al empezar cada sección, cuando ya existan las convenciones que deben fijar.
- **Bien:** las skills guardan el contexto del proyecto (rutas, IP, adb, reglas como "no declarar que funciona sin probarlo"), así no hay que repetirlo en cada prompt.
- **Corregido / problemas:** al editar TAREAS.md, un comando de la IA se ejecutó dos veces y duplicó líneas. Lo detectó en el diff y lo corrigió antes de commitear.
- **Aprendizaje:** una skill sirve cuando hay un proceso que se repite. Conviene crearla cuando el proceso ya está claro, no antes.

### 2026-11-02 · Skill de persistencia
- **Tarea:** Crear skill `persistencia`
- **Herramienta / skill:** Claude Code + `registrar-ia`
- **Pedido (prompt):** "creemos una skill por cada tarea distinta… una skill de persistencia que vaya entidad por entidad: 1) verificar si es necesario persistirlo, 2) cómo persistirlo, 3) entrega un análisis y yo le doy el ok o corrijo, 4) luego del ok implementa. La persistencia va a ser documentacional."
- **Resultado:**
  - Creó `.claude/skills/persistencia/` con el flujo en 5 pasos. La regla clave es que no escribe código sin el ok.
  - Incluyó criterios para decidir colección propia, embebida, constante o calculada, y para embeber o referenciar.
  - Definió convenciones de implementación: una `Coleccion` genérica que devuelve copias, un repositorio por colección y un seed.
  - Agregó `referencia-dominio.md`, con el diagrama y los casos de uso transcriptos del enunciado, para que la skill no dependa del PDF.
  - Creó `docs/persistencia.md` para seguir el estado y las decisiones de cada entidad.
- **Bien:** el diseño del flujo (análisis → aprobación → implementación) lo definí yo y la IA lo convirtió en una skill reutilizable. Reemplazó a la skill `modelo-dominio` que había propuesto antes.
- **Corregido / problemas:** la IA había propuesto crear las skills recién al empezar cada sección. Lo cambié: una skill por cada tipo de tarea, con aprobación en el medio.
- **Aprendizaje:** poner en la skill el punto de frenado (análisis → ok → implementación) hace que el control no dependa de acordarme de pedirlo cada vez.

### 2026-11-02 · Persistencia de Usuario (primer uso de `/persistencia`)
- **Tarea:** Persistir entidad por entidad: Usuario
- **Herramienta / skill:** Claude Code + `/persistencia` + `registrar-ia`
- **Pedido (prompt):** "dale" para analizar Usuario; después "no, utilicemos mongoose para persistir"; después "ah, entonces no es necesario, ¿cómo vas a persistir en memoria?"; y al final "me parece perfecto".
- **Resultado:**
  - Presentó el análisis de Usuario: colección propia, favoritos como array de ids, reputación calculada, y 4 dudas para que yo decidiera (roles, favoritos, login, ids).
  - Ante mi pedido de usar Mongoose, avisó que el enunciado exige persistencia en memoria. Propuso `mongodb-memory-server` como forma de cumplir las dos cosas.
  - Le pregunté cómo era la alternativa y explicó la persistencia en memoria con código de ejemplo. Me convenció y volvimos al enfoque original.
  - Con el ok, implementó `Coleccion` (un `Map` que devuelve copias), `usuarioRepositorio` y el seed con 4 usuarios. Lo probó con un script de Node y verificó que el backend arranca con el seed.
- **Bien:** frenó mi cambio de tecnología señalando un requisito del enunciado que yo no había tenido en cuenta, y no simplemente lo hizo.
- **Corregido / problemas:**
  - Durante las pruebas, la IA ajustó `Coleccion` para que el `id` quede primero y no se pueda pisar desde afuera.
  - Al escribir `docs/persistencia.md` con un comando de bash, las comillas invertidas se rompieron. Lo reescribió con la herramienta de archivos.
- **Aprendizaje:** antes de cambiar de tecnología, conviene contrastarla con los requisitos del enunciado; preguntarle a la IA "¿cómo sería la alternativa?" me ayudó a decidir con información.

### 2026-11-02 · Ids numéricos vs UUID
- **Tarea:** Persistir entidad por entidad (decisión transversal)
- **Herramienta / skill:** Claude Code
- **Pedido (prompt):** "¿la persistencia de usuarios no debería ser con UUID?"; después "el choque entre colecciones no me parece una razón tan fuerte".
- **Resultado:** comparó las dos opciones en una tabla y se inclinó apenas por UUID, por el choque de ids entre colecciones. Cuando le discutí ese argumento, lo revisó: el choque solo pasaría por un bug de programación y las referencias se validan. Cambió la recomendación a mantener los ids numéricos.
- **Bien:** reconoció que su argumento era débil y lo explicó, en lugar de sostenerlo por haberlo propuesto.
- **Corregido / problemas:** su primera recomendación le daba demasiado peso a un riesgo poco realista. Tuve que cuestionarla yo.
- **Aprendizaje:** las recomendaciones de la IA se pueden discutir: cuando cuestioné su argumento lo revisó, así que vale la pena preguntar el porqué antes de aceptarlas.

### 2026-11-02 · Persistencia de Categoria
- **Tarea:** Persistir entidad por entidad: Categoria
- **Herramienta / skill:** Claude Code + `/persistencia` + `registrar-ia`
- **Pedido (prompt):** "dale" (`/persistencia Categoria`); después "si las categorías no las carga nadie, entonces está bien lo que decís".
- **Resultado:**
  - Propuso una colección propia de solo lectura, cargada por el seed con 5 categorías del enunciado y referenciada desde Evento con `categoriaId`. Planteó como alternativa dejarla como constante en código.
  - Con el ok, creó `categoriaRepositorio`, sumó las categorías al seed e hizo que el log de arranque las cuente.
  - Lo probó con un script de Node y verificó el arranque: "Seed cargado: 4 usuarios, 5 categorias".
- **Bien:** usó el enunciado (el contexto menciona recitales, teatro, festivales, conferencias y deportes) para elegir las categorías, en vez de inventarlas.
- **Corregido / problemas:** ninguno. Aprobé el análisis después de confirmar que nadie carga categorías.
- **Aprendizaje:** basar los datos de ejemplo en el enunciado los hace más creíbles para la demo y evita inventar cosas que después hay que justificar.

### 2026-11-02 · Nomenclatura de repositorios
- **Tarea:** Persistir entidad por entidad (convención)
- **Herramienta / skill:** Claude Code
- **Pedido (prompt):** "modificá los repositorios para que sigan la nomenclatura entidadRepository; hacé el cambio en el código y en la skill".
- **Resultado:** renombró `usuarioRepositorio.js` → `usuarioRepository.js` y `categoriaRepositorio.js` → `categoriaRepository.js` con `git mv`, actualizó los imports del seed, `docs/persistencia.md` y la convención de la skill `/persistencia`. Verificó que el backend sigue arrancando.
- **Bien:** al estar la convención escrita en la skill, el cambio queda fijado para todas las entidades que faltan.
- **Corregido / problemas:** la convención original de la skill la había propuesto la IA; la cambié a mi gusto.
- **Aprendizaje:** cuando una convención no me convence, hay que cambiarla también en la skill; si no, la IA la vuelve a aplicar en las próximas entidades.

### 2026-11-02 · Skill /swagger y CLAUDE.md
- **Tarea:** Documentación de la API y convenciones del proyecto
- **Herramienta / skill:** Claude Code + `registrar-ia`
- **Pedido (prompt):** "quiero crear una skill /swagger para que cada vez que se crea un endpoint se registre en el swagger; en el CLAUDE.md debería estar especificado 'cada vez que se crea un endpoint usar /swagger'. ¿Te parece bien?"
- **Resultado:**
  - La IA propuso tres ajustes: que la regla cubra también modificar y eliminar endpoints; usar un `openapi.yaml` aparte en lugar de comentarios `swagger-jsdoc`; y que la skill no frene para pedir aprobación, porque solo documenta código existente.
  - Con el ok, instaló `swagger-ui-express` y `yaml`, sirvió Swagger UI en `/api-docs` y documentó `/health` como primer endpoint. También configuró nodemon para reiniciar cuando cambia el `.yaml`.
  - Creó `CLAUDE.md` con la regla de `/swagger`, la forma de trabajo, la tabla de skills, las convenciones y cómo levantar el proyecto.
  - Verificó que el YAML es válido y que `/api-docs` responde 200 e incluye `/health`.
- **Bien:** `CLAUDE.md` reúne en el repo convenciones que estaban dispersas en las skills y en la memoria de la IA.
- **Corregido / problemas:** `npm` bloqueó el script de instalación de `@scarf/scarf`, una telemetría que trae `swagger-ui-dist`. Lo dejamos bloqueado porque no hace falta.
- **Aprendizaje:** escribir las reglas del proyecto en `CLAUDE.md` hace que la IA las siga en cada sesión, sin depender de que se las repita.

### 2026-11-02 · Esquemas de persistencia en un solo lugar
- **Tarea:** Persistir entidad por entidad (estructura visible en el código)
- **Herramienta / skill:** Claude Code + `registrar-ia`
- **Pedido (prompt):** "siento que está quedando al aire en el código que no hay un lugar donde se muestre con qué estructura se persiste cada entidad".
- **Resultado:**
  - Propuso tres opciones: typedefs de JSDoc centralizados, funciones que armen cada documento, o los schemas del swagger. Recomendó los typedefs.
  - Con el ok, creó `backend/src/persistencia/esquemas.js` con `Usuario` y `Categoria`, y tipó los repositorios con `@returns`.
  - Sumó el paso a la skill `/persistencia` y lo anotó en `CLAUDE.md` y en `docs/persistencia.md`.
  - Lo verificó con TypeScript: un error de tipeo a propósito (`apelido`) se detecta y sugiere `apellido`.
- **Bien:** descartó los schemas del swagger con un argumento concreto: la API va a devolver campos calculados que no se persisten.
- **Corregido / problemas:** la falta de un lugar central la detecté yo. La IA había dejado la estructura solo en comentarios sueltos y en la documentación.
- **Aprendizaje:** la IA no detecta sola algunos problemas de diseño, como que la estructura de los datos estuviera dispersa; mirar el código como revisor sigue siendo tarea mía.

### 2026-11-02 · Persistencia de Evento
- **Tarea:** Persistir entidad por entidad (Evento, que también resuelve TipoEntrada)
- **Herramienta / skill:** Claude Code + `/persistencia Evento` + `registrar-ia`
- **Pedido (prompt):** `/persistencia Evento`. Después corregí: "prefiero fecha Date" y "si en la consigna habla del lugar agregalo, sino no".
- **Resultado:**
  - Análisis: colección propia `eventos`, con `categoriaId` y `organizadorId` como referencias y `tiposEntrada` embebidos con un id local, para que Compra los referencie con `eventoId` + `tipoEntradaId`. Las entradas disponibles, el precio mínimo y el puntaje se calculan, no se guardan. Avisó que la decisión afectaba a TipoEntrada, que quedó embebida.
  - Para lo del lugar, extrajo el texto del PDF con `pdftotext` y encontró "el acceso al lugar". Agregó `lugar` y aclaró que la "ubicación" de los tipos de entrada ya queda en su nombre.
  - Con el ok, creó `eventoRepository.js` (`buscar` por texto y categoría sin distinguir mayúsculas ni tildes, `buscarPorOrganizador` y `buscarPorIds`), los typedefs y un seed de 6 eventos con fechas relativas al arranque, dos de ellos pasados y uno con cupo 2 para agotar.
  - Lo probó con un script de Node: consultas, copias aisladas y la fecha como `Date` serializada a ISO. Verificó el arranque: "Seed cargado: 4 usuarios, 5 categorias, 6 eventos".
- **Bien:** las fechas relativas evitan que el seed quede viejo, y los casos borde (evento pasado, cupo chico) quedaron preparados para las próximas entidades.
- **Corregido / problemas:**
  - La IA había propuesto guardar la fecha como string ISO; la cambié a `Date`.
  - Planteó `lugar` como una duda en vez de revisar primero el enunciado; se lo pedí yo.
  - Agregó `buscarTodos` al repositorio sin que estuviera en el análisis (lo avisó).
  - Detalle que quedó abierto: buscar "musica" no encuentra eventos por su categoría, solo por su texto.
- **Aprendizaje:** cuando la IA plantea una duda sobre el dominio, primero hay que pedirle que la verifique contra el enunciado; muchas "dudas" ya tienen respuesta ahí.

### 2026-11-02 · Persistencia de Compra
- **Tarea:** Persistir entidad por entidad (Compra, que también resuelve EstadoCompra, CambioEstadoCompra y Mensaje)
- **Herramienta / skill:** Claude Code + `/persistencia Compra` + `registrar-ia`
- **Pedido (prompt):** `/persistencia Compra`, y "Ok, implementalo" después del análisis.
- **Resultado:**
  - Antes de analizar, revisó el enunciado con `pdftotext`. Confirmó los 5 estados y que el chat es "de cada compra".
  - Análisis: colección propia `compras`, con `compradorId`, `eventoId` y `tipoEntradaId` como referencias. El historial de estados y los mensajes van embebidos, y `EstadoCompra` es una constante en `backend/src/dominio/estadoCompra.js`. Avisó que esto decidía cuatro entidades del diagrama.
  - Justificó guardar `total` (lo que se pagó no debe cambiar si cambia el precio) y `estado` además del historial (`registrarCambioEstado` escribe los dos juntos).
  - Con el ok, creó `compraRepository.js` y un seed de 9 compras que cubre todos los estados, el cupo de Backstage agotado y una compra CONFIRMADA de un evento pasado, que no se puede cancelar.
  - Lo probó con un script de Node: el estado coincide con el historial, las fechas están en orden, las 2 de 2 Backstage vendidas, y las consultas y las copias aisladas funcionan. Verificó el arranque: "Seed cargado: 4 usuarios, 5 categorias, 6 eventos, 9 compras".
- **Bien:**
  - Revisó el enunciado antes de plantear dudas, que fue lo que se le marcó con Evento.
  - Separó lo que es persistencia de lo que es regla de negocio: si una PENDIENTE reserva cupo y cuándo una cancelación queda CANCELADA o REEMBOLSADA quedaron para la sección 2.
- **Corregido / problemas:**
  - Ninguna corrección mía al análisis.
  - Agregó a `crear` y `agregarMensaje` un parámetro de fecha opcional que no estaba en el análisis, para que el seed arme historiales con fechas pasadas (lo avisó).
  - El seed asume que una compra pasa directo de CONFIRMADA a REEMBOLSADA. Si el dominio define otro flujo, hay que ajustarla.
- **Aprendizaje:** una corrección que le hice en una entidad (revisar el enunciado antes) la aplicó sola en la siguiente; las correcciones dentro de la sesión rinden.

### 2026-11-02 · Persistencia de Resenia (cierre de la sección 1)
- **Tarea:** Persistir entidad por entidad (Resenia) · Cargar datos de ejemplo (seed)
- **Herramienta / skill:** Claude Code + `/persistencia Resenia` + `registrar-ia`
- **Pedido (prompt):** "Sí, seguí" (con la última entidad pendiente), y "Ok, implementalo" después del análisis.
- **Resultado:**
  - Revisó el enunciado con `pdftotext`: habla de "puntaje y comentario" y de la "reputación de cada organizador", pero no de una fecha de la reseña.
  - Análisis: colección propia `resenias`, con `compradorId` y `eventoId` como referencias. Descartó embeberla en Evento o en Compra porque se consulta por organizador, atravesando varios eventos.
  - No guarda el organizador (se llega por `evento.organizadorId`), ni `compraId`, ni la fecha. El puntaje del organizador se calcula.
  - Con el ok, creó `reseniaRepository.js` (`buscarPorEventos`, `buscarPorCompradorYEvento` y `buscarTodos`) y un seed de 2 reseñas: Lucía queda con 4.5 de promedio, Martín sin reseñas, y Sofía tiene una compra UTILIZADA sin reseñar para probar en vivo.
  - Lo probó con un script de Node, incluido el cálculo del promedio en dos pasos. Verificó el arranque: "Seed cargado: 4 usuarios, 5 categorias, 6 eventos, 9 compras, 2 resenias".
  - Marcó en `TAREAS.md` las casillas de persistencia y seed: la sección 1 quedó completa.
- **Bien:**
  - Aplicó solo el criterio que yo había usado con `lugar` (no agregar campos que el enunciado no menciona) y descartó la fecha de la reseña.
  - El seed deja preparados casos borde para la sección 2: un organizador sin puntaje y una compra CONFIRMADA de un evento pasado que no puede reseñar.
- **Corregido / problemas:**
  - Ninguna corrección mía al análisis.
  - Quedó abierto para la sección 2: el promedio de un organizador sin reseñas es `null`, y hay que decidir dónde va al ordenar por puntaje.
- **Aprendizaje:** los criterios que fui fijando entidad por entidad (no agregar campos que el enunciado no pide, calcular en vez de duplicar) hicieron que la última entidad saliera sin correcciones.

### 2026-11-02 · Nombres técnicos en inglés
- **Tarea:** preparación de "Crear skill `nuevo-endpoint`" (sección 2), antes de definir las carpetas de rutas y controladores
- **Herramienta / skill:** Claude Code + `registrar-ia`
- **Pedido (prompt):** "mantené la convención del inglés: routes, controller, domain. ¿hay algo que ya quedó en español? habría que dejarlo en inglés"; después elegí "Nivel 1 y 2".
- **Resultado:**
  - Relevó lo técnico que estaba en español y propuso una regla: lo técnico en inglés y lo del dominio en español (entidades, campos, estados), que ya era lo que pasaba con `categoriaRepository`.
  - Separó el cambio en dos niveles: carpetas, archivos y clases (`persistencia/` → `persistence/`, `repositorios/` → `repositories/`, `dominio/` → `domain/`, `Coleccion` → `Collection`, `esquemas.js` → `schemas.js`, `cargarSeed` → `loadSeed`, `crearApp` → `createApp`) y métodos (`insertar`/`buscarPorId`/`buscarTodos` → `insert`/`findById`/`findAll`, `buscarPorComprador` → `findByComprador`, `registrarCambioEstado` → `addCambioEstado`, etc.).
  - Renombró con `git mv` para conservar el historial y actualizó los imports, `CLAUDE.md` (nueva convención **Nombres**), la skill `persistencia` y `docs/persistencia.md`. Las entradas viejas de este registro quedaron como estaban.
  - Lo probó con un script de Node: el seed carga igual (4 usuarios, 5 categorías, 6 eventos, 9 compras, 2 reseñas), las consultas renombradas responden y `/health` contesta.
- **Bien:** el cambio se hizo antes de que existiera el primer endpoint, así que no hubo que tocar rutas ni el swagger.
- **Corregido / problemas:**
  - La convención anterior de `CLAUDE.md` ("nombres de dominio en español") era ambigua, y la IA la había aplicado también a lo técnico. La corregí yo.
  - Los comentarios del código quedaron en español a propósito, porque son explicaciones y no nombres.
- **Aprendizaje:** una convención de nombres ambigua se aplica de más; conviene escribirla con ejemplos de qué va en cada idioma, y cambiarla antes de que haya más código que dependa de ella.

### 2026-11-02 · Convenciones de endpoints y skill `nuevo-endpoint`
- **Tarea:** Crear skill `nuevo-endpoint` (subtareas 1 y 2: convenciones y SKILL.md)
- **Herramienta / skill:** Claude Code + `registrar-ia`
- **Pedido (prompt):** "antes de hacerlo explicame qué es", después "dale" para el análisis y "Aprobado".
- **Resultado:**
  - Explicó con un ejemplo (`POST /compras`) por dónde pasa un request y qué hace cada capa, antes de proponer nada.
  - Propuso seis decisiones, cada una con su recomendación: capas `routes/` → `controllers/` → `domain/` → repositorios; validaciones a mano en `http/validation.js`; clases de error con su status (400, 401, 403, 404, 409) y un `errorHandler` central; códigos y forma de las respuestas (listados como array directo); usuario activo en el header `X-User-Id`, que nunca se toma del body; y ajustes al swagger.
  - Al revisar el swagger encontró dos choques con su propia propuesta y los marcó: el formato de error ya era `{ "error": "mensaje" }` (recomendó mantenerlo en lugar del `{ codigo, mensaje }` que había sugerido), y la skill `swagger` pedía `operationId` en español (lo pasó a `createCompra`, igual que el controlador).
  - Con el ok, creó `.claude/skills/nuevo-endpoint/SKILL.md` (análisis → frena → implementa → `/swagger` + `/probar-caso-de-uso`), sumó el `securityScheme` del usuario activo a la skill `swagger` y resumió las convenciones en `CLAUDE.md`.
- **Bien:** pedirle primero la explicación hizo que las decisiones fueran entendibles antes de aprobarlas, y la revisión de lo existente evitó contradecir el swagger.
- **Corregido / problemas:**
  - Ninguna corrección mía al análisis.
  - La primera propuesta de formato de error no tenía en cuenta el swagger existente; la IA lo detectó sola al leerlo.
  - Intentó editar con Python, que no está instalado en la PC; lo resolvió con las herramientas de edición.
- **Aprendizaje:** pedir "explicame qué es" antes de aprobar me deja decidir con criterio propio y no solo aceptar la recomendación; y conviene que la IA lea lo que ya existe antes de proponer, porque su primera idea puede chocar con decisiones anteriores.

### 2026-11-02 · Base de errores, validaciones y usuario activo
- **Tarea:** Crear skill `nuevo-endpoint` (subtarea 3: la base que la skill da por hecha)
- **Herramienta / skill:** Claude Code + `registrar-ia`
- **Pedido (prompt):** "dale"
- **Resultado:**
  - Creó `backend/src/http/errors.js` (`AppError` y las subclases de 400, 401, 403, 404 y 409) y `http/validation.js` (`requireId`, `requireInteger`, `requireNumber`, `requireString`, `requireDate`, `requireArray`, que devuelven el valor ya convertido).
  - Creó los middlewares `requireUsuario` (lee `X-User-Id` y deja el documento en `req.usuario`) y `notFound` + `errorHandler` (responde `{ "error": "mensaje" }`, 400 para JSON mal formado y 500 genérico para lo no previsto), y los registró en `app.js`.
  - Lo probó con un script de Node que levanta una app con rutas descartables: 15 casos, entre ellos 404 de ruta, JSON roto, header faltante, inválido o de un usuario inexistente, cada validación, un 409 lanzado desde un handler async y un 500.
- **Bien:** la prueba confirmó que Express 5 lleva solo los errores async al `errorHandler`, así que los controladores no van a necesitar `try/catch`.
- **Corregido / problemas:**
  - Ninguna corrección mía.
  - En la prueba, la IA vio que un header `X-User-Id: abc` respondía "Falta indicar el usuario activo", que era engañoso, y lo separó en su propio mensaje.
- **Aprendizaje:** probar cada error con su mensaje real, y no solo el status, muestra cosas que un "devuelve 401" no muestra. Lo voy a exigir también en los endpoints.

### 2026-11-02 · Dominio: cupo disponible y `hayCupoPara`
- **Tarea:** Lógica de dominio (análisis + subtarea de cupo)
- **Herramienta / skill:** Claude Code + `registrar-ia`
- **Pedido (prompt):** "explicame la tarea antes", después "Dale" para el análisis y "Aprobado".
- **Resultado:**
  - Explicó la tarea con la máquina de estados dibujada y las decisiones pendientes desde persistencia. Después presentó el análisis: tres archivos en `domain/` con funciones que reciben los documentos, la tabla de transiciones con quién puede hacer cada paso, y tres dudas propias (no pagar un evento pasado, "desde el día del evento" desde las 00:00, y pruebas con `node --test`).
  - Decisiones aprobadas: una PENDIENTE ocupa cupo; cancelar una PENDIENTE la deja CANCELADA y una CONFIRMADA, REEMBOLSADA; la regla de cancelación va en la tabla de transiciones.
  - Con el ok, creó `domain/compra.js` (`ESTADOS_QUE_OCUPAN_CUPO`, `ocupaCupo`) y `domain/tipoEntrada.js` (`calcularDisponibles`, `hayCupoPara`), funciones puras que no tocan los repositorios.
  - Agregó `npm test` con el runner de Node y `test/domain.test.js` con 5 casos contra el seed: Backstage agotado, la PENDIENTE de la obra que ocupa, la REEMBOLSADA del rock que libera y el filtro por tipo.
- **Bien:** el seed preparado en la sección 1 ya tenía los casos borde, así que los tests salieron directo de ahí.
- **Corregido / problemas:**
  - Ninguna corrección mía.
  - El primer script `node --test test/` falló en Node 24 porque toma la carpeta como archivo. La IA lo cambió a `node --test`, que busca solo los `*.test.js`.
- **Aprendizaje:** pedir la explicación antes del análisis me dejó aprobar decisiones de negocio (que una PENDIENTE ocupe cupo) entendiendo el porqué, y tener tests guardados va a servir cuando los endpoints usen estas reglas.

### 2026-11-02 · Dominio: `tuPrecioEstaEntre`
- **Tarea:** Lógica de dominio (subtarea de precio)
- **Herramienta / skill:** Claude Code + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí"
- **Resultado:**
  - Creó `domain/evento.js` con `tuPrecioEstaEntre(evento, min, max)`: es verdadero si algún tipo de entrada tiene un precio en el rango, con los extremos incluidos, y cualquiera de los dos límites puede faltar.
  - Sumó 4 tests con el rock del seed (45.000 y 80.000): rango que toma un solo tipo, extremos, rango vacío y límites faltantes. La suite quedó en 9 tests, todos pasan.
- **Bien:** salió tal como estaba en el análisis aprobado, sin decisiones nuevas.
- **Corregido / problemas:** ninguno.
- **Aprendizaje:** cuando el análisis deja definidos los casos borde (extremos incluidos, límites opcionales), la implementación y sus tests salen directo y sin idas y vueltas.

### 2026-11-02 · Dominio: transiciones de estado con historial (cierre de la tarea)
- **Tarea:** Lógica de dominio (subtarea de transiciones)
- **Herramienta / skill:** Claude Code + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí"
- **Resultado:**
  - En `domain/evento.js` agregó `yaSeRealizo` (llegó la fecha y hora) y `esElDiaOPosterior` (desde las 00:00 del día del evento).
  - En `domain/compra.js` armó la tabla `TRANSICIONES`: PENDIENTE → CONFIRMADA o CANCELADA, y CONFIRMADA → REEMBOLSADA (las tres las hace el comprador, si el evento no se realizó) o UTILIZADA (la hace el organizador, desde el día del evento). Cualquier otra transición queda rechazada.
  - `estadoAlCancelar` decide entre CANCELADA y REEMBOLSADA. `actualizarEstado` valida en orden la transición (409), quién la pide (403) y la fecha (409), y graba el estado y el historial con `compraRepository.addCambioEstado`.
  - Sumó 8 tests: pagar con el historial, las dos cancelaciones, cancelar una UTILIZADA, pagar o cancelar un evento pasado, permisos, el borde de las 00:00 y las transiciones fuera de la tabla. Las compras que se modifican se crean en el test, para no alterar las del seed. La suite quedó en 17 tests, todos pasan.
  - Marcó en `TAREAS.md` la tarea de lógica de dominio.
- **Bien:** con `ahora` como parámetro se pudo probar el límite exacto de las 00:00 sin depender del día en que corren los tests.
- **Corregido / problemas:**
  - Ninguna corrección mía.
  - La IA había dejado en un test una aserción que no probaba nada; la sacó sola al revisarlo.
  - El dominio importa las clases de error de `http/errors.js`. Funciona, pero mezcla un poco las capas; si molesta, se pueden mover a `domain/`.
- **Aprendizaje:** escribir las reglas como una tabla de datos, y no como varios `if`, deja la regla del enunciado a la vista y la hace fácil de explicar en el video.

### 2026-11-02 · Endpoints de usuarios y categorías
- **Tarea:** Endpoints de usuarios y categorías
- **Herramienta / skill:** Claude Code + `/nuevo-endpoint` (primer uso) + `/swagger` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "segui con lo proximo" y "Aprobado" después del análisis. Antes confirmé que las validaciones de dominio quedan en el dominio y lanzan excepciones.
- **Resultado:**
  - `/nuevo-endpoint` propuso solo dos lecturas públicas: `GET /usuarios`, para elegir el usuario activo porque no hay login, y `GET /categorias`, para los filtros y el selector al crear un evento. Dejó fuera los favoritos (ningún caso de uso numerado ni pantalla los pide), el detalle por id y crear usuarios o categorías.
  - Con el ok, creó los primeros `routes/` y `controllers/` (`list` en cada uno) y los montó en `app.js`.
  - `/swagger` agregó los tags `Usuarios` y `Categorias`, los schemas `Usuario` y `Categoria`, y una respuesta reusable `ErrorInterno` para el 500.
  - `/probar-caso-de-uso` levantó el backend en una pestaña de la terminal y probó con `curl`: los dos listados responden 200 con los datos del seed, una ruta inexistente o con otro método responde 404 en JSON, y Swagger UI muestra los dos endpoints.
- **Bien:** con las convenciones ya fijadas, el primer uso de la skill salió sin decisiones nuevas. El análisis hizo explícito qué se deja afuera y por qué.
- **Corregido / problemas:**
  - Ninguna corrección mía.
  - El comando de verificación de la skill `swagger` fallaba desde la raíz del proyecto porque `yaml` está instalado en `backend/`. La IA lo corrigió en la skill.
  - `POST /usuarios` responde 404 y no 405 (método no permitido). Es aceptable para el TP, pero no es lo más preciso.
- **Aprendizaje:** el análisis no solo dice qué endpoints hacer, también qué no hacer y por qué. Eso me evita implementar cosas que ninguna pantalla va a usar.

### 2026-11-02 · Endpoints de eventos: crear y detalle
- **Tarea:** Endpoints de eventos: crear con tipos de entrada, detalle
- **Herramienta / skill:** Claude Code + `/nuevo-endpoint` + `/swagger` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí" y "Aprobado" después del análisis.
- **Resultado:**
  - Análisis de `POST /eventos` (caso 4, con el organizador tomado del usuario activo) y `GET /eventos/:id` (público). Cuatro dudas, todas aprobadas con la recomendación: categoría inexistente responde 400 y no 404; la respuesta trae resúmenes de categoría y organizador en lugar de los ids; `POST` devuelve la misma forma que el detalle; y se rechazan los tipos de entrada con el nombre repetido.
  - Con el ok, agregó `crearEvento` (categoría existente, fecha futura, nombres sin repetir) y `detalleEvento` (resúmenes y `disponibles` por tipo) a `domain/evento.js`. También creó `eventoController` (`create`, `getById`) y `eventoRoutes`, con `requireUsuario` solo en el `POST`.
  - 5 tests de dominio nuevos: la suite quedó en 22 y pasan todos.
  - `/swagger` agregó el tag `Eventos`, los schemas `EventoDetalle`, `TipoEntrada` y `NuevoEvento`, la respuesta `SinUsuarioActivo` y, por primera vez, el `securityScheme` `usuarioActivo` (botón Authorize con `X-User-Id`).
  - `/probar-caso-de-uso` probó con `curl` 16 casos contra el backend: crear como Martín y leer el evento creado, el festival con Backstage en 0, y cada error de la tabla del análisis (400, 401, 404 y 409). Todos dieron lo esperado.
- **Bien:** los mensajes de validación indican el campo exacto, por ejemplo `tiposEntrada[1].cupo`, así la pantalla de creación puede mostrar dónde está el error.
- **Corregido / problemas:**
  - Ninguna corrección mía.
  - El evento creado en la prueba (id 7) queda en memoria hasta que se reinicie el backend.
  - `domain/evento.js`, `tipoEntrada.js` y `compra.js` se importan en círculo. Funciona porque solo se usan funciones declaradas, pero conviene tenerlo en cuenta si se agregan constantes.
- **Aprendizaje:** cuando la IA propone varias dudas con su recomendación, puedo aprobarlas juntas sin perder control, porque cada una viene con su porqué.

### 2026-11-02 · Búsqueda de eventos
- **Tarea:** Búsqueda de eventos: texto, categoría y orden (precio, fecha, puntaje del organizador)
- **Herramienta / skill:** Claude Code + `/nuevo-endpoint` + `/swagger` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí" y "Aprobado" después del análisis.
- **Resultado:**
  - Análisis de `GET /eventos` (casos 3 y 11) con filtros opcionales: `texto`, `categoriaId`, `precioMin`/`precioMax` (usa `tuPrecioEstaEntre`) y `orden=fecha|precio|puntaje`. Cuatro dudas aprobadas con la recomendación: ocultar siempre los eventos pasados, dirección del orden fija, cada evento como resumen para la tarjeta, y una categoría inexistente devuelve `[]` y no un error.
  - Con el ok, creó `domain/resenia.js` (`calcularPuntajes`: promedio por organizador, que se llega desde el evento reseñado) y agregó a `domain/evento.js` `precioDesde`, los comparadores de orden y `buscarEventos`. Los organizadores sin reseñas van al final y la fecha desempata.
  - Agregó `eventoController.list` y la ruta `GET /eventos`. 6 tests nuevos: la suite quedó en 28 y pasan todos.
  - `/swagger` agregó el endpoint con sus parámetros y el schema `EventoResumen`, con los campos calculados documentados.
  - `/probar-caso-de-uso` probó con `curl` los tres órdenes, el texto sin tildes ni mayúsculas, la categoría, el rango de precio, la categoría inexistente, el texto vacío y 5 errores 400.
  - Corrigió en `docs/persistencia.md` nombres viejos que habían quedado del renombre (`persistence/repositorios/` y `crear`).
- **Bien:** el seed que se armó en la sección 1 (Martín sin reseñas, dos eventos pasados) permitió verificar los tres órdenes y el filtro de pasados sin crear datos.
- **Corregido / problemas:**
  - Ninguna corrección mía.
  - La prueba mostró que `?texto=a&texto=b` respondía "Falta el campo texto". La IA cambió el mensaje por uno que explica el problema.
  - El `sed` del renombre al inglés no había corregido todo `docs/persistencia.md`. Lo encontró recién ahora, al releerlo para esta tarea.
  - Los tests de dominio comparten el estado en memoria (un test crea un evento que aparece en la búsqueda), así que se comparan solo los ids del seed.
- **Aprendizaje:** un renombre automático (`sed`) hay que revisarlo con un `grep` de los nombres viejos en todos los archivos, no solo en el código. Si no, queda documentación desactualizada.

### 2026-11-02 · Endpoints de compras: crear, pagar y marcar utilizada
- **Tarea:** Endpoints de compras: crear (validando cupo), pagar, marcar utilizada
- **Herramienta / skill:** Claude Code + `/nuevo-endpoint` + `/swagger` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí" y "Aprobado" después del análisis.
- **Resultado:**
  - Análisis de `POST /compras` (caso 12), `POST /compras/:id/pago` y `POST /compras/:id/utilizacion`, con una respuesta común. Cuatro dudas aprobadas con la recomendación: acciones como sustantivos en lugar de `PATCH` con el estado, el organizador no puede comprar en su propio evento, los días restantes quedan para "Mis compras", y un evento o tipo inexistente en el body da 400.
  - Con el ok, agregó a `domain/compra.js` `comprar` (evento y tipo existentes, no organizador, evento no realizado, `hayCupoPara`, total calculado) y `detalleCompra` (resúmenes de evento, tipo de entrada y comprador). Pago y utilización reusan `actualizarEstado`, que ya existía.
  - Creó `compraController` (`create`, `pay`, `markUtilizada`, los dos últimos con un mismo helper) y `compraRoutes`, con `requireUsuario` para todo `/compras`. 5 tests nuevos: la suite quedó en 33.
  - `/swagger` agregó el tag `Compras`, los tres endpoints, los schemas `CompraDetalle`, `NuevaCompra`, `CambioEstadoCompra` y `Mensaje`, y respuestas y parámetros reusables (`IdInvalido`, `CompraNoEncontrada`, `CompraId`).
  - `/probar-caso-de-uso` probó con `curl` unos 20 casos: comprar y ver que la Platea del rock baja de 200 a 195, pagar, pagar dos veces, utilizar antes del día, utilizar la compra CONFIRMADA del stand-up pasado como Martín, permisos 403, 404, 400 y los 409 de cupo, evento pasado y organizador comprando.
- **Bien:** como las transiciones ya estaban en el dominio con sus tests, pagar y utilizar fueron dos líneas en el controlador.
- **Corregido / problemas:**
  - Ninguna corrección mía.
  - Como todo `/compras` pide usuario activo, una ruta inexistente bajo `/compras` responde 401 y no 404. Es aceptable.
  - Las compras de prueba (ids 10 y 11) y la compra 9, que quedó UTILIZADA, siguen en memoria hasta reiniciar el backend.
- **Aprendizaje:** haber hecho primero la lógica de dominio con tests separados de los endpoints hizo que esta tarea fuera casi solo conectar piezas. El orden de `TAREAS.md` funcionó.

### 2026-11-02 · Cancelación y reembolso
- **Tarea:** Cancelación / reembolso con sus reglas
- **Herramienta / skill:** Claude Code + `/nuevo-endpoint` + `/swagger` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí" y "Aprobado" después del análisis.
- **Resultado:**
  - Análisis de `POST /compras/:id/cancelacion` (casos 7 y 8). Todas las reglas ya estaban en el dominio (`estadoAlCancelar` y la tabla de transiciones), así que no había que crear ninguna. Dos dudas aprobadas: mantener el orden de errores de las otras acciones (primero el estado, después el permiso) y no agregar un campo de monto, porque el `total` ya dice cuánto se reembolsa.
  - Con el ok, generalizó el helper del controlador para que reciba una función que decide el estado de destino. Así `cancel` quedó como `changeEstado(estadoAlCancelar)`. Agregó la ruta y el endpoint en el swagger.
  - `/probar-caso-de-uso`, con el seed recién cargado (nodemon reinició solo al cambiar los archivos), probó: la CONFIRMADA de Sofía queda REEMBOLSADA y su PENDIENTE queda CANCELADA, las dos con el historial completo; el cupo del rock y de la obra vuelve al total; y respondió 409 para UTILIZADA, evento pasado, ya REEMBOLSADA y ya CANCELADA, 403 para otro comprador, 404, 400 y 401.
- **Bien:** la tarea fue casi solo conectar piezas, porque la regla del enunciado ya estaba resuelta y testeada desde la tarea de dominio.
- **Corregido / problemas:**
  - Ninguna corrección mía.
  - La IA quiso reiniciar el backend escribiendo `rs` en la pestaña de nodemon, pero la herramienta no permite reusar esa pestaña. No hizo falta: nodemon ya se había reiniciado al cambiar los archivos.
- **Aprendizaje:** dejar las reglas de negocio en el dominio desde el principio hace que cada endpoint nuevo sea chico y que el análisis se concentre en las decisiones que de verdad quedan abiertas.

### 2026-11-02 · Mis compras y detalle de compra
- **Tarea:** Listado de compras del comprador (estado + días restantes)
- **Herramienta / skill:** Claude Code + `/nuevo-endpoint` + `/swagger` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí" y "Aprobado" después del análisis.
- **Resultado:**
  - Análisis de `GET /compras` (caso 1), que devuelve las compras del usuario activo como comprador y nunca recibe un `compradorId`. Propuso además `GET /compras/:id`, que no está en `TAREAS.md` pero lo necesita la pantalla de detalle. Cuatro dudas aprobadas: sumar el detalle ahora, `diasRestantes` en todas las respuestas de compra, orden de la más reciente a la más vieja, y dejar las "acciones disponibles" para la pantalla de detalle.
  - Con el ok, agregó a `domain/compra.js` `diasRestantes` (días de calendario, solo si está CONFIRMADA y el evento no pasó) y `puedeVer` (comprador u organizador), y sumó `diasRestantes` a `detalleCompra`. En el controlador agregó `list` y `getById`.
  - 5 tests nuevos, incluidos los bordes de calendario: a las 00:30 del día del evento da 0, y a las 23:59 del día anterior da 1. La suite quedó en 38.
  - `/probar-caso-de-uso` probó con `curl` las compras de Sofía, Juan y Lucía (vacía), el orden, que una compra nueva y pagada aparezca primera con sus días, el detalle visto por la compradora y por la organizadora, y 403, 404, 400 y 401.
- **Bien:** la compra CONFIRMADA de Juan del stand-up pasado, que se armó en el seed de la sección 1, mostró el caso borde de `diasRestantes` en `null` aunque esté confirmada.
- **Corregido / problemas:**
  - Ninguna corrección mía.
  - En un test la IA dejó una línea con un comentario que dudaba de sí mismo ("¿18:00…? no"). La reescribió sola antes de commitear.
  - Se agregó un endpoint que no estaba en `TAREAS.md` (`GET /compras/:id`). Quedó propuesto y aprobado en el análisis, no se metió en silencio.
- **Aprendizaje:** pedirle a la IA que mire qué van a necesitar las pantallas de la sección 3 evita volver al backend más adelante. Igual conviene que lo proponga como duda y no lo agregue por su cuenta.
