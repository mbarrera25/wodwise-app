---
name: "Modo Atleta Testing Quality"
description: "Activa esta skill al agregar pruebas, revisar calidad, refactorizar servicios, validar reglas o mejorar mantenibilidad."
---

# Instrucciones de la Skill

## Prioridad de testing

Aunque el MVP no arranque con muchos tests, la arquitectura debe permitirlos.

Prioridad:

1. CoachEngineService.
2. ProgressService.
3. MealService.
4. StorageService.
5. Factories.
6. Utils de fechas.

## Servicio más importante

El servicio más importante para testear es:

```txt
coach-engine.service.ts
```

## Casos mínimos del CoachEngineService

Probar:

- Carga alta por dificultad >= 8.
- Carga alta por duración >= 60 y dificultad >= 7.
- Carga baja por movilidad o descanso activo.
- Recuperación baja por sueño bajo + dolor alto.
- Recuperación baja por energía baja.
- Recuperación buena por energía alta + dolor bajo.
- Riesgo alto por carga alta + recuperación baja.
- Riesgo medio por carga alta + recuperación aceptable.
- Recomendaciones correctas por objetivo.

## Reglas de calidad

- Evitar `any`.
- Mantener funciones pequeñas.
- Mantener servicios con responsabilidad única.
- Evitar duplicación de reglas.
- Usar nombres claros.
- Mantener reglas del coach centralizadas.
- No romper contratos existentes sin actualizar modelos y tests.
