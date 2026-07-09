import { Injectable, inject } from '@angular/core';
import { TrainingRepository } from '../training.repository';
import { Workout, TrainingSection, SectionScore } from '../../models';
import { AuthService } from '../../services/auth.service';
import { SectionType, WorkoutType } from '../../enums';

@Injectable({
  providedIn: 'root'
})
export class SupabaseTrainingRepository implements TrainingRepository {
  private readonly authService = inject(AuthService);

  async getWorkouts(): Promise<Workout[]> {
    const supabase = this.authService.getSupabaseClient();
    const userId = this.authService.currentUser()?.id;
    if (!supabase || !userId) return [];

    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select(`
          *,
          training_sections (
            *,
            section_scores (*),
            section_exercises (
              *,
              exercise_sets (*)
            )
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching workouts from Supabase:', error);
        return [];
      }

      return (data || []).map((session: any) => {
        // Sort sections by sort_order
        const sortedSections = (session.training_sections || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((sec: any) => {
            // Sort exercises by sort_order
            const sortedExercises = (sec.section_exercises || [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order);

            const scoreData = sec.section_scores?.[0];
            const score: SectionScore | undefined = scoreData ? {
              sets: scoreData.sets || undefined,
              weightKg: scoreData.weight_kg !== null ? Number(scoreData.weight_kg) : undefined,
              reps: scoreData.reps !== null ? Number(scoreData.reps) : undefined,
              finalTime: scoreData.final_time || undefined,
              distanceMeters: scoreData.distance_meters !== null ? Number(scoreData.distance_meters) : undefined,
              calories: scoreData.calories !== null ? Number(scoreData.calories) : undefined,
              rounds: scoreData.rounds !== null ? Number(scoreData.rounds) : undefined,
              repsCompleted: scoreData.reps_completed !== null ? Number(scoreData.reps_completed) : undefined,
              notes: scoreData.notes || undefined
            } : undefined;

            return {
              type: sec.type as SectionType,
              name: sec.name || undefined,
              exercises: sortedExercises.map((e: any) => e.name),
              score
            };
          });

        return {
          id: session.id,
          date: session.date,
          type: session.type as WorkoutType,
          name: session.name,
          durationMinutes: session.duration_minutes || undefined,
          mainExercises: sortedSections.flatMap((s: TrainingSection) => s.exercises),
          sections: sortedSections,
          perceivedDifficulty: session.perceived_difficulty,
          perceivedIntensity: session.perceived_intensity,
          energyBefore: session.energy_before ?? undefined,
          energyAfter: session.energy_after ?? undefined,
          notes: session.notes || undefined,
          createdAt: session.created_at,
          updatedAt: session.updated_at || undefined,
          syncStatus: 'synced',
          remoteId: session.id
        } as Workout;
      });
    } catch (err) {
      console.error('Exception in SupabaseTrainingRepository.getWorkouts:', err);
      return [];
    }
  }

  // Persists the whole workout (session + sections + scores + exercises + sets)
  // through the transactional save_workout RPC: either everything is saved
  // or nothing changes, so a mid-write failure can't corrupt existing data.
  async addWorkout(workout: Workout): Promise<void> {
    const supabase = this.authService.getSupabaseClient();
    const userId = this.authService.currentUser()?.id;
    if (!supabase || !userId) throw new Error('No active session to save workout');

    const payload = {
      id: workout.id,
      date: workout.date,
      type: workout.type,
      name: workout.name,
      durationMinutes: workout.durationMinutes ?? null,
      perceivedDifficulty: workout.perceivedDifficulty,
      perceivedIntensity: workout.perceivedIntensity ?? null,
      energyBefore: workout.energyBefore ?? null,
      energyAfter: workout.energyAfter ?? null,
      notes: workout.notes ?? null,
      createdAt: workout.createdAt,
      sections: (workout.sections || []).map(sec => ({
        type: sec.type,
        name: sec.name ?? null,
        exercises: sec.exercises,
        score: sec.score ?? null
      }))
    };

    const { error } = await supabase.rpc('save_workout', { payload });

    if (error) {
      console.error('Error saving workout via save_workout RPC:', error);
      throw error;
    }
  }

  async clearWorkouts(): Promise<void> {
    const supabase = this.authService.getSupabaseClient();
    const userId = this.authService.currentUser()?.id;
    if (!supabase || !userId) throw new Error('No active session to clear workouts');

    const { error } = await supabase
      .from('training_sessions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing workouts in Supabase:', error);
      throw error;
    }
  }
}
