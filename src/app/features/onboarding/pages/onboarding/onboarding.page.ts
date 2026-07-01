import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../../../core/services/storage.service';
import { STORAGE_KEYS } from '../../../../core/constants';
import { UserProfileFactory } from '../../../../core/utils/factories';
import {
  TrainingLevel,
  TrainingGoal,
  TrainingType,
  TRAINING_LEVEL_LABELS,
  TRAINING_GOAL_LABELS,
  TRAINING_TYPE_LABELS
} from '../../../../core/enums';

import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputText,
    InputNumber,
    Select,
    Button
  ],
  templateUrl: './onboarding.page.html',
  styleUrl: './onboarding.page.scss'
})
export class OnboardingPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly storage = inject(StorageService);

  readonly profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    age: [null, [Validators.min(10), Validators.max(100)]],
    heightCm: [null, [Validators.min(100), Validators.max(250)]],
    weightKg: [null, [Validators.min(30), Validators.max(250)]],
    trainingLevel: [TrainingLevel.Beginner, Validators.required],
    mainGoal: [TrainingGoal.FatLoss, Validators.required],
    trainingType: [TrainingType.Crossfit, Validators.required]
  });

  readonly trainingLevels = Object.entries(TRAINING_LEVEL_LABELS).map(([value, label]) => ({ label, value }));
  readonly trainingGoals = Object.entries(TRAINING_GOAL_LABELS).map(([value, label]) => ({ label, value }));
  readonly trainingTypes = Object.entries(TRAINING_TYPE_LABELS).map(([value, label]) => ({ label, value }));

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    const rawValue = this.profileForm.value;
    const newProfile = UserProfileFactory.create(rawValue);
    this.storage.setItem(STORAGE_KEYS.USER_PROFILE, newProfile);
    this.router.navigate(['/dashboard']);
  }
}
