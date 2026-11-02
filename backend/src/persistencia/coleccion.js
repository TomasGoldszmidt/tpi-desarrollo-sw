// Colección de documentos en memoria (estilo MongoDB).
// Siempre devuelve copias para que el estado solo cambie a través de la colección.
export class Coleccion {
  #documentos = new Map();
  #ultimoId = 0;

  insertar(datos) {
    const { id: _ignorado, ...resto } = structuredClone(datos);
    const documento = { id: ++this.#ultimoId, ...resto };
    this.#documentos.set(documento.id, documento);
    return structuredClone(documento);
  }

  buscarPorId(id) {
    const documento = this.#documentos.get(Number(id));
    return documento ? structuredClone(documento) : null;
  }

  buscarTodos(filtro = () => true) {
    return [...this.#documentos.values()]
      .filter(filtro)
      .map((documento) => structuredClone(documento));
  }

  actualizar(id, cambios) {
    const documento = this.#documentos.get(Number(id));
    if (!documento) return null;

    const { id: _ignorado, ...resto } = structuredClone(cambios);
    const actualizado = { ...documento, ...resto };
    this.#documentos.set(documento.id, actualizado);
    return structuredClone(actualizado);
  }

  eliminar(id) {
    return this.#documentos.delete(Number(id));
  }
}
