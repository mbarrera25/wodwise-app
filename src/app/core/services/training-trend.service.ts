import { Injectable, inject } from '@angular/core';
import { Workout } from '../models';
import { SectionType } from '../enums';
import { TrainingLoadService } from './training-load.service';
import { parseTimeToSeconds } from '../utils/time-utils';
import { parseLocalDate, toLocalDateString } from '../utils/date-utils';

export interface TrendPoint {
  date: string;
  value: number;
  workoutId: string;
  workoutName: string;
}

export interface WodTimePoint {
  date: string;
  seconds: number;
  workoutId: string;
}

export interface WeeklyLoadPoint {
  weekStart: string;
  score: number;
  label: string;
}

export interface WeeklyModalityPoint {
  weekStart: string;
  bySectionType: Partial<Record<SectionType, number>>;
}

const STRENGTH_SECTION_TYPES = [
  SectionType.Strength,
  SectionType.Weightlifting,
  SectionType.Accessory,
  SectionType.Gymnastics
];

const WOD_SECTION_TYPES = [SectionType.Wod, SectionType.Metcon];

@Injectable({
  providedIn: 'root'
})
export class TrainingTrendService {
  private readonly loadService = inject(TrainingLoadService);

  // Weight (or reps, when no weight is recorded) for a given exercise over time
  getStrengthTrend(exerciseName: string, workouts: Workout[]): TrendPoint[] {
    const points: TrendPoint[] = [];
    const name = exerciseName.trim().toLowerCase();
    if (!name) return points;

    workouts.forEach(w => {
      (w.sections || []).forEach(section => {
        if (!STRENGTH_SECTION_TYPES.includes(section.type)) return;
        const isMatch = section.exercises.some(ex => ex.trim().toLowerCase() === name);
        if (!isMatch) return;

        const score = section.score;
        if (!score) return;
        const value = score.weightKg ?? score.reps;
        if (value === undefined || value === null) return;

        points.push({ date: w.date, value, workoutId: w.id, workoutName: w.name });
      });
    });

    return points.sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());
  }

  // Final time for repeated WODs (same workout name) over time
  getWodTimeEvolution(wodName: string, workouts: Workout[]): WodTimePoint[] {
    const points: WodTimePoint[] = [];
    const name = wodName.trim().toLowerCase();
    if (!name) return points;

    workouts.forEach(w => {
      if (w.name.trim().toLowerCase() !== name) return;

      (w.sections || []).forEach(section => {
        if (!WOD_SECTION_TYPES.includes(section.type)) return;
        const finalTime = section.score?.finalTime;
        if (!finalTime) return;

        const seconds = parseTimeToSeconds(finalTime);
        if (seconds <= 0) return;

        points.push({ date: w.date, seconds, workoutId: w.id });
      });
    });

    return points.sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());
  }

  getWeeklyLoadHistory(workouts: Workout[], weeksBack = 8): WeeklyLoadPoint[] {
    return this.bucketByWeek(workouts, weeksBack).map(({ weekStart, workouts: weekWorkouts }) => {
      const score = this.loadService.calculateWeeklyLoadScore(weekWorkouts);
      return { weekStart, score, label: this.loadService.classifyWeeklyLoad(score) };
    });
  }

  getWeeklyModalityDistribution(workouts: Workout[], weeksBack = 8): WeeklyModalityPoint[] {
    return this.bucketByWeek(workouts, weeksBack).map(({ weekStart, workouts: weekWorkouts }) => {
      const bySectionType: Partial<Record<SectionType, number>> = {};
      weekWorkouts.forEach(w => {
        (w.sections || []).forEach(section => {
          bySectionType[section.type] = (bySectionType[section.type] || 0) + 1;
        });
      });
      return { weekStart, bySectionType };
    });
  }

  listAvailableExercises(workouts: Workout[]): string[] {
    const names = new Set<string>();
    workouts.forEach(w => {
      (w.sections || []).forEach(section => {
        if (!STRENGTH_SECTION_TYPES.includes(section.type)) return;
        section.exercises.forEach(ex => {
          const trimmed = ex.trim();
          if (trimmed) names.add(trimmed);
        });
      });
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }

  listAvailableWodNames(workouts: Workout[]): string[] {
    const names = new Set<string>();
    workouts.forEach(w => {
      const hasTimedWod = (w.sections || []).some(
        s => WOD_SECTION_TYPES.includes(s.type) && !!s.score?.finalTime
      );
      if (hasTimedWod && w.name.trim()) {
        names.add(w.name.trim());
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }

  // Buckets workouts into `weeksBack` Monday-start weeks, oldest first, ending with the current week.
  // Mirrors the ISO week calculation in WorkoutService.workoutsThisWeek.
  private bucketByWeek(workouts: Workout[], weeksBack: number): { weekStart: string; workouts: Workout[] }[] {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const currentWeekStart = new Date(today.getFullYear(), today.getMonth(), diff);

    const buckets: { weekStart: string; workouts: Workout[] }[] = [];
    for (let i = weeksBack - 1; i >= 0; i--) {
      const start = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() - i * 7);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);

      const weekWorkouts = workouts.filter(w => {
        const wDate = parseLocalDate(w.date);
        return wDate >= start && wDate < end;
      });

      buckets.push({ weekStart: toLocalDateString(start), workouts: weekWorkouts });
    }
    return buckets;
  }
}
