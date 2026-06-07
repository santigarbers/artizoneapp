# Artizone — Roadmap

Cada fase debe estar completa y estable antes de avanzar a la siguiente.
Marcá los items con [x] a medida que los completás.

---

## FASE 1 — Fundación: Auth + Perfil básico
> Objetivo: un usuario puede registrarse, iniciar sesión y tener un perfil propio.

### Setup inicial
- [x] Crear proyecto Expo con Expo Router
- [ ] Configurar ESLint y Prettier
- [x] Conectar repositorio a GitHub
- [x] Configurar variables de entorno (.env.local)
- [x] Inicializar cliente de Supabase (`lib/supabase.ts`)

### Autenticación
- [x] Registro con email y contraseña
- [x] Login con email y contraseña
- [ ] Login con Google (OAuth)
- [x] Logout
- [x] Persistencia de sesión (usuario sigue logueado al reabrir la app)
- [x] Protección de rutas (redirigir a login si no hay sesión)

### Perfil propio
- [x] Crear tabla `profiles` en Supabase
- [x] Crear perfil automáticamente al registrarse
- [x] Pantalla para editar perfil (nombre, bio, géneros, instrumentos)
- [x] Subir foto de perfil a Supabase Storage
- [x] Ver perfil propio

### Criterio de éxito de Fase 1
Un usuario puede registrarse, completar su perfil con foto y volver a entrar sin perder la sesión.

---

## FASE 2 — Descubrir: Swipe de músicos ← FASE ACTIVA
> Objetivo: el usuario puede explorar músicos con una experiencia tipo swipe y enviar invitaciones de conexión de forma natural.

### Modelo de datos
- [x] Agregar campo `looking_for` en tabla `profiles` (texto libre: "busco banda", "jam sessions", "grabar", etc.)
- [ ] Agregar campo `media` en tabla `profiles` o tabla separada `profile_media` (fotos + videos)
- [x] Crear tabla `swipes` para registrar decisiones (user_id, target_id, direction: 'left' | 'right')
- [x] Evitar mostrar músicos ya vistos (query excluye swipes previos)

### Experiencia de swipe
- [x] Stack de tarjetas con músicos (de a uno, apiladas visualmente)
- [x] Cada tarjeta muestra: foto principal, nombre, géneros, instrumentos, "qué está buscando"
- [ ] Scroll dentro de la tarjeta para ver más: bio, fotos adicionales, videos
- [x] Swipe a la derecha → enviar invitación de conexión (estado `pending`)
- [x] Swipe a la izquierda → descartar (no vuelve a aparecer)
- [x] Botones de acción visibles debajo de la tarjeta (✕ y ♥) además del swipe
- [x] Animación de swipe fluida con feedback visual (overlay verde/rojo según dirección)
- [x] Pantalla de "no hay más músicos cerca" cuando se acaban las tarjetas
- [x] Lógica para no mostrar el propio perfil

### Filtros del descubrimiento
- [ ] Filtrar por género musical
- [ ] Filtrar por instrumento
- [ ] Filtrar por distancia (sin mostrar ubicación exacta — solo radio aproximado)
- [ ] Botón para limpiar filtros activos
- [ ] Indicador visual de filtros activos

### Criterio de éxito de Fase 2
✅ El usuario puede hacer swipe sobre músicos, ver su perfil completo con multimedia, y al hacer swipe derecho se genera una invitación de conexión.

---

## FASE 3 — Salas: Mapa de espacios musicales
> Objetivo: el usuario puede encontrar salas de ensayo, locales de música y espacios culturales cerca suyo.

### Modelo de datos
- [ ] Crear tabla `venues` (nombre, tipo, dirección, coordenadas, teléfono, website, foto, horarios)
- [ ] Tipos de venue: sala de ensayo, local de instrumentos, bar con música en vivo, estudio de grabación, espacio cultural
- [ ] Carga inicial de venues con datos reales (carga manual o integración con Google Places API)

### Mapa de venues
- [ ] Tab "Salas" con mapa centrado en ubicación del usuario
- [ ] Marcadores diferenciados por tipo de venue (ícono distinto por categoría)
- [ ] Tap en marcador abre tarjeta con info del venue
- [ ] Tarjeta del venue: nombre, tipo, dirección, horarios, teléfono, link a Google Maps
- [ ] Filtrar venues por tipo (sala de ensayo, local, bar, estudio)
- [ ] Distancia aproximada desde la ubicación del usuario

