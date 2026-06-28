---
name: "Modo Atleta Meals Nutrition"
description: "Activa esta skill al trabajar con sugerencias de comidas, MealService, objetivos alimenticios, ingredientes o recomendaciones nutricionales generales."
---

# Instrucciones de la Skill

## Propósito

El módulo de comidas debe dar ideas prácticas según objetivo, ingredientes y contexto de entrenamiento.

No debe actuar como nutricionista médico.

## Permitido

- Sugerencias generales.
- Ideas de comidas prácticas.
- Comidas según objetivo.
- Comidas pre-entreno.
- Comidas post-entreno.
- Recomendaciones de hidratación.
- Recordatorios generales de proteína y carbohidrato.

## No permitido

- Dietas médicas estrictas.
- Promesas de pérdida de peso.
- Restricciones agresivas.
- Diagnósticos.
- Planes extremos.
- Recomendaciones para enfermedades específicas.

## Objetivos de comida

```ts
export enum MealGoal {
  PreWorkout = 'pre_workout',
  PostWorkout = 'post_workout',
  FatLoss = 'fat_loss',
  MuscleGain = 'muscle_gain',
  QuickMeal = 'quick_meal',
  LightDinner = 'light_dinner',
}
```

## Lógica base

```txt
Post-entreno fuerte:
proteína + carbohidrato + líquidos.

Pre-entreno:
comida ligera, fácil de digerir, con carbohidrato.

Bajar grasa:
proteína + vegetales + carbohidrato moderado.

Ganar músculo:
proteína + carbohidrato + calorías suficientes.

Cena ligera:
proteína + vegetales + porción moderada.
```

## MealService

Debe tener:

```ts
getMealSuggestions();
filterMealsByGoal();
filterMealsByIngredients();
```

## Tono

Usar lenguaje práctico:

- “Buena opción para recuperación.”
- “Puede ayudarte a reponer energía.”
- “Prioriza proteína y carbohidrato si el entrenamiento fue fuerte.”

Evitar:

- “Esto te hará bajar de peso.”
- “No comas X nunca.”
- “Esta dieta cura...”
