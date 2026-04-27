import { AuditEvent } from 'src/domain/entities/audit-event.entity';
import { AuditEventRepository } from 'src/domain/repositories/audit-event.repository';
import { RequestInfoContext } from 'src/common/contexts/request-info.context';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { AuditRecordInput, AuditService } from './audit.service';

describe('AuditService', () => {
  let repo: jest.Mocked<AuditEventRepository>;
  let userContext: RequestUserContext;
  let requestInfo: RequestInfoContext;
  let service: AuditService;

  const baseInput: AuditRecordInput = {
    action: 'child.update',
    entityType: 'Child',
    entityId: 'child-id-1',
    before: { firstName: 'A' },
    after: { firstName: 'B' },
  };

  beforeEach(() => {
    repo = {
      save: jest
        .fn()
        .mockImplementation((event: AuditEvent) => Promise.resolve(event)),
      saveMany: jest
        .fn()
        .mockImplementation((events: AuditEvent[]) => Promise.resolve(events)),
      findMany: jest.fn(),
    };

    userContext = new RequestUserContext();
    userContext.setUserId('user-id-1');

    requestInfo = new RequestInfoContext();
    requestInfo.setIpAddress('127.0.0.1');
    requestInfo.setUserAgent('jest');

    service = new AuditService(repo, userContext, requestInfo);
  });

  describe('record()', () => {
    it('persists an AuditEvent stamped with the current actor and request info', async () => {
      await service.record(baseInput);

      expect(repo.save).toHaveBeenCalledTimes(1);
      const saved = repo.save.mock.calls[0][0];
      expect(saved.action).toBe('child.update');
      expect(saved.entityType).toBe('Child');
      expect(saved.entityId).toBe('child-id-1');
      expect(saved.actorUserId).toBe('user-id-1');
      expect(saved.ipAddress).toBe('127.0.0.1');
      expect(saved.userAgent).toBe('jest');
      expect(saved.before).toEqual({ firstName: 'A' });
      expect(saved.after).toEqual({ firstName: 'B' });
    });

    it('forwards metadata when provided', async () => {
      await service.record({
        ...baseInput,
        metadata: { source: 'excel-import' },
      });

      const saved = repo.save.mock.calls[0][0];
      expect(saved.metadata).toEqual({ source: 'excel-import' });
    });

    it('normalizes an array IP (x-forwarded-for chain) to its first element', async () => {
      requestInfo.setIpAddress(['10.0.0.1', '10.0.0.2']);

      await service.record(baseInput);

      const saved = repo.save.mock.calls[0][0];
      expect(saved.ipAddress).toBe('10.0.0.1');
    });

    it('handles a missing ip and userAgent without throwing', async () => {
      requestInfo.setIpAddress(undefined);
      requestInfo.setUserAgent(undefined);

      await service.record(baseInput);

      const saved = repo.save.mock.calls[0][0];
      expect(saved.ipAddress).toBeUndefined();
      expect(saved.userAgent).toBeUndefined();
    });

    it('returns the AuditEvent persisted by the repository', async () => {
      const result = await service.record(baseInput);
      expect(result).toBeInstanceOf(AuditEvent);
      expect(result!.actorUserId).toBe('user-id-1');
    });

    it('returns null and skips the repository when there is no diff', async () => {
      const noDiffInput: AuditRecordInput = {
        ...baseInput,
        before: { firstName: 'Same' },
        after: { firstName: 'Same' },
      };

      const result = await service.record(noDiffInput);

      expect(result).toBeNull();
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('recordMany()', () => {
    it('returns an empty array and skips the repository when input is empty', async () => {
      const result = await service.recordMany([]);

      expect(result).toEqual([]);
      expect(repo.saveMany).not.toHaveBeenCalled();
    });

    it('calls saveMany once with every event stamped with the same actor', async () => {
      const inputs: AuditRecordInput[] = [
        { ...baseInput, entityId: 'c1' },
        { ...baseInput, entityId: 'c2' },
        { ...baseInput, entityId: 'c3' },
      ];

      await service.recordMany(inputs);

      expect(repo.saveMany).toHaveBeenCalledTimes(1);
      const events: AuditEvent[] = repo.saveMany.mock.calls[0][0];
      expect(events).toHaveLength(3);
      expect(events.map((e) => e.entityId)).toEqual(['c1', 'c2', 'c3']);
      expect(events.every((e) => e.actorUserId === 'user-id-1')).toBe(true);
    });

    it('filters out no-diff events before persisting', async () => {
      const sameSnapshot = { firstName: 'Same' };
      const inputs: AuditRecordInput[] = [
        { ...baseInput, entityId: 'c1' },
        {
          ...baseInput,
          entityId: 'c2',
          before: sameSnapshot,
          after: sameSnapshot,
        },
        { ...baseInput, entityId: 'c3' },
      ];

      await service.recordMany(inputs);

      expect(repo.saveMany).toHaveBeenCalledTimes(1);
      const events: AuditEvent[] = repo.saveMany.mock.calls[0][0];
      expect(events.map((e) => e.entityId)).toEqual(['c1', 'c3']);
    });

    it('returns an empty array and skips the repository when every input is no-diff', async () => {
      const sameSnapshot = { firstName: 'Same' };
      const inputs: AuditRecordInput[] = [
        {
          ...baseInput,
          entityId: 'c1',
          before: sameSnapshot,
          after: sameSnapshot,
        },
        {
          ...baseInput,
          entityId: 'c2',
          before: sameSnapshot,
          after: sameSnapshot,
        },
      ];

      const result = await service.recordMany(inputs);

      expect(result).toEqual([]);
      expect(repo.saveMany).not.toHaveBeenCalled();
    });
  });

  describe('query()', () => {
    it('delegates to the repository findMany with filter and pagination', async () => {
      const expected = { items: [], total: 0 };
      repo.findMany.mockResolvedValueOnce(expected);

      const filter = { entityType: 'Child' };
      const pagination = { limit: 20, offset: 40 };

      const result = await service.query(filter, pagination);

      expect(repo.findMany).toHaveBeenCalledWith(filter, pagination);
      expect(result).toBe(expected);
    });
  });
});
