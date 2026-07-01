import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type AuditEventDocument = HydratedDocument<AuditEvent>;

@Schema({
  collection: 'audit_events',
  timestamps: false,
  versionKey: false,
})
export class AuditEvent {
  @Prop({ required: true, index: true })
  action: string;

  @Prop({ required: true })
  entityType: string;

  @Prop({ required: true })
  entityId: string;

  @Prop({ required: true })
  actorUserId: string;

  @Prop({ required: true })
  actorEmail: string;

  @Prop({ required: true, default: 'user' })
  actorType: string;

  @Prop({ required: true })
  occurredAt: Date;

  @Prop({ type: SchemaTypes.Mixed, default: null })
  before: Record<string, unknown> | null;

  @Prop({ type: SchemaTypes.Mixed, default: null })
  after: Record<string, unknown> | null;

  @Prop({ type: SchemaTypes.Mixed })
  metadata?: Record<string, unknown>;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;
}

export const AuditEventSchema = SchemaFactory.createForClass(AuditEvent);

AuditEventSchema.index({ entityType: 1, entityId: 1, occurredAt: -1 });
AuditEventSchema.index({ actorUserId: 1, occurredAt: -1 });
AuditEventSchema.index({ occurredAt: -1 });
