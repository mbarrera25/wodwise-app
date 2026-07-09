import { UserGoal } from '../models';

export abstract class GoalRepository {
  abstract getGoals(): Promise<UserGoal[]>;
  abstract addGoal(goal: UserGoal): Promise<void>;
}
