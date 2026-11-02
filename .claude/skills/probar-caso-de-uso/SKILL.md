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
5. **Reportar** una tabla corta:

| Caso | Request / acción | Esperado | Obtenido | OK |
|---|---|---|---|---|

6. Si algo falla: mostrar la salida real, diagnosticar la causa y proponer el arreglo **sin aplicarlo** hasta que el usuario dé el ok.

## Reglas

- Nunca declarar que funciona sin haberlo ejecutado; si una parte no se pudo probar (ej: emulador cerrado), decirlo.
- Las capturas y salidas temporales van al scratchpad, no al repo.
- Al terminar, sugerir `/registrar-ia` si la prueba encontró algo interesante (un bug, un caso borde).
