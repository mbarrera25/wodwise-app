import { Workout } from '../models';

export abstract class TrainingRepository {
  abstract getWorkouts(): Promise<Workout[]>;
  abstract addWorkout(workout: Workout): Promise<void>;
  abstract clearWorkouts(): Promise<void>;
}
