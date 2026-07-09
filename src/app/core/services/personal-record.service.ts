import { Injectable } from '@angular/core';
import { Workout, TrainingSection, SectionScore } from '../models';
import { SectionType } from '../enums';
import { parseTimeToSeconds } from '../utils/time-utils';

export interface PersonalRecord {
  exerciseName: string;
  workoutId: string;
  workoutName: string;
  date: string;
  metricType: 'weight' | 'reps' | 'time' | 'distance' | 'calories' | 'rounds_reps';
  value: string;
  numericValue: number;
}

@Injectable({
  providedIn: 'root'
})
export class PersonalRecordService {

  // Detect PRs achieved in a specific workout by comparing it against all workouts
  detectPRsInWorkout(workout: Workout, allWorkouts: Workout[]): PersonalRecord[] {
    const prs: PersonalRecord[] = [];
    if (!workout.sections || workout.sections.length === 0) return prs;

    // Filter all workouts that occurred BEFORE the current workout date (excluding the current workout id)
    const history = allWorkouts.filter(w => w.id !== workout.id && new Date(w.date) <= new Date(workout.date));

    workout.sections.forEach(section => {
      // Ignore warm-up, mobility, cooldown, notes for PR consideration
      if (
        section.type === SectionType.WarmUp ||
        section.type === SectionType.Mobility ||
        section.type === SectionType.Cooldown ||
        section.type === SectionType.Notes
      ) {
        return;
      }

      const score = section.score;
      if (!score) return;

      // Group 1: Strength, Weightlifting, Gymnastics, Accessory (weight and reps PRs)
      if (
        section.type === SectionType.Strength ||
        section.type === SectionType.Weightlifting ||
        section.type === SectionType.Gymnastics ||
        section.type === SectionType.Accessory
      ) {
        section.exercises.forEach(exName => {
          const exercise = exName.trim();
          if (!exercise) return;

          // Check weight PR
          if (score.weightKg !== undefined && score.weightKg !== null && score.weightKg > 0) {
            const currentWeight = score.weightKg;
            const previousBest = this.getPreviousBest(history, exercise, 'weight');
            
            if (previousBest === null || currentWeight > previousBest) {
              prs.push({
                exerciseName: exercise,
                workoutId: workout.id,
                workoutName: workout.name,
                date: workout.date,
                metricType: 'weight',
                value: `${currentWeight} kg` + (score.reps ? ` (${score.reps} reps)` : '') + (score.sets ? ` [${score.sets} sets]` : ''),
                numericValue: currentWeight
              });
            }
          }

          // Check reps PR if no weight is involved (or for gymnastics/calisthenics reps)
          if ((score.weightKg === undefined || score.weightKg === null) && score.reps !== undefined && score.reps !== null && score.reps > 0) {
            const currentReps = score.reps;
            const previousBest = this.getPreviousBest(history, exercise, 'reps');

            if (previousBest === null || currentReps > previousBest) {
              prs.push({
                exerciseName: exercise,
                workoutId: workout.id,
                workoutName: workout.name,
                date: workout.date,
                metricType: 'reps',
                value: `${currentReps} reps` + (score.sets ? ` [${score.sets} sets]` : ''),
                numericValue: currentReps
              });
            }
          }
        });
      }

      // Group 2: WOD, Metcon, Skill, Technique (time, rounds, calories, distance PRs)
      if (
        section.type === SectionType.Wod ||
        section.type === SectionType.Metcon ||
        section.type === SectionType.Skill ||
        section.type === SectionType.Technique
      ) {
        const wodName = workout.name.trim() || 'WOD';

        // Check time PR (lower is better, only if metricType is time)
        if (score.finalTime) {
          const seconds = parseTimeToSeconds(score.finalTime);
          if (seconds > 0) {
            const previousBest = this.getPreviousBest(history, wodName, 'time');

            if (previousBest === null || seconds < previousBest) {
              prs.push({
                exerciseName: wodName,
                workoutId: workout.id,
                workoutName: workout.name,
                date: workout.date,
                metricType: 'time',
                value: score.finalTime,
                numericValue: seconds
              });
            }
          }
        }

        // Check rounds/reps PR
        if (score.rounds !== undefined && score.rounds !== null && score.rounds > 0) {
          const repsCompleted = score.repsCompleted || 0;
          const currentTotal = score.rounds * 1000 + repsCompleted;
          const previousBest = this.getPreviousBest(history, wodName, 'rounds_reps');

          if (previousBest === null || currentTotal > previousBest) {
            const valueStr = repsCompleted > 0 ? `${score.rounds} rds + ${repsCompleted} reps` : `${score.rounds} rds`;
            prs.push({
              exerciseName: wodName,
              workoutId: workout.id,
              workoutName: workout.name,
              date: workout.date,
              metricType: 'rounds_reps',
              value: valueStr,
              numericValue: currentTotal
            });
          }
        }

        // Check distance PR
        if (score.distanceMeters !== undefined && score.distanceMeters !== null && score.distanceMeters > 0) {
          const currentDistance = score.distanceMeters;
          const previousBest = this.getPreviousBest(history, wodName, 'distance');

          if (previousBest === null || currentDistance > previousBest) {
            prs.push({
              exerciseName: wodName,
              workoutId: workout.id,
              workoutName: workout.name,
              date: workout.date,
              metricType: 'distance',
              value: `${currentDistance} m`,
              numericValue: currentDistance
            });
          }
        }

        // Check calories PR
        if (score.calories !== undefined && score.calories !== null && score.calories > 0) {
          const currentCal = score.calories;
          const previousBest = this.getPreviousBest(history, wodName, 'calories');

          if (previousBest === null || currentCal > previousBest) {
            prs.push({
              exerciseName: wodName,
              workoutId: workout.id,
              workoutName: workout.name,
              date: workout.date,
              metricType: 'calories',
              value: `${currentCal} cal`,
              numericValue: currentCal
            });
          }
        }
      }
    });

    return prs;
  }

