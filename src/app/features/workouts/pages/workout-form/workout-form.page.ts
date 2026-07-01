import { Component, inject, OnInit, isDevMode } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkoutService } from '../../../../core/services/workout.service';
import { TrainingTemplateService } from '../../../../core/services/training-template.service';
import { WorkoutFactory } from '../../../../core/utils/factories';
import { WorkoutType, WORKOUT_TYPE_LABELS, SectionType, SECTION_TYPE_LABELS } from '../../../../core/enums';
import { CommonModule } from '@angular/common';

import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-workout-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputText,
    InputNumber,
    Select,
    Textarea,
    Button
  ],
  templateUrl: './workout-form.page.html',
  styleUrl: './workout-form.page.scss'
})
export class WorkoutFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly workoutService = inject(WorkoutService);
  private readonly templateService = inject(TrainingTemplateService);

  readonly workoutForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    type: [WorkoutType.Wod, Validators.required],
    discipline: ['custom', Validators.required],
    durationMinutes: [null, [Validators.min(1), Validators.max(300)]],
    perceivedDifficulty: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    perceivedIntensity: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    energyBefore: [7, [Validators.required, Validators.min(1), Validators.max(10)]],
    energyAfter: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    sections: this.fb.array([]),
    notes: ['']
  });

  readonly workoutTypes = Object.entries(WORKOUT_TYPE_LABELS).map(([value, label]) => ({ label, value }));
  readonly sectionTypes = Object.entries(SECTION_TYPE_LABELS).map(([value, label]) => ({ label, value }));
  readonly difficultyOptions = Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }));
  readonly disciplines = this.templateService.getDisciplines();

  readonly scoreTypes = [
    { label: 'Ninguno / Libre', value: 'none' },
    { label: 'Tiempo Final (MM:SS)', value: 'time' },
    { label: 'Peso Máximo (kg)', value: 'weight' },
    { label: 'Rondas + Reps (AMRAP)', value: 'amrap' },
    { label: 'Calorías (cal)', value: 'calories' },
    { label: 'Distancia (m)', value: 'distance' }
  ];

  // Collapsible tracking arrays
  collapsedSections: boolean[] = [];
  scoreExpanded: boolean[] = [];

  // Error diagnostics
  showErrorSummary = false;
  invalidFields: string[] = [];

  get sections(): FormArray {
    return this.workoutForm.get('sections') as FormArray;
  }

  ngOnInit(): void {
    // Initialize with Custom template
    this.onDisciplineChange('custom');
  }

  addSection(type: SectionType = SectionType.Wod, name: string = '', exercisesRaw: string = '', score: any = {}): void {
    const sectionGroup = this.fb.group({
      type: [type, Validators.required],
      name: [name, Validators.required],
      exercisesRaw: [exercisesRaw, Validators.required],
      score: this.fb.group({
        scoreType: [score.scoreType || 'none'],
        sets: [score.sets || null, Validators.min(0)],
        weightKg: [score.weightKg || null, [Validators.min(0)]],
        reps: [score.reps || null, [Validators.min(0)]],
        rounds: [score.rounds || null, [Validators.min(0)]],
        repsCompleted: [score.repsCompleted || null, [Validators.min(0)]],
        finalTime: [score.finalTime || '', [Validators.pattern(/^([0-9]{1,2}):([0-9]{2})$/)]],
        distanceMeters: [score.distanceMeters || null, [Validators.min(0)]],
        calories: [score.calories || null, [Validators.min(0)]],
        notes: [score.notes || '']
      })
    });
    this.sections.push(sectionGroup);

    // New sections start expanded, scores collapsed
    this.collapsedSections.push(false);
    
    const hasScoreData = score && Object.keys(score).some(k => score[k] !== undefined && score[k] !== null && score[k] !== '');
    this.scoreExpanded.push(hasScoreData);

    // If there is prefilled score data, configure it
    const idx = this.sections.length - 1;
    if (score.scoreType) {
      this.onScoreTypeChange(idx);
    }
  }

  removeSection(index: number): void {
    if (this.sections.length > 1) {
      this.sections.removeAt(index);
      this.collapsedSections.splice(index, 1);
      this.scoreExpanded.splice(index, 1);
    }
  }

  toggleSection(index: number): void {
    this.collapsedSections[index] = !this.collapsedSections[index];
  }

  toggleScore(index: number): void {
    this.scoreExpanded[index] = !this.scoreExpanded[index];
    const section = this.sections.at(index) as FormGroup;
    const scoreGroup = section.get('score') as FormGroup;

    if (!this.scoreExpanded[index]) {
      // Clear score type when collapsed/deleted
      scoreGroup.get('scoreType')?.setValue('none');
      this.onScoreTypeChange(index);
    } else {
      // Focus score type
      scoreGroup.get('scoreType')?.setValue('none');
      this.onScoreTypeChange(index);
    }
  }

  onScoreTypeChange(index: number): void {
    const section = this.sections.at(index) as FormGroup;
    const scoreGroup = section.get('score') as FormGroup;
    const scoreType = scoreGroup.get('scoreType')?.value;

    const weightControl = scoreGroup.get('weightKg');
    const roundsControl = scoreGroup.get('rounds');
    const finalTimeControl = scoreGroup.get('finalTime');
    const distanceControl = scoreGroup.get('distanceMeters');
    const caloriesControl = scoreGroup.get('calories');

    // Reset validations to baseline
    weightControl?.setValidators([Validators.min(0)]);
    roundsControl?.setValidators([Validators.min(0)]);
    caloriesControl?.setValidators([Validators.min(0)]);
    distanceControl?.setValidators([Validators.min(0)]);
    finalTimeControl?.setValidators([Validators.pattern(/^([0-9]{1,2}):([0-9]{2})$/)]);

    // Apply strict requirements based on scoreType selection
    if (scoreType === 'weight') {
      weightControl?.setValidators([Validators.required, Validators.min(0)]);
    } else if (scoreType === 'amrap') {
      roundsControl?.setValidators([Validators.required, Validators.min(0)]);
    } else if (scoreType === 'time') {
      finalTimeControl?.setValidators([Validators.required, Validators.pattern(/^([0-9]{1,2}):([0-9]{2})$/)]);
    } else if (scoreType === 'calories') {
      caloriesControl?.setValidators([Validators.required, Validators.min(0)]);
    } else if (scoreType === 'distance') {
      distanceControl?.setValidators([Validators.required, Validators.min(0)]);
    }

    weightControl?.updateValueAndValidity();
    roundsControl?.updateValueAndValidity();
    finalTimeControl?.updateValueAndValidity();
    caloriesControl?.updateValueAndValidity();
    distanceControl?.updateValueAndValidity();
  }

  onDisciplineChange(discipline: string): void {
    this.sections.clear();
    this.collapsedSections = [];
    this.scoreExpanded = [];

    const templateSections = this.templateService.getTemplateSections(discipline);
    templateSections.forEach((s, idx) => {
      // Map legacy templates to support sections
      const defaultScore = { scoreType: s.type === SectionType.Wod ? 'amrap' : 'none' };
      this.addSection(s.type, s.name || '', s.exercises.join('\n'), defaultScore);
      
      // Expand only the first block, collapse others
      if (idx > 0) {
        this.collapsedSections[idx] = true;
      }
    });
  }

  getSectionSummary(index: number): string {
    const section = this.sections.at(index) as FormGroup;
    const typeValue = section.get('type')?.value;
    const typeLabel = SECTION_TYPE_LABELS[typeValue as SectionType] || 'Bloque';
    const name = section.get('name')?.value || '';

    const exRaw = section.get('exercisesRaw')?.value || '';
    const exCount = exRaw.split(/[,\n]/).map((e: string) => e.trim()).filter((e: string) => e.length > 0).length;

    const scoreGroup = section.get('score') as FormGroup;
    const scoreType = scoreGroup.get('scoreType')?.value;
    const sets = scoreGroup.get('sets')?.value;

    let scoreStatus = 'Sin score';
    if (this.scoreExpanded[index] && scoreType !== 'none') {
      if (scoreGroup.invalid) {
        scoreStatus = 'Score pendiente';
      } else {
        const val: string[] = [];
        if (sets) val.push(`${sets} sets`);
        
        if (scoreType === 'weight' && scoreGroup.get('weightKg')?.value) {
          val.push(`${scoreGroup.get('weightKg')?.value} kg`);
        } else if (scoreType === 'time' && scoreGroup.get('finalTime')?.value) {
          val.push(scoreGroup.get('finalTime')?.value);
        } else if (scoreType === 'amrap' && scoreGroup.get('rounds')?.value) {
          const repsComp = scoreGroup.get('repsCompleted')?.value;
          val.push(repsComp ? `${scoreGroup.get('rounds')?.value} rds + ${repsComp} reps` : `${scoreGroup.get('rounds')?.value} rds`);
        } else if (scoreType === 'calories' && scoreGroup.get('calories')?.value) {
          val.push(`${scoreGroup.get('calories')?.value} cal`);
        } else if (scoreType === 'distance' && scoreGroup.get('distanceMeters')?.value) {
          val.push(`${scoreGroup.get('distanceMeters')?.value} m`);
        }
        scoreStatus = val.length > 0 ? `Score: ${val.join(' @ ')}` : 'Score guardado';
      }
    }

    const exText = exCount === 1 ? 'movimiento' : 'movimientos';
    const finalName = name ? `${name} (${typeLabel})` : typeLabel;
    return `${finalName} · ${exCount} ${exText} · ${scoreStatus}`;
  }

  getSectionStatus(index: number): 'complete' | 'missing_data' | 'incomplete_score' | 'no_score' {
    const section = this.sections.at(index) as FormGroup;
    const typeCtrl = section.get('type');
    const nameCtrl = section.get('name');
    const exCtrl = section.get('exercisesRaw');

    if (typeCtrl?.invalid || nameCtrl?.invalid || exCtrl?.invalid) {
      return 'missing_data';
    }

    const scoreGroup = section.get('score') as FormGroup;
    const scoreType = scoreGroup.get('scoreType')?.value;

    if (this.scoreExpanded[index] && scoreType !== 'none') {
      return scoreGroup.invalid ? 'incomplete_score' : 'complete';
    }

    return 'no_score';
  }

  // Diagnostic helper to collect errors in clean Spanish labels
  getInvalidFields(form: FormGroup): string[] {
    const errors: string[] = [];

    if (form.get('name')?.invalid) {
      errors.push('Nombre de la sesión (obligatorio, mínimo 3 caracteres)');
    }
    if (form.get('type')?.invalid) {
      errors.push('Tipo general de entrenamiento (requerido)');
    }
    if (form.get('discipline')?.invalid) {
      errors.push('Plantilla / Disciplina de entrenamiento');
    }
    if (form.get('durationMinutes')?.invalid) {
      errors.push('Duración total (debe estar entre 1 y 300 minutos)');
    }
    if (form.get('energyBefore')?.invalid || form.get('energyAfter')?.invalid) {
      errors.push('Escala de energía al iniciar/terminar (valor de 1 a 10)');
    }
    if (form.get('perceivedDifficulty')?.invalid || form.get('perceivedIntensity')?.invalid) {
      errors.push('Dificultad e intensidad percibidas (valor de 1 a 10)');
    }

    const sectionsArray = form.get('sections') as FormArray;
    if (sectionsArray.length === 0) {
      errors.push('El entrenamiento debe tener al menos una sección de ejercicios.');
    } else {
      sectionsArray.controls.forEach((ctrl, idx) => {
        const sec = ctrl as FormGroup;
        const name = sec.get('name')?.value || `Bloque #${idx + 1}`;
        
        if (sec.get('type')?.invalid) {
          errors.push(`Tipo de bloque en "${name}" (requerido)`);
        }
        if (sec.get('name')?.invalid) {
          errors.push(`Nombre de bloque en Sección #${idx + 1} (requerido)`);
        }
        if (sec.get('exercisesRaw')?.invalid) {
          errors.push(`Movimientos / Ejercicios en "${name}" (requerido)`);
        }

        const scoreGroup = sec.get('score') as FormGroup;
        if (scoreGroup.invalid) {
          const scoreType = scoreGroup.get('scoreType')?.value;
          if (scoreType === 'time') {
            errors.push(`Marca de Tiempo Final en "${name}" (requerido con formato MM:SS)`);
          } else if (scoreType === 'weight') {
            errors.push(`Marca de Peso Máximo en "${name}" (requerido mayor a 0 kg)`);
          } else if (scoreType === 'amrap') {
            errors.push(`Marca de Rondas en "${name}" (requerido mayor a 0)`);
          } else if (scoreType === 'calories') {
            errors.push(`Marca de Calorías en "${name}" (requerido mayor a 0)`);
          } else if (scoreType === 'distance') {
            errors.push(`Marca de Distancia en "${name}" (requerido mayor a 0)`);
          } else {
            errors.push(`Valores numéricos de marcas inválidos en "${name}"`);
          }
        }
      });
    }

    return errors;
  }

  // Developer console tree logger (only logs in devmode)
  private logInvalidControls(group: FormGroup | FormArray, path: string = ''): void {
    if (!isDevMode()) return;
    
    Object.keys(group.controls).forEach(key => {
      const abstractControl = group.get(key);
      const controlPath = path ? `${path}.${key}` : key;
      
      if (abstractControl instanceof FormGroup || abstractControl instanceof FormArray) {
        this.logInvalidControls(abstractControl, controlPath);
      } else if (abstractControl?.invalid) {
        console.warn(`[QA Diagnostic] Campo Inválido: "${controlPath}" | Errores:`, abstractControl.errors);
      }
    });
  }

  onSubmit(): void {
    this.invalidFields = this.getInvalidFields(this.workoutForm);
    
    if (this.workoutForm.invalid || this.sections.length === 0) {
      this.showErrorSummary = true;
      this.workoutForm.markAllAsTouched();
      
      // Auto expand sections containing invalid inputs so users can see the fields
      this.sections.controls.forEach((control, idx) => {
        if (control.invalid) {
          this.collapsedSections[idx] = false;
        }
      });

      // Log deep form tree errors in developer console
      this.logInvalidControls(this.workoutForm);

      // Scroll smoothly to the first invalid field
      setTimeout(() => {
        const firstInvalid = document.querySelector('.ng-invalid:not(form)');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    const formValue = this.workoutForm.value;
    
    // Map form sections array to TrainingSection[]
    const sectionsData = this.sections.controls.map(control => {
      const val = control.value;
      const exercises = val.exercisesRaw
        ? val.exercisesRaw.split(/[,\n]/).map((e: string) => e.trim()).filter((e: string) => e.length > 0)
        : [];
        
      const score: any = { scoreType: val.score.scoreType };
      const sVal = val.score;
      if (sVal.sets !== null) score.sets = sVal.sets;
      if (sVal.weightKg !== null) score.weightKg = sVal.weightKg;
      if (sVal.reps !== null) score.reps = sVal.reps;
      if (sVal.rounds !== null) score.rounds = sVal.rounds;
      if (sVal.repsCompleted !== null) score.repsCompleted = sVal.repsCompleted;
      if (sVal.finalTime) score.finalTime = sVal.finalTime;
      if (sVal.distanceMeters !== null) score.distanceMeters = sVal.distanceMeters;
      if (sVal.calories !== null) score.calories = sVal.calories;
      if (sVal.notes) score.notes = sVal.notes;

      return {
        type: val.type,
        name: val.name || undefined,
        exercises,
        score: val.score.scoreType !== 'none' ? score : undefined
      };
    });

    const todayStr = new Date().toISOString().split('T')[0];

    const workout = WorkoutFactory.create({
      date: todayStr,
      type: formValue.type,
      name: formValue.name,
      durationMinutes: formValue.durationMinutes || undefined,
      mainExercises: sectionsData.flatMap(s => s.exercises), // Backward compatibility
      sections: sectionsData,
      perceivedDifficulty: formValue.perceivedDifficulty,
      perceivedIntensity: formValue.perceivedIntensity,
      energyBefore: formValue.energyBefore,
      energyAfter: formValue.energyAfter,
      notes: formValue.notes || undefined
    });

    this.workoutService.addWorkout(workout);
    this.router.navigate(['/evaluation']);
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
