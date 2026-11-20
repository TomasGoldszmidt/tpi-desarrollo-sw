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
- [x] Inicio de sesión, registro y edición del perfil (`POST /sesiones`, `POST /usuarios`, `PATCH /usuarios/:id`)
- [x] Favoritos: listar, marcar y quitar (`GET /usuarios/:id/favoritos`, `PUT` y `DELETE /usuarios/:id/favoritos/:eventoId`)
- [x] Notificaciones calculadas y marcar como leídas (`GET /usuarios/:id/notificaciones`, `PUT /usuarios/:id/notificaciones/lectura`)
- [x] Marcar como leída una notificación y el chat de una compra (`PUT /usuarios/:id/notificaciones/:notificacionId/lectura`, `PUT /compras/:id/mensajes/lectura`)

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
- [x] Pantallas de inicio de sesión, registro y edición del perfil (reemplazan la elección de usuario)
- [x] Mis compras: filtrar y diferenciar por estado
- [x] Favoritos: corazón en el catálogo y el detalle, y pestaña Favoritos
- [x] Pantalla de notificaciones (se marcan como leídas al entrar), con la campana en el header (después se cambió: se marcan al abrir cada una, ver abajo)
- [x] Mensajes de cada evento: bandeja de conversaciones responsive
- [x] Notificaciones: se marcan como leídas al abrir cada una, con "Marcar todas como leídas"
- [x] Chats: se marcan como leídos al abrirlos; los indicadores muestran mensajes nuevos, y Mis compras tiene acceso directo al chat

## 4. Cierre técnico
- [x] Prueba integral de todos los casos de uso en el celular
- [x] Corrección de bugs y pulido visual
- [x] README con instrucciones para levantar el proyecto
- [x] Elegir el flujo a presentar y preparar guion del video (incluir las skills creadas y cómo ayudaron)
- [x] Redactar conclusión sobre el uso de IA
- [ ] Grabar y entregar el video (5-10 min)

## 5. Paginación
- [x] Catálogo de a páginas, con scroll infinito (`GET /eventos?pagina=&limite=`, helper `http/pagination.js`, hook `usePaginado`)
- [x] Reseñas de un organizador de a páginas (`GET /usuarios/:id/resenias`)
- [x] Notificaciones de a páginas, con `noLeidas` para la campana (`GET /usuarios/:id/notificaciones`)
- [x] Mis eventos de a páginas, con filtro Próximos / Ya realizados / Con mensajes nuevos (`GET /usuarios/:id/eventos`)
- [x] Mis compras de a páginas, con el orden y el filtro por estado en el backend (`GET /compras`)
- [x] Ventas de un evento de a páginas, con "Ver más" (`GET /eventos/:id/compras`)
- [x] Bandeja de mensajes de un evento de a páginas, con "Ver más" (`GET /eventos/:id/compras?conMensajes=true`)
- [x] "Ver más" en todas las listas, en lugar del scroll infinito (Catálogo, Reseñas, Notificaciones, Mis eventos y Mis compras)

## 6. Pruebas y rediseño
- [x] Prueba de todas las funcionalidades contra la consigna (132 pruebas de API) y análisis de UX
- [x] Confirmación al pagar y aviso cuando el evento ya pasó, en el detalle de la compra
- [x] Bocetos del rediseño de todas las pantallas, responsive (artefacto "AI Ticket It responsive")
- [x] Tema y componentes comunes: escala de letra, botones, estados con ícono, avisos y tamaños de pantalla
- [x] Rediseño de la cuenta: inicio de sesión, registro, perfil, menú y pestañas (barra lateral en tablet horizontal)
- [x] Rediseño del catálogo, filtros (con precio), detalle del evento, compra en pasos y reserva
- [x] Rediseño de favoritos, reseñas, Mis compras, detalle de compra, chat y notificaciones
- [x] Resumen de ventas y filtro por estado en `GET /eventos/:id/compras`
- [x] Rediseño de Mis eventos, ventas, mensajes y crear evento
- [ ] Prueba del rediseño en el emulador (teléfono y tablet)
- [x] Límite de largo de los textos del evento en el backend
- [x] Un solo componente de filtros (`FiltroChips`) en una línea deslizable: categorías del catálogo, Mis compras, Mis eventos y ventas de un evento
