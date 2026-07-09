import { Injectable } from '@angular/core';
import { Training } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TrainingValidationService {
  validateStep1(training: Partial<Training>): string[] {
    const errors: string[] = [];
    if (!training.name || training.name.trim().length < 3) {
      errors.push('Nombre del entrenamiento (mínimo 3 letras)');
    }
    if (!training.date) {
      errors.push('Fecha del entrenamiento (requerida)');
    }
    if (!training.trainingType) {
      errors.push('Tipo de entrenamiento (requerido)');
    }
    return errors;
  }

  validateStep2(training: Partial<Training>): string[] {
    const errors: string[] = [];
    const blocks = training.blocks || [];
    
    if (blocks.length === 0) {
      errors.push('Agrega al menos un bloque');
      return errors;
    }

    blocks.forEach((block, idx) => {
      const name = block.title || `Bloque #${idx + 1}`;
      const p = block.prescription;

      if (!block.title || block.title.trim() === '') {
        errors.push(`Título del bloque #${idx + 1} (requerido)`);
      }

      if (!p) {
        errors.push(`Prescripción del bloque "${name}" vacía`);
        return;
      }

      switch (block.type) {
        case 'WARM_UP':
          if (p.kind === 'WARM_UP' && (!p.content || p.content.trim() === '')) {
            errors.push(`Contenido del bloque "${name}" (requerido)`);
          }
          break;
        case 'STRENGTH':
          if (p.kind === 'STRENGTH') {
            if (!p.exercise || p.exercise.trim() === '') {
              errors.push(`Ejercicio en el bloque "${name}" (requerido)`);
            }
            if (!p.sets || p.sets <= 0) {
              errors.push(`Series válidas en el bloque "${name}" (requerido mayor a 0)`);
            }
            if (!p.reps || p.reps <= 0) {
              errors.push(`Repeticiones válidas en el bloque "${name}" (requerido mayor a 0)`);
            }
          }
          break;
        case 'WOD':
          if (p.kind === 'WOD') {
            if (!p.movements || p.movements.trim() === '') {
              errors.push(`Movimientos en el bloque "${name}" (requerido)`);
            }
          }
          break;
        case 'CARDIO':
          if (p.kind === 'CARDIO' && (!p.target || p.target.trim() === '')) {
            errors.push(`Distancia / Duración objetivo en el bloque "${name}" (requerido)`);
          }
          break;
        case 'FREE':
          if (p.kind === 'FREE' && (!p.text || p.text.trim() === '')) {
            errors.push(`Texto descriptivo en el bloque "${name}" (requerido)`);
          }
          break;
      }
    });

    return errors;
  }

  validateStep3(training: Partial<Training>): string[] {
    const errors: string[] = [];
    const blocks = training.blocks || [];

    blocks.forEach((block, idx) => {
      const name = block.title || `Bloque #${idx + 1}`;
      if (block.requiresResult) {
        const res = block.result;
        if (!res || !res.value || res.value.trim() === '') {
          errors.push(`Resultado de ${name} (requerido)`);
        } else if (res.rpe !== undefined && (res.rpe < 1 || res.rpe > 10 || isNaN(res.rpe))) {
          errors.push(`RPE de ${name} (debe estar entre 1 y 10)`);
        }
      }
    });

    return errors;
  }
}
