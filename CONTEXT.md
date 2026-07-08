# Artizone — Contexto del Proyecto

## Qué es Artizone
Red social de bandas. Un músico crea su perfil, arma o se une a bandas
(pueden ser proyectos solistas también), comparte discografía, videos, shows y
posts. El feed muestra la actividad de las bandas que seguís y de las bandas
cercanas: nuevos temas, próximos shows, búsquedas de integrantes, publicaciones.
La app también tiene un mapa de salas de ensayo, estudios y espacios musicales
en Buenos Aires, con los shows próximos superpuestos.

El foco no es "matchear" músicos sueltos: es **hacer visible la escena** y darle
a cada banda un lugar donde existir, mostrarse y crecer.

> ⚠️ Cambio de dirección (2026-07-07): pivot de app de descubrimiento de músicos
> individuales → red social de bandas. La banda pasa a ser entidad de primera
> clase. Se conserva: auth, perfil de músico, chat, mapa de Salas, sistema de
> conexiones 1-a-1. Se reescribe: descubrimiento (ahora tiene tres modos:
> músicos / bandas / shows), navegación (el Feed abre la app), y estructura de
> tabs. El código de swipe (`SwipeCard`, `useSwipeMusicians`) queda archivado
> en el repo pero fuera del flujo.

---

## Stack tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| App móvil | React Native + Expo SDK 54 | iOS y Android desde un solo código |
| UI | React Native StyleSheet + componentes propios | Sin librería de UI externa |
| Navegación | Expo Router v3 | Basado en archivos, similar a Next.js |
| Auth + DB | Supabase | PostgreSQL, Auth, Storage, Realtime, PostGIS |
| Mapa | react-native-maps | Apple Maps en iOS |
| Gestos | react-native-gesture-handler v2 | GestureDetector + Gesture.Pan() |
| Animaciones | react-native-reanimated v4 | useSharedValue, useAnimatedStyle |
| Gradientes | expo-linear-gradient | ⚠️ Requiere Xcode rebuild al instalar |
| Audio | expo-audio + Supabase Storage | Hosteo propio + embeds de Spotify/YouTube/Bandcamp |
| Video | expo-video + Supabase Storage | No usar expo-av |
| Versionado | GitHub | repo: github.com/santigarbers/artizoneapp |

---

## Estructura de tabs

| Tab | Ruta | Contenido |
|-----|------|-----------|
| 1 | /feed | Feed de actividad: bandas seguidas + bandas cercanas (tab por defecto al abrir) |
| 2 | /discover | Descubrir: músicos / bandas / shows cercanos con filtros |
| 3 | /chats | Conversaciones: DM músico↔músico, chat de banda, DM banda↔banda |
| 4 | /salas | Mapa de venues + shows próximos superpuestos |
| 5 | /profile | Perfil propio, tus bandas, tus instrumentos |

Las invitaciones (conexión, banda, colaboración) viven en una pantalla de
Actividad accesible desde el header del Feed, no en un tab dedicado.

---

## Modelo de identidad y gestión de banda

El usuario es siempre él mismo. **No hay switch global de identidad**
(no es como Instagram con múltiples cuentas). Las bandas son espacios
colectivos que se gestionan desde una vista dedicada.

**Panel de gestión de banda** (`/band/[id]/manage`)
Pantalla accesible solo para integrantes activos de la banda. Es donde
vive todo lo administrativo de esa banda. Estructura: tab-view con
tres secciones.

- **Contenido** — posts, shows, releases, fotos/videos
- **Integrantes** — invitar, roles, historial
- **Info** — datos de la banda (bio, foto, cover, estado)

Se accede desde dos lugares:
1. Perfil propio → sección "Sos parte de:" → tap en la banda → botón "Gestionar"
2. Perfil público de la banda → botón "Gestionar" en el header (solo integrantes)

**Regla del composer**
- Composer del Feed principal = siempre postea desde tu perfil personal
- Composer como banda = solo desde `/band/[id]/manage` (tab Contenido)

