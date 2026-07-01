import { MealLog } from '../models';

export abstract class MealRepository {
  abstract getMealLogs(): Promise<MealLog[]>;
  abstract addMealLog(log: MealLog): Promise<void>;
  abstract clearMealLogs(): Promise<void>;
}
