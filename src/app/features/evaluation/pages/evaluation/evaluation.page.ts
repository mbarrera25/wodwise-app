import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StorageService } from '../../../../core/services/storage.service';
import { WorkoutService } from '../../../../core/services/workout.service';
import { CheckInService } from '../../../../core/services/check-in.service';
import { CoachEngineService } from '../../../../core/services/coach-engine.service';
import { TrainingSummaryService } from '../../../../core/services/training-summary.service';
import { NutritionSuggestionService } from '../../../../core/services/nutrition-suggestion.service';
import { STORAGE_KEYS } from '../../../../core/constants';
import { UserProfile, Workout, DailyCheckIn, CoachEvaluation } from '../../../../core/models';
import { TrainingLoad, RecoveryStatus, FatigueRisk } from '../../../../core/enums';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [CommonModule, RouterLink, Button],
  templateUrl: './evaluation.page.html',
  styleUrl: './evaluation.page.scss'
})
export class EvaluationPage {
  private readonly router = inject(Router);
  private readonly storage = inject(StorageService);
  private readonly workoutService = inject(WorkoutService);
  private readonly checkInService = inject(CheckInService);
  private readonly coachEngine = inject(CoachEngineService);
  private readonly summaryService = inject(TrainingSummaryService);
  private readonly nutritionService = inject(NutritionSuggestionService);

  readonly profile = signal<UserProfile | null>(null);
  readonly workouts = this.workoutService.workouts;
  readonly latestCheckIn = this.checkInService.latestCheckIn;

  readonly latestWorkout = computed(() => {
    const list = this.workouts();
    return list.length > 0 ? list[0] : null;
  });

  readonly evaluation = computed<CoachEvaluation | null>(() => {
    const userProfile = this.profile();
    const workout = this.latestWorkout();
    if (!userProfile || !workout) return null;

    const checkIn = this.latestCheckIn();
    return this.coachEngine.evaluateWorkout(workout, checkIn, userProfile);
  });

  // Dynamic workout breakdown
  readonly workoutSummary = computed(() => {
    const workout = this.latestWorkout();
    if (!workout) return null;
    return this.summaryService.getSummary(workout);
  });

  // Nutrition suggestion based on workout main block
  readonly nutritionSuggestion = computed(() => {
    const workout = this.latestWorkout();
    return this.nutritionService.getNutritionSuggestion(workout);
  });

  constructor() {
    this.loadProfile();
    setTimeout(() => {
      if (!this.latestWorkout()) {
        this.router.navigate(['/dashboard']);
      }
    }, 100);
  }

  private loadProfile(): void {
    const data = this.storage.getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE);
    if (data) {
      this.profile.set(data);
    }
  }

  getLoadLabel(load: TrainingLoad): string {
    const labels = {
      [TrainingLoad.Low]: 'Baja (Regenerativa)',
      [TrainingLoad.Medium]: 'Media (Óptima)',
      [TrainingLoad.High]: 'Alta (Exigente)'
    };
    return labels[load];
  }

  getRecoveryLabel(status: RecoveryStatus): string {
    const labels = {
      [RecoveryStatus.Low]: 'Baja (Cuidado)',
      [RecoveryStatus.Ok]: 'Normal / Aceptable',
      [RecoveryStatus.Good]: 'Excelente (A tope)'
    };
    return labels[status];
  }

  getFatigueLabel(risk: FatigueRisk): string {
    const labels = {
      [FatigueRisk.Low]: 'Bajo',
      [FatigueRisk.Medium]: 'Moderado',
      [FatigueRisk.High]: 'Elevado ⚠️'
    };
    return labels[risk];
  }
}
