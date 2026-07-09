# CLAUDE.md — contexto para agentes IA

Este archivo se carga automáticamente en cada sesión de Claude Code sobre este repo. Está escrito para otro agente IA, no para humanos — asume que ya sabes leer código Angular pero no conoces el historial ni las decisiones de este proyecto. Para la guía orientada a devs humanos, ver [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md).

## Qué es esto

App de registro de entrenamientos (CrossFit/Hyrox/fuerza/cardio) llamada "wodwise" (nombre interno del paquete: `modo-atleta`). Angular 19 standalone + signals, PrimeNG, Supabase, PWA offline-first.

## Decisión arquitectónica clave: offline-first intencional

**No asumas que "sin sesión" es un bug.** La app funciona completa sin cuenta: onboarding crea un perfil en `localStorage`, todo se guarda ahí, y si el usuario luego se registra, [sync.service.ts](src/app/core/services/sync.service.ts) sube los datos locales a Supabase. Por eso:
- No existe (y se eliminó a propósito) un `authGuard` que exija login. El único guard de rutas es [profile.guard.ts](src/app/core/guards/profile.guard.ts), que solo comprueba "¿hay un perfil local?".
- El control de acceso real a los datos remotos es **RLS en Supabase** (`auth.uid() = user_id` en cada tabla), no el router.
- Si vas a añadir una ruta que *sí* requiera login (p.ej. algo que solo tenga sentido con cuenta), no reintroduzcas un guard genérico sin preguntar — puede que el patrón correcto sea un check dentro del propio componente con redirect a `/login`.

## El patrón repository + proxy — respétalo al añadir entidades

Cada entidad (`Training`/`Workout`, `BodyProgress`, `MealLog`, `UserGoal`) tiene 4 piezas:

```
core/repositories/<entity>.repository.ts          ← clase abstracta = token de DI
core/repositories/local/local-<entity>.repository.ts     ← localStorage
core/repositories/supabase/supabase-<entity>.repository.ts ← Supabase
core/repositories/proxy/proxy-<entity>.repository.ts     ← elige local vs supabase
```

El proxy decide en runtime: `authService.isAuthenticated() ? supabaseRepo : localRepo`. Se registra el proxy como implementación del token abstracto en [app.config.ts](src/app/app.config.ts).

Para goal/meal/progress existen bases genéricas — reutilízalas si añades una entidad nueva:
- [local-repository.base.ts](src/app/core/repositories/local/local-repository.base.ts) — `getAll()`/`upsert()` sobre una storage key.
- [proxy-repository.base.ts](src/app/core/repositories/proxy/proxy-repository.base.ts) — getter `activeRepo`.

**Excepción deliberada**: `Training`/`Workout` NO usa estas bases porque `SupabaseTrainingRepository.addWorkout` tiene lógica propia (llama al RPC `save_workout`, ver abajo). No lo fuerces a la base genérica.

**Anti-patrón detectado y sin arreglar todavía**: `CheckInService` ([check-in.service.ts](src/app/core/services/check-in.service.ts)) va directo a `StorageService`, sin repository ni proxy — los check-ins nunca se sincronizan a Supabase aunque el modelo extiende `SyncableModel`. Si tocas check-ins, este es el momento de decidir si migrarlo al patrón o dejarlo así intencionalmente (feature incompleta, no un bug urgente).

## Guardado de workouts: RPC transaccional, no delete+insert

`SupabaseTrainingRepository.addWorkout` llama a un único RPC (`supabase.rpc('save_workout', { payload })`) definido en [supabase_schema.sql](supabase_schema.sql) (sección 10). La función hace `DELETE` + inserts de sesión/secciones/scores/ejercicios/sets en una sola transacción de Postgres.

**Si modificas el modelo `Workout`/`TrainingSection`/`SectionScore`**, tienes que actualizar el payload en el repo TypeScript **y** la función SQL en el mismo cambio — no hay generación de tipos automática entre ambos. Si añades una tabla o columna nueva relacionada con el workout, edita `save_workout`, no vuelvas a un patrón de inserts sueltos desde el cliente.

