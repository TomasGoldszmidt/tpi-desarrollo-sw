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

### 2026-11-02 · Ventas por evento para el organizador
- **Tarea:** Listado de compras por evento para el organizador (estado + disponibles por tipo)
- **Herramienta / skill:** Claude Code + `/nuevo-endpoint` + `/swagger` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí" y "Aprobado" después del análisis.
- **Resultado:**
  - Análisis de `GET /eventos/:id/compras` (caso 2), solo para el organizador. La IA notó que el organizador no tenía forma de encontrar sus eventos (la búsqueda oculta los pasados y es de todos) y propuso `GET /eventos/organizados`. Tres dudas aprobadas: las disponibles por tipo salen del detalle del evento que ya existe (dos pedidos, el listado sigue siendo un array), sumar `organizados`, y no agregar totales por tipo.
  - Con el ok, agregó a `domain/evento.js` `verificarOrganizador` (403) y `eventosOrganizados`. Para no repetir código, extrajo un helper `resumenes` que ahora usan la búsqueda y los organizados. Movió el orden "más reciente primero" a `domain/compra.js` (`masRecientesPrimero`), así lo comparten "Mis compras" y las ventas.
  - En el router, `/organizados` quedó antes de `/:id` para que Express no lo tome como un id. 3 tests nuevos: la suite quedó en 41.
  - `/probar-caso-de-uso` probó con `curl` los eventos de Lucía (con el acústico pasado), de Martín y de Sofía (vacío); las ventas del rock (CONFIRMADA y REEMBOLSADA), del acústico pasado y del partido (CANCELADA); y los errores 403 (Martín pidiendo las ventas del rock), 404, 400 y 401.
- **Bien:** la IA pensó en cómo iba a llegar el organizador a la pantalla de ventas, no solo en el endpoint que pedía la tarea.
- **Corregido / problemas:**
  - Ninguna corrección mía.
  - Agregó otro endpoint que no estaba en `TAREAS.md` (`/eventos/organizados`), propuesto y aprobado en el análisis.
- **Aprendizaje:** antes de dar por cerrada una tarea conviene preguntarse cómo llega el usuario a usarla desde la app. Así salió a la luz que faltaba `organizados`.

### 2026-11-02 · Chat de la compra
- **Tarea:** Chat de la compra: enviar y listar mensajes
- **Herramienta / skill:** Claude Code + `/nuevo-endpoint` + `/swagger` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí" y "Aprobado" después del análisis.
- **Resultado:**
  - Análisis de `GET` y `POST /compras/:id/mensajes` (casos 5 y 6), para el comprador y el organizador, en cualquier estado de la compra y aunque el evento ya haya pasado. Cuatro dudas aprobadas: límite de 500 caracteres, `autor` con nombre en lugar de `usuarioId` (la compra no trae el nombre del organizador), el `POST` devuelve solo el mensaje creado, y nada de tiempo real (websockets sería una dependencia nueva; la pantalla puede refrescar).
  - Con el ok, agregó la opción `maxLength` a `requireString`, `mensajesConAutor` y `enviarMensaje` a `domain/compra.js` (reusa `puedeVer` y `addMensaje`), y `listMensajes` y `createMensaje` al controlador. 4 tests nuevos: la suite quedó en 45.
  - `/probar-caso-de-uso` probó con `curl` la conversación entre Sofía y Lucía en la compra 1, Juan y Martín en una compra CANCELADA, un chat vacío, el 403 de Martín para leer y escribir en una compra ajena, mensaje vacío, sin body, 501 caracteres, 404, 400 y 401.
- **Bien:** ante un resultado raro, la IA no lo dio por bueno ni "arregló" el backend a ciegas: armó una prueba aparte para encontrar la causa real.
- **Corregido / problemas:**
  - Ninguna corrección mía.
  - En la prueba, "¡Gracias!" se guardó como "�Gracias!". La IA sospechó del cliente y no del servidor (los mensajes del seed se veían bien) y lo confirmó mandando el mismo texto desde un archivo UTF-8 y con `fetch`: el backend estaba bien y el problema era curl en Windows con acentos escritos en el comando. Lo anotó en la skill `probar-caso-de-uso`.
- **Aprendizaje:** cuando una prueba falla, primero hay que descartar la herramienta de prueba antes de tocar el código. Y conviene dejar anotado en la skill lo que se aprendió, para que no vuelva a pasar.

### 2026-11-02 · Reseñas: crear y listar por organizador
- **Tarea:** Reseñas: crear (solo compra utilizada) y listar por organizador
- **Herramienta / skill:** Claude Code + `/nuevo-endpoint` + `/swagger` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí" y "Aprobado" después del análisis.
- **Resultado:**
  - Análisis de `POST /resenias` (caso 9) y `GET /usuarios/:id/resenias` (caso 10). Cuatro dudas aprobadas: crear con `eventoId` y no colgado de una compra (la reseña es de comprador + evento, como se decidió en persistencia), puntuación entera de 1 a 5, comentario obligatorio porque el caso lo pide, y listar en `/usuarios/:id/resenias`, que devuelve `[]` para quien no organiza.
  - Con el ok, agregó a `domain/resenia.js` `crearResenia` (evento existente, compra UTILIZADA de ese evento, una sola reseña), `reseniasDeOrganizador` (del evento más reciente al más viejo) y `detalleResenia`. Creó `reseniaController` y `reseniaRoutes`, y colgó el listado de `usuarioRoutes`. 4 tests nuevos: la suite quedó en 49.
  - `/probar-caso-de-uso` probó con un script de `fetch` (por los acentos): las reseñas de Lucía, Sofía reseñando el stand-up de Martín, el 409 por reseñar dos veces o sin compra UTILIZADA, y los 400 de evento inexistente, puntuación 6 o 4.5 y sin detalle. También verificó que después de la reseña Martín pasa de `null` a 4 en la búsqueda por puntaje.
