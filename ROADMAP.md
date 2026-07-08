# Artizone — Roadmap

Cada fase debe estar completa y estable antes de avanzar a la siguiente.
Marcá los items con [x] a medida que los completás.

> ⚠️ Este roadmap fue reescrito el 2026-07-07 con el pivot a red social de bandas.
> El roadmap anterior (basado en descubrimiento tipo swipe/lista) queda archivado.

---

## FASE 1 — Fundación (heredada, casi lista)
> Objetivo: cerrar lo pendiente del build previo antes de arrancar con el pivot.

### Ya hecho (se conserva)
- [x] Proyecto Expo con Expo Router
- [x] Repositorio en GitHub
- [x] Variables de entorno (.env.local)
- [x] Cliente de Supabase (`lib/supabase.ts`)
- [x] Registro con email/password
- [x] Login con email/password
- [x] Logout
- [x] Persistencia de sesión
- [x] Protección de rutas
- [x] Tabla `profiles` con creación automática al registrarse
- [x] Edición de perfil (nombre, bio, géneros, instrumentos)
- [x] Foto de perfil en Supabase Storage
- [x] Ver perfil propio

### Pendiente para cerrar Fase 1
- [ ] Agregar campos a `profiles`: `display_name`, `city`, `neighborhood`,
      `spotify_url`, `youtube_url`, `soundcloud_url`, `bandcamp_url`, `instagram_url`
- [ ] UI para editar redes/plataformas en el perfil
- [ ] ESLint y Prettier

### Criterio de éxito de Fase 1
Un usuario puede registrarse, completar su perfil con foto, redes y datos de
ubicación, y volver a entrar sin perder la sesión.

---

## FASE 2 — Banda como entidad ← FASE ACTIVA
> Objetivo: se pueden crear bandas, invitar integrantes, aceptar/rechazar,
> ver el perfil de una banda. Sin esto ninguna fase posterior tiene sentido.

### Modelo de datos
- [ ] Crear tabla `bands` con RLS
- [ ] Crear tabla `band_members` con RLS
- [ ] Crear tabla `band_invitations` con RLS
- [ ] Trigger: al crear una banda, el creador se agrega automáticamente como
      `role='leader'`, `status='active'`
- [ ] Policy: solo el líder puede editar datos de la banda y aceptar
      solicitudes de ingreso

### Crear banda
- [ ] Pantalla "Nueva banda" con nombre, género, año de formación, ciudad/barrio, bio
- [ ] Marcar automáticamente `is_solo_project = true` si el creador es el único
      integrante durante los primeros 7 días (o toggle manual)
- [ ] Subir logo/avatar y foto de portada a Supabase Storage
- [ ] Redirige al perfil recién creado

### Perfil público de banda
- [ ] Pantalla `/band/[id]` con avatar, cover, nombre, género, año, ciudad, bio
- [ ] Sección "Integrantes" con avatar, nombre, rol e instrumentos en la banda
- [ ] Botones según rol del visitante:
      - Público (no integrante): "Seguir", "Contactar banda" (Fase 8)
      - Integrante activo: botón "Gestionar" que abre `/band/[id]/manage`
- [ ] Estado de la banda visible (activa / en pausa / disuelta)

### Panel de gestión — tabs Integrantes e Info (esta fase)
- [ ] Pantalla `/band/[id]/manage` con tab-view (Contenido / Integrantes / Info)
      — la tab Contenido se implementa en Fase 3, en esta fase muestra estado
      vacío
- [ ] Protección de ruta: solo `band_members` con `status='active'` entran;
      resto redirige al perfil público
- [ ] Tab **Integrantes** (líder ve edición; miembro ve solo lectura):
      - Lista de integrantes activos con rol e instrumentos
      - Botón "Invitar músico" (solo líder) → `/band/[id]/manage/members/invite`
      - Cambiar rol de un integrante (solo líder)
      - Remover integrante (solo líder, confirmación)
      - Historial: ex-miembros e invitaciones pendientes
