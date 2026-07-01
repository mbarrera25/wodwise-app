import { Injectable, inject } from '@angular/core';
import { Workout } from '../models';
import { SectionType } from '../enums';
import { TrainingSummaryService } from './training-summary.service';

@Injectable({
  providedIn: 'root'
})
export class NutritionSuggestionService {
  private readonly summaryService = inject(TrainingSummaryService);

  getNutritionSuggestion(workout: Workout | null): string {
    if (!workout) {
      return 'Día de descanso o sin entrenamiento registrado: Enfócate en mantener tu hidratación base (30-35 ml de agua por kg de peso), prioriza proteínas magras para mantener la masa muscular y consume grasas saludables (aguacate, frutos secos) y vegetales variados para apoyar la recuperación celular.';
    }

    const summary = this.summaryService.getSummary(workout);
    if (!summary) {
      return 'Entrenamiento registrado: Procura consumir una comida equilibrada con proteínas de calidad y carbohidratos complejos en las 2 horas posteriores al entrenamiento para iniciar la recuperación muscular.';
    }

    const mainBlockType = summary.mainBlockType;

    switch (mainBlockType) {
      case SectionType.Weightlifting:
      case SectionType.Strength:
        return 'Enfoque de Fuerza y Levantamiento: Tu entrenamiento causó microroturas musculares que requieren reparación. Prioriza una ingesta alta de proteínas de calidad (huevo, carnes magras, pescado, legumbres) post-entrenamiento. Consume carbohidratos de bajo índice glucémico para mantener la energía y considera añadir alimentos ricos en magnesio (espinacas, cacao puro, semillas) para evitar calambres y mejorar la relajación nocturna.';

      case SectionType.Wod:
      case SectionType.Metcon:
        return 'Enfoque metabólico (WOD/Metcon): Tu sesión vació tus depósitos de glucógeno y causó una gran pérdida de líquidos y sales minerales. Post-entrenamiento, consume carbohidratos de absorción rápida (frutas, arroz, patata) combinados con una porción de proteína. Añade electrolitos (sodio, potasio) a tu agua para reponer lo perdido en el sudor y evitar la fatiga residual.';

      case SectionType.Mobility:
      case SectionType.WarmUp:
      case SectionType.Cooldown:
      case SectionType.Notes:
        return 'Enfoque de Movilidad y Flexibilidad: Sesión regenerativa. No requieres una carga extra de carbohidratos. Concéntrate en alimentos con propiedades antiinflamatorias como la cúrcuma, el jengibre, los frutos rojos (antioxidantes) y pescados azules ricos en Omega-3, junto con una hidratación constante para lubricar las fascias y articulaciones.';

      default:
        return 'Entrenamiento equilibrado completado: Repón tu energía con una combinación de carbohidratos complejos (boniato, avena) y proteínas de fácil digestión. Mantén una buena ingesta de agua para acelerar la eliminación de toxinas metabólicas acumuladas.';
    }
  }
}
