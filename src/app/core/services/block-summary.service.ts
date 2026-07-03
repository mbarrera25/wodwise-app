import { Injectable } from '@angular/core';
import { TrainingBlock } from '../models';

@Injectable({
  providedIn: 'root'
})
export class BlockSummaryService {
  getBlockSummary(block: TrainingBlock): string {
    const p = block.prescription;
    if (!p) return 'Bloque vacío';

    switch (block.type) {
      case 'WARM_UP':
        if (p.kind === 'WARM_UP') {
          return p.content ? p.content.replace(/\n/g, ' · ') : 'Sin calistenia / Ejercicios';
        }
        break;
      case 'STRENGTH':
        if (p.kind === 'STRENGTH') {
          const ex = p.exercise || 'Ejercicio fuerza';
          const weightText = p.targetWeightKg ? ` · ${p.targetWeightKg} kg` : '';
          return `${ex} · ${p.sets} series · ${p.reps} reps${weightText}`;
        }
        break;
      case 'WOD':
        if (p.kind === 'WOD') {
          const format = p.format || 'AMRAP';
          const duration = p.durationMinutes || p.timeCapMinutes || '';
          const durationText = duration ? ` ${duration}'` : '';
          const movs = p.movements ? p.movements.replace(/\n/g, ' · ') : 'Sin movimientos';
          return `${format}${durationText} · ${movs}`;
        }
        break;
      case 'CARDIO':
        if (p.kind === 'CARDIO') {
          const mod = p.modality || 'RUN';
          const target = p.target || '';
          const targetText = target ? ` · ${target}` : '';
          return `${mod}${targetText}`;
        }
        break;
      case 'FREE':
      default:
        if (p.kind === 'FREE') {
          return p.text ? p.text.substring(0, 50).replace(/\n/g, ' ') : 'Notas libres';
        }
        break;
    }
    return 'Bloque sin prescripción';
  }
}
