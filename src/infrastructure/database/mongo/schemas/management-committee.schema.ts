import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ManagementCommitteeDocument = HydratedDocument<ManagementCommittee>;

@Schema({
  collection: 'management_committees',
  timestamps: true,
  versionKey: false,
})
export class ManagementCommittee {
  @Prop({ required: true, unique: true })
  committeeId: string;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const ManagementCommitteeSchema =
  SchemaFactory.createForClass(ManagementCommittee);