Esto elimina la ambigüedad de "publicar como" y hace que la separación
sea cognitivamente limpia.

**Matriz de permisos** (por `band_members.role`)

| Acción | Líder | Miembro | Ex / Invitado |
|---|---|---|---|
| Ver panel | ✓ | ✓ (solo lectura en Integrantes/Info) | ✗ |
| Publicar post | ✓ | ✓ | ✗ |
| Publicar show | ✓ | ✓ | ✗ |
| Editar/borrar contenido propio | ✓ | ✓ | ✗ |
| Editar/borrar contenido de otros | ✓ | ✗ | ✗ |
| Crear/editar release | ✓ | ✗ | ✗ |
| Subir/borrar media | ✓ | ✗ | ✗ |
| Invitar integrantes | ✓ | ✗ | ✗ |
| Cambiar roles / remover integrantes | ✓ | ✗ | ✗ |
| Editar info de banda | ✓ | ✗ | ✗ |
| Cambiar estado (activa/pausa/disuelta) | ✓ | ✗ | ✗ |
| Publicar búsqueda de integrante | ✓ | ✗ | ✗ |
| Aceptar/rechazar aplicaciones | ✓ | ✗ | ✗ |

Los ex-miembros y guests no entran al panel. Aparecen en el perfil
público de la banda si el líder así lo configuró.

**Rutas del panel**
- `/band/[id]/manage` — tab-view por defecto en Contenido
- `/band/[id]/manage/post/new` — composer de post de banda
- `/band/[id]/manage/show/new` — composer de show
- `/band/[id]/manage/release/new` — nuevo release
- `/band/[id]/manage/release/[releaseId]` — editar release existente
- `/band/[id]/manage/members` — gestión de integrantes (solo líder)
- `/band/[id]/manage/members/invite` — invitar músico
- `/band/[id]/manage/info` — editar datos de la banda (solo líder)

---

## Entidades principales

**Músico (`profile`)** — persona real con un usuario. Puede estar en varias bandas
simultáneamente, tener instrumentos propios (gear), enlaces a sus redes/plataformas.

**Banda (`band`)** — proyecto musical con uno o más integrantes. Un solista es
una banda con un solo miembro (no hay entidad separada). Tiene su propio perfil,
discografía, shows, feed. Los integrantes pueden postear en nombre de la banda
según su rol.

**Integrante (`band_member`)** — vínculo entre un músico y una banda, con rol
(líder, miembro, ex-miembro, invitado) y qué toca en esa banda específicamente.

**Contenido de banda** — releases (LP/EP/single) con tracks (audio propio o
embed), videos, posts.

**Shows** — eventos con una o varias bandas en un venue (una `sala` del sistema
o texto libre si no está catalogada).

---

## Variables de entorno (nunca hardcodear)

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Esquema de base de datos (Supabase — project: qowfhgbnwwawvsavhnxi)

### `profiles`
```sql
id             uuid references auth.users primary key
username       text unique not null
display_name   text
bio            text
genres         text[]
instruments    text[]           -- qué toca en general (para descubrimiento)
avatar_url     text
location       geography(Point, 4326)
city           text
neighborhood   text
looking_for    text             -- qué busca (campo libre, se mantiene)
spotify_url    text
youtube_url    text
soundcloud_url text
bandcamp_url   text
instagram_url  text
created_at     timestamptz
```

### `gear` — instrumentos que posee el músico
```sql
id          uuid primary key
profile_id  uuid references profiles(id) on delete cascade
category    text        -- 'guitarra' | 'bajo' | 'bateria' | 'teclado' | 'ampli' | 'pedal' | 'microfono' | 'otro'
name        text        -- "Fender Stratocaster '95"
photo_url   text
notes       text
created_at  timestamptz
```

