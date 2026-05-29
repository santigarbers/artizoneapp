# Artizone — Roadmap

Cada fase debe estar completa y estable antes de avanzar a la siguiente.
Marcá los items con [x] a medida que los completás.

---

## FASE 1 — Fundación: Auth + Perfil básico
> Objetivo: un usuario puede registrarse, iniciar sesión y tener un perfil propio.

### Setup inicial
- [x] Crear proyecto Expo con Expo Router
- [ ] Configurar ESLint y Prettier
- [ ] Conectar repositorio a GitHub
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

## FASE 2 — Descubrimiento: Mapa interactivo
> Objetivo: ver músicos cercanos en el mapa y consultar sus perfiles.

### Ubicación
- [ ] Pedir permiso de ubicación al usuario
- [ ] Guardar coordenadas del usuario en `profiles` (PostGIS)
- [ ] Actualizar ubicación al abrir la app

### Mapa
- [ ] Integrar Mapbox en Expo
- [ ] Mostrar mapa centrado en la ubicación del usuario
- [ ] Cargar músicos cercanos desde Supabase (query por distancia)
- [ ] Mostrar marcadores de músicos en el mapa
- [ ] Tap en marcador abre preview del músico

### Perfil de otro músico
- [ ] Pantalla de perfil ajeno (solo lectura)
- [ ] Mostrar géneros, instrumentos, bio
- [ ] Mostrar videos del músico
- [ ] Subir videos propios a Supabase Storage

### Criterio de éxito de Fase 2
El usuario ve músicos cercanos en el mapa y puede explorar sus perfiles con videos.

---

## FASE 3 — Conexiones: Invitaciones
> Objetivo: enviar y recibir invitaciones para conectar con otros músicos.

### Envío de invitaciones
- [ ] Crear tabla `connections` en Supabase
- [ ] Botón "Conectar" en el perfil ajeno
- [ ] Guardar invitación con estado `pending`
- [ ] Evitar duplicados (no poder enviar dos veces al mismo usuario)

### Recepción de invitaciones
- [ ] Pantalla de invitaciones recibidas
- [ ] Aceptar invitación (cambia estado a `accepted`)
- [ ] Rechazar invitación (cambia estado a `rejected`)

### Notificaciones
- [ ] Push notification al recibir una invitación
- [ ] Push notification al ser aceptado
- [ ] Badge en el ícono de conexiones con invitaciones pendientes

### Criterio de éxito de Fase 3
Un usuario puede enviar una invitación, el otro la recibe, la acepta, y ambos quedan conectados.

---

## FASE 4 — Comunicación: Chat en tiempo real
> Objetivo: músicos conectados pueden conversar por chat.

### Chat
- [ ] Crear tabla `messages` en Supabase
- [ ] Abrir chat al aceptar una invitación
- [ ] Enviar y recibir mensajes en tiempo real (Supabase Realtime)
- [ ] Indicador de mensaje leído / no leído
- [ ] Scroll automático al último mensaje

### Lista de conversaciones
- [ ] Pantalla con todas las conversaciones activas
- [ ] Preview del último mensaje en cada conversación
- [ ] Badge con mensajes no leídos
- [ ] Push notification al recibir un mensaje nuevo

### Criterio de éxito de Fase 4
Dos músicos conectados pueden mandarse mensajes en tiempo real.

---

## FASE 5 — Pulido: UX y lanzamiento
> Objetivo: la app está lista para mostrarle a usuarios reales.

### UX general
- [ ] Pantallas de carga (skeletons)
- [ ] Manejo de errores con mensajes claros al usuario
- [ ] Estados vacíos (sin músicos cerca, sin conexiones, sin mensajes)
- [ ] Animaciones básicas de transición entre pantallas

### Moderación y seguridad
- [ ] Opción de reportar un perfil
- [ ] Opción de bloquear un usuario
- [ ] Reglas de seguridad en Supabase (Row Level Security)

### Lanzamiento
- [ ] Probar en dispositivo físico iOS y Android
- [ ] Build de producción con EAS Build (Expo)
- [ ] Subir a TestFlight (iOS) y Google Play Internal Testing
- [ ] Onboarding para usuarios nuevos (pantallas de bienvenida)

### Criterio de éxito de Fase 5
La app puede ser instalada y usada por alguien que no la conoce, sin confundirse.

---

## Fase activa ahora
**FASE 1 — Setup inicial y Autenticación**

