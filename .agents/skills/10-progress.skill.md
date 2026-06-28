---
name: "Modo Atleta Progress"
description: "Activa esta skill al trabajar con progreso semanal, métricas, avances notables, PRs, estadísticas o gráficos."
---

# Instrucciones de la Skill

## Propósito

El módulo de progreso debe mostrar señales útiles de mejora sin saturar al usuario.

Debe enfocarse en:

- Constancia.
- Carga.
- Energía.
- Dificultad.
- Descanso.
- Avances notables.
- PRs simples.

## ProgressService

Debe tener:

```ts
getWeeklySummary();
getTrainingFrequency();
getAverageEnergy();
getAverageDifficulty();
detectPersonalRecords();
detectNotableProgress();
```

## Métricas iniciales

Mostrar en fase 1:

- Entrenamientos esta semana.
- Promedio de energía.
- Promedio de dificultad.
- Días de descanso.
- Último entrenamiento.
- Avance notable.
- Mejor carga por ejercicio si hay datos.

## Avances notables

Detectar cosas como:

```txt
Entrenaste más días que la semana pasada.
Subiste peso en un ejercicio.
Repetiste un WOD similar con mejor tiempo.
Tu dificultad promedio bajó para entrenamientos similares.
Volviste después de varios días sin entrenar.
Tu energía promedio mejoró.
```

## Reglas

- No inventar avances.
- No exagerar.
- Mostrar evidencia cuando sea posible.
- Priorizar mensajes positivos y realistas.
- No hacer comparaciones dañinas.
- Comparar al usuario contra su propio historial.

## Ejemplo de mensaje

```txt
Avance notable:
Esta semana entrenaste 4 veces, una más que la semana anterior.
```

```txt
Avance notable:
Registraste 30 kg en clean, tu carga más alta hasta ahora para ese ejercicio.
```
