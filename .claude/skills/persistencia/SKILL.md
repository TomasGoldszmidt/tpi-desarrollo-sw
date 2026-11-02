---
name: persistencia
description: Analiza e implementa la persistencia en memoria (orientada a documentos) de UNA entidad del dominio de AI Ticket It por vez - decide si se persiste y cómo, presenta el análisis para aprobación y recién con el ok crea los archivos. Usar con "/persistencia <Entidad>" o "/persistencia siguiente", o cuando el usuario pida persistir una entidad.
---

# Persistencia de una entidad

La persistencia es **en memoria y orientada a documentos** (estilo MongoDB): colecciones de objetos JSON planos con `id`, donde cada relación se resuelve **embebiendo** el documento hijo o **referenciando** por id. Se trabaja **una entidad por invocación**, con aprobación del usuario antes de escribir código.

Archivos de apoyo:
- [referencia-dominio.md](referencia-dominio.md): diagrama de clases del enunciado y casos de uso. Leerlo siempre.
- `docs/persistencia.md`: estado y decisiones aprobadas de cada entidad. Es la fuente de verdad de lo ya decidido.

## Paso 0 · Elegir la entidad

- Si el usuario nombró una entidad, usar esa. Con "siguiente", tomar la primera `pendiente` de la tabla de `docs/persistencia.md`.
- Leer las decisiones ya aprobadas para no contradecirlas. Si una entidad ya decidida se va a ver afectada, avisarlo en el análisis.
- Leer el código existente en `backend/src/persistencia/` para respetar sus convenciones.

## Paso 1 · ¿Necesita persistencia propia?

Responder con criterio y justificando contra los casos de uso:

| Situación | Decisión |
|---|---|
| Tiene identidad y ciclo de vida propios, se consulta sola o la referencian varias entidades | **Colección propia** |
| Solo existe dentro de otra entidad y siempre se lee junto con ella | **Embebida** en el documento padre |
| Es un enum o un valor fijo | **Constante en código**, no se persiste |
| Se puede calcular a partir de otros datos (ej: entradas disponibles, puntaje promedio) | **No se persiste, se calcula**; salvo que haya una razón de performance justificada |

## Paso 2 · ¿Cómo se persiste?

Si se persiste, definir:

1. **Colección:** nombre en plural y minúsculas, o documento padre donde va embebida.
2. **Forma del documento:** un ejemplo JSON real con datos de ejemplo.
3. **Relaciones:** para cada una, decir si se embebe o se referencia por id, y por qué. Criterios:
   - Se **embebe** si el hijo no tiene sentido sin el padre, se lee siempre junto con él y no crece sin límite.
   - Se **referencia** si el hijo tiene vida propia, es compartido, o se consulta por separado.
4. **Consultas que debe soportar el repositorio**, sacadas de los casos de uso. Por ejemplo: buscar por texto, filtrar por categoría, compras por comprador, compras por evento, reseñas por organizador.
5. **Datos de ejemplo (seed):** cuántos documentos y cuáles hacen falta para poder probar los casos de uso, incluyendo casos borde como un evento pasado, un cupo agotado o una compra utilizada.

## Paso 3 · Entregar el análisis y FRENAR

Presentar el análisis con este formato y **no escribir código hasta que el usuario dé el ok**:

```markdown
## Persistencia: <Entidad>
**Decisión:** colección propia `<nombre>` | embebida en `<Padre>` | constante | calculada
**Por qué:** ...
**Documento de ejemplo:** ```json ... ```
**Relaciones:** tabla (relación · embebe/referencia · motivo)
**Consultas del repositorio:** lista de métodos con el caso de uso que cubre cada uno
**Seed:** qué datos de ejemplo se cargan
**Archivos a crear o modificar:** lista
**Dudas / alternativas:** lo que el usuario debería decidir
```

Si el usuario corrige algo, ajustar el análisis y volver a presentarlo hasta que lo apruebe.

## Paso 4 · Implementar (solo con ok)

Convenciones de `backend/src/persistencia/`, que se crean la primera vez:

- `coleccion.js`: clase genérica `Coleccion`.
  - Guarda los documentos en un `Map` y genera ids numéricos incrementales por colección.
  - Métodos: `insertar`, `buscarPorId`, `buscarTodos(filtro?)`, `actualizar(id, cambios)`, `eliminar`.
  - Devuelve **copias** (`structuredClone`), para que nadie pueda modificar el estado sin pasar por el repositorio.
- `repositorios/<entidad>Repository.js` (ej: `usuarioRepository.js`, importado como `usuarioRepository`): una instancia de `Coleccion` más las consultas específicas del Paso 2.
  - Exporta funciones con nombres de dominio en español, como `buscarPorCategoria`.
- `seed.js`: carga los datos de ejemplo. Se llama una vez al iniciar el servidor desde `src/index.js`.
  - Las referencias usan los ids que devuelve `insertar`; no se escriben a mano.

Reglas:

- ES Modules (`import`/`export`, con `.js` en los imports relativos) y nombres en español, igual que el resto del backend.
- Los repositorios solo guardan y consultan. Las reglas de negocio (`hayCupoPara`, transiciones de estado, validaciones) van en la sección 2 de TAREAS.md, no acá.
- No agregar dependencias.

## Paso 5 · Verificar y cerrar

1. Probar el repositorio con un script corto de Node: insertar, buscar, cada consulta específica y que el seed cargue bien. Mostrar la salida.
2. Si el backend está corriendo, confirmar que sigue levantando bien con el seed.
3. Actualizar `docs/persistencia.md`: pasar la entidad a `implementada` y anotar la decisión final. Si se decidió que no se persiste, marcarla como `no se persiste` con el motivo.
4. Proponer el commit y sugerir `/registrar-ia`, sobre todo si el usuario corrigió el análisis, porque eso es material para el video.
