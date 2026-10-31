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