- **Bien:** el seed preparado desde la sección 1 (Sofía con el stand-up UTILIZADO sin reseñar y Juan con el suyo CONFIRMADO) cubrió los casos sin crear datos. La IA aplicó sola la nota de la skill sobre los acentos.
- **Corregido / problemas:** ninguno.
- **Aprendizaje:** dejar escrito en la skill lo que se aprendió en la tarea anterior (los acentos con curl) hizo que esta prueba saliera bien de entrada. Las skills mejoran con el uso.

### 2026-11-02 · Revisión de errores, validaciones y REST (cierre de la sección 2)
- **Tarea:** Manejo de errores y validaciones
- **Herramienta / skill:** Claude Code + `/swagger` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** la IA propuso usar la tarea como revisión final. Le sumé: "cuando recorras cada endpoint revisá si cumple que sea RESTful". Después, "Aplicar todo".
- **Resultado:**
  - Recorrió las 18 rutas y probó casos borde contra el backend antes de proponer nada. Encontró 3 bugs reales: un body de más de 100 KB daba 500; `true` y `[2]` se aceptaban como números (`Number(true)` es 1), así que `cantidad: true` creaba una compra; y bajo `/compras` una URL inexistente daba 401 en lugar de 404, por el `router.use(requireUsuario)`.
  - En lo RESTful marcó: `GET /eventos/organizados` no era un recurso sino un filtro escondido en la ruta; un método equivocado daba 404 en lugar de 405; los 201 no traían `Location`. Recomendó no tocar `/pago`, `/utilizacion` y `/cancelacion`: la alternativa más REST (`POST /compras/:id/historial` con el estado) obligaba a la app a decidir entre CANCELADA y REEMBOLSADA.
  - Con el ok: los helpers numéricos aceptan solo números o textos numéricos; las fechas, solo texto ISO; `requireUrl` para `multimedia`; el `errorHandler` responde 400/413 en español para los errores del body; `MethodNotAllowedError` y `methodNotAllowed` con el header `Allow`, y todos los routers pasaron a `router.route(...).all(methodNotAllowed)`; `requireUsuario` quedó en cada ruta; `Location` en `POST /eventos` y `POST /compras`; `/eventos/organizados` pasó a `GET /usuarios/:id/eventos`, público.
  - Agregó `test/validation.test.js`: la suite quedó en 52 tests. Sincronizó el swagger (ruta movida, `Location`, respuestas comunes en la descripción) y comprobó con un script que las 18 rutas del código coinciden con las 18 del swagger. Actualizó la skill `nuevo-endpoint` y `CLAUDE.md` con las convenciones REST.
  - Prueba de punta a punta con 30 chequeos, todos OK: los casos de la revisión y el flujo completo. Martín crea un evento, Sofía compra el cupo entero, Juan se queda sin cupo, Sofía paga, chatean, Martín ve la venta y marca la entrada UTILIZADA, ya no se puede cancelar, Sofía reseña con 5 y Martín pasa a tener puntaje 5 en la búsqueda.
- **Bien:** la IA probó cada sospecha antes de reportarla, así que los hallazgos eran bugs confirmados y no teóricos.
- **Corregido / problemas:**
  - El pedido de revisar lo RESTful fue mío. La IA no lo había incluido en su propuesta de revisión, y salieron cuatro mejoras de diseño que no eran bugs.
  - Los bugs numéricos venían de la subtarea 3 de la skill `nuevo-endpoint` y sus tests no los habían detectado, porque nunca probaron tipos raros.
  - La app mobile todavía no usa la API, así que mover `/eventos/organizados` no rompió nada.
- **Aprendizaje:** una revisión final con criterios explícitos (en este caso REST) encuentra cosas que la revisión por endpoint no ve, y vale la pena pedirla aunque cada tarea se haya probado por separado. También aprendí a probar tipos raros (booleanos, arrays) y no solo valores fuera de rango.

### 2026-11-02 · Skill `nueva-pantalla`
- **Tarea:** Crear skill `nueva-pantalla` (pantalla, navegación, cliente HTTP)
- **Herramienta / skill:** Claude Code + `registrar-ia`
- **Pedido (prompt):** "sigamos con la proxima tarea que es frontend". Después de la primera propuesta: "en el analisis lo mas importante que deberia aprobar yo es la pantalla, podes crear un boceto y que yo lo tenga q aprobar".
- **Resultado:**
  - Skill en `.claude/skills/nueva-pantalla/SKILL.md`, con el mismo esquema que `nuevo-endpoint`: una pantalla por vez, aprobación antes del código, prueba y cierre.
  - El centro del análisis es un boceto HTML del tamaño de un celular, con datos reales del seed, los estados que importan (vacío, error, sin cupo) y anotaciones numeradas en cada elemento tocable. Se muestra en la conversación y se guarda en `docs/bocetos/`. Debajo va un análisis breve (caso de uso, ruta, endpoints, acciones, archivos, dudas).
  - Convenciones: Expo Router (como pide `mobile/AGENTS.md`), cliente HTTP con `fetch` que manda `X-User-Id` y muestra el `{ error }` del backend, usuario activo en un Context, componentes y `theme.js` compartidos, y volver a pedir los datos después de cada acción.
  - En la prueba, la captura del emulador se compara con el boceto aprobado.
  - Se sumó a la tabla de skills de `CLAUDE.md`.
