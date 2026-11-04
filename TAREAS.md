# AI Ticket It - Tareas

## 0. Setup técnico inicial
- [x] Inicializar repositorio git y `.gitignore`
- [x] Crear estructura de carpetas (`backend/`, `mobile/`)
- [x] Inicializar proyecto Node + Express (scripts, nodemon, CORS, JSON)
- [x] Inicializar proyecto React Native con Expo
- [x] Verificar conexión dispositivo mobile ↔ backend (emulador Android + Expo Go)
- [x] Crear registro de uso de IA (prompts, aciertos, correcciones)
- [x] Crear skills base de Claude Code (`registrar-ia`, `probar-caso-de-uso`) en `.claude/skills/`

## 1. Persistencia (en memoria)
- [x] Crear skill `persistencia` (análisis por entidad → ok → implementación)
- [x] Persistir entidad por entidad con `/persistencia` (seguimiento en `docs/persistencia.md`): Usuario, Categoria, Evento, TipoEntrada, Compra, EstadoCompra, CambioEstadoCompra, Mensaje, Resenia
- [x] Colección genérica en memoria (CRUD + generación de IDs), se crea con la primera entidad
- [x] Cargar datos de ejemplo (seed) al iniciar el servidor

## 2. Back-End
- [x] Crear skill `nuevo-endpoint` (ruta, controlador, validaciones, errores)
- [x] Lógica de dominio: cupo disponible, `hayCupoPara`, `tuPrecioEstaEntre`, transiciones de estado con historial
- [x] Endpoints de usuarios y categorías
- [x] Endpoints de eventos: crear con tipos de entrada, detalle
- [x] Búsqueda de eventos: texto, categoría y orden (precio, fecha, puntaje del organizador)
- [x] Endpoints de compras: crear (validando cupo), pagar, marcar utilizada
- [x] Cancelación / reembolso con sus reglas
- [x] Listado de compras del comprador (estado + días restantes)
- [x] Listado de compras por evento para el organizador (estado + disponibles por tipo)
- [x] Chat de la compra: enviar y listar mensajes
- [x] Reseñas: crear (solo compra utilizada) y listar por organizador
- [x] Manejo de errores y validaciones

## 3. Front-End
- [x] Crear skill `nueva-pantalla` (pantalla, navegación, cliente HTTP)
- [x] Navegación, cliente HTTP y selección de usuario activo
- [x] Pantalla de catálogo: búsqueda, categorías y ordenamiento
- [x] Pantalla de detalle de evento con reseñas del organizador
- [x] Flujo de compra: tipo de entrada y cantidad
- [x] Pantalla "Mis compras" con estados y días restantes
- [x] Detalle de compra: acciones (pagar, cancelar, reseñar) y chat
- [x] Pantalla de creación de evento (organizador)
- [x] Pantalla de ventas por evento (organizador)

## 4. Cierre técnico
- [x] Prueba integral de todos los casos de uso en el celular
- [x] Corrección de bugs y pulido visual
- [x] README con instrucciones para levantar el proyecto
- [x] Elegir el flujo a presentar y preparar guion del video (incluir las skills creadas y cómo ayudaron)
- [ ] Redactar conclusión sobre el uso de IA
- [ ] Grabar y entregar el video (5-10 min)