  // Get recent PRs across all workouts (e.g. in the last 7 days)
  getRecentPRs(allWorkouts: Workout[], days: number = 7): PersonalRecord[] {
    const recentPRs: PersonalRecord[] = [];
    const now = new Date();
    const thresholdDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Sort workouts chronologically so PRs are evaluated correctly
    const sortedWorkouts = [...allWorkouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedWorkouts.forEach((w, index) => {
      const workoutDate = new Date(w.date);
      if (workoutDate >= thresholdDate) {
        // Evaluate PRs in this workout against all workouts up to this point in sorted history
        const historicalSnapshot = sortedWorkouts.slice(0, index + 1);
        const workoutPRs = this.detectPRsInWorkout(w, historicalSnapshot);
        recentPRs.push(...workoutPRs);
      }
    });

    return recentPRs;
  }

  private getPreviousBest(history: Workout[], name: string, type: string): number | null {
    let bestValue: number | null = null;

    history.forEach(w => {
      if (!w.sections) return;

      w.sections.forEach(s => {
        const score = s.score;
        if (!score) return;

        // Strength, weightlifting, gymnastics, and accessory comparison
        const isStrengthType = s.type === SectionType.Strength ||
                               s.type === SectionType.Weightlifting ||
                               s.type === SectionType.Gymnastics ||
                               s.type === SectionType.Accessory;

        if (type === 'weight' && isStrengthType) {
          s.exercises.forEach(ex => {
            if (ex.trim().toLowerCase() === name.toLowerCase()) {
              if (score.weightKg !== undefined && score.weightKg !== null) {
                if (bestValue === null || score.weightKg > bestValue) {
                  bestValue = score.weightKg;
                }
              }
            }
          });
        }

        if (type === 'reps' && isStrengthType) {
          s.exercises.forEach(ex => {
            if (ex.trim().toLowerCase() === name.toLowerCase()) {
              if (score.reps !== undefined && score.reps !== null) {
                if (bestValue === null || score.reps > bestValue) {
                  bestValue = score.reps;
                }
              }
            }
          });
        }

        // WOD, Metcon, Skill, and Technique comparisons are based on WOD name matching
        const isWodType = s.type === SectionType.Wod ||
                          s.type === SectionType.Metcon ||
                          s.type === SectionType.Skill ||
                          s.type === SectionType.Technique;

        if (w.name.trim().toLowerCase() === name.toLowerCase() && isWodType) {
          if (type === 'time' && score.finalTime) {
            const secs = parseTimeToSeconds(score.finalTime);
            if (secs > 0) {
              if (bestValue === null || secs < bestValue) { // For time, lower is better
                bestValue = secs;
              }
            }
          }

          if (type === 'rounds_reps' && score.rounds !== undefined && score.rounds !== null) {
            const totalVal = score.rounds * 1000 + (score.repsCompleted || 0);
            if (bestValue === null || totalVal > bestValue) {
              bestValue = totalVal;
            }
          }

          if (type === 'distance' && score.distanceMeters !== undefined && score.distanceMeters !== null) {
            if (bestValue === null || score.distanceMeters > bestValue) {
              bestValue = score.distanceMeters;
            }
          }

          if (type === 'calories' && score.calories !== undefined && score.calories !== null) {
            if (bestValue === null || score.calories > bestValue) {
              bestValue = score.calories;
            }
          }
        }
      });
    });

    return bestValue;
  }
}
