import { Injectable, inject } from '@angular/core';
import { GoalRepository } from '../goal.repository';
import { UserGoal } from '../../models';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseGoalRepository implements GoalRepository {
  private readonly authService = inject(AuthService);

  async getGoals(): Promise<UserGoal[]> {
    const supabase = this.authService.getSupabaseClient();
    const userId = this.authService.currentUser()?.id;
    if (!supabase || !userId) return [];

    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching goals from Supabase:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        goalType: row.goal_type,
        targetValue: row.target_value,
        currentValue: row.current_value || undefined,
        deadline: row.deadline || undefined,
        status: row.status as any,
        createdAt: row.created_at,
        syncStatus: 'synced',
        remoteId: row.id
      }));
    } catch (err) {
      console.error('Exception in SupabaseGoalRepository.getGoals:', err);
      return [];
    }
  }

  async addGoal(goal: UserGoal): Promise<void> {
    const supabase = this.authService.getSupabaseClient();
    const userId = this.authService.currentUser()?.id;
    if (!supabase || !userId) throw new Error('No active session to save goal');

    const { error } = await supabase
      .from('user_goals')
      .upsert({
        id: goal.id,
        user_id: userId,
        goal_type: goal.goalType,
        target_value: goal.targetValue,
        current_value: goal.currentValue || null,
        deadline: goal.deadline || null,
        status: goal.status,
        created_at: goal.createdAt
      });

    if (error) {
      console.error('Error saving goal in Supabase:', error);
      throw error;
    }
  }
}
