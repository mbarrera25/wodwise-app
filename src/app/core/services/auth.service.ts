import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase!: SupabaseClient;
  
  readonly currentUser = signal<User | null>(null);
  readonly userProfile = signal<UserProfile | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    this.initSupabase();
  }

  private async initSupabase(): Promise<void> {
    try {
      this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
      
      // Load current session
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session?.user) {
        this.currentUser.set(session.user);
        await this.loadUserProfile(session.user.id);
      }

      // Listen for auth state changes
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          this.currentUser.set(session.user);
          await this.loadUserProfile(session.user.id);
        } else {
          this.currentUser.set(null);
          this.userProfile.set(null);
        }
      });
    } catch (err) {
      console.error('Error initializing Supabase client:', err);
    }
  }

  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }

  async signUp(email: string, password: string, name: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) return { user: null, error };
    
    // In case the DB trigger on auth.users didn't insert the profile or is delayed
    if (data.user) {
      this.currentUser.set(data.user);
      // Wait a brief moment for database trigger to complete or upsert manually
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.loadUserProfile(data.user.id);
    }

    return { user: data.user, error: null };
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return { user: null, error };

    if (data.user) {
      this.currentUser.set(data.user);
      await this.loadUserProfile(data.user.id);
    }

    return { user: data.user, error: null };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUser.set(null);
    this.userProfile.set(null);
  }

  async loadUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Profile might not exist yet if trigger is executing
        console.warn('Profile not found for user:', userId, error.message);
        return null;
      }

      const mapped: UserProfile = {
        id: data.id,
        name: data.name,
        age: data.age || undefined,
        heightCm: data.height_cm ? Number(data.height_cm) : undefined,
        weightKg: data.weight_kg ? Number(data.weight_kg) : undefined,
        trainingLevel: data.training_level,
        mainGoal: data.main_goal,
        trainingType: data.training_type,
        createdAt: data.created_at,
        updatedAt: data.updated_at || undefined
      };

      this.userProfile.set(mapped);
      return mapped;
    } catch (err) {
      console.error('Error loading user profile:', err);
      return null;
    }
  }

  async saveProfile(profile: UserProfile): Promise<boolean> {
    const userId = this.currentUser()?.id;
    if (!userId) return false;

    const payload = {
      id: profile.id,
      name: profile.name,
      age: profile.age || null,
      height_cm: profile.heightCm || null,
      weight_kg: profile.weightKg || null,
      training_level: profile.trainingLevel,
      main_goal: profile.mainGoal,
      training_type: profile.trainingType,
      updated_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('profiles')
      .upsert(payload);

    if (error) {
      console.error('Error saving profile:', error);
      return false;
    }

    this.userProfile.set(profile);
    return true;
  }
}
