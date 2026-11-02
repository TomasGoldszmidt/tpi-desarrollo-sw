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
- **Aprendizaje:** (completar)

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
- **Aprendizaje:** (completar)

### 2026-11-02 · Ids numéricos vs UUID
- **Tarea:** Persistir entidad por entidad (decisión transversal)
- **Herramienta / skill:** Claude Code
- **Pedido (prompt):** "¿la persistencia de usuarios no debería ser con UUID?"; después "el choque entre colecciones no me parece una razón tan fuerte".
- **Resultado:** comparó las dos opciones en una tabla y se inclinó apenas por UUID, por el choque de ids entre colecciones. Cuando le discutí ese argumento, lo revisó: el choque solo pasaría por un bug de programación y las referencias se validan. Cambió la recomendación a mantener los ids numéricos.
- **Bien:** reconoció que su argumento era débil y lo explicó, en lugar de sostenerlo por haberlo propuesto.
- **Corregido / problemas:** su primera recomendación le daba demasiado peso a un riesgo poco realista. Tuve que cuestionarla yo.
- **Aprendizaje:** (completar)

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
- **Aprendizaje:** (completar)

### 2026-11-02 · Nomenclatura de repositorios
- **Tarea:** Persistir entidad por entidad (convención)
- **Herramienta / skill:** Claude Code
- **Pedido (prompt):** "modificá los repositorios para que sigan la nomenclatura entidadRepository; hacé el cambio en el código y en la skill".
- **Resultado:** renombró `usuarioRepositorio.js` → `usuarioRepository.js` y `categoriaRepositorio.js` → `categoriaRepository.js` con `git mv`, actualizó los imports del seed, `docs/persistencia.md` y la convención de la skill `/persistencia`. Verificó que el backend sigue arrancando.
- **Bien:** al estar la convención escrita en la skill, el cambio queda fijado para todas las entidades que faltan.
- **Corregido / problemas:** la convención original de la skill la había propuesto la IA; la cambié a mi gusto.
- **Aprendizaje:** (completar)

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
- **Aprendizaje:** (completar)

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
- **Aprendizaje:** (completar)
