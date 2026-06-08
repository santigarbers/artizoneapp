# Artizone — Contexto del Proyecto

## Qué es Artizone
App móvil para descubrir músicos cercanos con experiencia de swipe tipo Tinder.
Los usuarios ven perfiles con gustos musicales y videos, hacen swipe para conectar,
y una vez aceptadas las invitaciones se abre un chat privado entre ambos.
También tiene un mapa de salas de ensayo, estudios y espacios musicales en Buenos Aires.

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
| Versionado | GitHub | repo: github.com/santigarbers/artizoneapp |

---

## Estructura de tabs

| Tab | Ruta | Contenido |
|-----|------|-----------|
| 1 | /discover | Swipe de músicos estilo Tinder |
| 2 | /salas | Mapa de venues musicales |
| 3 | /connections | Invitaciones recibidas/enviadas |
| 4 | /chats (o similar) | Conversaciones activas |
| 5 | /profile | Perfil propio |

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
id            uuid references auth.users primary key
username      text unique not null
bio           text
genres        text[]
instruments   text[]
avatar_url    text
location      geography(Point, 4326)
looking_for   text          -- qué busca el músico (campo libre)
created_at    timestamptz
```

### `swipes`
```sql
id          uuid primary key
user_id     uuid references profiles(id)
target_id   uuid references profiles(id)
direction   text  -- 'left' | 'right'
created_at  timestamptz
```

### `connections`
```sql
id           uuid primary key
sender_id    uuid references profiles(id)
receiver_id  uuid references profiles(id)
status       text  -- 'pending' | 'accepted' | 'rejected'
created_at   timestamptz
```

### `messages`
```sql
id            uuid primary key
connection_id uuid references connections(id)
sender_id     uuid references profiles(id)
content       text not null
read          boolean default false
created_at    timestamptz
```

### `videos`
```sql
id          uuid primary key
profile_id  uuid references profiles(id)
url         text not null
thumbnail   text
created_at  timestamptz
```

### `venues`
```sql
id        uuid primary key
name      text
type      text  -- 'sala_ensayo' | 'local_instrumentos' | 'bar_musica' | 'estudio_grabacion' | 'espacio_cultural'
address   text
latitude  double precision
longitude double precision
phone     text
website   text
hours     text
```

RLS habilitado en todas las tablas. Función PostGIS `nearby_musicians` para queries por distancia.

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

- **GestureHandlerRootView** envuelve toda la app en `_layout.tsx` (requerido por RNGH)
- **Expo Router** para navegación
- **Supabase Realtime** para chat en tiempo real
- **react-native-maps** para mapas (Apple Maps en iOS)
- **expo-video** para reproducción de videos (no expo-av)
- **expo-linear-gradient** para degradados (requiere Xcode rebuild)
- **expo-file-system/legacy** para uploads
- **Ionicons** de @expo/vector-icons para íconos del bottom nav
- **geography** de PostGIS para ubicaciones y queries de distancia
- Radio de búsqueda en `nearby_musicians` seteado en 999999999 (ilimitado) durante desarrollo
- SwipeCard: foto full-bleed, degradado con LinearGradient, botones ✕/♥ dentro de la card
- FilterSheet: draft state (no aplica hasta CTA), slider logarítmico 2–800km sin snap points
- Venues: coordenadas lat/lng en columnas separadas (no geography), filtro por tipo en cliente

---

## Estado actual del proyecto (post sesión 2026-06-08)

### ✅ Fase 2 — Descubrir (completa)
- Swipe estilo Tinder con GestureDetector + Reanimated
- Foto full-bleed con degradado LinearGradient
- Botones ✕ y ♥ dentro de la card
- Overlays LIKE/PASO animados
- Scroll vertical dentro de la card (bio completa) sin interferir con swipe
- FilterSheet: géneros, instrumentos, distancia (slider logarítmico)
- Registro de swipes en Supabase, lógica para no repetir músicos vistos
- Campo `looking_for` en perfil

### ✅ Fase 3 — Salas (completa)
- Mapa con 17 venues en Buenos Aires (Belgrano, Palermo, San Telmo, Almagro, etc.)
- Marcadores diferenciados por tipo (emoji + color)
- VenueCard con distancia Haversine, horarios, link Maps, llamada
- Filtros por tipo (chips horizontales)
- Botón de re-centrado en ubicación propia

### ✅ Extras completados
- App icon: artizone-logo.png (A con nota musical, gradiente naranja/rosa, fondo negro)
- Splash screen: fondo negro con logo centrado
- 7 perfiles de prueba en Supabase con bio, géneros, instrumentos, foto y video

### ❌ Pendiente importante
- Push notifications (requiere EAS Build)
- Login con Google (OAuth)
- Scroll dentro de tarjeta para ver más fotos/videos del músico
- Onboarding para usuarios nuevos
- Build de producción (TestFlight)

---

## Perfiles de prueba en Supabase

IDs con prefijo `a1000000-0000-0000-0000-00000000000X`:

| # | Username | Géneros | Instrumento | Barrio |
|---|----------|---------|-------------|--------|
| 1 | @lucasferreyra | Rock, Blues | Guitarra | Palermo |
| 2 | @valentinasosa | Jazz, Soul, Blues | Voz | Recoleta |
| 3 | @matiasromero | Cumbia, Folklore, Rock | Batería, Cajón | San Telmo |
| 4 | @nicolasib | Funk, R&B, Jazz | Bajo, Contrabajo | Caballito |
| 5 | @camilavidal | Tango, Clásica, Folklore | Violín | Almagro |
| 6 | @rodrigomendez | Jazz, Electrónica, Funk | Teclado, Piano | Belgrano |
| 7 | @agustinat | Folklore, Rock, Pop | Voz, Guitarra | Villa Crespo |

---

## Reglas de trabajo

1. Si algo está roto de forma estructural, reescribir limpio — no parchear
2. Antes de proponer un fix, explicar brevemente qué lo causa
3. No instalar librerías nativas sin avisar (requieren Xcode rebuild)
4. Las credenciales siempre como variables de entorno, nunca hardcodeadas
5. Commitear por feature/fase con mensajes descriptivos en español
