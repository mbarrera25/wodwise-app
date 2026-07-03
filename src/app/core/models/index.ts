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
  updatedAt?: string;
}

// =====================================================================
// MODELO WIZARD DE ENTRENAMIENTO EN 3 PASOS (FASE 2.5)
// =====================================================================

export type WizardTrainingType = 'CROSSFIT' | 'HYROX' | 'STRENGTH' | 'CARDIO' | 'FREE';

export type TrainingStatus = 'DRAFT' | 'COMPLETED';

export type BlockType =
  | 'WARM_UP'
  | 'STRENGTH'
  | 'WOD'
  | 'CARDIO'
  | 'FREE'
  | 'SKILL'
  | 'ACCESSORY'
  | 'COOLDOWN'
  | 'CUSTOM';

export type WodFormat =
  | 'AMRAP'
  | 'EMOM'
  | 'FOR_TIME'
  | 'INTERVALS'
  | 'CHIPPER'
  | 'FREE';

export type ScoreType =
  | 'NONE'
  | 'TIME'
  | 'ROUNDS_REPS'
  | 'REPS'
  | 'CALORIES'
  | 'DISTANCE'
  | 'LOAD';

export interface TrainingBlock {
  id: string;
  order: number;
  type: BlockType;
  title: string;
  prescription: BlockPrescription;
  scoreExpected?: ScoreType;
  requiresResult: boolean;
  result?: BlockResult;
  notes?: string;
}

export type BlockPrescription =
  | WarmUpPrescription
  | StrengthPrescription
  | WodPrescription
  | CardioPrescription
  | FreePrescription;

export interface WarmUpPrescription {
  kind: 'WARM_UP';
  inputType: 'TEXT' | 'EXERCISE_LIST';
  content: string;
}

export interface StrengthPrescription {
  kind: 'STRENGTH';
  exercise: string;
  sets: number;
  reps: number;
  targetWeightKg?: number;
  restSeconds?: number;
  notes?: string;
}

export interface WodPrescription {
  kind: 'WOD';
  format: WodFormat;
  durationMinutes?: number;
  timeCapMinutes?: number;
  movements: string;
  scoreExpected: ScoreType;
  notes?: string;
}

export interface CardioPrescription {
  kind: 'CARDIO';
  modality: 'RUN' | 'ROW' | 'BIKE' | 'SKI' | 'WALK' | 'OTHER';
  target: string;
  intensity?: 'LOW' | 'MODERATE' | 'HIGH';
  notes?: string;
}

export interface FreePrescription {
  kind: 'FREE';
  text: string;
}

export interface BlockResult {
  scoreType: ScoreType;
  value: string;
  rpe?: number;
  scaling?: 'RX' | 'SCALED';
  notes?: string;
}

export interface Training {
  id: string;
  name: string;
  date: string;
  trainingType: WizardTrainingType;
  status: TrainingStatus;
  blocks: TrainingBlock[];
  createdAt: string;
  updatedAt: string;
}
