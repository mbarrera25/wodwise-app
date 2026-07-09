import { Injectable, inject } from '@angular/core';
import { ProgressRepository } from '../progress.repository';
import { BodyProgress } from '../../models';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseProgressRepository implements ProgressRepository {
  private readonly authService = inject(AuthService);

  async getProgressLogs(): Promise<BodyProgress[]> {
    const supabase = this.authService.getSupabaseClient();
    const userId = this.authService.currentUser()?.id;
    if (!supabase || !userId) return [];

    try {
      const { data, error } = await supabase
        .from('body_progress')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching body progress from Supabase:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        date: row.date,
        weightKg: Number(row.weight_kg),
        bodyFatPercentage: row.body_fat_percentage !== null ? Number(row.body_fat_percentage) : undefined,
        muscleMassKg: row.muscle_mass_kg !== null ? Number(row.muscle_mass_kg) : undefined,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        syncStatus: 'synced',
        remoteId: row.id
      }));
    } catch (err) {
      console.error('Exception in SupabaseProgressRepository.getProgressLogs:', err);
      return [];
    }
  }

  async addProgressLog(log: BodyProgress): Promise<void> {
    const supabase = this.authService.getSupabaseClient();
    const userId = this.authService.currentUser()?.id;
    if (!supabase || !userId) throw new Error('No active session to save body progress');

    const { error } = await supabase
      .from('body_progress')
      .upsert({
        id: log.id,
        user_id: userId,
        date: log.date,
        weight_kg: log.weightKg,
        body_fat_percentage: log.bodyFatPercentage || null,
        muscle_mass_kg: log.muscleMassKg || null,
        notes: log.notes || null,
        created_at: log.createdAt
      });

    if (error) {
      console.error('Error saving body progress in Supabase:', error);
      throw error;
    }
  }
}
