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
          energyBefore: session.energy_before,
          energyAfter: session.energy_after,
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

  async addWorkout(workout: Workout): Promise<void> {
    const supabase = this.authService.getSupabaseClient();
    const userId = this.authService.currentUser()?.id;
    if (!supabase || !userId) return;

    try {
      // Delete existing to cascade-delete all sub-entities and perform a clean reload (implements updates)
      await supabase
        .from('training_sessions')
        .delete()
        .eq('id', workout.id);

      // Insert main training session
      const { error: sessionErr } = await supabase
        .from('training_sessions')
        .insert({
          id: workout.id,
          user_id: userId,
          date: workout.date,
          type: workout.type,
          name: workout.name,
          duration_minutes: workout.durationMinutes || null,
          perceived_difficulty: workout.perceivedDifficulty,
          perceived_intensity: workout.perceivedIntensity || workout.perceivedDifficulty,
          energy_before: workout.energyBefore || 5,
          energy_after: workout.energyAfter || 5,
          notes: workout.notes || null,
          created_at: workout.createdAt
        });

      if (sessionErr) {
        console.error('Error inserting training_session in Supabase:', sessionErr);
        throw sessionErr;
      }

      if (!workout.sections || workout.sections.length === 0) return;

      // Insert sections, exercises, sets, and scores
      for (let secIdx = 0; secIdx < workout.sections.length; secIdx++) {
        const sec = workout.sections[secIdx];
        
        const { data: secData, error: secErr } = await supabase
          .from('training_sections')
          .insert({
            session_id: workout.id,
            user_id: userId,
            type: sec.type,
            name: sec.name || null,
            sort_order: secIdx
          })
          .select()
          .single();

        if (secErr || !secData) {
          console.error('Error inserting training_section:', secErr);
          throw secErr;
        }

        // Insert score if present
        if (sec.score) {
          const { error: scoreErr } = await supabase
            .from('section_scores')
            .insert({
              section_id: secData.id,
              user_id: userId,
              sets: sec.score.sets || null,
              weight_kg: sec.score.weightKg || null,
              reps: sec.score.reps || null,
              final_time: sec.score.finalTime || null,
              distance_meters: sec.score.distanceMeters || null,
              calories: sec.score.calories || null,
              rounds: sec.score.rounds || null,
              reps_completed: sec.score.repsCompleted || null,
              notes: sec.score.notes || null
            });

          if (scoreErr) {
            console.error('Error inserting section_score:', scoreErr);
            throw scoreErr;
          }
        }

        // Insert exercises
        for (let exIdx = 0; exIdx < sec.exercises.length; exIdx++) {
          const exName = sec.exercises[exIdx];
          
          const { data: exData, error: exErr } = await supabase
            .from('section_exercises')
            .insert({
              section_id: secData.id,
              user_id: userId,
              name: exName,
              sort_order: exIdx
            })
            .select()
            .single();

          if (exErr || !exData) {
            console.error('Error inserting section_exercise:', exErr);
            throw exErr;
          }

          // Generate default sets if a set count is provided in score
          if (sec.score && sec.score.sets && sec.score.sets > 0) {
            const setsPayload = [];
            for (let i = 1; i <= sec.score.sets; i++) {
              setsPayload.push({
                exercise_id: exData.id,
                user_id: userId,
                set_number: i,
                weight_kg: sec.score.weightKg || null,
                reps: sec.score.reps || null
              });
            }
            const { error: setsErr } = await supabase
              .from('exercise_sets')
              .insert(setsPayload);

            if (setsErr) {
              console.error('Error inserting exercise_sets:', setsErr);
              throw setsErr;
            }
          }
        }
      }
    } catch (err) {
      console.error('Exception in SupabaseTrainingRepository.addWorkout:', err);
    }
  }

  async clearWorkouts(): Promise<void> {
    const supabase = this.authService.getSupabaseClient();
    const userId = this.authService.currentUser()?.id;
    if (!supabase || !userId) return;

    try {
      await supabase
        .from('training_sessions')
        .delete()
        .eq('user_id', userId);
    } catch (err) {
      console.error('Exception in SupabaseTrainingRepository.clearWorkouts:', err);
    }
  }
}
