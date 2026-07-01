import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type CaregiverAttendanceEventDocument =
  HydratedDocument<CaregiverAttendanceEvent>;

@Schema({
  collection: 'caregiver_attendance_events',
  timestamps: false,
  versionKey: false,
})
export class CaregiverAttendanceEvent {
  @Prop({ type: Types.ObjectId, ref: 'CaregiverMother' })
  caregiverId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CommunityHall' })
  communityHallId?: Types.ObjectId;

  @Prop({ required: true })
  localDate: string; // YYYY-MM-DD

  @Prop()
  blockId?: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true })
  source: string; // self-service | assisted | system

  @Prop({ type: SchemaTypes.Mixed })
  metadata?: Record<string, unknown>;

  @Prop({ required: true })
  recordedAt: Date;
}

export const CaregiverAttendanceEventSchema = SchemaFactory.createForClass(
  CaregiverAttendanceEvent,
);

CaregiverAttendanceEventSchema.index({ localDate: 1, reason: 1 });
CaregiverAttendanceEventSchema.index({ caregiverId: 1, localDate: 1 });
CaregiverAttendanceEventSchema.index({ communityHallId: 1, localDate: 1 });