La migración SQL de esa sección **no se aplica sola** — hay que correrla manualmente en el SQL Editor de Supabase. Si el usuario reporta "function save_workout does not exist", ese es el motivo.

## Restauración de sesión: hay un `provideAppInitializer` que la bloquea

`AuthService.ready` es una promesa que resuelve cuando `getSession()` de Supabase terminó. [app.config.ts](src/app/app.config.ts) usa `provideAppInitializer(() => inject(AuthService).ready)` para que Angular no renderice nada hasta que la sesión esté resuelta. **No quites esto** — sin él, un usuario logueado que recarga la página puede ver por un instante los datos del repo local en vez del remoto, porque los proxies deciden `local vs supabase` en base a `isAuthenticated()`, que tarda en resolver de forma asíncrona.

## Fechas: usa siempre `date-utils`, nunca `toISOString().split('T')[0]`

[date-utils.ts](src/app/core/utils/date-utils.ts) tiene `toLocalDateString(date)` y `parseLocalDate(dateStr)`. `Date.prototype.toISOString()` convierte a UTC, lo que desplaza el día calendario para usuarios en huso horario negativo (Latinoamérica) por la noche. Cualquier código nuevo que necesite "la fecha de hoy en formato YYYY-MM-DD" o que compare fechas tipo `'YYYY-MM-DD'` contra un `Date` debe pasar por estas funciones, no por `new Date(str)` ni `toISOString()`.

## Errores: nunca los trates en silencio

Todos los métodos de escritura de los repos Supabase **re-lanzan** el error tras loguearlo (antes no lo hacían, y eso causaba pérdida silenciosa de datos — ver `git log` del commit `f4efc54`). Si añades un método de escritura nuevo, sigue el mismo patrón: comprobar `error` de Supabase, `console.error` + `throw`. El consumidor (servicio o componente) es responsable de capturar y mostrar el toast vía `NotificationService` ([notification.service.ts](src/app/core/services/notification.service.ts)) — no metas `alert()` ni dejes el catch vacío.

## Modelo de datos: dos capas distintas para entrenamientos

- **`Training`/`TrainingBlock`/`BlockPrescription`** (en [models/index.ts](src/app/core/models/index.ts), sección "MODELO WIZARD"): estado transitorio del formulario multi-step ([workout-form.page.ts](src/app/features/workouts/pages/workout-form/workout-form.page.ts)). Vive solo en memoria mientras el usuario llena el wizard.
- **`Workout`/`TrainingSection`/`SectionScore`**: modelo persistido (local o Supabase).

El puente entre ambos es [training-mapper.service.ts](src/app/core/services/training-mapper.service.ts) (`TrainingMapperService.mapTrainingToWorkout`). Si añades un tipo de bloque nuevo al wizard (`BlockType`), tienes que mapearlo ahí también, o el workout final quedará con una sección vacía.

## Cosas ya revisadas y con veredicto — no las reabras sin razón

- `MealsPage` y `ProgressPage` son stubs vacíos a propósito (features no implementadas, no bugs).
- `authGuard` fue eliminado deliberadamente (ver arriba, offline-first).
- No hay tests más allá del spec por defecto de `AppComponent` — si añades lógica de dominio no trivial (coach engine, mappers, validación), considera añadir specs, pero no es una convención establecida en el resto del código.
- El bundle inicial excede el budget de Angular (~811 KB vs 500 KB configurado) — es una advertencia de build conocida, no un error; no la "arregles" bajando el budget sin que te lo pidan.

## Antes de tocar código de sync/repos/fechas, lee esto

Hay un historial de bugs de esta clase específica ya corregidos (commits `f4efc54`, `352409e`, `92b2ef4`). Antes de reintroducir un patrón como "catch que traga el error", "comparar `new Date(dateStr)` directamente", o "elegir repo local/remoto sin esperar `ready`", revisa esos commits — son exactamente los patrones que causaron los bugs originales.