### `bands`
```sql
id               uuid primary key
name             text not null
slug             text unique       -- para URL amigable, opcional
bio              text
genres           text[]
formed_year      int
city             text
neighborhood     text
location         geography(Point, 4326)
avatar_url       text              -- logo o foto principal
cover_url        text              -- portada del perfil
status           text default 'active'  -- 'active' | 'hiatus' | 'disbanded'
is_solo_project  boolean default false  -- solo para orden/UI, no cambia lógica
created_by       uuid references profiles(id)
created_at       timestamptz
```

### `band_members`
```sql
id           uuid primary key
band_id      uuid references bands(id) on delete cascade
profile_id   uuid references profiles(id) on delete cascade
role         text                     -- 'leader' | 'member' | 'ex_member' | 'guest'
instruments  text[]                   -- qué toca en esta banda específicamente
joined_at    date
left_at      date                     -- null si sigue activo
status       text default 'active'    -- 'active' | 'invited' | 'ex'
unique(band_id, profile_id)
```

### `band_invitations`
```sql
id             uuid primary key
band_id        uuid references bands(id) on delete cascade
inviter_id     uuid references profiles(id)
invitee_id     uuid references profiles(id)
proposed_role  text
message        text
status         text default 'pending'   -- 'pending' | 'accepted' | 'rejected'
created_at     timestamptz
```

### `releases` — discografía
```sql
id            uuid primary key
band_id       uuid references bands(id) on delete cascade
title         text not null
type          text            -- 'lp' | 'ep' | 'single'
cover_url     text
release_date  date
description   text
spotify_url   text
bandcamp_url  text
youtube_url   text
created_at    timestamptz
```

### `tracks`
```sql
id             uuid primary key
release_id     uuid references releases(id) on delete cascade
band_id        uuid references bands(id) on delete cascade
title          text not null
track_number   int
duration_secs  int
audio_url      text            -- hosteo propio en Supabase Storage
spotify_url    text            -- alternativa embebida
youtube_url    text
created_at     timestamptz
```

### `media` — fotos y videos (polimórfica, reemplaza `videos`)
```sql
id             uuid primary key
owner_type     text            -- 'profile' | 'band' | 'release' | 'show'
owner_id       uuid
type           text            -- 'video' | 'photo'
url            text
thumbnail_url  text
caption        text
created_at     timestamptz
```

### `posts` — feed
```sql
id                  uuid primary key
author_type         text        -- 'band' | 'profile'
author_id           uuid
type                text        -- 'text' | 'photo' | 'video' | 'release_announcement' | 'show_announcement' | 'open_position'
content             text
media_url           text
related_release_id  uuid references releases(id)
related_show_id     uuid references shows(id)
related_position_id uuid references open_positions(id)
created_at          timestamptz
```

### `post_reactions`
```sql
id          uuid primary key
post_id     uuid references posts(id) on delete cascade
profile_id  uuid references profiles(id) on delete cascade
reaction    text                    -- '🔥' | '🎸' | '👏' | '❤️'
unique(post_id, profile_id, reaction)
created_at  timestamptz
```

### `post_comments`
```sql
id          uuid primary key
post_id     uuid references posts(id) on delete cascade
profile_id  uuid references profiles(id)
content     text not null
created_at  timestamptz
```

### `shows`
```sql
id                    uuid primary key
band_id               uuid references bands(id)   -- banda que crea el show
venue_id              uuid references venues(id)  -- puede ser null si el venue no está catalogado
venue_name_freeform   text
starts_at             timestamptz not null
ticket_url            text
price_text            text
description           text
poster_url            text
created_at            timestamptz
```

### `show_lineup` — bandas en el show (si es compartido)
```sql
id              uuid primary key
show_id         uuid references shows(id) on delete cascade
band_id         uuid references bands(id)
order_position  int
unique(show_id, band_id)
```

### `show_rsvps`
```sql
id          uuid primary key
show_id     uuid references shows(id) on delete cascade
profile_id  uuid references profiles(id)
status      text                    -- 'going' | 'interested'
unique(show_id, profile_id)
created_at  timestamptz
```