- **Bien:** la IA reusó la estructura de las skills anteriores, y quedó avisado de antemano que Expo Router trae dependencias nuevas (se deciden en la subtarea siguiente).
- **Corregido / problemas:** la primera propuesta tenía un análisis técnico (endpoints, archivos, estados) y no mostraba la pantalla. Le pedí que lo que apruebe sea un boceto visual.
- **Aprendizaje:** en el frontend, lo que conviene aprobar antes de que la IA escriba código es cómo se ve la pantalla, no la lista de archivos. Un boceto con datos reales permite corregir el diseño cuando todavía no cuesta nada.

### 2026-11-02 · Navegación, cliente HTTP y usuario activo (primera pantalla)
- **Tarea:** Navegación, cliente HTTP y selección de usuario activo
- **Herramienta / skill:** Claude Code + `/nueva-pantalla` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí". Sobre el boceto: "la app no tiene logo (podria ser un ticket o algo asi) y una vez ingresado no se ve nada que identifique a la app". Después, "Aprobado".
- **Resultado:**
  - Primer uso de `/nueva-pantalla`. El boceto (`docs/bocetos/usuario-activo.html`) tenía tres pantallas con los usuarios reales del seed: elegir usuario, sin conexión al backend y la app con pestañas.
  - Antes de aprobar pregunté si estaba bien que no hubiera roles. La IA lo verificó contra el PDF: el diagrama tiene un solo `Usuario` y comprador y organizador son relaciones (`Compra.comprador`, `Evento.organizador`), así que las tres pestañas quedan visibles para todos.
  - Con mi pedido del logo, rehizo el boceto con el ticket verde del enunciado ("AI" + "Ticket It"): grande en la selección y en el error, chico en el header de todas las pestañas, y pasó el color de la app a verde.
  - Con el ok, instaló Expo Router (`expo-router`, `react-native-screens`, `react-native-safe-area-context`, `expo-linking`) con `npx expo install`, consultando antes la documentación de instalación y de pestañas. Creó el cliente `api/client.js` (manda `X-User-Id` y lanza el `{ error }` del backend), `UsuarioContext`, `theme.js`, los componentes `Logo` (dibujado con Views, sin imágenes), `Avatar`, `EstadoCarga` y `Seccion`, la pantalla de selección y las tres pestañas provisorias. Borró `App.js` e `index.js`.
  - `/probar-caso-de-uso` en el emulador: lista de usuarios, entrar como Sofía, cambiar de pestaña, el chip vuelve a la selección, error sin red (se apagó el wifi del emulador con adb) y Reintentar con la red de vuelta, y entrar como Lucía. Coincide con el boceto.
- **Bien:** el boceto hizo que discutiera el diseño (el logo, los roles) antes de que hubiera una línea de código.
- **Corregido / problemas:**
  - Le pedí el logo: el primer boceto no identificaba a la app.
  - La IA se equivocó en el análisis: dijo que `@expo/vector-icons` venía con `expo` y no estaba instalado. Lo avisó y me preguntó antes de agregarlo.
  - `npx expo install @expo/vector-icons` falló por un conflicto de dependencias opcionales de la versión web de Expo Router (`react-dom` pedía otro `react`). Se instaló con `--legacy-peer-deps`. Un `npm install` normal ahora funciona, con una advertencia.
  - El puerto 8081 estaba ocupado por otro proceso (java) y Expo se levantó en el 8083.
  - No corrió `npx expo lint`, porque la primera vez instala ESLint como dependencia nueva y queda pendiente de mi ok.
- **Aprendizaje:** aprobar un boceto me hizo pensar en cosas que en un análisis de texto no hubiera visto, como la identidad de la app y si hacen falta roles. Y cuando la IA afirma que algo "ya viene incluido", conviene que lo verifique antes de dar por buena la decisión.

### 2026-11-02 · ESLint en la app mobile
- **Tarea:** cierre de "Navegación, cliente HTTP y selección de usuario activo" (faltaba el lint)
- **Herramienta / skill:** Claude Code + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Sí, instalalo" (ESLint para `npx expo lint`).
- **Resultado:**
  - Instaló `eslint` y `eslint-config-expo` como dependencias de desarrollo, y también `typescript`, que la configuración de Expo necesita aunque el proyecto sea JavaScript. Se generó `eslint.config.js`.
  - El lint encontró un error real en la pantalla de selección: `setState` sincrónico dentro de un `useEffect` (`react-hooks/set-state-in-effect`), que provoca renders en cascada. El primer arreglo de la IA tampoco pasó, porque la regla sigue las funciones que llama el efecto.
  - Quedó un hook `src/hooks/useCarga.js` que pide los datos dentro del efecto con `.then`, descarta respuestas viejas si la pantalla se desmonta y expone `{ data, loading, error, recargar }`. Lo van a reusar todas las pantallas que cargan datos. Lint sin errores.
  - Volvió a probar en el emulador el error sin red y Reintentar: funciona igual.
  - Anotó en la skill `nueva-pantalla` que hay que usar `useCarga` y que, por el conflicto de `react-dom`, las instalaciones van con `--legacy-peer-deps`.
- **Bien:** el lint encontró un problema que la prueba en el emulador no mostraba, porque la pantalla funcionaba bien.
- **Corregido / problemas:** el conflicto de `react-dom` volvió a aparecer al instalar ESLint, y hizo falta `typescript`, que no estaba previsto. El primer arreglo del error de lint no alcanzó.
- **Aprendizaje:** que una pantalla "ande" en el emulador no quiere decir que esté bien escrita. Vale la pena tener el lint desde la primera pantalla, porque el patrón que se corrige ahora (`useCarga`) se repite en todas las que siguen.

