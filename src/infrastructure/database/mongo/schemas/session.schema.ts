import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

@Schema({
  collection: 'sessions',
  timestamps: true,
  versionKey: false,
})
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  tokenId: string;
  
  @Prop({ default: true })
  active: boolean;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;
}

export const SessionSchema =
  SchemaFactory.createForClass(Session);
