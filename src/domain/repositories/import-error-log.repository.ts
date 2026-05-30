import { ImportErrorLog } from '../entities/import-error-log.entity';

/** Append-only audit log for import errors/anomalies. No updates or deletes. */
export interface ImportErrorLogRepository {
  /**
   * Persist one or more error log entries in bulk. Append-only.
   */
  bulkSave(logs: ImportErrorLog[]): Promise<void>;
}
