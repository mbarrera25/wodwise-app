---
name: "Modo Atleta Local Storage"
description: "Activa esta skill al trabajar con persistencia local, LocalStorage, IndexedDB, keys, serialización o repositorios futuros."
---

# Instrucciones de la Skill

## Propósito

La fase 1 debe persistir datos localmente usando `StorageService`.

Los componentes nunca deben acceder directamente a `localStorage`.

## Keys oficiales

```ts
export const STORAGE_KEYS = {
  USER_PROFILE: 'modo_atleta_user_profile',
  WORKOUTS: 'modo_atleta_workouts',
  CHECK_INS: 'modo_atleta_check_ins',
  MEAL_REQUESTS: 'modo_atleta_meal_requests',
  SETTINGS: 'modo_atleta_settings',
};
```

## Reglas

- No hardcodear keys en componentes.
- Toda persistencia debe pasar por `StorageService`.
- Manejar errores de `JSON.parse`.
- Manejar valores inexistentes.
- No romper la app si storage falla.
- Preparar la estructura para migrar a IndexedDB o backend futuro.

## Contrato recomendado

```ts
getItem<T>(key: string): T | null;
setItem<T>(key: string, value: T): void;
removeItem(key: string): void;
clear(): void;
```

## Versionado futuro

Si los modelos cambian mucho, agregar versionado de storage:

```ts
export const STORAGE_VERSION = 1;
```

Y manejar migraciones:

```ts
migrateStorageIfNeeded(): void;
```

## Antipatrón

```ts
localStorage.setItem('workouts', JSON.stringify(workouts));
```

Debe ser:

```ts
this.storageService.setItem(STORAGE_KEYS.WORKOUTS, workouts);
```
