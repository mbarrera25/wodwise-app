import { Injectable, inject } from '@angular/core';
import { UserProfile, Workout, DailyCheckIn, CoachEvaluation } from '../models';
import { TrainingLoad, RecoveryStatus, FatigueRisk, WorkoutType, TrainingGoal, SectionType } from '../enums';
import { TrainingLoadService } from './training-load.service';
import { RecoveryRecommendationService } from './recovery-recommendation.service';
import { WorkoutService } from './workout.service';

@Injectable({
  providedIn: 'root'
})
export class CoachEngineService {
  private readonly loadService = inject(TrainingLoadService);
  private readonly recoveryService = inject(RecoveryRecommendationService);
  private readonly workoutService = inject(WorkoutService);

  evaluateWorkout(workout: Workout, checkIn: DailyCheckIn | null, profile: UserProfile): CoachEvaluation {
    const trainingLoad = this.calculateTrainingLoad(workout);
    const recoveryStatus = this.calculateRecoveryStatus(checkIn);
    const fatigueRisk = this.calculateFatigueRisk(trainingLoad, recoveryStatus);
    const highlights = this.detectHighlights(workout, checkIn, profile, trainingLoad, recoveryStatus);
    const recommendations = this.generateRecommendations(workout, checkIn, profile, trainingLoad, recoveryStatus);

    return {
      trainingLoad,
      recoveryStatus,
      fatigueRisk,
      highlights,
      recommendations
    };
  }

  calculateTrainingLoad(workout: Workout): TrainingLoad {
    return this.loadService.getWorkoutLoad(workout);
  }

  calculateRecoveryStatus(checkIn: DailyCheckIn | null): RecoveryStatus {
    if (!checkIn) {
      return RecoveryStatus.Ok;
    }

    const sleep = checkIn.sleepHours;
    const soreness = checkIn.sorenessLevel;
    const energy = checkIn.energyLevel;
    const stress = checkIn.stressLevel;

    if (sleep < 6 && soreness >= 7) {
      return RecoveryStatus.Low;
    }
    if (energy <= 4) {
      return RecoveryStatus.Low;
    }
    if (stress >= 8) {
      return RecoveryStatus.Low;
    }
    if (energy >= 8 && soreness <= 4) {
      return RecoveryStatus.Good;
    }

    return RecoveryStatus.Ok;
  }

  calculateFatigueRisk(load: TrainingLoad, recovery: RecoveryStatus): FatigueRisk {
    if (load === TrainingLoad.High && recovery === RecoveryStatus.Low) {
      return FatigueRisk.High;
    }
    if (load === TrainingLoad.High && recovery === RecoveryStatus.Ok) {
      return FatigueRisk.Medium;
    }
    if (load === TrainingLoad.Medium && recovery === RecoveryStatus.Low) {
      return FatigueRisk.Medium;
    }
    if (load === TrainingLoad.Low && recovery === RecoveryStatus.Good) {
      return FatigueRisk.Low;
    }

    if (recovery === RecoveryStatus.Low) {
      return FatigueRisk.Medium;
    }
    if (load === TrainingLoad.High) {
      return FatigueRisk.Medium;
    }
    return FatigueRisk.Low;
  }

  private detectHighlights(
    workout: Workout,
    checkIn: DailyCheckIn | null,
    profile: UserProfile,
    load: TrainingLoad,
    recovery: RecoveryStatus
  ): string[] {
    const highlights: string[] = [];

    if (load === TrainingLoad.High) {
      highlights.push('Sesión de alta exigencia completada.');
    } else if (load === TrainingLoad.Medium) {
      highlights.push('Estímulo de intensidad moderada acumulado.');
    } else {
      highlights.push('Sesión de carga regenerativa o baja intensidad.');
    }

    if (checkIn) {
      if (checkIn.sleepHours < 6) {
        highlights.push('Descanso nocturno limitado detectable.');
      } else if (checkIn.sleepHours >= 8) {
        highlights.push('Excelente descanso nocturno registrado.');
      }

      if (checkIn.sorenessLevel >= 7) {
        highlights.push('Nivel alto de dolor o fatiga muscular residual.');
      }
    }

    if (workout.sections && workout.sections.length > 0) {
      const strengthSections = workout.sections.filter(s => s.type === SectionType.Strength || s.type === SectionType.Weightlifting);
      if (strengthSections.length > 0) {
        highlights.push(`Contiene ${strengthSections.length} bloques enfocados en fuerza/peso.`);
      }
    } else if (workout.weightKg && workout.weightKg > 0) {
      highlights.push(`Trabajo con carga externa de ${workout.weightKg} kg.`);
    }

    return highlights;
  }

  private generateRecommendations(
    workout: Workout,
    checkIn: DailyCheckIn | null,
    profile: UserProfile,
    load: TrainingLoad,
    recovery: RecoveryStatus
  ): string[] {
    const recs: string[] = [];

    // Add recovery suggestions from our new service
    const history = this.workoutService.getWorkouts();
    const recoveryAdvice = this.recoveryService.getRecommendation(history);
    if (recoveryAdvice) {
      recs.push(recoveryAdvice);
    }

    if (load === TrainingLoad.High) {
      recs.push('Este entrenamiento tuvo carga alta. Prioriza hidratación, proteína y un descanso de calidad esta noche.');
      recs.push('Evita repetir otro entrenamiento muy intenso mañana si sigues con dolor muscular alto.');
    }

    if (recovery === RecoveryStatus.Low) {
      recs.push('Hoy tu recuperación parece baja. Considera enfocar tu siguiente sesión en movilidad, caminata suave o descanso activo.');
      if (checkIn && checkIn.sleepHours < 6) {
        recs.push('Prioriza dormir al menos 7-8 horas esta noche antes de buscar añadir volumen o cargas extra a tus entrenamientos.');
      }
      recs.push('No busques romper marcas personales (PR) cuando tu cuerpo muestre altos niveles de fatiga o poco sueño.');
    }

    if (checkIn && checkIn.sorenessLevel >= 7) {
      recs.push('Presentas dolor muscular alto. Evita repetir ejercicios exigentes para el mismo grupo muscular mañana; añade movilidad suave.');
    }

    if (profile.mainGoal === TrainingGoal.Strength) {
      recs.push('Consejo de Fuerza: Registra con precisión tus cargas y busca una progresión gradual, no des saltos agresivos de peso.');
    } else if (profile.mainGoal === TrainingGoal.Endurance) {
      recs.push('Consejo de Resistencia: Mantén ritmos sostenibles en tus sesiones aeróbicas. Trabaja tu respiración y el ritmo constante.');
    } else if (profile.mainGoal === TrainingGoal.FatLoss) {
      recs.push('Consejo de Enfoque: Combina entrenamientos de fuerza con movimiento continuo y prioriza alimentos densos en nutrientes.');
    }

    if (recs.length === 0) {
      recs.push('¡Buen trabajo! Sigue registrando tus sensaciones diarias para detectar patrones de progreso con más claridad.');
    }

    return recs;
  }
}
