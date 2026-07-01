import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CaregiverMotherDocument = HydratedDocument<CaregiverMother>;

@Schema({
  collection: 'caregiver_mothers',
  timestamps: true,
  versionKey: false,
})
export class CaregiverMother {
  @Prop({ required: true })
  documentType: string;

  @Prop({ required: true })
  documentNumber: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  fullName?: string;

  @Prop()
  phone?: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ type: Date, default: null })
  endDate?: Date | null;

  @Prop({ required: true, default: 'active' })
  status: string;
}

export const CaregiverMotherSchema =
  SchemaFactory.createForClass(CaregiverMother);

CaregiverMotherSchema.index(
  { documentType: 1, documentNumber: 1 },
  { unique: true },
);
