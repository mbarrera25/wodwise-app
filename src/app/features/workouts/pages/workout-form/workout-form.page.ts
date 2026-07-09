import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkoutService } from '../../../../core/services/workout.service';
import { BlockFactoryService } from '../../../../core/services/block-factory.service';
import { BlockSummaryService } from '../../../../core/services/block-summary.service';
import { TrainingValidationService } from '../../../../core/services/training-validation.service';
import { TrainingMapperService } from '../../../../core/services/training-mapper.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { toLocalDateString } from '../../../../core/utils/date-utils';
import {
  Training,
  TrainingBlock,
  BlockType,
  WodFormat,
  ScoreType,
  WizardTrainingType,
  WarmUpPrescription,
  StrengthPrescription,
  WodPrescription,
  CardioPrescription,
  FreePrescription
} from '../../../../core/models';
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
  private readonly factoryService = inject(BlockFactoryService);
  private readonly summaryService = inject(BlockSummaryService);
  private readonly validationService = inject(TrainingValidationService);
  private readonly mapperService = inject(TrainingMapperService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  // Stepper state
  currentStep = 1;

  // Wizard Training draft state
  activeTraining: Training = {
    id: crypto.randomUUID(),
    name: 'CrossFit de hoy',
    date: toLocalDateString(new Date()),
    trainingType: 'CROSSFIT',
    status: 'DRAFT',
    blocks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Sub-screen (Block Editor) active states
  isEditingBlock = false;
  activeEditBlockIndex: number | null = null;
  activeEditBlockType: BlockType = 'WOD';

  // Wizard steps form groups
  basicForm = this.fb.group({
    name: ['CrossFit de hoy', [Validators.required, Validators.minLength(3)]],
    date: [toLocalDateString(new Date()), Validators.required],
    trainingType: ['CROSSFIT' as WizardTrainingType, Validators.required]
  });

  resultsForm = this.fb.group({});

  // Dynamic Block editor forms
  warmUpForm = this.fb.group({
    title: ['Warm-up', Validators.required],
    inputType: ['TEXT' as 'TEXT' | 'EXERCISE_LIST'],
    content: ['', Validators.required]
  });

  strengthForm = this.fb.group({
    title: ['Strength', Validators.required],
    exercise: ['', Validators.required],
    sets: [5, [Validators.required, Validators.min(1)]],
    reps: [5, [Validators.required, Validators.min(1)]],
    targetWeightKg: [null as number | null],
    restSeconds: [90],
    notes: ['']
  });

  wodForm = this.fb.group({
    title: ['WOD', Validators.required],
    format: ['AMRAP' as WodFormat, Validators.required],
    durationMinutes: [12],
    timeCapMinutes: [null as number | null],
    movements: ['', Validators.required],
    scoreExpected: ['ROUNDS_REPS' as ScoreType, Validators.required],
    notes: ['']
  });

  cardioForm = this.fb.group({
    title: ['Cardio / Run', Validators.required],
    modality: ['RUN' as any, Validators.required],
    target: ['', Validators.required],
    intensity: ['MODERATE' as any],
    notes: ['']
  });

  freeForm = this.fb.group({
    title: ['Trabajo libre', Validators.required],
    text: ['', Validators.required]
  });

  // Select dropdown option arrays
  readonly trainingTypes = [
    { label: 'CrossFit', value: 'CROSSFIT' },
    { label: 'Hyrox', value: 'HYROX' },
    { label: 'Fuerza', value: 'STRENGTH' },
    { label: 'Cardio', value: 'CARDIO' },
    { label: 'Libre', value: 'FREE' }
  ];

  readonly difficultyOptions = Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }));

  readonly wodFormats = [
    { label: 'AMRAP', value: 'AMRAP' },
    { label: 'EMOM', value: 'EMOM' },
    { label: 'For Time', value: 'FOR_TIME' },
    { label: 'Intervals', value: 'INTERVALS' },
    { label: 'Chipper', value: 'CHIPPER' },
    { label: 'Libre / Otro', value: 'FREE' }
  ];

  readonly scoreTypes = [
    { label: 'Ninguno / Libre', value: 'NONE' },
    { label: 'Tiempo Final', value: 'TIME' },
    { label: 'Rondas + Reps', value: 'ROUNDS_REPS' },
    { label: 'Repeticiones', value: 'REPS' },
    { label: 'Calorías', value: 'CALORIES' },
    { label: 'Distancia', value: 'DISTANCE' },
    { label: 'Peso / Carga', value: 'LOAD' }
  ];

  readonly cardioModalities = [
    { label: 'Correr (Run)', value: 'RUN' },
    { label: 'Remar (Row)', value: 'ROW' },
    { label: 'Bicicleta (Bike)', value: 'BIKE' },
    { label: 'Esquiar (Ski)', value: 'SKI' },
    { label: 'Caminar (Walk)', value: 'WALK' },
    { label: 'Otro', value: 'OTHER' }
  ];

  readonly intensityOptions = [
    { label: 'Suave / Baja', value: 'LOW' },
    { label: 'Moderada', value: 'MODERATE' },
    { label: 'Exigente / Alta', value: 'HIGH' }
  ];

  readonly scalingOptions = [
    { label: 'Rx (Como prescrito)', value: 'RX' },
    { label: 'Escalado', value: 'SCALED' }
  ];

  // Error diagnostic listings
  showErrorSummary = false;
  invalidFields: string[] = [];

  ngOnInit(): void {
    // Set default initial template setup
    this.selectQuickTemplate('crossfit');

    // Watch basic form changes to sync with activeTraining state
    this.basicForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
      this.activeTraining.name = val.name || '';
      this.activeTraining.date = val.date || '';
      this.activeTraining.trainingType = val.trainingType || 'CROSSFIT';
    });
  }

  getFormattedDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const day = parts[2];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const month = months[monthIndex] || parts[1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  }

  getScoreTypeLabel(scoreType?: string): string {
    const found = this.scoreTypes.find(s => s.value === scoreType);
    return found ? found.label : (scoreType || 'Ninguno / Libre');
  }

  // 1. Quick Template Selector (Step 1 Chips)
  selectQuickTemplate(templateName: string): void {
    if (templateName === 'crossfit') {
      this.basicForm.patchValue({
        name: 'CrossFit de hoy',
        trainingType: 'CROSSFIT'
      });
      this.activeTraining.blocks = [
        this.factoryService.createBlock('WARM_UP', 1, 'Warm-up'),
        this.factoryService.createBlock('STRENGTH', 2, 'Strength'),
        this.factoryService.createBlock('WOD', 3, 'WOD')
      ];
      // Pre-fill exercises
      (this.activeTraining.blocks[0].prescription as WarmUpPrescription).content = '3 rounds · 10 air squats · 10 push-ups · 200m run';
      (this.activeTraining.blocks[1].prescription as StrengthPrescription).exercise = 'Back Squat';
      (this.activeTraining.blocks[2].prescription as WodPrescription).movements = '10 wall balls · 8 burpees · 6 box jumps';
    } else if (templateName === 'hyrox') {
      this.basicForm.patchValue({
        name: 'Hyrox del día',
        trainingType: 'HYROX'
      });
      this.activeTraining.blocks = [
        this.factoryService.createBlock('WARM_UP', 1, 'Warm-up'),
        this.factoryService.createBlock('CARDIO', 2, 'Cardio / Run'),
        this.factoryService.createBlock('WOD', 3, 'Estaciones')
      ];
      (this.activeTraining.blocks[0].prescription as WarmUpPrescription).content = 'Calentamiento articular y trote ligero';
      (this.activeTraining.blocks[1].prescription as CardioPrescription).modality = 'RUN';
      (this.activeTraining.blocks[1].prescription as CardioPrescription).target = '800 m';
      (this.activeTraining.blocks[2].prescription as WodPrescription).format = 'FREE';
      (this.activeTraining.blocks[2].prescription as WodPrescription).movements = 'Burpee Broad Jumps · Sandbag Lunges';
    } else if (templateName === 'strength') {
      this.basicForm.patchValue({
        name: 'Fuerza del día',
        trainingType: 'STRENGTH'
      });
      this.activeTraining.blocks = [
        this.factoryService.createBlock('WARM_UP', 1, 'Calentamiento'),
        this.factoryService.createBlock('STRENGTH', 2, 'Strength')
      ];
      (this.activeTraining.blocks[0].prescription as WarmUpPrescription).content = 'Movilidad y aproximaciones';
      (this.activeTraining.blocks[1].prescription as StrengthPrescription).exercise = 'Back Squat';
    } else {
      this.basicForm.patchValue({
        name: 'Entrenamiento libre',
        trainingType: 'FREE'
      });
      this.activeTraining.blocks = [
        this.factoryService.createBlock('FREE', 1, 'Trabajo libre')
      ];
      (this.activeTraining.blocks[0].prescription as FreePrescription).text = 'Movilidad de hombros y handstand';
    }
  }

  // 2. Wizard Step Navigation controls
  nextStep(): void {
    this.showErrorSummary = false;
    this.invalidFields = [];

    if (this.currentStep === 1) {
      const step1Errors = this.validationService.validateStep1(this.activeTraining);
      if (step1Errors.length === 0) {
        this.currentStep = 2;
      } else {
        this.basicForm.markAllAsTouched();
        this.invalidFields = step1Errors;
        this.showErrorSummary = true;
      }
    } else if (this.currentStep === 2) {
      const step2Errors = this.validationService.validateStep2(this.activeTraining);
      if (step2Errors.length === 0) {
        this.currentStep = 3;
        this.rebuildResultsForm(); // Initialize Step 3 validation forms
      } else {
        this.invalidFields = step2Errors;
        this.showErrorSummary = true;
      }
    }
  }

  prevStep(): void {
    this.showErrorSummary = false;
    if (this.currentStep > 1) {
      if (this.currentStep === 3) {
        this.syncResultsToTraining(); // Preserve what the user typed in Step 3
      }
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step === 2 && !this.step1Complete) return;
    if (step === 3 && (!this.step1Complete || !this.step2Complete)) return;

    if (this.currentStep === 3 && step !== 3) {
      this.syncResultsToTraining(); // Preserve what the user typed in Step 3
    }

    this.showErrorSummary = false;
    this.currentStep = step;
    if (step === 3) {
      this.rebuildResultsForm();
    }
  }

  // 3. Block list actions (Step 2)
  addBlock(type: BlockType): void {
    const order = this.activeTraining.blocks.length + 1;
    const newBlock = this.factoryService.createBlock(type, order);
    
    this.activeTraining.blocks.push(newBlock);
    
    // Jump straight to the sub-screen editor for the new block
    this.openEditBlockSubscreen(this.activeTraining.blocks.length - 1);
  }

  deleteBlock(index: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este bloque?')) {
      this.activeTraining.blocks.splice(index, 1);
      // Re-map orders
      this.activeTraining.blocks.forEach((b, idx) => b.order = idx + 1);
    }
  }

  moveBlockUp(index: number): void {
    if (index === 0) return;
    const current = this.activeTraining.blocks[index];
    this.activeTraining.blocks.splice(index, 1);
    this.activeTraining.blocks.splice(index - 1, 0, current);
    
    // Re-map orders
    this.activeTraining.blocks.forEach((b, idx) => b.order = idx + 1);
  }

  moveBlockDown(index: number): void {
    if (index === this.activeTraining.blocks.length - 1) return;
    const current = this.activeTraining.blocks[index];
    this.activeTraining.blocks.splice(index, 1);
    this.activeTraining.blocks.splice(index + 1, 0, current);
    
    // Re-map orders
    this.activeTraining.blocks.forEach((b, idx) => b.order = idx + 1);
  }

  getBlockSummary(block: TrainingBlock): string {
    return this.summaryService.getBlockSummary(block);
  }

  getBlockIcon(type: BlockType): string {
    switch (type) {
      case 'WARM_UP':
        return 'pi-heart';
      case 'STRENGTH':
      case 'SKILL':
      case 'ACCESSORY':
        return 'pi-dumbbell';
      case 'WOD':
        return 'pi-bolt';
      case 'CARDIO':
        return 'pi-sync';
      default:
        return 'pi-tag';
    }
  }

  getBlockColorClass(type: BlockType): string {
    switch (type) {
      case 'WARM_UP': return 'warmup';
      case 'STRENGTH': return 'strength';
      case 'WOD': return 'wod';
      case 'CARDIO': return 'cardio';
      default: return 'free';
    }
  }

  // 4. Subscreen Editor handlers (Step 2 subview)
  openEditBlockSubscreen(index: number): void {
    this.activeEditBlockIndex = index;
    const block = this.activeTraining.blocks[index];
    this.activeEditBlockType = block.type;
    this.isEditingBlock = true;

    // Load active prescription values into target form group
    const p = block.prescription;
    if (block.type === 'WARM_UP' && p.kind === 'WARM_UP') {
      this.warmUpForm.patchValue({
        title: block.title,
        inputType: p.inputType,
        content: p.content
      });
    } else if (block.type === 'STRENGTH' && p.kind === 'STRENGTH') {
      this.strengthForm.patchValue({
        title: block.title,
        exercise: p.exercise,
        sets: p.sets,
        reps: p.reps,
        targetWeightKg: p.targetWeightKg || null,
        restSeconds: p.restSeconds || 90,
        notes: p.notes || ''
      });
    } else if (block.type === 'WOD' && p.kind === 'WOD') {
      this.wodForm.patchValue({
        title: block.title,
        format: p.format,
        durationMinutes: p.durationMinutes || 12,
        timeCapMinutes: p.timeCapMinutes || null,
        movements: p.movements,
        scoreExpected: block.scoreExpected || 'ROUNDS_REPS',
        notes: p.notes || ''
      });
    } else if (block.type === 'CARDIO' && p.kind === 'CARDIO') {
      this.cardioForm.patchValue({
        title: block.title,
        modality: p.modality,
        target: p.target,
        intensity: p.intensity || 'MODERATE',
        notes: p.notes || ''
      });
    } else {
      // Free or other
      const textVal = p.kind === 'FREE' ? p.text : '';
      this.freeForm.patchValue({
        title: block.title,
        text: textVal
      });
    }
  }

  saveBlockPrescription(): void {
    if (this.activeEditBlockIndex === null) return;
    
    const block = this.activeTraining.blocks[this.activeEditBlockIndex];

    if (block.type === 'WARM_UP') {
      if (this.warmUpForm.invalid) { this.warmUpForm.markAllAsTouched(); return; }
      const val = this.warmUpForm.value;
      block.title = val.title || 'Warm-up';
      block.prescription = {
        kind: 'WARM_UP',
        inputType: val.inputType || 'TEXT',
        content: val.content || ''
      };
      block.requiresResult = false;
    } else if (block.type === 'STRENGTH') {
      if (this.strengthForm.invalid) { this.strengthForm.markAllAsTouched(); return; }
      const val = this.strengthForm.value;
      block.title = val.title || 'Strength';
      block.prescription = {
        kind: 'STRENGTH',
        exercise: val.exercise || '',
        sets: val.sets || 5,
        reps: val.reps || 5,
        targetWeightKg: val.targetWeightKg || undefined,
        restSeconds: val.restSeconds || undefined,
        notes: val.notes || ''
      };
      block.scoreExpected = 'LOAD';
      block.requiresResult = true;
    } else if (block.type === 'WOD') {
      if (this.wodForm.invalid) { this.wodForm.markAllAsTouched(); return; }
      const val = this.wodForm.value;
      block.title = val.title || 'WOD';
      block.prescription = {
        kind: 'WOD',
        format: val.format || 'AMRAP',
        durationMinutes: val.durationMinutes || undefined,
        timeCapMinutes: val.timeCapMinutes || undefined,
        movements: val.movements || '',
        scoreExpected: val.scoreExpected || 'ROUNDS_REPS',
        notes: val.notes || ''
      };
      block.scoreExpected = val.scoreExpected || 'ROUNDS_REPS';
      block.requiresResult = block.scoreExpected !== 'NONE';
    } else if (block.type === 'CARDIO') {
      if (this.cardioForm.invalid) { this.cardioForm.markAllAsTouched(); return; }
      const val = this.cardioForm.value;
      block.title = val.title || 'Cardio';
      block.prescription = {
        kind: 'CARDIO',
        modality: val.modality || 'RUN',
        target: val.target || '',
        intensity: val.intensity || 'MODERATE',
        notes: val.notes || ''
      };
      block.scoreExpected = 'TIME';
      block.requiresResult = true;
    } else {
      if (this.freeForm.invalid) { this.freeForm.markAllAsTouched(); return; }
      const val = this.freeForm.value;
      block.title = val.title || 'Trabajo libre';
      block.prescription = {
        kind: 'FREE',
        text: val.text || ''
      };
      block.requiresResult = false;
    }

    this.isEditingBlock = false;
    this.activeEditBlockIndex = null;
  }

  cancelBlockEdit(): void {
    this.isEditingBlock = false;
    this.activeEditBlockIndex = null;
  }

  // 5. Result dynamic form rebuilding (Step 3)
  rebuildResultsForm(): void {
    const group: any = {};
    this.activeTraining.blocks.forEach(block => {
      if (block.requiresResult) {
        group[block.id] = this.fb.group({
          value: [block.result?.value || '', Validators.required],
          rpe: [block.result?.rpe || 8, [Validators.required, Validators.min(1), Validators.max(10)]],
          scaling: [block.result?.scaling || 'RX'],
          notes: [block.result?.notes || '']
        });
      }
    });
    this.resultsForm = this.fb.group(group);
  }

  getResultGroup(blockId: string): FormGroup {
    return this.resultsForm.get(blockId) as FormGroup;
  }

  // 6. Step completion status indicators
  get step1Complete(): boolean {
    return this.validationService.validateStep1(this.activeTraining).length === 0;
  }

  get step2Complete(): boolean {
    return this.validationService.validateStep2(this.activeTraining).length === 0;
  }

  get step3Complete(): boolean {
    const step3Errors = this.validationService.validateStep3(this.activeTraining);
    
    // Check resultsForm validation status if we are on step 3
    if (this.currentStep === 3) {
      return this.resultsForm.valid && step3Errors.length === 0;
    }
    
    return step3Errors.length === 0;
  }

  get blocksRequiringResults(): TrainingBlock[] {
    return this.activeTraining.blocks.filter(b => b.requiresResult);
  }

  getFormattedModality(val: string): string {
    const found = this.cardioModalities.find(m => m.value === val);
    return found ? found.label : val;
  }

  // Copy the current resultsForm values back into the activeTraining state.
  // Runs on every step-3 exit and before validating on submit, so typed
  // values are never lost and validation always sees fresh data.
  private syncResultsToTraining(): void {
    this.activeTraining.blocks.forEach(block => {
      if (!block.requiresResult) return;
      const resVal = this.resultsForm.get(block.id)?.value;
      if (resVal) {
        block.result = {
          scoreType: block.scoreExpected || 'NONE',
          value: resVal.value || '',
          rpe: resVal.rpe !== null && resVal.rpe !== undefined ? Number(resVal.rpe) : undefined,
          scaling: resVal.scaling || 'RX',
          notes: resVal.notes || ''
        };
      }
    });
  }

  // 7. Relational Model Compiler & Save
  async onSubmit(): Promise<void> {
    this.invalidFields = [];
    this.showErrorSummary = false;

    // Always persist what the user typed before validating
    this.syncResultsToTraining();

    const step1Errors = this.validationService.validateStep1(this.activeTraining);
    const step2Errors = this.validationService.validateStep2(this.activeTraining);
    const step3Errors = this.validationService.validateStep3(this.activeTraining);

    if (step1Errors.length > 0) this.invalidFields.push(...step1Errors);
    if (step2Errors.length > 0) this.invalidFields.push(...step2Errors);
    if (step3Errors.length > 0) this.invalidFields.push(...step3Errors);

    if (this.invalidFields.length > 0) {
      this.showErrorSummary = true;
      this.resultsForm.markAllAsTouched();
      return;
    }

    // Compile dynamic Training object to relational Workout schema
    const workout = this.mapperService.mapTrainingToWorkout(this.activeTraining);

    try {
      await this.workoutService.addWorkout(workout);
      this.notificationService.success('Entrenamiento guardado.');
      this.router.navigate(['/evaluation']);
    } catch {
      this.notificationService.error('No se pudo guardar el entrenamiento. Inténtalo de nuevo.');
    }
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
