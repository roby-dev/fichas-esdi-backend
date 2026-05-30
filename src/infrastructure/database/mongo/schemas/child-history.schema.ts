import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChildHistoryDocument = HydratedDocument<ChildHistory>;

/**
 * Append-only snapshot of a child's active record, captured before a
 * committee change is applied during Excel import.
 *
 * Collection: children_history
 */
@Schema({
  collection: 'children_history',
  timestamps: false,
  versionKey: false,
})
export class ChildHistory {
  /** Reference to the original active-child document's _id */
  @Prop({ required: true, type: Types.ObjectId, index: true })
  originalId: Types.ObjectId;

  @Prop({ required: true, index: true })
  documentNumber: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: false })
  fullName?: string;

  @Prop({ required: true })
  birthday: Date;

  @Prop({ required: true })
  admissionDate: Date;

  @Prop({ type: Date, required: false, default: null })
  birthdayImported?: Date | null;

  @Prop({ type: Date, required: false, default: null })
  admissionDateImported?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'CommunityHall', required: false, default: null })
  communityHallId?: Types.ObjectId | null;

  @Prop({ required: false })
  communityHallLocalId?: string;

  @Prop({ required: false })
  communityHallName?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, default: null })
  userId?: Types.ObjectId | null;

  @Prop({ required: false })
  gender?: string;

  @Prop({ required: false })
  childCode?: string;

  @Prop({ required: false })
  managementCommitteCode?: string;

  @Prop({ required: false })
  managementCommitteName?: string;

  /** UTC timestamp of when this snapshot was created */
  @Prop({ required: true })
  snapshotDate: Date;

  /** Reason for the snapshot (e.g. "committee_change") */
  @Prop({ required: true })
  reason: string;
}

export const ChildHistorySchema = SchemaFactory.createForClass(ChildHistory);