### 2026-11-02 · Pantalla de catálogo
- **Tarea:** Pantalla de catálogo: búsqueda, categorías y ordenamiento
- **Herramienta / skill:** Claude Code + `/nueva-pantalla` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí". Sobre el boceto: "el buscador esta bien ahi pero quizas los otros filtros podrian agregarse en un modal que se abre con un boton de filtro". Después, "Aprobado".
- **Resultado:**
  - El primer boceto (`docs/bocetos/catalogo.html`) tenía buscador, una fila de categorías y un selector de orden, todo arriba de la lista. Con mi pedido, la IA pasó categoría y orden a un modal que se abre desde abajo con un botón de filtros. El botón muestra cuántos filtros hay activos, y debajo del buscador quedan como etiquetas que se pueden quitar.
  - El filtro por precio (`precioMin`/`precioMax`, `tuPrecioEstaEntre`) quedó afuera porque ningún caso de uso lo pide en la app.
  - Con el ok creó `api/eventos.js` y `api/categorias.js`, `format.js` (fechas, precios y puntajes en es-AR hechos a mano, sin depender de Intl), `EventoCard`, `FiltrosModal` (con el `Modal` de React Native, sin dependencias) y la pantalla, que usa `useCarga`. La búsqueda espera medio segundo después de la última tecla.
  - Prueba en el emulador: la lista por fecha, el orden por puntaje con Martín (sin reseñas) al final, Conferencias sin resultados con las dos etiquetas y el contador en 2, Limpiar filtros, la búsqueda "caba" (2 eventos), y el error sin red con Reintentar.
- **Bien:** el boceto con datos reales permitió discutir dónde van los filtros antes de escribir código. Cambiarlo costó un boceto, no una pantalla.
- **Corregido / problemas:**
  - Le pedí el modal de filtros: el primer boceto ponía todos los controles a la vista.
  - En el emulador las horas salían 3 horas corridas (23:00 en lugar de 20:00), porque el emulador está en UTC. La IA lo corrigió mostrando siempre la hora argentina, ya que los eventos son en Argentina.
  - Metro no tomaba los cambios: Expo Go seguía conectado a una sesión vieja. La IA se dio cuenta de que la prueba de Reintentar de la subtarea anterior había corrido el código viejo, lo reconoció y la repitió acá. Dejó anotado en `probar-caso-de-uso` cómo verificar que la app corre el código nuevo.
  - Tocar un evento todavía no lleva a ningún lado: el detalle es la subtarea siguiente.
- **Aprendizaje:** una prueba solo vale si se sabe qué versión del código se está probando. La IA dio por buena una prueba que en realidad corrió código viejo, y solo lo descubrió porque una pantalla nueva no aparecía. Conviene verificar que el bundle se haya recargado antes de dar algo por probado.

### 2026-11-03 · Detalle de evento y reseñas del organizador
- **Tarea:** Pantalla de detalle de evento con reseñas del organizador
- **Herramienta / skill:** Claude Code + `/nueva-pantalla` + `/nuevo-endpoint` + `/swagger` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí". Sobre el boceto: "no entendi los bocetos, cuando aparece cada pantalla", y después "no deberia mostrar informacion del codigo de la app" y la propuesta de "que aparezca unicamente el organizador y que me deje ir a ver sus resenas [...] esa pantalla se puede reutilizar". Luego "Aprobado, en el back" y "Aprobado, los dos".
- **Resultado:**
  - El primer boceto mostraba la misma pantalla en tres columnas (arriba, scrolleada y otro evento) y no se entendía. Además tenía dibujada dentro del celular una nota técnica ("si el evento no existe...").
  - Con mi propuesta, la IA verificó contra el caso 10 ("que las reseñas se visualicen en los Eventos de cada organizador"). Propuso una versión intermedia: en el detalle, la tarjeta del organizador con su puntaje, una reseña de muestra y "Ver las N reseñas", y una pantalla aparte y reutilizable con todas las reseñas. Rehizo el boceto como un solo celular largo, con las notas afuera.
  - El detalle no traía el puntaje del organizador. En lugar de calcularlo en la app, con `/nuevo-endpoint` se agregó `organizador.puntaje` y `cantidadResenias` a `GET /eventos/:id` y un endpoint nuevo `GET /usuarios/:id` (el usuario con su puntaje), los dos con `puntajeDe` en el dominio, que reusa `calcularPuntajes`. 2 tests nuevos (suite en 53), swagger actualizado y probado con curl: 200, 404, 400 y 405.
  - En la app: `eventos/[id].js` (galería deslizable, tipos de entrada con disponibles o "Agotado", la tarjeta del organizador y el botón Comprar fijo abajo), `usuarios/[id]/resenias.js` y los componentes `Estrellas` y `ReseniaItem`.
  - Prueba en el emulador: el Festival con las dos imágenes, Backstage agotado, la reseña de muestra de Juan, las 2 reseñas de Lucía con el promedio 4,5, el partido de Martín sin reseñas y sin enlace, y "No existe el evento 99" con un enlace directo.
- **Bien:** la propuesta de pantalla aparte fue mía, y la IA no la aceptó ni la rechazó sin más: la contrastó con el texto del caso de uso y propuso cómo cumplirlo sin perder la idea.
- **Corregido / problemas:**
  - El primer boceto era confuso y mezclaba notas para mí con lo que ve el usuario. Lo marqué yo.
  - En el emulador, el botón Comprar quedaba debajo de la barra de gestos de Android. Se corrigió con el margen seguro (`useSafeAreaInsets`).
  - Al aplicar ese arreglo apareció un error en pantalla ("useSafeAreaInsets doesn't exist"), porque Fast Refresh tomó el archivo a mitad de la edición. Se fue al recargar.
  - El subtítulo "Organizadora" del boceto se cambió por "Reseñas de sus eventos", para no deducir el género a partir del nombre.
  - El botón Comprar todavía no lleva a ningún lado: es la subtarea siguiente.
