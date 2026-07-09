# Guía para desarrolladores — wodwise / modo-atleta

App de registro de entrenamientos (CrossFit, Hyrox, fuerza, cardio) con modo offline. Angular 19 (standalone components + signals), PrimeNG, Supabase como backend, PWA con service worker.

> Si eres un agente IA (Claude Code u otro) trabajando en este repo, lee primero [CLAUDE.md](../CLAUDE.md) en la raíz — tiene contexto específico para evitar reintroducir bugs ya corregidos.

## Setup local

```bash
npm install
cp src/environments/environment.example.ts src/environments/environment.ts
# edita environment.ts con tu URL y anon key de Supabase
cp src/environments/environment.example.ts src/environments/environment.development.ts
# idem para development.ts
npm start   # ng serve, http://localhost:4200
```

`environment.ts` y `environment.development.ts` **no están en git** (están en `.gitignore` y fueron destrackeados). En producción (Vercel), [scripts/set-env.js](../scripts/set-env.js) genera `environment.production.ts` a partir de las variables de entorno `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` durante el build (`npm run build` las ejecuta en cadena).

Necesitas un proyecto Supabase con el esquema de [supabase_schema.sql](../supabase_schema.sql) aplicado — pégalo entero en el SQL Editor del dashboard. Si el esquema ya existía antes de julio 2026, asegúrate de correr también la sección 10 (`save_workout` + los `ALTER TABLE` que relajan `energy_before`/`energy_after`), que se añadió en una corrección posterior.

## Arquitectura en una imagen mental

```
features/<feature>/pages/<page>/<page>.page.ts   ← componentes standalone, uno por ruta
core/services/                                    ← lógica de dominio (signals + computed)
core/repositories/<entity>.repository.ts          ← abstracción de persistencia
  ├── local/     → localStorage (modo anónimo / sin conexión)
  ├── supabase/  → Postgres vía supabase-js
  └── proxy/     → elige local o supabase según sesión
core/guards/     ← profileGuard: ¿hay perfil local? si no, a onboarding
core/models/     ← interfaces compartidas
layout/          ← shell móvil (header, bottom-nav, mobile-shell)
```

### Por qué existe el proxy

La app es **offline-first**: puedes usarla sin crear cuenta. Todo se guarda en `localStorage`. Si después te registras, [sync.service.ts](../src/app/core/services/sync.service.ts) sube lo que tenías localmente a Supabase. El proxy de cada entidad decide en cada llamada si leer/escribir en local o remoto, mirando `AuthService.isAuthenticated()`. Los servicios de dominio (`WorkoutService`, etc.) nunca saben cuál de los dos están usando — inyectan el token abstracto (`TrainingRepository`), no una implementación concreta.

Esto significa que **el control de acceso a rutas no es "requiere login"**, es "requiere tener un perfil" (local o remoto, da igual). La seguridad real sobre los datos remotos la da Row Level Security en Supabase (cada política exige `auth.uid() = user_id`).

### El wizard de entrenamiento tiene dos modelos

1. **`Training`** (con `TrainingBlock`, `BlockPrescription`) — el estado del formulario multi-step mientras lo estás llenando. Vive solo en el componente [workout-form.page.ts](../src/app/features/workouts/pages/workout-form/workout-form.page.ts).
2. **`Workout`** (con `TrainingSection`, `SectionScore`) — lo que realmente se persiste.

`TrainingMapperService.mapTrainingToWorkout()` traduce de uno al otro al hacer submit. Si añades un nuevo tipo de bloque al wizard, ese es el sitio donde tienes que enseñarle a mapearlo.

### Guardado de workouts: todo o nada

Guardar un entrenamiento llama a una función de Postgres (`save_workout`, RPC) que inserta sesión + secciones + scores + ejercicios + sets dentro de una sola transacción. Si algo falla a mitad, se revierte todo — no quedan filas huérfanas. Si necesitas cambiar los campos que se guardan, edita **tanto** el payload en [supabase-training.repository.ts](../src/app/core/repositories/supabase/supabase-training.repository.ts) **como** la función SQL en `supabase_schema.sql`, y vuelve a aplicar el SQL en el dashboard.

## Convenciones que sí importan

- **Fechas**: usa `toLocalDateString()` / `parseLocalDate()` de [date-utils.ts](../src/app/core/utils/date-utils.ts) para cualquier cosa relacionada con "hoy" o comparar fechas `YYYY-MM-DD`. Nunca `new Date().toISOString().split('T')[0]` ni `new Date(dateStr)` directo — ambos operan en UTC y desplazan el día para usuarios en huso horario negativo.
- **Errores en repos**: los métodos de escritura de los repos Supabase deben re-lanzar el error (no tragarlo con un `catch` vacío). El componente/servicio que llama es quien decide mostrar el error, normalmente vía `NotificationService` (toasts de PrimeNG), nunca `alert()`.
- **IDs**: `crypto.randomUUID()`, no `Math.random()`.
- **Entidades nuevas con sync local↔remoto**: sigue el patrón repository/proxy. Si es simple (CRUD plano tipo goal/meal/progress), extiende `LocalRepositoryBase`/`ProxyRepositoryBase` en vez de repetir la lógica.

## Comandos

```bash
npm start              # ng serve
npm run build          # genera environment.production.ts + ng build
npm test               # karma + jasmine (solo hay specs mínimos por ahora)
```

## Limitaciones conocidas (no son bugs, son estado del proyecto)

- `MealsPage` y `ProgressPage` son pantallas vacías — la infraestructura de datos existe (`MealRepository`, `ProgressRepository`) pero la UI no está implementada.
- `CheckInService` no sincroniza a Supabase (va directo a `localStorage`), a diferencia de las demás entidades.
- Cobertura de tests mínima — si añades lógica de dominio no trivial, considera escribir specs aunque no sea la norma actual del repo.
- El bundle inicial supera el budget configurado en `angular.json` (~811 KB / 500 KB). Es una advertencia de build conocida.

## Historial de bugs corregidos que conviene conocer

En julio de 2026 se corrigió una serie de bugs relacionados entre sí — commits `f4efc54`, `352409e`, `92b2ef4`. Vale la pena mirarlos si vas a tocar sync, repos de Supabase, sesión, o manejo de fechas, porque documentan patrones concretos a evitar (errores tragados, comparación de fechas en UTC, elegir repo local/remoto antes de que la sesión termine de resolver).
