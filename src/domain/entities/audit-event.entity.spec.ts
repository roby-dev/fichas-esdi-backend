import { AuditEvent } from './audit-event.entity';

describe('AuditEvent Entity', () => {
  const base = {
    action: 'child.update',
    entityType: 'Child',
    entityId: 'child-id-1',
    actorUserId: 'user-id-1',
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('changedFields', () => {
    it('returns an empty array when before and after match', () => {
      const event = AuditEvent.create(
        base.action,
        base.entityType,
        base.entityId,
        base.actorUserId,
        { firstName: 'Juan' },
        { firstName: 'Juan' },
      );

      expect(event.changedFields).toEqual([]);
    });

    it('returns only the keys whose values differ', () => {
      const event = AuditEvent.create(
        base.action,
        base.entityType,
        base.entityId,
        base.actorUserId,
        { firstName: 'Juan', lastName: 'Pérez' },
        { firstName: 'Juan', lastName: 'González' },
      );

      expect(event.changedFields).toEqual(['lastName']);
    });

    it('returns all "after" keys when before is null (creation)', () => {
      const event = AuditEvent.create(
        'child.create',
        base.entityType,
        base.entityId,
        base.actorUserId,
        null,
        { firstName: 'Juan', lastName: 'Pérez' },
      );

      expect(event.changedFields.sort()).toEqual(['firstName', 'lastName']);
    });

    it('returns all "before" keys when after is null (deletion)', () => {
      const event = AuditEvent.create(
        'child.delete',
        base.entityType,
        base.entityId,
        base.actorUserId,
        { firstName: 'Juan', lastName: 'Pérez' },
        null,
      );

      expect(event.changedFields.sort()).toEqual(['firstName', 'lastName']);
    });

    it('treats nested object differences as changed', () => {
      const event = AuditEvent.create(
        base.action,
        base.entityType,
        base.entityId,
        base.actorUserId,
        { address: { street: 'A' } },
        { address: { street: 'B' } },
      );

      expect(event.changedFields).toEqual(['address']);
    });
  });

  describe('hasDiff', () => {
    it('is true when there are changed fields', () => {
      const event = AuditEvent.create(
        base.action,
        base.entityType,
        base.entityId,
        base.actorUserId,
        { name: 'A' },
        { name: 'B' },
      );

      expect(event.hasDiff).toBe(true);
    });

    it('is false when nothing changed', () => {
      const event = AuditEvent.create(
        base.action,
        base.entityType,
        base.entityId,
        base.actorUserId,
        { name: 'A' },
        { name: 'A' },
      );

      expect(event.hasDiff).toBe(false);
    });
  });

  describe('create()', () => {
    it('stamps occurredAt with the current UTC time', () => {
      const fixed = new Date('2026-04-26T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(fixed);

      const event = AuditEvent.create(
        base.action,
        base.entityType,
        base.entityId,
        base.actorUserId,
        null,
        { firstName: 'Juan' },
      );

      expect(event.occurredAt.toISOString()).toBe(fixed.toISOString());
    });

    it('does not assign an id', () => {
      const event = AuditEvent.create(
        base.action,
        base.entityType,
        base.entityId,
        base.actorUserId,
        null,
        { firstName: 'Juan' },
      );

      expect(event.id).toBeUndefined();
    });
  });

  describe('fromPrimitives() / toPrimitives()', () => {
    it('preserves all fields including id', () => {
      const occurredAt = new Date('2026-01-01T00:00:00.000Z');
      const data = {
        id: 'audit-id-1',
        action: 'child.update',
        entityType: 'Child',
        entityId: 'child-id-1',
        actorUserId: 'user-id-1',
        occurredAt,
        before: { name: 'A' },
        after: { name: 'B' },
        metadata: { source: 'manual' },
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      };

      const event = AuditEvent.fromPrimitives(data);

      expect(event.toPrimitives()).toEqual(data);
    });
  });
});
