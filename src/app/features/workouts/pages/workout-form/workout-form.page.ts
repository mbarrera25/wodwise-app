import { Component, inject, OnInit, isDevMode } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
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

  currentStep = 1;

  // Active modal editing properties
  isEditingSection = false;
  activeEditIndex: number | null = null;
  editSectionForm: FormGroup | null = null;

  readonly workoutForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    type: [WorkoutType.Wod, Validators.required],
    discipline: ['custom', Validators.required],
    date: [this.formatDate(new Date()), Validators.required],
    durationMinutes: [null, [Validators.min(1), Validators.max(300)]],
    // Step 4 final score fields
    scoreType: ['none'],
    finalScore: [''],
    perceivedDifficulty: [8, [Validators.required, Validators.min(1), Validators.max(10)]],
    perceivedIntensity: [8, [Validators.required, Validators.min(1), Validators.max(10)]],
    energyBefore: [7, [Validators.required, Validators.min(1), Validators.max(10)]],
    energyAfter: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    notes: [''],
    sections: this.fb.array([])
  });

  readonly workoutTypes = Object.entries(WORKOUT_TYPE_LABELS).map(([value, label]) => ({ label, value }));
  readonly sectionTypes = Object.entries(SECTION_TYPE_LABELS).map(([value, label]) => ({ label, value }));
  readonly difficultyOptions = Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }));
  readonly disciplines = this.templateService.getDisciplines();
  readonly SectionType = SectionType;

  readonly scoreTypes = [
    { label: 'Ninguno / Libre', value: 'none' },
    { label: 'Tiempo Final (MM:SS)', value: 'time' },
    { label: 'Peso Máximo (kg)', value: 'weight' },
    { label: 'Rondas + Reps (AMRAP)', value: 'amrap' },
    { label: 'Calorías (cal)', value: 'calories' },
    { label: 'Distancia (m)', value: 'distance' }
  ];

  // Collapsible tracking arrays for backward-compatibility representation
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

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  // 1. Quick Template Selector (Chips)
  selectQuickTemplate(templateName: string): void {
    if (templateName === 'crossfit') {
      this.workoutForm.patchValue({
        name: 'CrossFit de hoy',
        type: WorkoutType.Wod,
        discipline: 'crossfit'
      });
      this.onDisciplineChange('crossfit');
    } else if (templateName === 'hyrox') {
      this.workoutForm.patchValue({
        name: 'Hyrox del día',
        type: WorkoutType.Cardio,
        discipline: 'hyrox'
      });
      this.onDisciplineChange('hyrox');
    } else if (templateName === 'strength') {
      this.workoutForm.patchValue({
        name: 'Fuerza del día',
        type: WorkoutType.Strength,
        discipline: 'strength'
      });
      this.onDisciplineChange('strength');
    } else {
      this.workoutForm.patchValue({
        name: 'Entrenamiento libre',
        type: WorkoutType.Wod,
        discipline: 'custom'
      });
      this.onDisciplineChange('custom');
    }
  }

  // 2. Navigation Flow controls
  nextStep(): void {
    this.showErrorSummary = false;
    this.invalidFields = [];

    if (this.currentStep === 1) {
      const nameValid = this.workoutForm.get('name')?.valid;
      const dateValid = this.workoutForm.get('date')?.valid;
      const typeValid = this.workoutForm.get('type')?.valid;

      if (nameValid && dateValid && typeValid) {
        this.currentStep = 2;
      } else {
        this.workoutForm.get('name')?.markAsTouched();
        this.workoutForm.get('date')?.markAsTouched();
        this.workoutForm.get('type')?.markAsTouched();
        this.invalidFields = ['Faltan datos obligatorios del paso 1.'];
        this.showErrorSummary = true;
      }
    } else if (this.currentStep === 2) {
      if (this.sections.length > 0) {
        this.currentStep = 3;
      } else {
        this.invalidFields = ['Debes agregar al menos una sección.'];
        this.showErrorSummary = true;
      }
    } else if (this.currentStep === 3) {
      // Validate all sections have exercises raw
      const hasEmptySection = this.sections.controls.some(ctrl => ctrl.get('exercisesRaw')?.invalid);
      if (!hasEmptySection) {
        this.currentStep = 4;
        this.onStep4ScoreTypeChange(); // Initialize Step 4 validators
      } else {
        this.sections.controls.forEach(ctrl => ctrl.get('exercisesRaw')?.markAsTouched());
        this.invalidFields = ['Todas las secciones agregadas deben tener movimientos.'];
        this.showErrorSummary = true;
      }
    }
  }

  prevStep(): void {
    this.showErrorSummary = false;
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    // Basic validation guard when attempting to jump steps directly
    if (step === 2 && !this.step1Complete) return;
    if (step === 3 && (!this.step1Complete || !this.step2Complete)) return;
    if (step === 4 && (!this.step1Complete || !this.step2Complete || !this.step3Complete)) return;
    
    this.showErrorSummary = false;
    this.currentStep = step;
  }

  // 3. Section control actions
  addSection(type: SectionType = SectionType.Wod, name: string = '', exercisesRaw: string = '', score: any = {}): void {
    const sectionGroup = this.fb.group({
      type: [type, Validators.required],
      name: [name || this.getDefaultSectionName(type), Validators.required],
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

    this.collapsedSections.push(false);
    this.scoreExpanded.push(false);
  }

  getDefaultSectionName(type: SectionType): string {
    return SECTION_TYPE_LABELS[type] || 'Nueva Sección';
  }

  removeSection(index: number): void {
    if (this.sections.length > 1) {
      this.sections.removeAt(index);
      this.collapsedSections.splice(index, 1);
      this.scoreExpanded.splice(index, 1);
    }
  }

  moveSectionUp(index: number): void {
    if (index === 0) return;
    const current = this.sections.at(index);
    this.sections.removeAt(index);
    this.sections.insert(index - 1, current);

    // Swap expanded lists
    const colVal = this.collapsedSections[index];
    this.collapsedSections[index] = this.collapsedSections[index - 1];
    this.collapsedSections[index - 1] = colVal;
  }

  moveSectionDown(index: number): void {
    if (index === this.sections.length - 1) return;
    const current = this.sections.at(index);
    this.sections.removeAt(index);
    this.sections.insert(index + 1, current);

    // Swap expanded lists
    const colVal = this.collapsedSections[index];
    this.collapsedSections[index] = this.collapsedSections[index + 1];
    this.collapsedSections[index + 1] = colVal;
  }

  // 4. Modal Section Editing Actions
  openEditSectionModal(index: number): void {
    this.activeEditIndex = index;
    const sec = this.sections.at(index) as FormGroup;
    const scoreGroup = sec.get('score') as FormGroup;

    this.editSectionForm = this.fb.group({
      type: [sec.get('type')?.value, Validators.required],
      name: [sec.get('name')?.value, Validators.required],
      exercisesRaw: [sec.get('exercisesRaw')?.value, Validators.required],
      scoreType: [scoreGroup.get('scoreType')?.value || 'none'],
      sets: [scoreGroup.get('sets')?.value || null, Validators.min(0)],
      weightKg: [scoreGroup.get('weightKg')?.value || null, Validators.min(0)],
      reps: [scoreGroup.get('reps')?.value || null, Validators.min(0)],
      rounds: [scoreGroup.get('rounds')?.value || null, Validators.min(0)],
      repsCompleted: [scoreGroup.get('repsCompleted')?.value || null, Validators.min(0)],
      finalTime: [scoreGroup.get('finalTime')?.value || '', Validators.pattern(/^([0-9]{1,2}):([0-9]{2})$/)],
      distanceMeters: [scoreGroup.get('distanceMeters')?.value || null, Validators.min(0)],
      calories: [scoreGroup.get('calories')?.value || null, Validators.min(0)],
      notes: [scoreGroup.get('notes')?.value || '']
    });

    this.onModalScoreTypeChange();
    this.isEditingSection = true;
  }

  onModalScoreTypeChange(): void {
    if (!this.editSectionForm) return;

    const scoreType = this.editSectionForm.get('scoreType')?.value;
    const weightCtrl = this.editSectionForm.get('weightKg');
    const roundsCtrl = this.editSectionForm.get('rounds');
    const finalTimeCtrl = this.editSectionForm.get('finalTime');
    const distanceCtrl = this.editSectionForm.get('distanceMeters');
    const caloriesCtrl = this.editSectionForm.get('calories');

    // Reset validations to baseline
    weightCtrl?.setValidators([Validators.min(0)]);
    roundsCtrl?.setValidators([Validators.min(0)]);
    caloriesCtrl?.setValidators([Validators.min(0)]);
    distanceCtrl?.setValidators([Validators.min(0)]);
    finalTimeCtrl?.setValidators([Validators.pattern(/^([0-9]{1,2}):([0-9]{2})$/)]);

    if (scoreType === 'weight') {
      weightCtrl?.setValidators([Validators.required, Validators.min(0)]);
    } else if (scoreType === 'amrap') {
      roundsCtrl?.setValidators([Validators.required, Validators.min(0)]);
    } else if (scoreType === 'time') {
      finalTimeCtrl?.setValidators([Validators.required, Validators.pattern(/^([0-9]{1,2}):([0-9]{2})$/)]);
    } else if (scoreType === 'calories') {
      caloriesCtrl?.setValidators([Validators.required, Validators.min(0)]);
    } else if (scoreType === 'distance') {
      distanceCtrl?.setValidators([Validators.required, Validators.min(0)]);
    }

    weightCtrl?.updateValueAndValidity();
    roundsCtrl?.updateValueAndValidity();
    finalTimeCtrl?.updateValueAndValidity();
    caloriesCtrl?.updateValueAndValidity();
    distanceCtrl?.updateValueAndValidity();
  }

  saveSectionEdit(): void {
    if (!this.editSectionForm || this.editSectionForm.invalid || this.activeEditIndex === null) {
      this.editSectionForm?.markAllAsTouched();
      return;
    }

    const val = this.editSectionForm.value;
    const sec = this.sections.at(this.activeEditIndex) as FormGroup;
    
    sec.get('type')?.setValue(val.type);
    sec.get('name')?.setValue(val.name);
    sec.get('exercisesRaw')?.setValue(val.exercisesRaw);

    const scoreGroup = sec.get('score') as FormGroup;
    scoreGroup.get('scoreType')?.setValue(val.scoreType);
    scoreGroup.get('sets')?.setValue(val.sets);
    scoreGroup.get('weightKg')?.setValue(val.weightKg);
    scoreGroup.get('reps')?.setValue(val.reps);
    scoreGroup.get('rounds')?.setValue(val.rounds);
    scoreGroup.get('repsCompleted')?.setValue(val.repsCompleted);
    scoreGroup.get('finalTime')?.setValue(val.finalTime);
    scoreGroup.get('distanceMeters')?.setValue(val.distanceMeters);
    scoreGroup.get('calories')?.setValue(val.calories);
    scoreGroup.get('notes')?.setValue(val.notes);

    this.onScoreTypeChange(this.activeEditIndex);
    this.isEditingSection = false;
    this.activeEditIndex = null;
  }

  closeEditSectionModal(): void {
    this.isEditingSection = false;
    this.activeEditIndex = null;
  }

  // 5. General score configuration in Step 4
  onStep4ScoreTypeChange(): void {
    const scoreType = this.workoutForm.get('scoreType')?.value;
    const finalScoreCtrl = this.workoutForm.get('finalScore');
    
    if (scoreType === 'none') {
      finalScoreCtrl?.clearValidators();
    } else {
      finalScoreCtrl?.setValidators([Validators.required]);
    }
    finalScoreCtrl?.updateValueAndValidity();
  }

  onScoreTypeChange(index: number): void {
    const section = this.sections.at(index) as FormGroup;
    const scoreGroup = section.get('score') as FormGroup;
    const scoreType = scoreGroup.get('scoreType')?.value;

    const weightCtrl = scoreGroup.get('weightKg');
    const roundsCtrl = scoreGroup.get('rounds');
    const finalTimeCtrl = scoreGroup.get('finalTime');
    const distanceCtrl = scoreGroup.get('distanceMeters');
    const caloriesCtrl = scoreGroup.get('calories');

    // Reset validations to baseline
    weightCtrl?.setValidators([Validators.min(0)]);
    roundsCtrl?.setValidators([Validators.min(0)]);
    caloriesCtrl?.setValidators([Validators.min(0)]);
    distanceCtrl?.setValidators([Validators.min(0)]);
    finalTimeCtrl?.setValidators([Validators.pattern(/^([0-9]{1,2}):([0-9]{2})$/)]);

    if (scoreType === 'weight') {
      weightCtrl?.setValidators([Validators.required, Validators.min(0)]);
    } else if (scoreType === 'amrap') {
      roundsCtrl?.setValidators([Validators.required, Validators.min(0)]);
    } else if (scoreType === 'time') {
      finalTimeCtrl?.setValidators([Validators.required, Validators.pattern(/^([0-9]{1,2}):([0-9]{2})$/)]);
    } else if (scoreType === 'calories') {
      caloriesCtrl?.setValidators([Validators.required, Validators.min(0)]);
    } else if (scoreType === 'distance') {
      distanceCtrl?.setValidators([Validators.required, Validators.min(0)]);
    }

    weightCtrl?.updateValueAndValidity();
    roundsCtrl?.updateValueAndValidity();
    finalTimeCtrl?.updateValueAndValidity();
    caloriesCtrl?.updateValueAndValidity();
    distanceCtrl?.updateValueAndValidity();
  }

  onDisciplineChange(discipline: string): void {
    this.sections.clear();
    this.collapsedSections = [];
    this.scoreExpanded = [];

    const templateSections = this.templateService.getTemplateSections(discipline);
    templateSections.forEach((s, idx) => {
      const defaultScore = { scoreType: s.type === SectionType.Wod ? 'amrap' : 'none' };
      this.addSection(s.type, s.name || '', s.exercises.join('\n'), defaultScore);
      
      if (idx > 0) {
        this.collapsedSections[idx] = true;
      }
    });
  }

  // 6. Preview Formatting Helpers
  getSectionIcon(type: SectionType): string {
    switch (type) {
      case SectionType.WarmUp:
        return 'pi-heart';
      case SectionType.Strength:
      case SectionType.Weightlifting:
        return 'pi-dumbbell';
      case SectionType.Wod:
      case SectionType.Metcon:
        return 'pi-bolt';
      case SectionType.Skill:
      case SectionType.Technique:
        return 'pi-star';
      case SectionType.Accessory:
        return 'pi-link';
      case SectionType.Mobility:
      case SectionType.Cooldown:
        return 'pi-sync';
      default:
        return 'pi-tag';
    }
  }

  getSectionColorClass(type: SectionType): string {
    switch (type) {
      case SectionType.WarmUp:
        return 'section-warmup';
      case SectionType.Strength:
      case SectionType.Weightlifting:
        return 'section-strength';
      case SectionType.Wod:
      case SectionType.Metcon:
        return 'section-wod';
      case SectionType.Skill:
      case SectionType.Technique:
        return 'section-skill';
      case SectionType.Accessory:
        return 'section-accessory';
      case SectionType.Mobility:
      case SectionType.Cooldown:
        return 'section-mobility';
      default:
        return 'section-default';
    }
  }

  getSectionSummary(index: number): string {
    const section = this.sections.at(index) as FormGroup;
    const exRaw = section.get('exercisesRaw')?.value || '';
    const exCount = exRaw.split(/[,\n]/).map((e: string) => e.trim()).filter((e: string) => e.length > 0).length;

    const scoreGroup = section.get('score') as FormGroup;
    const scoreType = scoreGroup.get('scoreType')?.value;
    const sets = scoreGroup.get('sets')?.value;

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

    const scoreText = val.length > 0 ? ` · ${val.join(' @ ')}` : '';
    const exText = exCount === 1 ? '1 ejercicio' : `${exCount} ejercicios`;

    return `${exText}${scoreText}`;
  }

  getSectionExercisesArray(index: number): string[] {
    const section = this.sections.at(index) as FormGroup;
    const exRaw = section.get('exercisesRaw')?.value || '';
    return exRaw.split('\n').map((e: string) => e.trim()).filter((e: string) => e.length > 0);
  }

  getSectionScoreDetailText(index: number): string {
    const section = this.sections.at(index) as FormGroup;
    const scoreGroup = section.get('score') as FormGroup;
    const scoreType = scoreGroup.get('scoreType')?.value;
    
    if (scoreType === 'none') return '';
    
    const val: string[] = [];
    if (scoreGroup.get('sets')?.value) {
      val.push(`Series: ${scoreGroup.get('sets')?.value}`);
    }
    if (scoreType === 'weight' && scoreGroup.get('weightKg')?.value) {
      val.push(`Peso objetivo: ${scoreGroup.get('weightKg')?.value} kg`);
    }
    if (scoreType === 'amrap' && scoreGroup.get('rounds')?.value) {
      val.push(`Formato: AMRAP ${scoreGroup.get('rounds')?.value}'`);
    }
    if (scoreType === 'time' && scoreGroup.get('finalTime')?.value) {
      val.push(`Formato: Tiempo límite ${scoreGroup.get('finalTime')?.value}`);
    }
    return val.join(' · ');
  }

  // 7. Step Complete checks
  get step1Complete(): boolean {
    return !!(this.workoutForm.get('name')?.valid && this.workoutForm.get('date')?.valid && this.workoutForm.get('type')?.valid);
  }

  get step2Complete(): boolean {
    return this.sections.length > 0;
  }

  get step3Complete(): boolean {
    return this.sections.length > 0 && this.sections.controls.every(ctrl => ctrl.get('exercisesRaw')?.valid);
  }

  get step4Complete(): boolean {
    const scoreType = this.workoutForm.get('scoreType')?.value;
    return scoreType === 'none' || !!this.workoutForm.get('finalScore')?.valid;
  }

  // 8. Debugger console logger
  private logInvalidControls(group: FormGroup | FormArray, path: string = ''): void {
    if (!isDevMode()) return;
    
    Object.keys(group.controls).forEach(key => {
      const abstractControl = group.get(key);
      const controlPath = path ? `${path}.${key}` : key;
      
      if (abstractControl instanceof FormGroup || abstractControl instanceof FormArray) {
        this.logInvalidControls(abstractControl, controlPath);
      } else if (abstractControl?.invalid) {
        console.warn(`[QA Wizard Diagnostic] Campo Inválido: "${controlPath}" | Errores:`, abstractControl.errors);
      }
    });
  }

  onSubmit(): void {
    this.invalidFields = [];
    this.showErrorSummary = false;

    // Deep checks across all steps
    if (!this.step1Complete) {
      this.invalidFields.push('Paso 1: Completa los datos básicos obligatorios.');
    }
    if (!this.step2Complete) {
      this.invalidFields.push('Paso 2: Agrega al menos una sección al entrenamiento.');
    }
    if (!this.step3Complete) {
      this.invalidFields.push('Paso 3: Completa los movimientos de todas las secciones.');
    }
    if (!this.step4Complete) {
      this.invalidFields.push('Paso 4: Ingresa el valor del resultado final para el score elegido.');
    }

    if (this.invalidFields.length > 0) {
      this.showErrorSummary = true;
      this.workoutForm.markAllAsTouched();
      this.logInvalidControls(this.workoutForm);
      return;
    }

    const formValue = this.workoutForm.value;
    
    // Map FormArray to database TrainingSection[] format
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

    const parsedDate = new Date(); // Fallback if parsing fails
    const workout = WorkoutFactory.create({
      date: formValue.date,
      type: formValue.type,
      name: formValue.name,
      durationMinutes: formValue.durationMinutes || undefined,
      mainExercises: sectionsData.flatMap(s => s.exercises), // Backward compatibility
      sections: sectionsData,
      perceivedDifficulty: formValue.perceivedDifficulty,
      perceivedIntensity: formValue.perceivedIntensity,
      energyBefore: formValue.energyBefore,
      energyAfter: formValue.energyAfter,
      // Map overall Step 4 score values if required
      rounds: formValue.scoreType === 'amrap' ? Number(formValue.finalScore) : undefined,
      finalTime: formValue.scoreType === 'time' ? formValue.finalScore : undefined,
      weightKg: formValue.scoreType === 'weight' ? Number(formValue.finalScore) : undefined,
      notes: formValue.notes || undefined
    });

    this.workoutService.addWorkout(workout);
    this.router.navigate(['/evaluation']);
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
