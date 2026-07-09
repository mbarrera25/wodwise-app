import { BodyProgress } from '../models';

export abstract class ProgressRepository {
  abstract getProgressLogs(): Promise<BodyProgress[]>;
  abstract addProgressLog(log: BodyProgress): Promise<void>;
}
