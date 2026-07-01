import { Injectable } from '@angular/core';
import { Workout, TrainingSection, SectionScore } from '../models';
import { WorkoutType, SectionType } from '../enums';

@Injectable({
  providedIn: 'root'
})
export class LocalMigrationService {

  migrateWorkouts(workouts: Workout[]): Workout[] {
    let updated = false;
    const migrated = workouts.map(workout => {
      if (!workout.sections || workout.sections.length === 0) {
        updated = true;
        const score: SectionScore = {};
        
        if (workout.weightKg !== undefined && workout.weightKg !== null) score.weightKg = workout.weightKg;
        if (workout.reps !== undefined && workout.reps !== null) score.reps = workout.reps;
        if (workout.rounds !== undefined && workout.rounds !== null) score.rounds = workout.rounds;
        if (workout.finalTime) score.finalTime = workout.finalTime;
        if (workout.notes) score.notes = workout.notes;

        const defaultSection: TrainingSection = {
          type: this.mapWorkoutTypeToSectionType(workout.type),
          name: 'Sección Migrada',
          exercises: workout.mainExercises || [],
          score: Object.keys(score).length > 0 ? score : undefined
        };

        return {
          ...workout,
          sections: [defaultSection]
        };
      }
      return workout;
    });

    return migrated;
  }

  private mapWorkoutTypeToSectionType(type: WorkoutType): SectionType {
    switch (type) {
      case WorkoutType.Strength:
        return SectionType.Strength;
      case WorkoutType.Mobility:
        return SectionType.Mobility;
      case WorkoutType.ActiveRest:
      case WorkoutType.Walk:
        return SectionType.Cooldown;
      case WorkoutType.Cardio:
        return SectionType.Metcon;
      case WorkoutType.Wod:
      default:
        return SectionType.Wod;
    }
  }
}