- **Aprendizaje:** un boceto también tiene que ser claro para quien lo aprueba: si muestra la misma pantalla partida en columnas, o mezcla notas para mí con lo que ve el usuario, no sirve para decidir. Y vale la pena proponer ideas propias de diseño, pero pidiéndole a la IA que las contraste con la consigna.

### 2026-11-03 · Flujo de compra
- **Tarea:** Flujo de compra: tipo de entrada y cantidad
- **Herramienta / skill:** Claude Code + `/nueva-pantalla` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí". Sobre el boceto: "no debe mostrar el estado 409, nunca muestres nada del codigo". Después, "Aprobado".
- **Resultado:**
  - Boceto (`docs/bocetos/compra.html`): elegir el tipo de entrada y la cantidad con el total, la compra hecha (PENDIENTE de pago), la pantalla cuando no alcanza el cupo y el botón "Es tu evento" en el detalle de un evento propio, porque el backend no deja que el organizador compre en su evento.
  - Con el ok: `api/compras.js` y `eventos/[id]/comprar.js`. La cantidad va de 1 a las disponibles del tipo elegido, y si las disponibles bajan, baja con ellas. Si la compra falla se muestra el mensaje del backend y se vuelve a pedir el evento. La compra hecha no tiene flecha para volver al formulario. "Ver mi compra" lleva por ahora a Mis compras, porque el detalle de la compra es la subtarea 3.7.
  - Prueba en el emulador: Sofía elige 3 VIP; mientras tanto Juan compra 98 por la API y quedan 2. Al confirmar aparece "No hay cupo suficiente: quedan 2 entradas", VIP pasa a "2 disponibles" y la cantidad baja sola a 2. Confirma y se ve "Compraste 2 entradas VIP" por $ 360.000, que quedó PENDIENTE en el backend. Lucía ve "Es tu evento" en su festival.
- **Bien:** la carrera por el cupo (dos personas comprando a la vez) se probó de verdad, combinando el emulador con una compra por la API en el medio.
- **Corregido / problemas:**
  - El primer boceto tenía otra vez texto técnico dentro del celular ("409", "la pantalla vuelve a pedir el evento"). Es la segunda vez que lo marco: la IA lo agregó como regla en la skill `nueva-pantalla` y en su memoria, y rehizo la pantalla del error tal como la vería el usuario.
  - Otra vez Fast Refresh mostró un error en pantalla porque la IA agregó el uso de `useUsuario` antes del import. Quedó anotado en la skill: primero el import.
- **Aprendizaje:** cuando corrijo lo mismo dos veces, tiene que quedar escrito en la skill o en la memoria, no alcanza con que la IA lo arregle esa vez. Y conviene probar los casos de concurrencia simulándolos, porque en el emulador solo no se pueden provocar.

### 2026-11-03 · Sin información técnica y pantallas de carga
- **Tarea:** ajustes pedidos antes de seguir con la sección 3 (no son un ítem de TAREAS.md)
- **Herramienta / skill:** Claude Code + `/nueva-pantalla` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "quita el texto cuando ingresas de en donde esta levantado el back (todo lo que tenga q ver con el codigo borralo)" y "agrega entre procesos una pantalla de carga con un spinner". Sobre el boceto: que la pantalla B tuviera los íconos de las pestañas, y la pregunta de si el griseado de la C era a propósito.
- **Resultado:**
  - Se sacó de la pantalla de inicio la dirección del backend y "Revisá que esté levantado". Los errores de conexión ahora dicen "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo." y los inesperados "Algo salió mal. Intentá de nuevo." También se actualizó el boceto de esa pantalla.
  - Boceto de carga (`docs/bocetos/carga.html`) con tres variantes: pantalla completa con el logo al abrir una pantalla, spinner en el lugar de la lista al buscar o filtrar, y un velo sobre la pantalla al confirmar una acción. Con mis observaciones se agregaron los íconos a las pestañas y se dibujó entera la pantalla de compra debajo del velo, que antes parecía un texto suelto.
  - `useCarga` ahora sabe a qué pedido corresponde cada respuesta, así que `loading` también es `true` cuando cambian los filtros. Componentes nuevos `PantallaCarga` y `CargaEncima`, y `EstadoCarga` con mensaje. Se usaron en el inicio, el catálogo, el detalle, las reseñas y la compra.
  - Prueba con la red del emulador demorada a propósito: "Buscando eventos…", "Cargando el evento…" con el logo, el velo "Confirmando tu compra…" y el error sin red con el mensaje nuevo.
- **Bien:** demorar la red del emulador (`adb emu network delay`) permitió ver y capturar estados que con la red normal duran milisegundos.
- **Corregido / problemas:**
  - En el boceto, la IA había simplificado las pestañas a solo texto y la pantalla de compra debajo del velo no se entendía. Lo marqué yo.
  - El velo salió abajo del botón en vez de cubrir la pantalla: `StyleSheet.absoluteFillObject` no aplicaba. Se cambió por la posición absoluta escrita a mano.
  - En la prueba la IA cometió varios errores con el emulador: las teclas para recargar se escribieron en el buscador, la red lenta cortó la descarga del bundle y Expo Go quedó roto hasta recargar, un script tocó botones en la pantalla equivocada, y llegó a reabrir la app sin red. Todo se resolvió, pero llevó varias vueltas.
  - Las compras de prueba quedaron en el backend y se volvió al seed reiniciándolo.
