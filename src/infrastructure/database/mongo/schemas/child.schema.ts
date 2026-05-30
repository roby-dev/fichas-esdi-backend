import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChildDocument = HydratedDocument<Child>;

@Schema({
  collection: 'children',
  timestamps: true,
  versionKey: false,
})
export class Child {
  @Prop({ required: true, unique: true, index: true })
  documentNumber: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  /** Concatenation of firstName + lastName (set at persistence time) */
  @Prop({ required: false })
  fullName?: string;

  @Prop({ required: true })
  birthday: Date;

  @Prop({ required: true })
  admissionDate: Date;

  /** Date imported from Excel — stored only when it differs from the authoritative birthday */
  @Prop({ required: false, default: null })
  birthdayImported?: Date | null;

  /** Date imported from Excel — stored only when it differs from the authoritative admissionDate */
  @Prop({ required: false, default: null })
  admissionDateImported?: Date | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'CommunityHall',
    required: false,
    default: null,
  })
  communityHallId?: Types.ObjectId | null;

  /** Raw localId string from the Excel file (e.g. "LOC001") — used when communityHallId can't be resolved */
  @Prop({ required: false })
  communityHallLocalId?: string;

  /** Human-readable community hall name as provided by Excel */
  @Prop({ required: false })
  communityHallName?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  })
  userId?: Types.ObjectId | null;

  /** Gender as provided by Excel (e.g. "M" | "F") */
  @Prop({ required: false })
  gender?: string;

  /** Child code / registry code from Excel */
  @Prop({ required: false })
  childCode?: string;

  /** Raw management committee code from Excel */
  @Prop({ required: false })
  managementCommitteCode?: string;

  /** Human-readable management committee name from Excel */
  @Prop({ required: false })
  managementCommitteName?: string;
}

export const ChildSchema = SchemaFactory.createForClass(Child);

// Global unique index on documentNumber — enforces one child per DNI across all community halls.
// Declared here as well as via @Prop({ unique: true }) for clarity and to support
// explicit index creation in migrations.
ChildSchema.index({ documentNumber: 1 }, { unique: true });