- [ ] Tab **Info** (líder ve edición; miembro ve solo lectura):
      - Editar nombre, bio, géneros, año, ciudad, barrio
      - Cambiar avatar y cover (upload a Supabase Storage)
      - Cambiar estado (activa / en pausa / disuelta)

### Invitaciones a banda
- [ ] Desde `/band/[id]/manage/members/invite` el líder busca un músico por
      username, propone rol e instrumentos, escribe un mensaje opcional
- [ ] El invitado ve la invitación en la pantalla de Actividad
      (acceso desde el header del Feed)
- [ ] Aceptar → se crea el `band_member` con `status='active'`
- [ ] Rechazar → invitación queda `rejected`

### RLS a definir en esta fase
- [ ] `bands`: SELECT abierto; UPDATE/DELETE solo `band_members` con
      `role='leader'` y `status='active'`
- [ ] `band_members`: SELECT abierto; INSERT/UPDATE/DELETE solo líderes de
      la banda (excepto el auto-INSERT del creador)
- [ ] `band_invitations`: SELECT solo si sos inviter o invitee; INSERT solo
      líderes; UPDATE (aceptar/rechazar) solo invitee

### Mis bandas (en el perfil propio)
- [ ] Sección "Sos parte de:" con las bandas del usuario
- [ ] Tap en una banda abre su perfil
- [ ] Botón "Crear banda" siempre disponible

### Limpieza del pivot
- [ ] Marcar `SwipeCard` y `useSwipeMusicians` como `@deprecated` (JSDoc)
- [ ] Evaluar si la tabla `swipes` se puede dropear o se conserva

### Criterio de éxito de Fase 2
Un músico puede crear una banda, invitar a otros dos músicos, y todos ven la
banda en su perfil "Sos parte de:". El perfil público de la banda muestra a
los tres integrantes con sus roles.

---

## FASE 3 — Contenido de la banda
> Objetivo: una banda vale la pena visitarla. Discografía, videos, gear
> individual de los músicos. Se habilita la tab Contenido del panel de gestión.

### Modelo
- [ ] Crear tabla `releases` con RLS (SELECT abierto; INSERT/UPDATE/DELETE
      solo líderes)
- [ ] Crear tabla `tracks` con RLS (mismas policies que releases)
- [ ] Crear tabla `media` con RLS (SELECT abierto; INSERT/DELETE solo
      líderes cuando `owner_type='band'`, dueño cuando `owner_type='profile'`)
- [ ] Migrar la tabla `videos` actual a `media` con `owner_type='profile'`
- [ ] Crear tabla `gear` con RLS (solo el dueño edita)

### Panel de gestión — tab Contenido (versión Fase 3)
> En esta fase el composer de posts y shows todavía no existe (llega en Fase
> 4 y 6). La tab muestra las subsecciones de contenido gestionable ahora.
- [ ] Subsección **Discografía** (solo líder ve botones de edición)
      - Lista de releases con tapa, título, tipo y fecha
      - Botón "Nuevo release" → `/band/[id]/manage/release/new`
      - Tap en un release existente → `/band/[id]/manage/release/[releaseId]`
        (editar metadata + gestionar tracks)
- [ ] Subsección **Fotos y videos** (solo líder gestiona)
      - Grid de media de la banda
      - Botón "Subir" con selector foto/video
      - Long-press para borrar (solo líder)

### Crear/editar release
- [ ] Pantalla `/band/[id]/manage/release/new` con título, tipo (LP/EP/single),
      tapa, fecha de salida, descripción, links externos
      (Spotify/Bandcamp/YouTube)
- [ ] Pantalla de edición del release: los mismos campos + gestión de tracks
      - Agregar track con título, número, duración, audio propio (upload a
        Supabase Storage con `expo-file-system/legacy`) o embed externo
      - Reordenar tracks
      - Eliminar track (confirmación)
- [ ] Redirige al perfil público de la banda al finalizar

