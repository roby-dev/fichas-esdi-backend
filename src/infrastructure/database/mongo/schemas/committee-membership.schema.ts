import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommitteeMembershipDocument =
  HydratedDocument<CommitteeMembership>;

@Schema({
  collection: 'committee_memberships',
  timestamps: true,
  versionKey: false,
})
export class CommitteeMembership {
  @Prop({ type: Types.ObjectId, ref: 'Committee', required: true })
  committeeRef: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userRef: Types.ObjectId;
}

export const CommitteeMembershipSchema =
  SchemaFactory.createForClass(CommitteeMembership);

CommitteeMembershipSchema.index(
  { committeeRef: 1, userRef: 1 },
  { unique: true },
);
