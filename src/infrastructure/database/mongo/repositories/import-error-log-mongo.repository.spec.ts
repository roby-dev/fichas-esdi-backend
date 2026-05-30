import { ImportErrorLogMongoRepository } from './import-error-log-mongo.repository';
import { ImportErrorLog } from 'src/domain/entities/import-error-log.entity';

describe('ImportErrorLogMongoRepository', () => {
  const makeModel = (insertManyFn: jest.Mock) => ({
    insertMany: insertManyFn,
  });

  const loggedAt = new Date('2026-05-30T12:00:00.000Z');

  const makeLogs = (count: number): ImportErrorLog[] =>
    Array.from({ length: count }, (_, i) =>
      ImportErrorLog.create({
        errorCode: 'UNKNOWN_COMMUNITY_HALL',
        errorMessage: `Hall not found for child ${i}`,
        documentNumber: `1234567${i}`,
        importBatchRef: 'batch-001',
        loggedAt,
      }),
    );

  describe('bulkSave', () => {
    it('should call model.insertMany with mapped documents', async () => {
      const insertManyMock = jest.fn().mockResolvedValue([]);
      const repo = new ImportErrorLogMongoRepository(makeModel(insertManyMock) as any);
      const logs = makeLogs(2);

      await repo.bulkSave(logs);

      expect(insertManyMock).toHaveBeenCalledTimes(1);
      const docs = insertManyMock.mock.calls[0][0];
      expect(docs).toHaveLength(2);
      expect(docs[0].errorCode).toBe('UNKNOWN_COMMUNITY_HALL');
      expect(docs[0].documentNumber).toBe('12345670');
      expect(docs[1].documentNumber).toBe('12345671');
    });

    it('should do nothing when given an empty array', async () => {
      const insertManyMock = jest.fn().mockResolvedValue([]);
      const repo = new ImportErrorLogMongoRepository(makeModel(insertManyMock) as any);

      await repo.bulkSave([]);

      expect(insertManyMock).not.toHaveBeenCalled();
    });

    it('should return void (append-only)', async () => {
      const insertManyMock = jest.fn().mockResolvedValue([]);
      const repo = new ImportErrorLogMongoRepository(makeModel(insertManyMock) as any);

      const result = await repo.bulkSave(makeLogs(1));

      expect(result).toBeUndefined();
    });
  });
});