- **Aprendizaje:** la app tiene que hablarle al usuario, no al programador: los mensajes técnicos que me sirvieron para depurar no tienen que llegar a la pantalla. Y para probar estados que duran muy poco (una carga) hay que provocarlos a propósito, en este caso con la red lenta.

### 2026-11-03 · Mis compras
- **Tarea:** Pantalla "Mis compras" con estados y días restantes
- **Herramienta / skill:** Claude Code + `/nueva-pantalla` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "dale" y "Aprobado", sin cambios al boceto.
- **Resultado:**
  - Boceto (`docs/bocetos/mis-compras.html`) con las compras reales de Sofía, las de Juan con los cinco estados y la lista vacía de Lucía.
  - `EstadoBadge` con un color por estado (pendiente ámbar, confirmada verde, utilizada gris, cancelada roja, reembolsada violeta), pensado para reusar en el detalle de la compra y en las ventas. `CompraCard` muestra los días que faltan solo en las confirmadas ("Faltan 20 días", "Es hoy" o "El evento ya pasó") y apaga las canceladas y reembolsadas.
  - La pestaña vuelve a pedir la lista cada vez que se entra (`useFocusEffect`) y al deslizar hacia abajo. Para eso `recargar` de `useCarga` pasó a ser estable entre renders.
  - Prueba en el emulador: las 4 compras de Sofía; una compra nueva hecha por la API aparece al volver a la pestaña; las 5 de Juan con todos los estados, incluido el stand-up confirmado que ya pasó; Lucía sin compras, y "Explorar eventos" lleva al catálogo.
- **Bien:** el seed preparado en la sección 1 tenía todos los estados repartidos entre Sofía y Juan, así que la pantalla se probó entera sin crear datos.
- **Corregido / problemas:**
  - Ninguna corrección mía al boceto.
  - Expo Go se quedó trabado al abrir y hubo que cerrarlo y reabrirlo con un enlace directo.
  - Tocar una compra todavía no hace nada: el detalle es la subtarea siguiente.
- **Aprendizaje:** cuando el seed está pensado para cubrir los casos, cada pantalla se prueba completa en un par de minutos. Preparar los datos al principio del TP sigue rindiendo.

### 2026-11-03 · Detalle de compra y chat
- **Tarea:** Detalle de compra: acciones (pagar, cancelar, reseñar) y chat
- **Herramienta / skill:** Claude Code + `/nueva-pantalla` + `/nuevo-endpoint` + `/swagger` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Dale, seguí". Sobre el chat: "para actualizar el chat no podemos hacer un pull based?". Después, "dale, implementalo", y "Sí, en el backend" para la reseña.
- **Resultado:**
  - Boceto (`docs/bocetos/detalle-compra.html`): compra pendiente con Pagar y Cancelar, confirmada con "Cancelar y pedir reembolso", utilizada con el formulario de reseña, y el chat en una pantalla aparte.
  - La IA había propuesto que el chat se actualizara solo al entrar, porque se habían descartado los websockets. Le propuse consultar cada tanto, y quedó así: mientras el chat está abierto, pide los mensajes cada 5 segundos (con `useFocusEffect`, así se corta al salir) y, si un pedido falla, muestra "Sin conexión. Reintentando…".
  - Backend: `GET /compras/:id` (y los listados de compras) ahora traen `resenia`, la reseña del comprador para ese evento o null, con `reseniaDeCompra` en el dominio. Un test nuevo (suite en 54) y swagger actualizado.
  - App: `compras/[id].js` (estado, días, entradas, reseña, vista previa del chat, historial y acciones con confirmación y velo de carga), `compras/[id]/chat.js`, `ReseniaForm` y las funciones de la API. Las tarjetas de Mis compras y "Ver mi compra" ahora abren el detalle. `formatDiasRestantes` quedó en `format.js`, porque estaba repetido.
  - Prueba en el emulador: Sofía paga Bernarda Alba (pasa a Confirmada, "Faltan 5 días"), la cancela y confirma (queda Reembolsada, sin acciones), reseña el stand-up con 4 estrellas (Martín pasa a tener puntaje 4) y escribe en el chat del Rock. Lucía contesta por la API y el mensaje aparece solo en menos de 5 segundos. Al volver, la vista previa dice "4 mensajes".
- **Bien:** la consulta periódica resolvió el chat sin tocar el backend, y la idea fue mía.
- **Corregido / problemas:**
  - En el boceto, la IA escribió "Chat con la organizadora", deduciendo el género por el nombre. Lo cambió por el nombre de la persona.
  - El aviso "Elegí de 1 a 5 estrellas" quedaba visible después de elegirlas; se corrigió.
  - El teclado tapaba el campo del chat. `KeyboardAvoidingView` no funcionó, ni con el `behavior` que recomienda la guía de Expo, porque la app es de borde a borde. Se resolvió con un hook propio (`useAlturaTeclado`) que mide desde dónde empieza el teclado. Hicieron falta tres intentos.
  - En un paso intermedio, la IA dejó un comentario JSX en un lugar inválido; lo vio antes de probar.
  - El organizador ve la compra pero todavía no puede "Marcar como utilizada": queda para las ventas (3.9).
  - No se verificó directamente que la consulta periódica se corte al salir del chat, porque el backend no registra los pedidos. Se confía en la limpieza de `useFocusEffect`.
- **Aprendizaje:** la IA da por cerradas algunas opciones ("sin websockets no hay actualización") que tienen alternativas simples. Vale la pena preguntarle "¿y si hacemos X?". Y lo que en la documentación parece resuelto (el teclado) hay que probarlo en el emulador.

