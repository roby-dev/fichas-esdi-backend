import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type CaregiverAttendanceRecordDocument =
  HydratedDocument<CaregiverAttendanceRecord>;

@Schema({
  collection: 'caregiver_attendance_records',
  timestamps: false,
  versionKey: false,
})
export class CaregiverAttendanceRecord {
  @Prop({ type: Types.ObjectId, ref: 'CaregiverMother', required: true })
  caregiverId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CommunityHall', required: true })
  communityHallId: Types.ObjectId;

  @Prop({ required: true })
  localDate: string; // YYYY-MM-DD

  @Prop({ required: true })
  blockId: string;

  @Prop({ required: true })
  markKind: string;

  @Prop()
  entryTime?: string; // HH:mm

  @Prop({ type: String, default: null })
  exitTime?: string | null;

  @Prop({ required: true })
  source: string;

  @Prop()
  reason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  performerId?: Types.ObjectId;

  @Prop({ required: true, default: false })
  isVoided: boolean;

  @Prop({ type: Date, default: null })
  voidedAt?: Date | null;

  @Prop({ type: String, default: null })
  correctedFromId?: string | null;

  @Prop({ required: true })
  recordedAt: Date;

  @Prop({ type: SchemaTypes.Mixed })
  metadata?: Record<string, unknown>;
}

export const CaregiverAttendanceRecordSchema = SchemaFactory.createForClass(
  CaregiverAttendanceRecord,
);

CaregiverAttendanceRecordSchema.index(
  { caregiverId: 1, localDate: 1, blockId: 1, markKind: 1, isVoided: 1 },
  { unique: true },
);
CaregiverAttendanceRecordSchema.index({ communityHallId: 1, localDate: 1 });
CaregiverAttendanceRecordSchema.index({ caregiverId: 1, localDate: 1 });
