import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StorageService } from '../../../../core/services/storage.service';
import { WorkoutService } from '../../../../core/services/workout.service';
import { CheckInService } from '../../../../core/services/check-in.service';
import { CoachEngineService } from '../../../../core/services/coach-engine.service';
import { TrainingLoadService } from '../../../../core/services/training-load.service';
import { PersonalRecordService, PersonalRecord } from '../../../../core/services/personal-record.service';
import { RecoveryRecommendationService } from '../../../../core/services/recovery-recommendation.service';
import { STORAGE_KEYS } from '../../../../core/constants';
import { toLocalDateString } from '../../../../core/utils/date-utils';
import { UserProfile, Workout, DailyCheckIn, CoachEvaluation } from '../../../../core/models';
import { WORKOUT_TYPE_LABELS, SectionType } from '../../../../core/enums';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Button],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage {
  private readonly router = inject(Router);
  private readonly storage = inject(StorageService);
  private readonly workoutService = inject(WorkoutService);
  private readonly checkInService = inject(CheckInService);
  private readonly coachEngine = inject(CoachEngineService);
  private readonly loadService = inject(TrainingLoadService);
  private readonly prService = inject(PersonalRecordService);
  private readonly recoveryService = inject(RecoveryRecommendationService);

  readonly profile = signal<UserProfile | null>(null);
  readonly workouts = this.workoutService.workouts;
  readonly latestCheckIn = this.checkInService.latestCheckIn;
  readonly workoutsThisWeek = this.workoutService.workoutsThisWeek;
  readonly workoutTypeLabels = WORKOUT_TYPE_LABELS;

  readonly hasCheckInToday = computed(() => {
    const latest = this.latestCheckIn();
    if (!latest) return false;
    const todayStr = toLocalDateString(new Date());
    return latest.date === todayStr;
  });

  // Calculate weekly load score
  readonly weeklyLoadScore = computed(() => {
    return this.loadService.calculateWeeklyLoadScore(this.workoutsThisWeek());
  });

  readonly weeklyLoadLabel = computed(() => {
    return this.loadService.classifyWeeklyLoad(this.weeklyLoadScore());
  });

  // Count metabolic sections (WOD/Metcon) this week
  readonly wodMetconCount = computed(() => {
    return this.workoutsThisWeek().reduce((count, w) => {
      if (!w.sections) return count;
      return count + w.sections.filter(s => s.type === SectionType.Wod || s.type === SectionType.Metcon).length;
    }, 0);
  });

  // Count strength/weightlifting sections this week
  readonly strengthWeightliftingCount = computed(() => {
    return this.workoutsThisWeek().reduce((count, w) => {
      if (!w.sections) return count;
      return count + w.sections.filter(s => s.type === SectionType.Strength || s.type === SectionType.Weightlifting).length;
    }, 0);
  });

  // Fetch recent PRs (last 7 days)
  readonly recentPRs = computed(() => {
    return this.prService.getRecentPRs(this.workouts(), 7);
  });

  // Recovery recommendation
  readonly recoveryRecommendation = computed(() => {
    return this.recoveryService.getRecommendation(this.workouts());
  });

  readonly latestEvaluation = computed<CoachEvaluation | null>(() => {
    const userProfile = this.profile();
    const workoutsList = this.workouts();
    if (!userProfile || workoutsList.length === 0) return null;

    const latestWorkout = workoutsList[0];
    const checkIn = this.latestCheckIn();
    
    return this.coachEngine.evaluateWorkout(latestWorkout, checkIn, userProfile);
  });

  readonly coachAdvice = computed<string | null>(() => {
    return this.recoveryRecommendation();
  });

  constructor() {
    this.loadProfile();
  }

  private loadProfile(): void {
    const data = this.storage.getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE);
    if (data) {
      this.profile.set(data);
    }
  }

  resetAllData(): void {
    if (confirm('¿Estás seguro de que quieres restablecer todos los datos? Esto borrará tu perfil y registros.')) {
      this.storage.clear();
      this.workoutService.clearWorkouts();
      this.checkInService.clearCheckIns();
      this.router.navigate(['/onboarding']);
    }
  }
}
