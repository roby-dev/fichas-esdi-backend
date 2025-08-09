import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AlertChildDocument = HydratedDocument<AlertChild>;

@Schema({
  collection: 'alert_children',
  timestamps: true,
  versionKey: false,
})
export class AlertChild {
  @Prop({ required: true })
  documentNumber: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  gender: string;

  @Prop({ required: true })
  childCode: string;

  @Prop({ required: true })
  admissionDate: Date;

  @Prop({ required: true })
  birthday: Date;

  @Prop({ required: true })
  managementCommitteName: string;

  @Prop({ required: true })
  managementCommitteCode: string;

  @Prop({ required: true })
  communityHallName: string;

  @Prop({ required: true })
  communityHallId: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId;
}

export const AlertChildSchema = SchemaFactory.createForClass(AlertChild);