### Perfil público de banda (visualización del contenido)
- [ ] Sección "Discografía" en `/band/[id]` ordenada por fecha desc
- [ ] Player de audio nativo con expo-audio (play/pause, scrub, duración)
- [ ] Renderizar embeds de Spotify/YouTube/Bandcamp cuando existan
- [ ] Grid de fotos/videos con lightbox
- [ ] Estados vacíos ("Todavía no hay lanzamientos", "Sin fotos ni videos")

### Gear del músico (independiente del panel de banda)
- [ ] Sección "Mi equipo" en el perfil propio del músico
- [ ] Agregar instrumento con categoría, nombre, foto opcional, notas
- [ ] Renderizar como grid con foto y nombre
- [ ] Editar/borrar (solo el dueño)

### Criterio de éxito de Fase 3
Un líder de banda entra al panel, sube un release con tracks reproducibles
(audio propio o embed), agrega fotos, y todo se ve renderizado en el perfil
público. Un músico agrega su gear desde su perfil.

---

## FASE 4 — Feed (pilar de la app)
> Objetivo: la app abre en un feed con actividad de bandas seguidas y bandas
> cercanas. Es lo primero que ve el usuario cada vez que entra.

### Modelo de datos
- [ ] Crear tabla `posts` con RLS
- [ ] Crear tabla `post_reactions` con RLS
- [ ] Crear tabla `post_comments` con RLS
- [ ] Crear tabla `follows` con RLS
- [ ] Función SQL `feed_for_user(user_id, limit, offset)` que devuelve posts de:
      bandas seguidas + bandas de las que sos integrante + bandas cercanas
      (dentro de X km), ordenados por fecha desc

### Composer de posts (dos caminos, sin ambigüedad)
- [ ] **Composer personal** desde el Feed:
      - Botón flotante o en el header del `/feed`
      - Postea siempre como el usuario (perfil personal)
      - Tipos: texto, foto, video
- [ ] **Composer de banda** desde el panel:
      - Ruta `/band/[id]/manage/post/new` (accesible desde tab Contenido
        del panel)
      - Postea siempre en nombre de esa banda
      - Tipos: texto, foto, video, `release_announcement` (linkea a un
        release existente), `show_announcement` (linkea a un show existente,
        se completa desde Fase 6), `open_position` (linkea a una búsqueda
        existente, se completa desde Fase 7)
      - Autor visible en el post: avatar de banda + "publicado por [nombre
        del músico]"
- [ ] RLS de `posts`:
      - INSERT si `author_type='profile'` y `author_id = auth.uid()`
      - INSERT si `author_type='band'` y el usuario es `band_member`
        activo con `role in ('leader','member')`
      - UPDATE/DELETE: autor del post o líder de la banda

### Feed
- [ ] Tab `/feed` como pantalla por defecto al abrir la app
- [ ] Lista vertical con pull-to-refresh y paginación infinita
- [ ] Tarjeta de post: autor (avatar + nombre + tipo), fecha relativa,
      contenido, media, entidad linkeada (release/show/position) si aplica
- [ ] Reacciones: barra con 🔥 🎸 👏 ❤️ — tap para reaccionar, tap otra vez para quitar
- [ ] Contador de reacciones y comentarios por post
- [ ] Tap en el post abre pantalla de detalle con comentarios

### Seguir bandas
- [ ] Botón "Seguir" en el perfil de banda
- [ ] Contador de seguidores en el perfil de banda
- [ ] Lista de bandas seguidas en el perfil propio

### Actividad (notificaciones in-app)
- [ ] Ícono en el header del feed que abre `/activity`
- [ ] Muestra: invitaciones de banda pendientes, solicitudes de conexión,
      nuevos seguidores, respuestas a posts propios de tus bandas
- [ ] Badge con conteo de items sin leer

### Criterio de éxito de Fase 4
El usuario abre la app, ve el feed con al menos 5 posts recientes de bandas
seguidas y cercanas, puede reaccionar, comentar y publicar desde su banda.

---