### Criterio de éxito de Fase 3
El usuario puede ver en el mapa espacios musicales cercanos, filtrarlos por tipo y obtener info de contacto para ir.

---

## FASE 4 — Conexiones e invitaciones
> Objetivo: gestionar las invitaciones generadas por el swipe y conectar músicos.

### Recepción de invitaciones
- [x] Pantalla de invitaciones recibidas
- [x] Aceptar invitación (cambia estado a `accepted`)
- [x] Rechazar invitación (cambia estado a `rejected`)

### Notificaciones
- [ ] Push notification al recibir una invitación
- [ ] Push notification al ser aceptado
- [ ] Badge en el ícono de conexiones con invitaciones pendientes

### Criterio de éxito de Fase 4
Un usuario recibe la invitación generada por el swipe, la acepta, y ambos quedan conectados.

---

## FASE 5 — Comunicación: Chat en tiempo real
> Objetivo: músicos conectados pueden conversar por chat.

### Chat
- [x] Crear tabla `messages` en Supabase
- [x] Abrir chat al aceptar una invitación
- [x] Enviar y recibir mensajes en tiempo real (Supabase Realtime)
- [x] Indicador de mensaje leído / no leído
- [x] Scroll automático al último mensaje

### Lista de conversaciones
- [x] Pantalla con todas las conversaciones activas
- [x] Preview del último mensaje en cada conversación
- [x] Badge con mensajes no leídos
- [ ] Push notification al recibir un mensaje nuevo
- [ ] Indicador "está escribiendo..."

### Criterio de éxito de Fase 5
Dos músicos conectados pueden mandarse mensajes en tiempo real.

---

## FASE 6 — Pulido: UX y lanzamiento
> Objetivo: la app está lista para mostrarle a usuarios reales.

### UX general
- [x] Rediseño del bottom navigation menu
- [x] Skeletons de carga en todas las pantallas principales
- [x] Estados de error en todas las acciones críticas
- [x] Estados vacíos (sin conexiones, sin mensajes, sin videos)
- [x] Avatar del músico en el header del chat
- [ ] Animaciones básicas de transición entre pantallas

### Onboarding
- [ ] Pantalla de bienvenida con propuesta de valor clara
- [ ] Flujo de onboarding (2-3 pantallas explicando cómo funciona la app)
- [ ] Prompt para completar el perfil al registrarse por primera vez
- [ ] Prompt para activar notificaciones push en el momento justo
- [ ] Prompt para activar ubicación con explicación clara del por qué

### Seguridad (antes del lanzamiento)
- [x] Row Level Security (RLS) en todas las tablas de Supabase
- [ ] Validación de datos en formularios

### Moderación (v2 — no bloquea MVP)
- [ ] Opción de reportar un perfil
- [ ] Opción de bloquear un usuario

### Lanzamiento
- [ ] Login con Google (OAuth)
- [ ] Probar en dispositivo físico iOS
- [ ] Build de producción con EAS Build (Expo)
- [ ] Subir a TestFlight (iOS)
- [ ] Android y Google Play Internal Testing (v2)

### Criterio de éxito de Fase 6
La app puede ser instalada por alguien que no la conoce, entiende cómo funciona sola y puede registrarse sin ayuda.

---

## Estructura de tabs actualizada

| Tab | Nombre | Contenido |
|-----|--------|-----------|
| 1 | Descubrir | Swipe de músicos |
| 2 | Salas | Mapa de venues musicales |
| 3 | Conexiones | Invitaciones y contactos |
| 4 | Chats | Conversaciones activas |
| 5 | Perfil | Perfil propio |

---

## Fase activa ahora
**FASE 2 — Swipe de músicos**

## Resumen de pendientes MVP
| Prioridad | Tarea |
|-----------|-------|
| 🔴 Alta | Experiencia de swipe (tab Descubrir) |
| 🔴 Alta | Mapa de venues (tab Salas) |
| 🔴 Alta | Push notifications (invitaciones + mensajes) |
| 🔴 Alta | Row Level Security en Supabase |
| 🟡 Media | Login con Google (OAuth) |
| 🟡 Media | Onboarding para usuarios nuevos |
| 🟡 Media | Animaciones de transición |
| 🟢 Baja | ESLint y Prettier |
