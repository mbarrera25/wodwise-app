import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CheckInService } from '../../../../core/services/check-in.service';
import { DailyCheckInFactory } from '../../../../core/utils/factories';
import { toLocalDateString } from '../../../../core/utils/date-utils';
import { Mood, MOOD_LABELS } from '../../../../core/enums';
import { CommonModule } from '@angular/common';

import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputNumber,
    Select,
    Textarea,
    Button
  ],
  templateUrl: './check-in.page.html',
  styleUrl: './check-in.page.scss'
})
export class CheckInPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly checkInService = inject(CheckInService);

  readonly checkInForm: FormGroup = this.fb.group({
    sleepHours: [8, [Validators.required, Validators.min(0), Validators.max(14)]],
    energyLevel: [7, [Validators.required, Validators.min(1), Validators.max(10)]],
    sorenessLevel: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
    stressLevel: [4, [Validators.required, Validators.min(1), Validators.max(10)]],
    hungerLevel: [5, [Validators.min(1), Validators.max(10)]],
    mood: [Mood.Good],
    notes: ['']
  });

  readonly levelOptions = Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }));
  readonly moodOptions = Object.entries(MOOD_LABELS).map(([value, label]) => ({ label, value }));

  onSubmit(): void {
    if (this.checkInForm.invalid) return;

    const formValue = this.checkInForm.value;
    const todayStr = toLocalDateString(new Date());

    const checkIn = DailyCheckInFactory.create({
      ...formValue,
      date: todayStr
    });

    this.checkInService.saveDailyCheckIn(checkIn);
    this.router.navigate(['/dashboard']);
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
