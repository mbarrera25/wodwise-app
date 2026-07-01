import { Injectable, inject } from '@angular/core';
import { Workout } from '../models';
import { SectionType, TrainingLoad } from '../enums';
import { TrainingLoadService } from './training-load.service';

@Injectable({
  providedIn: 'root'
})
export class RecoveryRecommendationService {
  private readonly loadService = inject(TrainingLoadService);

  getRecommendation(workouts: Workout[]): string {
    if (!workouts || workouts.length === 0) {
      return 'Comienza a registrar tus entrenamientos para recibir recomendaciones personalizadas del coach sobre tu descanso y recuperación.';
    }

    // Sort by date descending (latest first)
    const sorted = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 1. Check for consecutive high load days (today/yesterday or two consecutive days in the last 3 days)
    if (sorted.length >= 2) {
      const w1 = sorted[0];
      const w2 = sorted[1];
      const diffTime = Math.abs(new Date(w1.date).getTime() - new Date(w2.date).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        const l1 = this.loadService.getWorkoutLoad(w1);
        const l2 = this.loadService.getWorkoutLoad(w2);
        
        if (l1 === TrainingLoad.High && l2 === TrainingLoad.High) {
          return '⚠️ Alerta de Fatiga: Has acumulado 2 días seguidos con entrenamientos de alta carga. Tu cuerpo necesita descanso para supercompensar. Hoy te sugerimos descanso total o una sesión dedicada puramente a la movilidad.';
        }
      }
    }

    // 2. Check for excess of WOD/Metcon on consecutive days
    if (sorted.length >= 3) {
      const w1 = sorted[0];
      const w2 = sorted[1];
      const w3 = sorted[2];
      
      const diff1 = Math.ceil(Math.abs(new Date(w1.date).getTime() - new Date(w2.date).getTime()) / (1000 * 60 * 60 * 24));
      const diff2 = Math.ceil(Math.abs(new Date(w2.date).getTime() - new Date(w3.date).getTime()) / (1000 * 60 * 60 * 24));

      if (diff1 === 1 && diff2 === 1) {
        const hasMetcon1 = this.hasMetconSection(w1);
        const hasMetcon2 = this.hasMetconSection(w2);
        const hasMetcon3 = this.hasMetconSection(w3);

        if (hasMetcon1 && hasMetcon2 && hasMetcon3) {
          return '⚠️ Estrés Metabólico Elevado: Llevas 3 días consecutivos haciendo WODs o Metcons intensos. Este tipo de estímulo estresa fuertemente el sistema cardiovascular y el sistema nervioso central. Hoy realiza fuerza pura de baja velocidad (sin cronómetro) o haz descanso activo.';
        }
      }
    }

    // 3. Check for severe energy drop in the latest workout
    const latest = sorted[0];
    const energyBefore = latest.energyBefore || 5;
    const energyAfter = latest.energyAfter || 5;
    const difficulty = latest.perceivedDifficulty;
    const intensity = latest.perceivedIntensity || difficulty;

    if (energyAfter <= 3 && (difficulty >= 8 || intensity >= 8)) {
      return `📉 Depleción de Energía: Tu último entrenamiento (${latest.name}) te dejó con energía muy baja (${energyAfter}/10) y fue altamente demandante. Tu sistema nervioso central está agotado. Mañana asegúrate de reponer carbohidratos, dormir 8 horas y evitar pesos máximos.`;
    }

    if (energyBefore <= 3 && difficulty >= 8) {
      return '⚠️ Esfuerzo Forzado: Entrenaste con muy baja energía inicial y la dificultad percibida fue extrema. Vigila tus sensaciones articulares. Tu cuerpo avisa que está cerca del límite.';
    }

    // 4. Default recommendation
    const latestLoad = this.loadService.getWorkoutLoad(latest);
    if (latestLoad === TrainingLoad.High) {
      return 'Estímulo de alta intensidad completado con éxito. Hidrátate bien, añade proteína en tus próximas comidas y procura dormir al menos 7-8 horas esta noche para acelerar la regeneración muscular.';
    }

    return 'Tus niveles de fatiga acumulados y energía están en equilibrio óptimo. Mantén la consistencia y sigue escuchando tu cuerpo en cada sesión.';
  }

  private hasMetconSection(workout: Workout): boolean {
    if (!workout.sections) return false;
    return workout.sections.some(s => s.type === SectionType.Wod || s.type === SectionType.Metcon);
  }
}
