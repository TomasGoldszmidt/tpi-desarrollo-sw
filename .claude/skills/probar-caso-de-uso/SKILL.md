---
name: probar-caso-de-uso
description: Prueba de punta a punta un caso de uso de AI Ticket It contra el backend (requests con curl) y, si hay pantalla, en el emulador Android (captura con adb). Usar después de implementar un endpoint o una pantalla, o cuando el usuario pida "probá X" / "verificá que funcione".
---

# Probar caso de uso

Objetivo: demostrar con evidencia que un caso de uso funciona, incluidos los casos de error. No alcanza con que el código compile.

## Entorno

- Backend: `backend/`, se levanta con `npm run dev` en `0.0.0.0:3000`. Salud: `GET http://localhost:3000/health`.
- App: Expo en el emulador Android (AVD `Pixel_8`). La IP de la PC en la LAN es la que use `REACT_NATIVE_PACKAGER_HOSTNAME` (hoy `192.168.1.10`; verificar con `ipconfig` si algo falla).
- adb: `$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe` (no está en el PATH).
- La persistencia es en memoria: reiniciar el backend vuelve al seed. Si una prueba depende del estado, decirlo.

## Pasos

1. **Identificar el caso de uso** en el enunciado o en `TAREAS.md` y escribir antes de probar qué se espera: camino feliz + al menos un caso de error (validación, cupo insuficiente, estado inválido, recurso inexistente).
2. **Backend arriba:** `curl -s -m 5 http://localhost:3000/health`. Si no responde, levantarlo en una pestaña de la terminal (`npm run dev` en `backend/`) para que el usuario la vea; no dejar procesos huérfanos.
3. **Probar la API** con `curl -s -i` (status + body). Encadenar los IDs que devuelve cada respuesta en lugar de hardcodearlos.
4. **Probar la pantalla** si el caso de uso tiene UI y el emulador está abierto (`adb devices`):
   - Captura: `adb exec-out screencap -p > <scratchpad>/captura.png` y mirarla con Read.
   - Si hay que navegar, describirle al usuario qué tocar o usar `adb shell input tap X Y` con coordenadas tomadas de la captura.
   - **Antes de probar, confirmar que la app corre el código nuevo:** si la pantalla no cambió después de editar, Expo Go puede haber quedado conectado a un Metro viejo. Abrir de nuevo la app con `adb shell am start -a android.intent.action.VIEW -d exp://<IP>:<puerto> host.exp.exponent` y verificar en la terminal de Expo que aparezca un `Android Bundled` nuevo.
   - Sin red: `adb shell svc wifi disable` y `adb shell svc data disable` (y `enable` para volver), para probar los errores de conexión.
   - El emulador está en UTC: las horas se comparan contra la hora argentina que muestra la app (`src/format.js`).
   - La tecla atrás (`keyevent 4`) en la primera pestaña cierra la app; para cerrar el teclado usar `keyevent 111`.
5. **Reportar** una tabla corta:

| Caso | Request / acción | Esperado | Obtenido | OK |
|---|---|---|---|---|

6. Si algo falla: mostrar la salida real, diagnosticar la causa y proponer el arreglo **sin aplicarlo** hasta que el usuario dé el ok.

## Reglas

- Nunca declarar que funciona sin haberlo ejecutado; si una parte no se pudo probar (ej: emulador cerrado), decirlo.
- Las capturas y salidas temporales van al scratchpad, no al repo.
- En Windows, curl manda mal los acentos y la ñ escritos directo en `-d` (llegan como `�`). Para bodies con texto en español, escribir el JSON en un archivo UTF-8 del scratchpad y mandarlo con `--data-binary @archivo`, o usar `fetch` desde `node -e`.
- Al terminar, sugerir `/registrar-ia` si la prueba encontró algo interesante (un bug, un caso borde).
