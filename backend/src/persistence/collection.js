// Colección de documentos en memoria (estilo MongoDB).
// Siempre devuelve copias para que el estado solo cambie a través de la colección.
export class Collection {
  #documents = new Map();
  #lastId = 0;

  insert(data) {
    const { id: _ignored, ...rest } = structuredClone(data);
    const document = { id: ++this.#lastId, ...rest };
    this.#documents.set(document.id, document);
    return structuredClone(document);
  }

  findById(id) {
    const document = this.#documents.get(Number(id));
    return document ? structuredClone(document) : null;
  }

  findAll(filter = () => true) {
    return [...this.#documents.values()]
      .filter(filter)
      .map((document) => structuredClone(document));
  }

  update(id, changes) {
    const document = this.#documents.get(Number(id));
    if (!document) return null;

    const { id: _ignored, ...rest } = structuredClone(changes);
    const updated = { ...document, ...rest };
    this.#documents.set(document.id, updated);
    return structuredClone(updated);
  }

  delete(id) {
    return this.#documents.delete(Number(id));
  }
}
