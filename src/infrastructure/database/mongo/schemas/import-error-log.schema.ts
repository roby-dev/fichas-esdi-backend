import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ImportErrorLogDocument = HydratedDocument<ImportErrorLog>;

/**
 * Append-only audit record for every row saved during an Excel import
 * that contained an unresolved reference or invalid data.
 *
 * Collection: import_error_logs
 */
@Schema({
  collection: 'import_error_logs',
  timestamps: false,
  versionKey: false,
})
export class ImportErrorLog {
  /**
   * Machine-readable error code.
   * Valid values: UNKNOWN_COMMUNITY_HALL | UNRESOLVED_COMMITTEE_CODE |
   *               COMMITTEE_DETECTION_SKIPPED | INVALID_DNI
   */
  @Prop({ required: true, index: true })
  errorCode: string;

  /** Human-readable description of the anomaly */
  @Prop({ required: true })
  errorMessage: string;

  /** Normalized (or raw if invalid) DNI of the affected child */
  @Prop({ required: true, index: true })
  documentNumber: string;

  @Prop({ required: false })
  fullName?: string;

  @Prop({ required: false })
  childCode?: string;

  @Prop({ required: false })
  managementCommitteCode?: string;

  @Prop({ required: false })
  managementCommitteName?: string;

  /** Raw community hall localId from the Excel row */
  @Prop({ required: false })
  communityHallId?: string;

  @Prop({ required: false })
  communityHallName?: string;

  /** File name or batch identifier of the import run */
  @Prop({ required: false, index: true })
  importBatchRef?: string;

  /** UTC timestamp when this log entry was created */
  @Prop({ required: true })
  loggedAt: Date;
}

export const ImportErrorLogSchema = SchemaFactory.createForClass(ImportErrorLog);
