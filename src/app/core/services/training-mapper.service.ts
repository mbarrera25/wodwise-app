import { Injectable } from '@angular/core';
import { Training, TrainingBlock, TrainingSection, SectionScore, Workout } from '../models';
import { WorkoutType, SectionType } from '../enums';
import { WorkoutFactory } from '../utils/factories';

// Compiles the wizard's dynamic Training draft into the relational Workout
// schema that repositories persist.
@Injectable({
  providedIn: 'root'
})
export class TrainingMapperService {
  mapTrainingToWorkout(training: Training): Workout {
    let typeVal = WorkoutType.Wod;
    if (training.trainingType === 'STRENGTH') typeVal = WorkoutType.Strength;
    if (training.trainingType === 'CARDIO') typeVal = WorkoutType.Cardio;

    const sections = training.blocks.map(block => this.mapBlockToSection(block));

    const rpeValues = training.blocks
      .filter(b => b.requiresResult && b.result?.rpe)
      .map(b => b.result!.rpe!);
    const avgRpe = rpeValues.length > 0
      ? Math.round(rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length)
      : 8;

    const overallNotes = training.blocks
      .filter(b => b.notes || (b.requiresResult && b.result?.notes))
      .map(b => `${b.title}: ${b.notes || b.result?.notes}`)
      .join('\n');

    return WorkoutFactory.create({
      date: training.date,
      type: typeVal,
      name: training.name,
      mainExercises: sections.flatMap(s => s.exercises),
      sections,
      perceivedDifficulty: avgRpe,
      perceivedIntensity: avgRpe,
      notes: overallNotes || undefined
    });
  }

  private mapBlockToSection(block: TrainingBlock): TrainingSection {
    let secType = SectionType.Wod;
    if (block.type === 'WARM_UP') secType = SectionType.WarmUp;
    if (block.type === 'STRENGTH') secType = SectionType.Strength;
    if (block.type === 'CARDIO') secType = SectionType.Metcon;
    if (block.type === 'FREE') secType = SectionType.Notes;
    if (block.type === 'SKILL') secType = SectionType.Skill;
    if (block.type === 'ACCESSORY') secType = SectionType.Accessory;
    if (block.type === 'COOLDOWN') secType = SectionType.Cooldown;

    const exercises: string[] = [];
    let score: SectionScore | undefined = undefined;

    const p = block.prescription;
    if (p.kind === 'WARM_UP') {
      if (p.content) {
        exercises.push(...this.splitExercises(p.content));
      }
    } else if (p.kind === 'STRENGTH') {
      if (p.exercise) exercises.push(p.exercise);
      score = {
        sets: p.sets,
        reps: p.reps,
        weightKg: p.targetWeightKg || undefined,
        notes: p.notes || undefined
      };
    } else if (p.kind === 'WOD') {
      if (p.movements) {
        exercises.push(...this.splitExercises(p.movements));
      }
      score = { notes: p.notes || undefined };
    } else if (p.kind === 'CARDIO') {
      exercises.push(`${p.modality}: ${p.target}`);
      score = { notes: p.notes || undefined };
    } else if (p.kind === 'FREE') {
      if (p.text) exercises.push(p.text);
    }

    if (block.requiresResult && block.result) {
      score = this.applyResultToScore(score || {}, block);
    }

    return {
      type: secType,
      name: block.title,
      exercises,
      score: score && Object.keys(score).length > 0 ? score : undefined
    };
  }

  private applyResultToScore(score: SectionScore, block: TrainingBlock): SectionScore {
    const res = block.result!;
    score.notes = res.notes || score.notes;

    if (res.scoreType === 'LOAD') {
      score.weightKg = Number(res.value) || score.weightKg;
    } else if (res.scoreType === 'TIME') {
      score.finalTime = res.value;
    } else if (res.scoreType === 'ROUNDS_REPS') {
      const parsed = this.parseRoundsReps(res.value);
      score.rounds = parsed.rounds;
      score.repsCompleted = parsed.repsCompleted;
      if (parsed.rounds === undefined && parsed.repsCompleted === undefined) {
        // Unparseable format: keep the raw value so the data isn't lost
        score.notes = score.notes ? `${res.value} — ${score.notes}` : res.value;
      }
    } else if (res.scoreType === 'REPS') {
      score.reps = Number(res.value) || undefined;
    } else if (res.scoreType === 'CALORIES') {
      score.calories = Number(res.value) || undefined;
    } else if (res.scoreType === 'DISTANCE') {
      score.distanceMeters = Number(res.value) || undefined;
    }

    return score;
  }

  // Accepts "3+15", "3 rounds + 15 reps", "3 rondas y 15 reps", "3"
  private parseRoundsReps(value: string): { rounds?: number; repsCompleted?: number } {
    const v = value.trim();

    const plusFormat = v.match(/^(\d+)\s*\+\s*(\d+)$/);
    if (plusFormat) {
      return { rounds: Number(plusFormat[1]), repsCompleted: Number(plusFormat[2]) };
    }

    const roundsMatch = v.match(/(\d+)\s*(?:rounds?|rondas?)/i);
    if (roundsMatch) {
      const repsMatch = v.match(/(\d+)\s*rep/i);
      return {
        rounds: Number(roundsMatch[1]),
        repsCompleted: repsMatch ? Number(repsMatch[1]) : undefined
      };
    }

    if (/^\d+$/.test(v)) {
      return { rounds: Number(v) };
    }

    return {};
  }

  private splitExercises(content: string): string[] {
    return content.split(/[,\n]/).map(e => e.trim()).filter(e => e.length > 0);
  }
}
