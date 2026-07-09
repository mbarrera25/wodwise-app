import { Injectable } from '@angular/core';
import { Workout, TrainingSection, SectionScore } from '../models';
import { WorkoutType, SectionType } from '../enums';

@Injectable({
  providedIn: 'root'
})
export class LocalMigrationService {

  migrateWorkouts(workouts: Workout[]): Workout[] {
    const migrated = workouts.map(workout => {
      // Only migrate legacy local workouts (flat fields, no sections).
      // Remote workouts arriving without sections (e.g. a partial fetch)
      // must not get a fabricated section from fields they never had.
      const hasLegacyData = workout.weightKg != null || workout.reps != null
        || workout.rounds != null || !!workout.finalTime
        || (workout.mainExercises?.length ?? 0) > 0;

      if ((!workout.sections || workout.sections.length === 0)
        && workout.syncStatus !== 'synced' && hasLegacyData) {
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