### `follows` — seguir a una banda
```sql
id           uuid primary key
follower_id  uuid references profiles(id) on delete cascade
band_id      uuid references bands(id) on delete cascade
created_at   timestamptz
unique(follower_id, band_id)
```

### `open_positions` — banda busca integrante
```sql
id           uuid primary key
band_id      uuid references bands(id) on delete cascade
instrument   text
description  text
status       text default 'open'  -- 'open' | 'filled' | 'closed'
created_at   timestamptz
```

### `open_position_applications`
```sql
id           uuid primary key
position_id  uuid references open_positions(id) on delete cascade
profile_id   uuid references profiles(id)
message      text
status       text default 'pending'  -- 'pending' | 'accepted' | 'rejected'
created_at   timestamptz
```

### `connections` — se mantiene (contactos 1-a-1 músico↔músico)
```sql
id           uuid primary key
sender_id    uuid references profiles(id)
receiver_id  uuid references profiles(id)
status       text                    -- 'pending' | 'accepted' | 'rejected'
created_at   timestamptz
```

### `conversations` — nueva, unifica DMs y chats de banda
```sql
id          uuid primary key
type        text            -- 'dm' | 'band_group' | 'band_to_band'
band_id     uuid            -- si type = 'band_group' o 'band_to_band'
created_at  timestamptz
```

### `conversation_participants`
```sql
id                uuid primary key
conversation_id   uuid references conversations(id) on delete cascade
participant_type  text                 -- 'profile' | 'band'
participant_id    uuid
joined_at         timestamptz
```

### `messages` — refactor (ahora atado a conversation, no a connection)
```sql
id               uuid primary key
conversation_id  uuid references conversations(id) on delete cascade
sender_id        uuid references profiles(id)   -- siempre un profile envía, incluso "por la banda"
sent_as_band_id  uuid references bands(id)      -- si el mensaje habla en nombre de una banda
content          text not null
read             boolean default false
created_at       timestamptz
```

### `venues` — se mantiene
```sql
id        uuid primary key
name      text
type      text            -- 'sala_ensayo' | 'local_instrumentos' | 'bar_musica' | 'estudio_grabacion' | 'espacio_cultural'
address   text
latitude  double precision
longitude double precision
phone     text
website   text
hours     text
```

**Funciones PostGIS:** `nearby_musicians`, `nearby_bands` (a crear en Fase 5),
`nearby_shows` (a crear en Fase 6).

**RLS habilitado** en todas las tablas. Reglas clave a definir por fase.

---

## GitHub — cuentas y cómo commitear

- Repo: https://github.com/santigarbers/artizoneapp
- Dos cuentas en el sistema: `santiagogarbers` (activa por defecto) y `santigarbers` (dueña del repo)
- **Siempre antes de `git push`:** `gh auth switch --user santigarbers`

---

## Build y desarrollo

- El usuario corre la app con **Xcode** (build nativo), NO Expo Go
- Después de instalar cualquier librería con módulo nativo → **requiere rebuild en Xcode**
  1. Xcode → Product → Clean Build Folder (`⇧⌘K`)
  2. Product → Run (`⌘R`)
- Para cambios solo en JS/TS → Metro bundler recarga sin rebuild
- **Debug build**: necesita Metro corriendo en la Mac (misma red WiFi)
- **Release build**: JS bundle embebido, funciona sin la Mac ni cable
- **Wireless debugging**: Window → Devices and Simulators → "Connect via network" ✓
- Prebuild necesario si cambia `app.json`: `npx expo prebuild --clean --platform ios`

---

## Decisiones técnicas tomadas (no cambiar sin consenso)

- **Sin switch global de identidad.** El usuario es siempre él mismo. La
  gestión de bandas vive en `/band/[id]/manage`, no en un "modo banda"
  que reemplace la app.
- **Regla del composer:** Feed principal siempre postea desde el perfil
  personal. Publicar como banda solo se puede desde el panel de esa banda.
  No hay selector "publicar como" en el composer del Feed.
- **Panel de gestión = tab-view** con tres secciones fijas: Contenido,
  Integrantes, Info. Miembros no-líderes ven Integrantes e Info en solo
  lectura.
