import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CaregiverHallAssignmentDocument =
  HydratedDocument<CaregiverHallAssignment>;

@Schema({
  collection: 'caregiver_hall_assignments',
  timestamps: true,
  versionKey: false,
})
export class CaregiverHallAssignment {
  @Prop({ type: Types.ObjectId, ref: 'CaregiverMother', required: true })
  caregiverId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CommunityHall', required: true })
  communityHallId: Types.ObjectId;

  @Prop({ required: true })
  validFrom: Date;

  @Prop({ type: Date, default: null })
  validTo?: Date | null;
}

export const CaregiverHallAssignmentSchema = SchemaFactory.createForClass(
  CaregiverHallAssignment,
);

CaregiverHallAssignmentSchema.index({ caregiverId: 1, validFrom: 1 });
CaregiverHallAssignmentSchema.index({ communityHallId: 1, validFrom: 1 });