### 2026-11-03 · Cargas que faltaban y "Pendiente de pago"
- **Tarea:** ajustes pedidos sobre la sección 3 (no son un ítem de TAREAS.md)
- **Herramienta / skill:** Claude Code + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "Recorda agregar las pantallas de carga" y "Cuando compras dice 'PENDIENTE de pago' deberia ir 'Pendiente de pago'".
- **Resultado:**
  - La IA revisó todas las pantallas buscando procesos sin carga y encontró tres. En el detalle de la compra, después de pagar o cancelar, el velo se iba antes de que llegara el estado nuevo; ahora sigue con "Actualizando tu compra…" hasta que llega. En la compra, al volver a pedir las entradas después de un error de cupo, aparece "Actualizando las entradas…". En el chat, al enviar, aparece "Enviando tu mensaje…".
  - La compra hecha ahora usa `EstadoBadge`, la misma etiqueta de estado que el resto de la app, en lugar de un texto escrito a mano en mayúsculas.
  - Prueba en el emulador: la etiqueta "Pendiente de pago" después de comprar, y con la red demorada, el velo sobre la compra hasta que aparece Confirmada.
- **Bien:** la IA no se limitó al caso que yo había visto: revisó todas las pantallas y encontró el estado viejo que se veía un instante después de pagar.
- **Corregido / problemas:**
  - Las dos cosas las marqué yo: la IA había dejado procesos sin carga a la vista, aunque eso ya estaba en la skill, y había escrito el estado a mano en lugar de reusar el componente.
  - El velo del chat no se pudo capturar, porque la demora de red del emulador no se aplicó a tiempo en ninguno de los dos intentos. Quedó sin verificar en pantalla.
- **Aprendizaje:** las reglas de la skill no alcanzan si no se revisan al cerrar cada pantalla. Para el resto, conviene pedirle a la IA que verifique explícitamente la carga en cada proceso antes de dar la pantalla por terminada.

### 2026-11-03 · Pantalla de creación de evento
- **Tarea:** 3. Front-End · Pantalla de creación de evento (organizador)
- **Herramienta / skill:** Claude Code + `/nueva-pantalla` + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "segui con la siguiente tarea". Con el boceto, "Ok, implementá", que también aprobó el selector de fecha nativo.
- **Resultado:**
  - Boceto (`docs/bocetos/crear-evento.html`) con seis estados: Mis eventos con el botón, los datos del evento, el selector de fecha, los tipos de entrada, el error del backend con el botón deshabilitado y "Creando el evento…".
  - Dependencia nueva, aprobada antes de instalarla: `@react-native-community/datetimepicker` 9.2.1, con `npx expo install … -- --legacy-peer-deps`. Agregó su plugin en `app.json`. Se usa la API imperativa de Android (`DateTimePickerAndroid.open`), leída del README de la versión instalada, porque la página de Expo SDK 58 no la documenta.
  - App:
    - `eventos/nuevo.js`: formulario con nombre, descripción, chips de categorías (`GET /categorias`), fecha y hora nativas sin días pasados, lugar, links de imágenes opcionales y tipos de entrada que se agregan y se quitan (siempre queda uno).
    - Botón "Crear evento" en la pestaña Mis eventos. La lista de eventos queda para la 3.9.
    - `crearEvento` en la API. `fechaArgentinaISO`, `formatDiaElegido` y `formatHoraElegida` en `format.js`: la fecha elegida se toma como hora argentina.
  - Validación en la app: el botón queda deshabilitado hasta que todo esté completo, con avisos de cupo menor a 1, precio inválido y link que no empieza con http(s). Los mensajes del backend para esos campos nombran cosas como `tiposEntrada[0].cupo`, que no se pueden mostrar. La fecha no futura y el nombre repetido sí se muestran con el mensaje del backend.
  - Al crear, `router.replace` lleva al detalle del evento, así "volver" vuelve a Mis eventos.
  - Pruebas:
    - API con curl: 201, 409 por nombre repetido y 409 por fecha pasada.
    - Emulador con Juan: link `ftp://` (aviso y "Agregar" deshabilitado), cupo 0 (aviso y botón deshabilitado), hoy a las 20:00 cuando ya habían pasado ("La fecha del evento tiene que ser futura"), "General" y "general" ("Hay tipos de entrada con el nombre repetido") y la creación correcta. El evento se guardó para el 20 de noviembre a las 20:00 (23:00 UTC), con su imagen, y "volver" llevó a Mis eventos.
- **Bien:** el boceto se aprobó sin cambios. Los errores del backend que ya estaban en español se mostraron tal cual, sin escribir nada nuevo.
- **Corregido / problemas:**
  - Al abrir, Expo Go mostró una versión vieja de la app (la prueba de conexión del setup). Se reabrió contra el Metro actual.
  - Al manejar el emulador con adb, unos borrados que eran para el campo "Lugar" cayeron en "Nombre", y el evento de prueba quedó como "Taller". Fue un error al manejar el emulador, no de la app.
  - No se llegaron a capturar las pantallas "Creando el evento…" ni "Cargando el formulario…", porque el backend local respondió antes de la captura. Las dos usan los mismos componentes de carga que las otras pantallas.
  - La IA cambió dos cosas respecto del análisis: `TipoEntradaForm` quedó dentro de la pantalla y no en `components/`, porque se usa en un solo lugar, y se sumó la validación de precio, cupo y link en la app.
- **Aprendizaje:** antes de mostrar un mensaje del backend tal cual, hay que mirar qué dice. Los de las reglas de negocio sirven para el usuario, pero los de validación de formato nombran campos técnicos, así que esos casos conviene validarlos en la app.

