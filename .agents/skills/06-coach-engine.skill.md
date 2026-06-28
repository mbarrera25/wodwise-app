---
name: "Modo Atleta Coach Engine"
description: "Activa esta skill al trabajar con evaluación de WODs, carga de entrenamiento, recuperación, fatiga, recomendaciones o highlights del coach."
---

# Instrucciones de la Skill

## Propósito

`CoachEngineService` es el corazón del proyecto. Evalúa entrenamientos, recuperación, riesgo de fatiga y recomendaciones usando reglas internas.

No debe depender de IA externa en fase 1.

## Input esperado

El servicio puede recibir:

- UserProfile.
- Workout.
- DailyCheckIn.
- Historial opcional de workouts.
- Historial opcional de check-ins.

## Output esperado

Debe devolver un objeto `CoachEvaluation`.

```ts
export interface CoachEvaluation {
  trainingLoad: TrainingLoad;
  recoveryStatus: RecoveryStatus;
  fatigueRisk: FatigueRisk;
  highlights: string[];
  recommendations: string[];
}
```

## Reglas de carga

```txt
Si perceivedDifficulty >= 8 → trainingLoad = high.
Si durationMinutes >= 60 y perceivedDifficulty >= 7 → trainingLoad = high.
Si perceivedDifficulty está entre 5 y 7 → trainingLoad = medium.
Si perceivedDifficulty <= 4 → trainingLoad = low.
Si workout type es mobility o active_rest → trainingLoad = low, salvo dificultad >= 8.
```

## Reglas de recuperación

```txt
Si sleepHours < 6 y sorenessLevel >= 7 → recoveryStatus = low.
Si energyLevel <= 4 → recoveryStatus = low.
Si stressLevel >= 8 → recoveryStatus = low.
Si energyLevel >= 8 y sorenessLevel <= 4 → recoveryStatus = good.
Caso contrario → recoveryStatus = ok.
```

## Reglas de fatiga

```txt
trainingLoad high + recoveryStatus low → fatigueRisk high.
trainingLoad high + recoveryStatus ok → fatigueRisk medium.
trainingLoad medium + recoveryStatus low → fatigueRisk medium.
trainingLoad low + recoveryStatus good → fatigueRisk low.
```

## Recomendaciones base

### Carga alta

- Prioriza hidratación, proteína y sueño.
- Evita repetir otro entrenamiento muy intenso mañana si sigues con dolor alto.

### Recuperación baja

- Considera movilidad, caminata suave o descanso activo.
- No busques PR si dormiste poco o tienes mucho dolor.

### Dolor muscular alto

- Evita repetir el mismo grupo muscular fuerte al día siguiente.
- Añade movilidad suave y buena hidratación.

### Sueño bajo

- Reduce intensidad si puedes.
- Prioriza sueño antes que volumen extra.

### Objetivo resistencia

- Mantén ritmos sostenibles.
- Trabaja respiración y pacing.

### Objetivo fuerza

- Registra cargas.
- Busca progresión gradual, no saltos agresivos.

## Tono de las recomendaciones

Debe ser:

- Claro.
- Motivador.
- Práctico.
- Sin juicio.
- Sin prometer resultados médicos.

Evitar:

- “Estás fallando”.
- “Entrenaste mal”.
- “Comiste mal”.
- “Vas a bajar X kilos”.
