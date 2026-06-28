---
name: "Modo Atleta Models Enums Factories"
description: "Activa esta skill al crear o modificar modelos TypeScript, enums, factories, tipos, contratos de datos o labels reutilizables."
---

# Instrucciones de la Skill

## Principio general

El proyecto debe usar:

- Interfaces para contratos de datos.
- Enums para valores repetibles.
- Factories para crear entidades con defaults.
- Constantes para labels visibles.
- Nada de strings mágicos.

## Interfaces

Usar interfaces para representar datos.

```ts
export interface Workout {
  id: string;
  date: string;
  type: WorkoutType;
  name: string;
  durationMinutes?: number;
  mainExercises: string[];
  weightKg?: number;
  rounds?: number;
  reps?: number;
  finalTime?: string;
  perceivedDifficulty: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}
```

## Enums

```ts
export enum WorkoutType {
  Wod = 'wod',
  Strength = 'strength',
  Cardio = 'cardio',
  Mobility = 'mobility',
  Walk = 'walk',
  ActiveRest = 'active_rest',
}
```

```ts
export enum TrainingLoad {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}
```

```ts
export enum RecoveryStatus {
  Low = 'low',
  Ok = 'ok',
  Good = 'good',
}
```

```ts
export enum FatigueRisk {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}
```

## Labels visibles

Los labels de UI deben mapearse aparte.

```ts
export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  [WorkoutType.Wod]: 'WOD',
  [WorkoutType.Strength]: 'Fuerza',
  [WorkoutType.Cardio]: 'Cardio',
  [WorkoutType.Mobility]: 'Movilidad',
  [WorkoutType.Walk]: 'Caminata',
  [WorkoutType.ActiveRest]: 'Descanso activo',
};
```

## Factories

Usar factories cuando se necesiten defaults consistentes.

```ts
export class WorkoutFactory {
  static create(input: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>): Workout {
    const now = new Date().toISOString();

    return {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
  }
}
```

## Reglas

- No crear constructores pesados en modelos.
- No meter lógica de negocio en modelos.
- No usar `any`.
- No usar strings repetidos.
- No hardcodear labels en varios componentes.
- Usar tipos explícitos.
