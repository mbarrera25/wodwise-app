import {
  TrainingLevel,
  TrainingGoal,
  TrainingType,
  WorkoutType,
  TrainingLoad,
  RecoveryStatus,
  FatigueRisk,
  Mood,
  SectionType
} from '../enums';

export interface SyncableModel {
  syncStatus?: 'local' | 'synced' | 'pending';
  remoteId?: string;
  lastSyncedAt?: string;
}

export interface UserProfile extends SyncableModel {
  id: string;
  name: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  trainingLevel: TrainingLevel;
  mainGoal: TrainingGoal;
  trainingType: TrainingType;
  createdAt: string;
  updatedAt?: string;
}

export interface DailyCheckIn extends SyncableModel {
  id: string;
  date: string; // YYYY-MM-DD
  sleepHours: number;
  energyLevel: number;
  sorenessLevel: number;
  stressLevel: number;
  hungerLevel?: number;
  mood?: Mood;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SectionScore {
  sets?: number;
  weightKg?: number;
  reps?: number;
  finalTime?: string; // MM:SS
  distanceMeters?: number;
  calories?: number;
  rounds?: number;
  repsCompleted?: number;
  notes?: string;
}

export interface TrainingSection {
  type: SectionType;
  name?: string;
  exercises: string[];
  score?: SectionScore;
}

export interface Workout extends SyncableModel {
  id: string;
  date: string; // YYYY-MM-DD
  type: WorkoutType;
  name: string;
  durationMinutes?: number;
  mainExercises: string[];
  sections?: TrainingSection[];
  weightKg?: number;
  rounds?: number;
  reps?: number;
  finalTime?: string;
  perceivedDifficulty: number;
  perceivedIntensity?: number;
  energyBefore?: number;
  energyAfter?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TrainingSession = Workout;

export interface CoachEvaluation {
  trainingLoad: TrainingLoad;
  recoveryStatus: RecoveryStatus;
  fatigueRisk: FatigueRisk;
  highlights: string[];
  recommendations: string[];
}

export interface MealLog extends SyncableModel {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  createdAt: string;
}

export interface BodyProgress extends SyncableModel {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  bodyFatPercentage?: number;
  muscleMassKg?: number;
  notes?: string;
  createdAt: string;
}

export interface UserGoal extends SyncableModel {
  id: string;
  goalType: string;
  targetValue: string;
  currentValue?: string;
  deadline?: string; // YYYY-MM-DD
  status: 'active' | 'achieved' | 'failed';
  createdAt: string;
}
