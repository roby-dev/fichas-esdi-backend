import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CaregiverAttendanceExceptionDocument =
  HydratedDocument<CaregiverAttendanceException>;

@Schema({
  collection: 'caregiver_attendance_exceptions',
  timestamps: true,
  versionKey: false,
})
export class CaregiverAttendanceException {
  @Prop({ required: true })
  scope: string; // hall | caregiver

  @Prop({ type: Types.ObjectId, ref: 'CommunityHall' })
  communityHallId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CaregiverMother' })
  caregiverId?: Types.ObjectId;

  @Prop({ required: true })
  localDate: string; // YYYY-MM-DD

  @Prop()
  blockId?: string;

  @Prop({ required: true })
  kind: string; // holiday | day_off | permission | justification

  @Prop({ required: true, default: 'accepted' })
  status: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  requestedBy?: Types.ObjectId;
}

export const CaregiverAttendanceExceptionSchema = SchemaFactory.createForClass(
  CaregiverAttendanceException,
);

CaregiverAttendanceExceptionSchema.index({ communityHallId: 1, localDate: 1 });
CaregiverAttendanceExceptionSchema.index({ caregiverId: 1, localDate: 1 });
