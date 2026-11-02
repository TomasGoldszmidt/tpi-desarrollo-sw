---
name: registrar-ia
description: Agrega una entrada al registro de uso de IA (docs/registro-ia.md) con lo hecho en la tarea actual. Usar al terminar una subtarea de TAREAS.md, cuando el usuario pida "registrá esto" / "anotalo en el registro", o al cerrar una sesión de trabajo.
---

# Registrar uso de IA

El TP exige reflexionar en el video sobre el uso de IA (ventajas, desventajas, dificultades, aprendizajes). `docs/registro-ia.md` es la bitácora que alimenta esa conclusión, así que cada entrada tiene que ser concreta y honesta.

## Pasos

1. Leer `docs/registro-ia.md` para respetar la plantilla y ver la última entrada (no duplicar algo ya registrado).
2. Identificar qué se hizo desde la última entrada: subtarea de `TAREAS.md`, commits (`git log --oneline`), decisiones y problemas que surgieron en la conversación.
3. Agregar **una entrada por subtarea** al final de la sección "Entradas", con este formato:

```markdown
### AAAA-MM-DD · Título corto
- **Tarea:** ítem de TAREAS.md
- **Herramienta / skill:** Claude Code + skills usadas (ej: `/probar-caso-de-uso`)
- **Pedido (prompt):** lo que pidió el usuario, citando sus palabras si son cortas
- **Resultado:** qué hizo la IA, con lo técnico relevante
- **Bien:** qué salió bien o ahorró tiempo
- **Corregido / problemas:** qué hubo que corregir, qué falló, qué tuvo que hacer el usuario a mano
- **Aprendizaje:** qué se lleva el usuario
```

4. Commitear el registro junto con el resto de la subtarea, o solo si no hay otros cambios.

## Reglas

- **No inventar ni exagerar.** Si no hubo correcciones, poner "ninguno". Los errores de la IA (código que no anduvo, suposiciones equivocadas, cosas que el usuario corrigió) son lo más valioso para el video: registrarlos siempre.
- Mencionar explícitamente las **skills** usadas, incluida esta, porque el video las va a mostrar.
- Fecha en formato `AAAA-MM-DD`, con la fecha real del día.
- El campo **Aprendizaje** es del usuario: proponerlo, pero avisarle que lo revise y lo reescriba con sus palabras.
- Escribir en español rioplatense, breve; viñetas si el resultado tiene varios pasos.