- **Solista = banda con un integrante.** No hay entidad separada para solistas.
  El flag `is_solo_project` es solo para orden/UI.
- **Audio: hosteo propio + embeds.** Los tracks propios se suben a Supabase
  Storage. Los campos `spotify_url` / `youtube_url` / `bandcamp_url` son
  opcionales por si la banda ya tiene su catálogo publicado.
- **Fans se posponen a v2.** El MVP es de músicos. El modelo `follows` ya está
  preparado para cuando entren fans, sin cambios de arquitectura.
- **Feed = tab por defecto** al abrir la app.
- **Media polimórfica** (`media` con `owner_type` + `owner_id`) para no
  duplicar tablas por cada tipo de dueño.
- **Mensajes atados a `conversations`, no a `connections`.** Esto permite chat
  de banda (grupo) y DM banda↔banda sin duplicar lógica.
- **Descubrimiento con tres modos** (músicos / bandas / shows) compartiendo el
  mismo tab, filtros y componente de tarjeta.
- **GestureHandlerRootView** envuelve toda la app en `_layout.tsx`
- **Expo Router** para navegación
- **Supabase Realtime** para feed, chat y notificaciones
- **react-native-maps** para mapas (Apple Maps en iOS)
- **expo-video** para video, **expo-audio** para audio propio
- **expo-linear-gradient** para degradados (requiere Xcode rebuild)
- **expo-file-system/legacy** para uploads
- **Ionicons** de @expo/vector-icons para íconos del bottom nav
- **geography** de PostGIS para músicos y bandas; **lat/lng en columnas** para
  venues (no cambiar, filtro por tipo en cliente)
- FilterSheet: draft state (no aplica hasta CTA), slider logarítmico 2–800km
- SwipeCard / useSwipeMusicians: archivos conservados, fuera del flujo

---

## Estado actual del proyecto (post pivot 2026-07-07)

### ✅ Se conserva del build previo
- Auth (email/password, sesión persistente, protección de rutas)
- Perfil de músico básico (username, bio, géneros, instrumentos, avatar, `looking_for`)
- Función PostGIS `nearby_musicians` y hook `useNearbyMusicians`
- FilterSheet con géneros, instrumentos y distancia
- Chat 1-a-1 (base para el refactor a `conversations`)
- Lista de conversaciones con preview y unread badges
- Mapa de Salas con 17 venues en Buenos Aires
- 7 perfiles de prueba con datos realistas
- App icon y splash screen

### 🔄 Se reescribe
- Descubrir → tres modos (músicos / bandas / shows) en lugar de swipe
- Navegación → Feed abre la app, tab de conexiones se disuelve en Actividad
- Modelo de mensajes → migrar de `messages.connection_id` a
  `messages.conversation_id`

### 🆕 Se agrega (grueso de las próximas fases)
- Banda como entidad + integrantes + invitaciones
- Discografía (releases + tracks con hosteo propio de audio)
- Feed de actividad con posts, reacciones y comentarios
- Shows y RSVP integrados con el mapa de Salas
- Gear (instrumentos que posee el músico)
- Búsquedas abiertas de integrantes
- Chat de banda + DM banda↔banda
- Push notifications

### 📦 Archivado (queda en el repo, fuera del flujo)
- `SwipeCard`, `useSwipeMusicians`, tabla `swipes` (evaluar drop en Fase 2)

---

## Reglas de trabajo

1. Si algo está roto de forma estructural, reescribir limpio — no parchear
2. Antes de proponer un fix, explicar brevemente qué lo causa
3. No instalar librerías nativas sin avisar (requieren Xcode rebuild)
4. Las credenciales siempre como variables de entorno, nunca hardcodeadas
5. Commitear por feature/fase con mensajes descriptivos en español
6. Cada fase se completa y se prueba antes de avanzar
7. Las decisiones de producto se discuten antes de escribir código —
   los MDs son la fuente de verdad
