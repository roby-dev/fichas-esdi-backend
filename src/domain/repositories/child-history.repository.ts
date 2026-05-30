import { ChildHistory } from '../entities/child-history.entity';

/** Append-only archive for child record snapshots. No updates or deletes. */
export interface ChildHistoryRepository {
  /**
   * Persist a new snapshot. Append-only — never overwrites existing records.
   */
  save(snapshot: ChildHistory): Promise<void>;
}
