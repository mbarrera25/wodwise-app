import { Injectable, inject } from '@angular/core';
import { Workout, SectionScore } from '../models';
import { TrainingSummaryService } from './training-summary.service';
import { parseTimeToSeconds } from '../utils/time-utils';
import { parseLocalDate } from '../utils/date-utils';

export interface SessionComparisonMetric {
  metric: string;
  valueA: string;
  valueB: string;
  // Whether `workout` (the one being reviewed) improved, worsened, or matched `other` on this metric.
  trend: 'better' | 'worse' | 'same';
}

@Injectable({
  providedIn: 'root'
})
export class SessionComparisonService {
  private readonly summaryService = inject(TrainingSummaryService);

  findSimilarSessions(workout: Workout, allWorkouts: Workout[]): Workout[] {
    const candidates = allWorkouts.filter(w => w.id !== workout.id);
    const workoutName = workout.name.trim().toLowerCase();

    if (workoutName) {
      const sameName = candidates.filter(w => w.name.trim().toLowerCase() === workoutName);
      if (sameName.length > 0) {
        return this.sortByDateDesc(sameName);
      }
    }

    const exercisesA = new Set(workout.mainExercises.map(e => e.trim().toLowerCase()).filter(Boolean));
    if (exercisesA.size === 0) return [];

    const similar = candidates.filter(w => {
      const exercisesB = new Set(w.mainExercises.map(e => e.trim().toLowerCase()).filter(Boolean));
      if (exercisesB.size === 0) return false;
      const overlap = [...exercisesA].filter(e => exercisesB.has(e)).length;
      const overlapRatio = overlap / Math.max(exercisesA.size, exercisesB.size);
      return overlapRatio >= 0.5;
    });

    return this.sortByDateDesc(similar);
  }

  // `workout` is the session being reviewed, `other` is the similar session picked to compare against.
  compareSessions(workout: Workout, other: Workout): SessionComparisonMetric[] {
    const scoreA = this.getComparableScore(workout);
    const scoreB = this.getComparableScore(other);
    const metrics: SessionComparisonMetric[] = [];

    if (scoreA.finalTime && scoreB.finalTime) {
      const secA = parseTimeToSeconds(scoreA.finalTime);
      const secB = parseTimeToSeconds(scoreB.finalTime);
      metrics.push({
        metric: 'Tiempo',
        valueA: scoreA.finalTime,
        valueB: scoreB.finalTime,
        trend: this.compare(secA, secB, false)
      });
    }

    if (scoreA.weightKg != null && scoreB.weightKg != null) {
      metrics.push({
        metric: 'Peso',
        valueA: `${scoreA.weightKg} kg`,
        valueB: `${scoreB.weightKg} kg`,
        trend: this.compare(scoreA.weightKg, scoreB.weightKg, true)
      });
    }

    if (scoreA.rounds != null && scoreB.rounds != null) {
      metrics.push({
        metric: 'Rounds',
        valueA: `${scoreA.rounds}${scoreA.repsCompleted ? ' + ' + scoreA.repsCompleted + ' reps' : ''}`,
        valueB: `${scoreB.rounds}${scoreB.repsCompleted ? ' + ' + scoreB.repsCompleted + ' reps' : ''}`,
        trend: this.compare(
          scoreA.rounds * 1000 + (scoreA.repsCompleted || 0),
          scoreB.rounds * 1000 + (scoreB.repsCompleted || 0),
          true
        )
      });
    } else if (scoreA.reps != null && scoreB.reps != null) {
      metrics.push({
        metric: 'Reps',
        valueA: `${scoreA.reps}`,
        valueB: `${scoreB.reps}`,
        trend: this.compare(scoreA.reps, scoreB.reps, true)
      });
    }

    metrics.push({
      metric: 'Dificultad percibida',
      valueA: `${workout.perceivedDifficulty}/10`,
      valueB: `${other.perceivedDifficulty}/10`,
      trend: this.compare(workout.perceivedDifficulty, other.perceivedDifficulty, false)
    });

    return metrics;
  }

  private getComparableScore(workout: Workout): SectionScore {
    if (workout.sections && workout.sections.length > 0) {
      const mainSection = this.summaryService.detectMainSection(workout.sections);
      if (mainSection.score) return mainSection.score;
    }
    return {
      finalTime: workout.finalTime,
      weightKg: workout.weightKg,
      rounds: workout.rounds,
      reps: workout.reps
    };
  }

  private compare(valueA: number, valueB: number, higherIsBetter: boolean): 'better' | 'worse' | 'same' {
    if (valueA === valueB) return 'same';
    const aIsHigher = valueA > valueB;
    const aIsBetter = higherIsBetter ? aIsHigher : !aIsHigher;
    return aIsBetter ? 'better' : 'worse';
  }

  private sortByDateDesc(workouts: Workout[]): Workout[] {
    return [...workouts].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
  }
}
