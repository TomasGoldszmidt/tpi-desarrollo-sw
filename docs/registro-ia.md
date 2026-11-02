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
