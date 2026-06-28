---
name: "Modo Atleta Forms Validation"
description: "Activa esta skill al crear o modificar formularios, validaciones, inputs, mensajes de error o experiencia de captura de datos."
---

# Instrucciones de la Skill

## Regla principal

Todos los formularios deben usar **Reactive Forms**.

## Formularios iniciales

- Onboarding/Profile form.
- Daily Check-in form.
- Workout form.
- Meal request form.
- Settings form.

## Reglas obligatorias

- Validaciones explícitas.
- Mensajes de error visibles.
- Botones desactivados si el formulario es inválido.
- Límites claros para campos numéricos.
- No permitir valores negativos en campos físicos.
- No permitir escalas fuera del rango 1–10.

## Límites recomendados

```txt
sleepHours: mínimo 0, máximo 14
energyLevel: mínimo 1, máximo 10
sorenessLevel: mínimo 1, máximo 10
stressLevel: mínimo 1, máximo 10
hungerLevel: mínimo 1, máximo 10
durationMinutes: mínimo 1, máximo 300
perceivedDifficulty: mínimo 1, máximo 10
weightKg: mínimo 0, máximo 500
rounds: mínimo 0, máximo 100
reps: mínimo 0, máximo 10000
```

## UX de formularios

- Formularios cortos.
- Inputs cómodos para mobile.
- Sliders o steppers para escalas 1–10.
- Mostrar feedback inmediato al guardar.
- Evitar pedir demasiada información obligatoria.
- Permitir notas opcionales.

## Antipatrón

No crear formularios enormes en una sola pantalla.

Si un formulario crece demasiado, dividirlo en secciones:

1. Datos básicos.
2. Intensidad.
3. Notas.
4. Resultado.
