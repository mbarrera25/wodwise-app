import { Injectable } from '@angular/core';
import { Workout, TrainingSection } from '../models';
import { SectionType, SECTION_TYPE_LABELS } from '../enums';

export interface SectionSummary {
  type: SectionType;
  label: string;
  summaryText: string;
}

export interface TrainingSummary {
  mainBlockType: SectionType;
  mainBlockSummary: string;
  sectionSummaries: SectionSummary[];
  fullSummaryText: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrainingSummaryService {

  getSummary(workout: Workout): TrainingSummary | null {
    if (!workout.sections || workout.sections.length === 0) {
      return null;
    }

    const summaries: SectionSummary[] = workout.sections.map(section => {
      const label = SECTION_TYPE_LABELS[section.type] || 'Sección';
      const exercisesText = section.exercises.length > 0
        ? section.exercises.join(', ')
        : 'Sin ejercicios registrados';

      const scoreParts: string[] = [];
      const score = section.score;

      if (score) {
        if (score.weightKg !== undefined && score.weightKg !== null) {
          if (score.reps !== undefined && score.reps !== null) {
            scoreParts.push(`hasta ${score.weightKg} kg (${score.reps} reps)`);
          } else {
            scoreParts.push(`hasta ${score.weightKg} kg`);
          }
        } else if (score.reps !== undefined && score.reps !== null) {
          scoreParts.push(`${score.reps} reps`);
        }

        if (score.rounds !== undefined && score.rounds !== null) {
          if (score.repsCompleted !== undefined && score.repsCompleted !== null) {
            scoreParts.push(`${score.rounds} rounds + ${score.repsCompleted} reps`);
          } else {
            scoreParts.push(`${score.rounds} rounds`);
          }
        } else if (score.repsCompleted !== undefined && score.repsCompleted !== null) {
          scoreParts.push(`${score.repsCompleted} reps`);
        }

        if (score.finalTime) {
          scoreParts.push(`tiempo de ${score.finalTime}`);
        }

        if (score.distanceMeters !== undefined && score.distanceMeters !== null) {
          scoreParts.push(`${score.distanceMeters} m`);
        }

        if (score.calories !== undefined && score.calories !== null) {
          scoreParts.push(`${score.calories} cal`);
        }
        
        if (score.notes) {
          scoreParts.push(`(${score.notes})`);
        }
      }

      const scoreText = scoreParts.length > 0 ? ` [${scoreParts.join(', ')}]` : '';
      const summaryText = `${exercisesText}${scoreText}`;

      return {
        type: section.type,
        label,
        summaryText
      };
    });

    // Detect main block (wod/metcon/strength/weightlifting)
    const mainSection = this.detectMainSection(workout.sections);
    const mainBlockType = mainSection.type;
    const mainBlockLabel = SECTION_TYPE_LABELS[mainBlockType] || 'Principal';
    const mainBlockSummary = summaries.find(s => s.type === mainBlockType)?.summaryText || 'Sin detalles';

    const fullSummaryText = summaries
      .map(s => `${s.label}: ${s.summaryText}`)
      .join('; ');

    return {
      mainBlockType,
      mainBlockSummary: `${mainBlockLabel}: ${mainBlockSummary}`,
      sectionSummaries: summaries,
      fullSummaryText
    };
  }

  detectMainSection(sections: TrainingSection[]): TrainingSection {
    // Priority order: wod, metcon, strength, weightlifting, gymnastics, technique, skill, other
    const priorities = [
      SectionType.Wod,
      SectionType.Metcon,
      SectionType.Strength,
      SectionType.Weightlifting,
      SectionType.Gymnastics,
      SectionType.Technique,
      SectionType.Skill
    ];

    for (const type of priorities) {
      const match = sections.find(s => s.type === type);
      if (match) return match;
    }

    return sections[0];
  }
}
