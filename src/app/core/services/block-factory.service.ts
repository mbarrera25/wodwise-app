import { Injectable } from '@angular/core';
import { TrainingBlock, BlockType, ScoreType } from '../models';

@Injectable({
  providedIn: 'root'
})
export class BlockFactoryService {
  createBlock(type: BlockType, order: number, title?: string): TrainingBlock {
    const id = Math.random().toString(36).substring(2, 9);
    
    switch (type) {
      case 'WARM_UP':
        return {
          id,
          order,
          type,
          title: title || 'Warm-up',
          requiresResult: false,
          prescription: {
            kind: 'WARM_UP',
            inputType: 'TEXT',
            content: ''
          }
        };
      case 'STRENGTH':
        return {
          id,
          order,
          type,
          title: title || 'Strength',
          requiresResult: true,
          scoreExpected: 'LOAD',
          prescription: {
            kind: 'STRENGTH',
            exercise: '',
            sets: 5,
            reps: 5
          }
        };
      case 'WOD':
        return {
          id,
          order,
          type,
          title: title || 'WOD',
          requiresResult: true,
          scoreExpected: 'ROUNDS_REPS',
          prescription: {
            kind: 'WOD',
            format: 'AMRAP',
            movements: '',
            scoreExpected: 'ROUNDS_REPS'
          }
        };
      case 'CARDIO':
        return {
          id,
          order,
          type,
          title: title || 'Cardio / Run',
          requiresResult: true,
          scoreExpected: 'TIME',
          prescription: {
            kind: 'CARDIO',
            modality: 'RUN',
            target: ''
          }
        };
      case 'FREE':
      default:
        return {
          id,
          order,
          type: type === 'FREE' ? 'FREE' : 'CUSTOM',
          title: title || 'Trabajo libre',
          requiresResult: false,
          prescription: {
            kind: 'FREE',
            text: ''
          }
        };
    }
  }
}