## FASE 5 — Descubrimiento reimaginado
> Objetivo: el tab Descubrir reemplaza al viejo (swipe/lista de músicos).
> Ahora es un solo tab con tres modos: músicos, bandas, shows.

### Modelo
- [ ] Función PostGIS `nearby_bands(user_location, radius_km)`
- [ ] Función `nearby_shows(user_location, radius_km, from_date, to_date)` — se
      apoya en Fase 6, agregar acá si Fase 6 empezó, o dejar sin shows por ahora

### UI compartida
- [ ] Tab `/discover` con toggle segmentado: Músicos | Bandas | Shows
- [ ] FilterSheet compartido (géneros, distancia, escena/barrio)
- [ ] Indicador visual de filtros activos + botón para limpiar

### Modo Músicos
- [ ] Reutilizar `useNearbyMusicians` (ya existe, conectar a los filtros)
- [ ] Lista + toggle a mapa (integrar el `map.tsx` existente)
- [ ] Tap abre el perfil del músico con botón "Conectar" (envía `connection`
      con status `pending`)
- [ ] Estados de carga, vacío, error

### Modo Bandas
- [ ] Hook `useNearbyBands` similar a `useNearbyMusicians`
- [ ] Lista + toggle a mapa (marcador por banda)
- [ ] Tap abre el perfil de la banda con botón "Seguir"

### Modo Shows
- [ ] Feed vertical de shows próximos ordenados por fecha
- [ ] Tarjeta: banda(s), fecha, venue, precio, poster
- [ ] Tap abre detalle del show con RSVP

### Criterio de éxito de Fase 5
El usuario abre Descubrir, alterna entre los tres modos con el mismo set de
filtros, y encuentra un músico, una banda y un show cercanos.

---

## FASE 6 — Shows y eventos
> Objetivo: las bandas publican sus shows, aparecen en el feed, en el mapa
> de Salas y en el modo Shows del Descubrir. Es el momento en que la app
> deja de ser estática y se vuelve escena viva.

### Modelo de datos
- [ ] Crear tabla `shows` con RLS (solo integrantes de la banda crean shows)
- [ ] Crear tabla `show_lineup` (lineup si hay varias bandas)
- [ ] Crear tabla `show_rsvps` con RLS

### Publicar show
- [ ] Desde el panel de banda: ruta `/band/[id]/manage/show/new`
      - Acceso: líderes y miembros (según matriz)
      - Botón visible en la tab Contenido del panel
- [ ] Formulario: fecha/hora, venue (seleccionar de `venues` existentes o
      texto libre), lineup (agregar otras bandas), precio, link a entradas,
      descripción, poster
- [ ] Al publicar: se crea un `post` de tipo `show_announcement` en el feed
      con `author_type='band'` y `author_id=band_id`
- [ ] Editar/borrar show: el creador y los líderes de la banda; miembros solo
      pueden editar el suyo propio
- [ ] RLS de `shows`:
      - INSERT si el usuario es `band_member` activo con `role in
        ('leader','member')` de la `band_id`
      - UPDATE/DELETE: creador del show o líder de la banda

### Detalle del show
- [ ] Pantalla `/show/[id]` con toda la info + lineup con links a las bandas
- [ ] Botones "Voy" y "Me interesa" (RSVP)
- [ ] Lista de músicos que van (top 5 avatares + contador)
- [ ] Link a Google Maps si tiene venue con coordenadas

### Integración con Salas
- [ ] En el mapa de Salas: superponer un marcador secundario si hay shows
      próximos en ese venue
- [ ] Tap en el marcador de show → tarjeta con detalle rápido

### Post-show
- [ ] Después de la fecha del show, la banda puede subir fotos/videos al show
- [ ] Los que hicieron RSVP reciben una notificación sutil para revisitar

### Criterio de éxito de Fase 6
Una banda publica un show, aparece en el feed de sus seguidores, en el mapa
de Salas superpuesto sobre el venue, y en el modo Shows del Descubrir. Los
usuarios pueden hacer RSVP.

