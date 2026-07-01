import { Injectable } from '@angular/core';
import { TrainingSection } from '../models';
import { SectionType } from '../enums';

@Injectable({
  providedIn: 'root'
})
export class TrainingTemplateService {
  getTemplateSections(discipline: string): TrainingSection[] {
    switch (discipline.toLowerCase()) {
      case 'crossfit':
        return [
          { type: SectionType.WarmUp, name: 'Warm-Up / Calentamiento', exercises: [] },
          { type: SectionType.Weightlifting, name: 'Fuerza o Levantamiento', exercises: [] },
          { type: SectionType.Wod, name: 'WOD / Metcon principal', exercises: [] },
          { type: SectionType.Mobility, name: 'Movilidad o Notas', exercises: [] }
        ];
      case 'hyrox':
        return [
          { type: SectionType.WarmUp, name: 'Warm-Up / Calentamiento', exercises: [] },
          { type: SectionType.Metcon, name: 'Running', exercises: [] },
          { type: SectionType.Wod, name: 'Stations / Estaciones', exercises: [] },
          { type: SectionType.Notes, name: 'Notas / Bitácora', exercises: [] }
        ];
      case 'strength':
        return [
          { type: SectionType.WarmUp, name: 'Warm-Up / Calentamiento', exercises: [] },
          { type: SectionType.Strength, name: 'Main Lift / Levantamiento Principal', exercises: [] },
          { type: SectionType.Accessory, name: 'Accessory / Accesorios', exercises: [] },
          { type: SectionType.Mobility, name: 'Mobility / Estiramientos', exercises: [] }
        ];
      case 'mobility':
        return [
          { type: SectionType.Mobility, name: 'Trabajo de Movilidad', exercises: [] },
          { type: SectionType.Notes, name: 'Notas de Sensación', exercises: [] }
        ];
      default:
        return [
          { type: SectionType.Wod, name: 'Entrenamiento Principal', exercises: [] }
        ];
    }
  }

  getDisciplines(): { label: string; value: string }[] {
    return [
      { label: 'CrossFit', value: 'crossfit' },
      { label: 'Hyrox / Carrera y Estaciones', value: 'hyrox' },
      { label: 'Fuerza / Musculación', value: 'strength' },
      { label: 'Movilidad / Flexibilidad', value: 'mobility' },
      { label: 'Libre / Personalizado', value: 'custom' }
    ];
  }
}
