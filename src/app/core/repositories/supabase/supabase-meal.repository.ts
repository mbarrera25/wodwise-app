import { Injectable, inject } from '@angular/core';
import { MealRepository } from '../meal.repository';
import { MealLog } from '../../models';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseMealRepository implements MealRepository {
  private readonly authService = inject(AuthService);

  async getMealLogs(): Promise<MealLog[]> {
    const supabase = this.authService.getSupabaseClient();
    const userId = this.authService.currentUser()?.id;
    if (!supabase || !userId) return [];

    try {
      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching meal logs from Supabase:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        date: row.date,
        mealType: row.meal_type as any,
        description: row.description,
        calories: row.calories !== null ? Number(row.calories) : undefined,
        proteinG: row.protein_g !== null ? Number(row.protein_g) : undefined,
        carbsG: row.carbs_g !== null ? Number(row.carbs_g) : undefined,
        fatG: row.fat_g !== null ? Number(row.fat_g) : undefined,
        createdAt: row.created_at,
        syncStatus: 'synced',
        remoteId: row.id
      }));
    } catch (err) {
      console.error('Exception in SupabaseMealRepository.getMealLogs:', err);
      return [];
    }
  }

  async addMealLog(log: MealLog): Promise<void> {
    const supabase = this.authService.getSupabaseClient();
    const userId = this.authService.currentUser()?.id;
    if (!supabase || !userId) return;

    try {
      await supabase
        .from('meal_logs')
        .upsert({
          id: log.id,
          user_id: userId,
          date: log.date,
          meal_type: log.mealType,
          description: log.description,
          calories: log.calories || null,
          protein_g: log.proteinG || null,
          carbs_g: log.carbsG || null,
          fat_g: log.fatG || null,
          created_at: log.createdAt
        });
    } catch (err) {
      console.error('Exception in SupabaseMealRepository.addMealLog:', err);
    }
  }

  async clearMealLogs(): Promise<void> {
    const supabase = this.authService.getSupabaseClient();
    const userId = this.authService.currentUser()?.id;
    if (!supabase || !userId) return;

    try {
      await supabase
        .from('meal_logs')
        .delete()
        .eq('user_id', userId);
    } catch (err) {
      console.error('Exception in SupabaseMealRepository.clearMealLogs:', err);
    }
  }
}
