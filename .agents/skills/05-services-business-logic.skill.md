---
name: "Modo Atleta Services Business Logic"
description: "Activa esta skill al crear o modificar servicios, lógica de negocio, persistencia local, evaluación, comidas, progreso o reglas de dominio."
---

# Instrucciones de la Skill

## Regla principal

Toda lógica de negocio debe vivir en servicios, no en componentes.

## Servicios obligatorios

### StorageService

Responsable de persistencia local.

Debe tener:

```ts
getItem<T>(key: string): T | null;
setItem<T>(key: string, value: T): void;
removeItem(key: string): void;
clear(): void;
```

Reglas:

- Ningún componente debe usar `localStorage` directamente.
- Manejar errores de JSON parse.
- Usar keys desde constantes.

### WorkoutService

Responsable de entrenamientos.

Debe tener:

```ts
createWorkout();
updateWorkout();
deleteWorkout();
getWorkouts();
getWorkoutById();
```

Reglas:

- No evalúa entrenamientos.
- No genera recomendaciones.
- Solo gestiona datos de workouts.

### CheckInService

Responsable de check-ins diarios.

Debe tener:

```ts
saveDailyCheckIn();
getCheckIns();
getCheckInByDate();
getLatestCheckIn();
```

### CoachEngineService

Servicio central del proyecto.

Debe tener:

```ts
evaluateWorkout();
calculateTrainingLoad();
calculateRecoveryStatus();
calculateFatigueRisk();
generateRecommendations();
detectHighlights();
```

Reglas:

- No accede al DOM.
- No conoce PrimeNG.
- No guarda datos.
- Solo recibe modelos y devuelve evaluaciones.
- Debe ser testeable.
- Debe ser determinístico.

### MealService

Responsable de sugerencias de comidas.

Debe tener:

```ts
getMealSuggestions();
filterMealsByGoal();
filterMealsByIngredients();
```

Reglas:

- No generar dietas médicas.
- No prometer pérdida de peso.
- Usar recetas base desde constantes o data local.
- Dar recomendaciones prácticas.

### ProgressService

Responsable de progreso.

Debe tener:

```ts
getWeeklySummary();
getTrainingFrequency();
getAverageEnergy();
getAverageDifficulty();
detectPersonalRecords();
detectNotableProgress();
```

## Antipatrón

```ts
// No hacer esto dentro de WorkoutFormPage
if (workout.perceivedDifficulty >= 8) {
  this.trainingLoad = 'high';
}
```

Debe ser:

```ts
const evaluation = this.coachEngine.evaluateWorkout(workout, checkIn, profile);
```
