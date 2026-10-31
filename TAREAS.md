# AI Ticket It - Tareas

## 0. Setup técnico inicial
- [x] Inicializar repositorio git y `.gitignore`
- [ ] Crear estructura de carpetas (`backend/`, `mobile/`)
- [ ] Inicializar proyecto Node + Express (scripts, nodemon, CORS, JSON)
- [ ] Inicializar proyecto React Native con Expo
- [ ] Verificar conexión celular ↔ PC por IP local
- [ ] Crear registro de uso de IA (prompts, aciertos, correcciones)
- [ ] Crear skills de Claude Code para la implementación (`.claude/skills/`) y registrar su uso

## 1. Persistencia (en memoria)
- [ ] Definir modelo de dominio: Usuario, Categoria, Evento, TipoEntrada, Compra, EstadoCompra, CambioEstadoCompra, Mensaje, Resenia
- [ ] Implementar repositorios en memoria (CRUD genérico + generación de IDs)
- [ ] Cargar datos de ejemplo (seed) al iniciar el servidor

## 2. Back-End
- [ ] Lógica de dominio: cupo disponible, `hayCupoPara`, `tuPrecioEstaEntre`, transiciones de estado con historial
- [ ] Endpoints de usuarios y categorías
- [ ] Endpoints de eventos: crear con tipos de entrada, detalle
- [ ] Búsqueda de eventos: texto, categoría y orden (precio, fecha, puntaje del organizador)
- [ ] Endpoints de compras: crear (validando cupo), pagar, marcar utilizada
- [ ] Cancelación / reembolso con sus reglas
- [ ] Listado de compras del comprador (estado + días restantes)
- [ ] Listado de compras por evento para el organizador (estado + disponibles por tipo)
- [ ] Chat de la compra: enviar y listar mensajes
- [ ] Reseñas: crear (solo compra utilizada) y listar por organizador
- [ ] Manejo de errores y validaciones

## 3. Front-End
- [ ] Navegación, cliente HTTP y selección de usuario activo
- [ ] Pantalla de catálogo: búsqueda, categorías y ordenamiento
- [ ] Pantalla de detalle de evento con reseñas del organizador
- [ ] Flujo de compra: tipo de entrada y cantidad
- [ ] Pantalla "Mis compras" con estados y días restantes
- [ ] Detalle de compra: acciones (pagar, cancelar, reseñar) y chat
- [ ] Pantalla de creación de evento (organizador)
- [ ] Pantalla de ventas por evento (organizador)

## 4. Cierre técnico
- [ ] Prueba integral de todos los casos de uso en el celular
- [ ] Corrección de bugs y pulido visual
- [ ] README con instrucciones para levantar el proyecto
- [ ] Elegir el flujo a presentar y preparar guion del video (incluir las skills creadas y cómo ayudaron)
- [ ] Redactar conclusión sobre el uso de IA
- [ ] Grabar y entregar el video (5-10 min)
