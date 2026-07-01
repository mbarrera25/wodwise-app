import { Injectable } from '@angular/core';
import { Workout } from '../models';
import { TrainingLoad, SectionType } from '../enums';

@Injectable({
  providedIn: 'root'
})
export class TrainingLoadService {

  calculateWorkoutLoadScore(workout: Workout): number {
    // Combine difficulty and intensity (taking the maximum of both to reflect high physical stress)
    const difficulty = workout.perceivedDifficulty || 5;
    const intensity = workout.perceivedIntensity || difficulty;
    const loadFactor = Math.max(difficulty, intensity);

    const duration = workout.durationMinutes || 30;

    if (!workout.sections || workout.sections.length === 0) {
      return loadFactor * duration;
    }

    let totalWeight = 0;
    workout.sections.forEach(section => {
      switch (section.type) {
        case SectionType.Strength:
        case SectionType.Weightlifting:
        case SectionType.Wod:
        case SectionType.Metcon:
          totalWeight += 1.5;
          break;
        case SectionType.WarmUp:
        case SectionType.Mobility:
        case SectionType.Cooldown:
        case SectionType.Notes:
          totalWeight += 0.4;
          break;
        default:
          totalWeight += 1.0;
          break;
      }
    });

    const averageWeight = totalWeight / workout.sections.length;
    return Math.round(loadFactor * duration * averageWeight);
  }

  classifyLoad(score: number): TrainingLoad {
    if (score < 150) {
      return TrainingLoad.Low;
    } else if (score >= 150 && score < 450) {
      return TrainingLoad.Medium;
    } else {
      return TrainingLoad.High;
    }
  }

  getWorkoutLoad(workout: Workout): TrainingLoad {
    const score = this.calculateWorkoutLoadScore(workout);
    return this.classifyLoad(score);
  }

  calculateWeeklyLoadScore(weeklyWorkouts: Workout[]): number {
    return weeklyWorkouts.reduce((sum, w) => sum + this.calculateWorkoutLoadScore(w), 0);
  }

  classifyWeeklyLoad(score: number): string {
    if (score < 500) {
      return 'Baja (Recuperación / Inicio)';
    } else if (score >= 500 && score <= 1500) {
      return 'Óptima (Estímulo Adecuado)';
    } else {
      return 'Alta (Riesgo de Sobreentrenamiento)';
    }
  }
}