### 2026-11-03 · Campos faltantes marcados en "Crear evento"
- **Tarea:** ajuste sobre la pantalla de creación de evento (sección 3)
- **Herramienta / skill:** Claude Code + `/probar-caso-de-uso` + `registrar-ia`
- **Pedido (prompt):** "en el formulario no agregamos asterisco a los campos obligatorios, sino que pusimos opcional a los que no lo son, esta bien eso? es un buen patron?". Después, "dale" a la propuesta.
- **Resultado:**
  - La IA respondió que marcar el campo opcional está bien cuando la mayoría de los campos son obligatorios, como en este formulario: un opcional contra unos doce obligatorios. Pero señaló otro problema: el botón deshabilitado no decía qué faltaba. Propuso dejarlo siempre habilitado y marcar lo que falta al tocarlo.
  - Boceto actualizado: el estado E muestra los campos faltantes en rojo, con un aviso arriba del botón. El error del backend pasó a ser el estado E2.
  - `eventos/nuevo.js`: el botón está siempre habilitado. Si falta algo, no llama al backend: marca en rojo cada campo con lo que hay que hacer ("Elegí una categoría", "Completá el cupo"), muestra "Completá los campos marcados en rojo" y baja hasta el primero que falta. La marca se va apenas se completa el campo.
  - Prueba en el emulador: con solo el nombre cargado, al tocar "Crear evento" bajó hasta "Descripción" y marcó todo lo que faltaba, incluidos los campos del tipo de entrada. Al elegir "Música" se fue la marca de la categoría.
- **Bien:** la pregunta sobre los asteriscos llevó a encontrar un problema real de la pantalla que había quedado aprobada.
- **Corregido / problemas:**
  - Para bajar hasta el primer campo, la IA guardó las posiciones en un `useRef`, y el lint lo rechazó (`react-hooks/refs`, por escribir el ref desde un handler armado durante el render). Se pasaron a un estado que se actualiza en `onLayout`.
  - Marqué que "Completá el cupo" quedaba mal ubicado: la IA había puesto los avisos de precio y cupo debajo de la fila, y el del cupo aparecía debajo del precio. Se movió cada uno debajo de su campo, como ya estaban los de fecha y hora.
  - Después del cambio, no se volvió a probar en el emulador la creación correcta ni los errores del backend. Ese código no cambió, salvo el chequeo previo.
- **Aprendizaje:** que una pantalla esté aprobada no significa que esté bien diseñada. Preguntarle a la IA "¿es un buen patrón?" sobre algo concreto sirve para revisarla con criterio y encontrar problemas que en el boceto no se veían.

### 2026-11-03 · Pantalla de ventas por evento
- **Tarea:** Pantalla de ventas por evento (organizador)
- **Herramienta / skill:** Claude Code + `/nueva-pantalla` + `/probar-caso-de-uso` + `/registrar-ia`
- **Pedido (prompt):** "siguiente tarea". Después de ver el boceto: "aprobado, solo estan mal los logos del catalogo, mis compras y mis eventos pero entiendo que es solo el boceto".
- **Resultado:**
  - Boceto `docs/bocetos/ventas-evento.html` con datos del seed: Mis eventos de Lucía separados en "Próximos" y "Ya realizados", las ventas de Rock Nacional (una compra confirmada y una reembolsada), el Festival con Backstage agotado, un evento sin ventas, la carga y el error sin conexión.
  - La pestaña "Mis eventos" ahora lista los eventos del usuario activo (`GET /usuarios/:id/eventos`) y los vuelve a pedir cada vez que se vuelve a la pestaña.
  - Pantalla nueva `eventos/[id]/ventas.js`: las entradas disponibles por tipo, con una barra de lo vendido, salen de `GET /eventos/:id`, y las compras de `GET /eventos/:id/compras`. Cada compra muestra estado, comprador, tipo × cantidad, mensajes, total y fecha, y abre el detalle de compra existente, donde está el chat con el comprador.
  - Prueba en el emulador: los estados A a F coincidieron con el boceto. Tocar una compra abrió su detalle con el chat; sin red apareció el error y "Reintentar" recuperó las ventas. Además, se creó por API una compra de Juan en el Meetup de Sofía y, al deslizar para recargar, apareció como pendiente y las disponibles bajaron de 30 a 27.
- **Bien:** no hizo falta tocar el backend: los endpoints ya devolvían todo, incluidas las disponibles por tipo. El análisis detectó que `POST /compras/:id/utilizacion` no lo usa ninguna pantalla, y quedó como decisión aparte en lugar de meterse sin avisar.
- **Corregido / problemas:**
  - Los logos de las pestañas del boceto eran cuadrados genéricos, no los íconos de la app. Lo marqué yo, y lo dejamos así porque es solo el boceto.
  - La IA cambió tres cosas respecto del boceto y del análisis:
    - El header lleva la flecha y el logo, como las otras pantallas apiladas, en vez del título "Ventas", que pasó a ser una etiqueta arriba del nombre del evento.
    - Las tarjetas quedaron dentro de cada pantalla y no en `components/`, porque se usan en un solo lugar.
    - La carga de Mis eventos usa `EstadoCarga` debajo del botón, como Mis compras, en vez de `PantallaCarga`.
  - El seed no tiene eventos sin ventas: el vacío se probó con un evento creado antes desde la app, que se pierde al reiniciar el backend.
  - No se probó en el emulador el 403, que aparece cuando el usuario no es el organizador: desde la app no se llega a esa pantalla con otro usuario. Se verificó por API.
- **Aprendizaje:** antes de pedir una pantalla conviene revisar qué endpoints del backend no usa ninguna. Así apareció que nadie podía marcar una compra como utilizada, una acción que de otro modo se habría descubierto recién en la prueba integral.
