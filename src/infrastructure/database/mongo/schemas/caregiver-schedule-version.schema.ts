import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type CaregiverScheduleVersionDocument =
  HydratedDocument<CaregiverScheduleVersion>;

@Schema({
  collection: 'caregiver_schedule_versions',
  timestamps: true,
  versionKey: false,
})
export class CaregiverScheduleVersion {
  @Prop({ type: Types.ObjectId, ref: 'CommunityHall', required: true })
  communityHallId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  validFrom: Date;

  @Prop({ type: Date, default: null })
  validTo?: Date | null;

  @Prop({ type: SchemaTypes.Mixed })
  blocks: Record<string, unknown>[];

  @Prop({ type: SchemaTypes.Mixed })
  dayRules: Record<string, unknown>[];

  @Prop({ type: SchemaTypes.Mixed, default: [] })
  specialDays: Record<string, unknown>[];
}

export const CaregiverScheduleVersionSchema = SchemaFactory.createForClass(
  CaregiverScheduleVersion,
);

CaregiverScheduleVersionSchema.index({ communityHallId: 1, validFrom: 1 });
