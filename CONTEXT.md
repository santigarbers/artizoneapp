# Artizone — Contexto del Proyecto

## Qué es Artizone
App móvil para descubrir músicos cercanos a través de un mapa interactivo.
Los usuarios ven perfiles con gustos musicales y videos, envían invitaciones de conexión,
y una vez aceptadas se abre un chat privado entre ambos.

---

## Stack tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| App móvil | React Native + Expo SDK 54 | iOS y Android desde un solo código |
| UI | React Native StyleSheet + componentes propios | Sin librería de UI externa por ahora |
| Navegación | Expo Router v3 | Basado en archivos, similar a Next.js |
| Auth + DB | Supabase | PostgreSQL, Auth, Storage, Realtime |
| Mapa | Mapbox (react-native-mapbox-gl) | Capa gratuita más generosa que Google Maps |
| Backend logic | Supabase Edge Functions | Serverless, solo si hace falta |
| Versionado | GitHub | Ramas por feature, nunca commitear directo a main |
| Deploy web | Vercel | Solo si se hace versión web en el futuro |

---

## Variables de entorno (nunca hardcodear)

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_MAPBOX_TOKEN=
```

---

## Estructura de carpetas

```
artizone/
├── CONTEXT.md
├── ROADMAP.md
├── app/                        ← Pantallas (Expo Router)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── map.tsx
│   │   ├── connections.tsx
│   │   └── profile.tsx
│   └── chat/
│       └── [id].tsx
├── components/                 ← Componentes reutilizables
│   ├── ui/                     ← Botones, inputs, cards genéricos
│   └── features/               ← Componentes específicos de Artizone
├── lib/
│   ├── supabase.ts             ← Cliente de Supabase
│   └── hooks/                  ← Custom hooks (useAuth, useLocation, etc.)
├── types/
│   └── database.ts             ← Types generados por Supabase
├── supabase/
│   └── migrations/             ← SQL de cambios a la DB
└── .env.local                  ← Credenciales (en .gitignore)
```

---

## Esquema de base de datos (Supabase)

### Tabla: `profiles`
```sql
id          uuid references auth.users primary key
username    text unique not null
bio         text
genres      text[]          -- géneros musicales
instruments text[]          -- instrumentos que toca
avatar_url  text
location    geography(Point, 4326)   -- coordenadas geográficas
created_at  timestamptz default now()
```

### Tabla: `connections`
```sql
id           uuid primary key default gen_random_uuid()
sender_id    uuid references profiles(id)
receiver_id  uuid references profiles(id)
status       text check (status in ('pending', 'accepted', 'rejected'))
created_at   timestamptz default now()
```

### Tabla: `messages`
```sql
id           uuid primary key default gen_random_uuid()
connection_id uuid references connections(id)
sender_id    uuid references profiles(id)
content      text not null
read         boolean default false
created_at   timestamptz default now()
```

### Tabla: `videos`
```sql
id          uuid primary key default gen_random_uuid()
profile_id  uuid references profiles(id)
url         text not null
thumbnail   text
created_at  timestamptz default now()
```

---

## Decisiones técnicas tomadas (no cambiar sin consenso)

- **Expo Router** para navegación, no React Navigation standalone
- **Supabase Realtime** para el chat, no WebSockets propios
- **Mapbox** para el mapa, no Google Maps
- **Supabase Auth** para autenticación — soporte email/password y OAuth (Google)
- **geography** de PostGIS para ubicaciones, permite queries de distancia eficientes

---

## Estado actual del proyecto

### ✅ Funcionando
- (completar a medida que se avanza)

### ⚙️ En progreso
- Setup inicial del proyecto
- Autenticación con Supabase

### ❌ Roto o pendiente
- (completar a medida que aparecen problemas)

---

## Fase activa del Roadmap

**FASE 1 — Fundación: Auth + Perfil básico**
Ver ROADMAP.md para detalle completo.

---

## Reglas para esta sesión

1. Resolver UN solo problema por conversación
2. Si algo está roto de forma estructural, reescribir limpio — no parchear
3. Antes de proponer un fix, explicar brevemente qué lo causa
4. Todo código debe ser compatible con el stack listado arriba
5. No instalar librerías nuevas sin mencionarlo y justificarlo
6. Las credenciales siempre como variables de entorno, nunca hardcodeadas

---

## Cómo usar este archivo

Pegá el contenido de este archivo al inicio de cada conversación nueva con Claude.
Luego agregá una línea de contexto:

> "Estoy en [FASE X]. El problema de hoy es: [descripción concreta del problema]."

