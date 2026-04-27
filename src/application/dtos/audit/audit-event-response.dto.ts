import { ApiProperty } from '@nestjs/swagger';
import { AuditEvent } from 'src/domain/entities/audit-event.entity';

export class AuditEventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'alert-child.update' })
  action: string;

  @ApiProperty({ example: 'AlertChild' })
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiProperty()
  actorUserId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  occurredAt: Date;

  @ApiProperty({
    type: Object,
    nullable: true,
    additionalProperties: true,
  })
  before: Record<string, unknown> | null;

  @ApiProperty({
    type: Object,
    nullable: true,
    additionalProperties: true,
  })
  after: Record<string, unknown> | null;

  @ApiProperty({
    type: [String],
    description: 'Top-level keys whose values differ between before and after',
  })
  changedFields: string[];

  @ApiProperty({
    required: false,
    type: Object,
    additionalProperties: true,
  })
  metadata?: Record<string, unknown>;

  @ApiProperty({ required: false })
  ipAddress?: string;

  @ApiProperty({ required: false })
  userAgent?: string;

  static fromDomain(event: AuditEvent): AuditEventResponseDto {
    return {
      id: event.id!,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      actorUserId: event.actorUserId,
      occurredAt: event.occurredAt,
      before: event.before,
      after: event.after,
      changedFields: event.changedFields,
      metadata: event.metadata,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    };
  }
}
