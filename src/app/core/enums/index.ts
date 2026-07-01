export enum TrainingLevel {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced'
}

export enum TrainingGoal {
  FatLoss = 'fat_loss',
  Strength = 'strength',
  MuscleGain = 'muscle_gain',
  Endurance = 'endurance',
  Maintenance = 'maintenance'
}

export enum TrainingType {
  Crossfit = 'crossfit',
  Gym = 'gym',
  Running = 'running',
  Functional = 'functional',
  Hiking = 'hiking',
  Hybrid = 'hybrid'
}

export enum WorkoutType {
  Wod = 'wod',
  Strength = 'strength',
  Cardio = 'cardio',
  Mobility = 'mobility',
  Walk = 'walk',
  ActiveRest = 'active_rest'
}

export enum TrainingLoad {
  Low = 'low',
  Medium = 'medium',
  High = 'high'
}

export enum RecoveryStatus {
  Low = 'low',
  Ok = 'ok',
  Good = 'good'
}

export enum FatigueRisk {
  Low = 'low',
  Medium = 'medium',
  High = 'high'
}

export enum Mood {
  Good = 'good',
  Tired = 'tired',
  Motivated = 'motivated',
  Anxious = 'anxious',
  Sore = 'sore',
  LowEnergy = 'low_energy'
}

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  [WorkoutType.Wod]: 'WOD',
  [WorkoutType.Strength]: 'Fuerza',
  [WorkoutType.Cardio]: 'Cardio',
  [WorkoutType.Mobility]: 'Movilidad',
  [WorkoutType.Walk]: 'Caminata',
  [WorkoutType.ActiveRest]: 'Descanso Activo'
};

export const TRAINING_LEVEL_LABELS: Record<TrainingLevel, string> = {
  [TrainingLevel.Beginner]: 'Principiante',
  [TrainingLevel.Intermediate]: 'Intermedio',
  [TrainingLevel.Advanced]: 'Avanzado'
};

export const TRAINING_GOAL_LABELS: Record<TrainingGoal, string> = {
  [TrainingGoal.FatLoss]: 'Pérdida de Grasa',
  [TrainingGoal.Strength]: 'Fuerza',
  [TrainingGoal.MuscleGain]: 'Ganancia Muscular',
  [TrainingGoal.Endurance]: 'Resistencia',
  [TrainingGoal.Maintenance]: 'Mantenimiento'
};

export const TRAINING_TYPE_LABELS: Record<TrainingType, string> = {
  [TrainingType.Crossfit]: 'CrossFit',
  [TrainingType.Gym]: 'Gimnasio',
  [TrainingType.Running]: 'Running',
  [TrainingType.Functional]: 'Funcional',
  [TrainingType.Hiking]: 'Senderismo',
  [TrainingType.Hybrid]: 'Híbrido'
};

export const MOOD_LABELS: Record<Mood, string> = {
  [Mood.Good]: 'Excelente / Bien',
  [Mood.Tired]: 'Cansado',
  [Mood.Motivated]: 'Motivado',
  [Mood.Anxious]: 'Ansioso',
  [Mood.Sore]: 'Con Agujetas / Dolorido',
  [Mood.LowEnergy]: 'Bajo de Energía'
};

export enum SectionType {
  WarmUp = 'warm_up',
  Skill = 'skill',
  Technique = 'technique',
  Strength = 'strength',
  Weightlifting = 'weightlifting',
  Gymnastics = 'gymnastics',
  Wod = 'wod',
  Metcon = 'metcon',
  Accessory = 'accessory',
  Mobility = 'mobility',
  Cooldown = 'cooldown',
  Notes = 'notes'
}

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  [SectionType.WarmUp]: 'Calentamiento',
  [SectionType.Skill]: 'Habilidad',
  [SectionType.Technique]: 'Técnica',
  [SectionType.Strength]: 'Fuerza',
  [SectionType.Weightlifting]: 'Levantamiento de Pesas',
  [SectionType.Gymnastics]: 'Gimnasia',
  [SectionType.Wod]: 'WOD',
  [SectionType.Metcon]: 'Metcon',
  [SectionType.Accessory]: 'Accesorios',
  [SectionType.Mobility]: 'Movilidad',
  [SectionType.Cooldown]: 'Vuelta a la calma',
  [SectionType.Notes]: 'Notas / Bitácora'
};