---

## FASE 7 — Búsquedas abiertas
> Objetivo: matchear bandas que buscan integrantes con músicos disponibles.
> Se posiciona tarde porque su utilidad depende de tener masa crítica.

### Modelo
- [ ] Crear tabla `open_positions` con RLS
- [ ] Crear tabla `open_position_applications` con RLS

### Publicar búsqueda
- [ ] Desde el panel de banda (tab Contenido): botón "Buscar integrante"
      → `/band/[id]/manage/position/new` (solo líder)
- [ ] Formulario: instrumento, descripción (nivel, estilo, disponibilidad)
- [ ] Al publicar: se crea un `post` de tipo `open_position` en el feed
- [ ] Lista de búsquedas activas y cerradas dentro del panel

### Aplicar
- [ ] Desde el post o desde una sección "Búsquedas abiertas" en Descubrir:
      botón "Me interesa" con mensaje opcional
- [ ] Aplicación queda en `open_position_applications` con `status='pending'`

### Gestionar aplicaciones (dentro del panel)
- [ ] En el panel, subsección "Aplicaciones recibidas" agrupadas por búsqueda
- [ ] Solo líder ve y responde
- [ ] Aceptar → abre chat con el músico + dispara automáticamente una
      `band_invitation` con el rol/instrumento propuestos
- [ ] Rechazar → aplicación queda `rejected`, notificación silenciosa al aplicante

### Sección dedicada
- [ ] Filtro adicional en Descubrir → Bandas: "Solo bandas buscando integrante"
- [ ] Filtro por instrumento buscado

### Criterio de éxito de Fase 7
Una banda publica una búsqueda de baterista, un músico la ve, aplica, y
la banda le manda una invitación formal al aceptar.

---

## FASE 8 — Comunicación ampliada
> Objetivo: el chat pasa de ser solo 1-a-1 a incluir chat de banda y DM
> banda↔banda para armar tocadas.

### Refactor del modelo
- [ ] Crear tabla `conversations` y `conversation_participants` con RLS
- [ ] Migrar `messages`: reemplazar `connection_id` por `conversation_id`
- [ ] Migrar conversaciones DM existentes creando una `conversation` type=`dm`
      por cada `connection` con status `accepted`
- [ ] Agregar `sent_as_band_id` en `messages` para chats de banda↔banda

### Chat de banda (grupo automático)
- [ ] Al crear una banda, se crea una `conversation` type=`band_group`
- [ ] Los integrantes activos son participantes automáticos
- [ ] Al aceptar una invitación, el nuevo integrante se agrega al grupo
- [ ] Al salir de la banda, se lo remueve del grupo

### DM banda ↔ banda
- [ ] Desde el perfil de una banda: botón "Contactar banda" (solo si sos
      líder o miembro de otra banda)
- [ ] Se elige desde qué banda estás hablando
- [ ] Los mensajes se envían con `sent_as_band_id = tu_banda_id`
- [ ] En la tarjeta del mensaje: mostrás el avatar de la banda + "vía [Nombre] (miembro)"

### Lista de chats unificada
- [ ] Un solo tab `/chats` con las tres tipos mezcladas
- [ ] Iconografía distinta para DM personal, grupo de banda, banda↔banda
- [ ] Filtros por tipo

### Criterio de éxito de Fase 8
Un músico integrante de dos bandas puede: mandarle un DM a otro músico,
participar del grupo de sus dos bandas, y contactar a otra banda desde una
de las suyas para armar una tocada compartida.

---

## FASE 9 — Pulido y lanzamiento
> Objetivo: la app se puede mostrar a usuarios reales y llegar a TestFlight.

### UX general
- [x] Rediseño del bottom navigation menu
- [x] Skeletons de carga en pantallas principales del build previo
- [ ] Skeletons de carga en pantallas nuevas (feed, band, discover, shows)
- [x] Estados de error en acciones críticas del build previo
- [ ] Estados de error en flujos nuevos (crear banda, publicar post, RSVP)
- [x] Estados vacíos en pantallas viejas
- [ ] Estados vacíos en pantallas nuevas
- [ ] Animaciones básicas de transición

