import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChildDocument = HydratedDocument<Child>;

@Schema({
  collection: 'children',
  timestamps: true,
  versionKey: false,
})
export class Child {
  @Prop({ required: true, unique: true })
  documentNumber: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  birthday: Date;

  @Prop({ required: true })
  admissionDate: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'CommunityHall',
    required: true,
  })
  communityHallId: Types.ObjectId;
}

export const ChildSchema = SchemaFactory.createForClass(Child);
