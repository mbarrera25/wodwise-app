---
name: "Modo Atleta Signals State"
description: "Activa esta skill al trabajar con estado reactivo, Angular Signals, computed values, servicios de estado o sincronización de datos locales."
---

# Instrucciones de la Skill

## Principio general

La app debe usar **Angular Signals** para estado local y valores derivados.

Signals deben usarse especialmente en servicios de dominio como:

- WorkoutService.
- CheckInService.
- MealService.
- ProgressService.
- SettingsService.

## Reglas

- Usar `signal()` para estado mutable interno.
- Exponer señales como readonly.
- Usar `computed()` para valores derivados.
- Usar `effect()` solo cuando sea necesario.
- No usar `effect()` para lógica de negocio pesada.
- No abusar de RxJS si Signals resuelve el caso.
- RxJS queda reservado para formularios, APIs futuras y flujos asíncronos complejos.

## Ejemplo recomendado

```ts
private readonly workoutsSignal = signal<Workout[]>([]);

readonly workouts = this.workoutsSignal.asReadonly();

readonly totalWorkouts = computed(() => this.workoutsSignal().length);

readonly workoutsThisWeek = computed(() =>
  this.workoutsSignal().filter(workout => isCurrentWeek(workout.date))
);
```

## Actualización de estado

```ts
addWorkout(workout: Workout): void {
  this.workoutsSignal.update(current => [workout, ...current]);
}
```

## Antipatrón

```ts
// No hacer lógica pesada directamente en el componente
ngOnInit() {
  if (this.sleep < 6 && this.soreness > 7) {
    this.message = 'Recuperación baja';
  }
}
```

Esa lógica pertenece a `CoachEngineService`.

## Estado global vs estado local

- Estado global de dominio: servicios.
- Estado temporal de formulario: Reactive Forms.
- Estado visual simple: signals dentro del componente.
- Datos persistidos: StorageService o repositorio futuro.