### Onboarding
- [ ] Pantalla de bienvenida con propuesta de valor ("red social de bandas")
- [ ] 3 pantallas explicando: perfil de músico → tus bandas → feed y shows
- [ ] Prompt para completar el perfil al registrarse
- [ ] Prompt para crear/unirse a una banda al terminar el perfil
- [ ] Prompt para activar notificaciones push en el momento justo
- [ ] Prompt para activar ubicación con explicación clara

### Notificaciones push
- [ ] Setup con EAS Build + expo-notifications
- [ ] Push al recibir invitación de banda
- [ ] Push al recibir solicitud de conexión
- [ ] Push al recibir mensaje nuevo
- [ ] Push cuando una banda seguida publica algo
- [ ] Push cuando una banda seguida publica un show
- [ ] Push cuando una banda que va a un show sube fotos/videos post-show

### Seguridad y validación
- [x] RLS en tablas del build previo
- [ ] RLS en todas las tablas nuevas (bands, releases, tracks, posts, shows,
      follows, positions, conversations)
- [ ] Validación de datos en formularios (nombre de banda, longitud de posts,
      tipos MIME de uploads)
- [ ] Rate limiting en composer de posts

### Auth extendida
- [ ] Login con Google (OAuth)

### Moderación (v2 — no bloquea MVP)
- [ ] Reportar perfil de músico
- [ ] Reportar perfil de banda
- [ ] Reportar post
- [ ] Bloquear usuario

### Lanzamiento
- [ ] Probar en dispositivo físico iOS con al menos 5 usuarios de prueba
      (fricción, onboarding, invitaciones cruzadas)
- [ ] Build de producción con EAS Build
- [ ] Subir a TestFlight (iOS)
- [ ] Android + Google Play Internal Testing (v2)

### Criterio de éxito de Fase 9
Un músico que no conoce Artizone se registra, completa su perfil, crea una
banda, invita a un amigo, publica un tema y un show, todo sin ayuda.

---

## Estructura de tabs (referencia)

| Tab | Nombre | Contenido |
|-----|--------|-----------|
| 1 | Feed | Actividad de bandas seguidas + cercanas (default al abrir) |
| 2 | Descubrir | Músicos / Bandas / Shows con toggle y filtros |
| 3 | Chats | DMs, chats de banda, banda↔banda |
| 4 | Salas | Mapa de venues + shows superpuestos |
| 5 | Perfil | Perfil propio + tus bandas + tu gear |

Invitaciones y notificaciones in-app viven en `/activity`, accesible desde
el header del Feed (icono con badge).

---

## Fase activa ahora
**FASE 2 — Banda como entidad**

## Resumen de pendientes MVP (post-pivot)

| Prioridad | Tarea |
|-----------|-------|
| 🔴 Alta | Modelo de bandas + integrantes + invitaciones (Fase 2) |
| 🔴 Alta | Perfil de banda con integrantes y roles (Fase 2) |
| 🔴 Alta | Discografía con audio propio + embeds (Fase 3) |
| 🔴 Alta | Feed con posts, reacciones, comentarios (Fase 4) |
| 🔴 Alta | Descubrir con tres modos (Fase 5) |
| 🔴 Alta | Shows con RSVP integrados con Salas (Fase 6) |
| 🔴 Alta | Refactor de mensajes a `conversations` (Fase 8) |
| 🔴 Alta | RLS en todas las tablas nuevas |
| 🟡 Media | Búsquedas abiertas de integrantes (Fase 7) |
| 🟡 Media | Push notifications (Fase 9) |
| 🟡 Media | Onboarding nuevo (Fase 9) |
| 🟡 Media | Login con Google (Fase 9) |
| 🟢 Baja | ESLint y Prettier |
| 🟢 Baja | Moderación (reportar/bloquear) v2 |
