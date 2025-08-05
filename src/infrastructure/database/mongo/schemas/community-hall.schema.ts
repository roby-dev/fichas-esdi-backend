import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommunityHallDocument = HydratedDocument<CommunityHall>;

@Schema({ collection: 'community_halls', timestamps: true, versionKey: false })
export class CommunityHall {
  @Prop({ required: true })
  localId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'ManagementCommittee', required: true })
  managementCommitteeId: Types.ObjectId;
}

export const CommunityHallSchema = SchemaFactory.createForClass(CommunityHall);
