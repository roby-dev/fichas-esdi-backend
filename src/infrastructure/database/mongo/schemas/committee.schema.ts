import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommitteeDocument = HydratedDocument<Committee>;

@Schema({
  collection: 'committees',
  timestamps: true,
  versionKey: false,
})
export class Committee {
  @Prop({ required: true, unique: true })
  committeeId: string;

  @Prop({ required: true})
  name: string;
}

export const CommitteeSchema = SchemaFactory.createForClass(Committee);
