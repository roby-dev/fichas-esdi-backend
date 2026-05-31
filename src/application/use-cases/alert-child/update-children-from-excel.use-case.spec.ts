/**
 * Unit tests for UpdateChildrenFromExcelUseCase (Phase 3 rewrite).
 *
 * Tests cover:
 *  - INVALID_DNI: row excluded from save, error logged
 *  - UNKNOWN_COMMUNITY_HALL: tolerant insert, error logged
 *  - COMMITTEE_DETECTION_SKIPPED: hall unresolved, still saves, logs
 *  - UNRESOLVED_COMMITTEE_CODE: committee code not found, still saves, logs
 *  - Committee SAME: update without snapshot
 *  - Committee CHANGED: snapshot written BEFORE update
 *  - Non-destructive date merge: form dates authoritative; Excel dates → imported fields
 *  - New child (no existing): upsertByDni without history snapshot
 */
import { UpdateChildrenFromExcelUseCase } from './update-children-from-excel.use-case';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import type { CommitteeRepository } from 'src/domain/repositories/committee.repository';
import type { ChildHistoryRepository } from 'src/domain/repositories/child-history.repository';
import type { ImportErrorLogRepository } from 'src/domain/repositories/import-error-log.repository';
import type { ChildExcelReader } from 'src/application/interfaces/child-excel-reader.interface';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { Child } from 'src/domain/entities/child.entity';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';
import { Committee } from 'src/domain/entities/committee.entity';
import { ChildExcelRow } from 'src/application/interfaces/child-excel-row.interface';
import { ImportErrorLog } from 'src/domain/entities/import-error-log.entity';
import { ChildHistory } from 'src/domain/entities/child-history.entity';
import {
  AuditRecordInput,
  AuditService,
} from 'src/application/services/audit.service';

// Helpers
const makeRow = (overrides: Partial<ChildExcelRow> = {}): ChildExcelRow => ({
  managementCommitteCode: 'CG001',
  managementCommitteName: 'Comité Central',
  communityHallLocalId: 'LOC001',
  communityHallName: 'Sala Los Pinos',
  childCode: 'CH-001',
  fatherLastName: 'GOMEZ',
  motherLastName: 'RIOS',
  childNames: 'PEDRO',
  gender: 'M',
  admissionDate: '01/01/2025',
  documentNumber: '12345678',
  birthday: '10/03/2018',
  ...overrides,
});

const makeHall = (committeeRef = 'committeeMongoId-001'): CommunityHall =>
  CommunityHall.fromPrimitives({
    id: 'hallMongoId-001',
    localId: 'LOC001',
    name: 'Sala Los Pinos',
    committeeRef,
  });

const makeCommittee = (): Committee =>
  Committee.fromPrimitives({
    id: 'committeeMongoId-001',
    committeeId: 'CG001',
    name: 'Comité Central',
  });

const makeExistingChild = (overrides: Partial<{
  communityHallId: string | null;
  managementCommitteCode: string;
}> = {}): Child =>
  Child.fromPrimitives({
    id: '507f1f77bcf86cd799439011',
    documentNumber: '12345678',
    firstName: 'PEDRO',
    lastName: 'GOMEZ RIOS',
    fullName: 'PEDRO GOMEZ RIOS',
    birthday: new Date('2018-03-10'),
    admissionDate: new Date('2025-01-01'),
    birthdayImported: null,
    admissionDateImported: null,
    communityHallId: overrides.communityHallId ?? 'hallMongoId-001',
    userId: 'userId-001',
    managementCommitteCode: overrides.managementCommitteCode ?? 'CG001',
  });

describe('UpdateChildrenFromExcelUseCase', () => {
  let useCase: UpdateChildrenFromExcelUseCase;
  let childRepo: jest.Mocked<ChildRepository>;
  let hallRepo: jest.Mocked<CommunityHallRepository>;
  let committeeRepo: jest.Mocked<CommitteeRepository>;
  let historyRepo: jest.Mocked<ChildHistoryRepository>;
  let errorLogRepo: jest.Mocked<ImportErrorLogRepository>;
  let excelReader: jest.Mocked<ChildExcelReader>;
  let userContext: jest.Mocked<RequestUserContext>;
  let auditService: jest.Mocked<AuditService>;

  const MOCK_FILE = { originalname: 'import-2026.xlsx' } as Express.Multer.File;
  const MOCK_USER_ID = 'userId-001';

  beforeEach(() => {
    childRepo = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllUnpaginated: jest.fn(),
      delete: jest.fn(),
      findByDocumentNumber: jest.fn(),
      findByDocumentNumberAndCommunnityHallId: jest.fn(),
      findAlllByUser: jest.fn(),
      findAllByCommittee: jest.fn(),
      findAllGroupedByUser: jest.fn(),
      upsertByDni: jest.fn(),
    } as unknown as jest.Mocked<ChildRepository>;

    hallRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllUnpaginated: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByNameAndCommitteeRef: jest.fn(),
      findAllByCommitteeRef: jest.fn(),
      findByLocalId: jest.fn(),
    } as unknown as jest.Mocked<CommunityHallRepository>;

    committeeRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllUnpaginated: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByCommitteeId: jest.fn(),
    } as unknown as jest.Mocked<CommitteeRepository>;

    historyRepo = {
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ChildHistoryRepository>;

    errorLogRepo = {
      bulkSave: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ImportErrorLogRepository>;

    excelReader = {
      read: jest.fn(),
    } as unknown as jest.Mocked<ChildExcelReader>;

    userContext = {
      getUserId: jest.fn().mockReturnValue(MOCK_USER_ID),
    } as unknown as jest.Mocked<RequestUserContext>;

    auditService = {
      record: jest.fn().mockResolvedValue(null),
      recordMany: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<AuditService>;

    // Default stored-side committee resolution chain (decision #4):
    //   existing.communityHallId -> hall.findById -> committeeRef -> committee.findById
    // Resolves a stored child to committeeId "CG001" unless a test overrides it.
    hallRepo.findById.mockResolvedValue(makeHall());
    committeeRepo.findById.mockResolvedValue(makeCommittee());

    useCase = new UpdateChildrenFromExcelUseCase(
      childRepo,
      hallRepo,
      committeeRepo,
      historyRepo,
      errorLogRepo,
      excelReader,
      userContext,
      auditService,
    );
  });

  // Helper: flatten all audit inputs passed to recordMany across calls
  const recordedAudits = (): AuditRecordInput[] =>
    auditService.recordMany.mock.calls.flatMap((call) => call[0]);

  describe('INVALID_DNI', () => {
    it('should skip saving a child with an invalid DNI and log INVALID_DNI', async () => {
      const row = makeRow({ documentNumber: 'INVALID' });
      excelReader.read.mockResolvedValue([row]);

      await useCase.execute(MOCK_FILE, 'CG001');

      expect(childRepo.upsertByDni).not.toHaveBeenCalled();
      expect(errorLogRepo.bulkSave).toHaveBeenCalledTimes(1);
      const logs: ImportErrorLog[] = errorLogRepo.bulkSave.mock.calls[0][0];
      expect(logs).toHaveLength(1);
      expect(logs[0].errorCode).toBe('INVALID_DNI');
      expect(logs[0].documentNumber).toBe('INVALID');
    });

    it('should NOT skip a valid 8-digit DNI', async () => {
      const row = makeRow({ documentNumber: '12345678' });
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      expect(childRepo.upsertByDni).toHaveBeenCalledTimes(1);
    });
  });

  describe('UNKNOWN_COMMUNITY_HALL', () => {
    it('should still upsert the child when hall localId is not found', async () => {
      const row = makeRow();
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(null);
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild({ communityHallId: null }));

      await useCase.execute(MOCK_FILE, 'CG001');

      expect(childRepo.upsertByDni).toHaveBeenCalledTimes(1);
    });

    it('should log UNKNOWN_COMMUNITY_HALL when hall is not found', async () => {
      const row = makeRow();
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(null);
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild({ communityHallId: null }));

      await useCase.execute(MOCK_FILE, 'CG001');

      const logs: ImportErrorLog[] = errorLogRepo.bulkSave.mock.calls[0][0];
      const hallLog = logs.find((l) => l.errorCode === 'UNKNOWN_COMMUNITY_HALL');
      expect(hallLog).toBeDefined();
    });
  });

  describe('COMMITTEE_DETECTION_SKIPPED', () => {
    it('should log COMMITTEE_DETECTION_SKIPPED when hall is unresolved', async () => {
      const row = makeRow();
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(null);
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild({ communityHallId: null }));

      await useCase.execute(MOCK_FILE, 'CG001');

      const logs: ImportErrorLog[] = errorLogRepo.bulkSave.mock.calls[0][0];
      const skippedLog = logs.find(
        (l) => l.errorCode === 'COMMITTEE_DETECTION_SKIPPED',
      );
      expect(skippedLog).toBeDefined();
    });
  });

  describe('UNRESOLVED_COMMITTEE_CODE', () => {
    it('should still upsert the child when committee code is not found', async () => {
      const row = makeRow();
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(null);
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      expect(childRepo.upsertByDni).toHaveBeenCalledTimes(1);
    });

    it('should log UNRESOLVED_COMMITTEE_CODE when committee code is not found', async () => {
      const row = makeRow();
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(null);
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      const logs: ImportErrorLog[] = errorLogRepo.bulkSave.mock.calls[0][0];
      const unresolvedLog = logs.find(
        (l) => l.errorCode === 'UNRESOLVED_COMMITTEE_CODE',
      );
      expect(unresolvedLog).toBeDefined();
    });
  });

  describe('committee change detection', () => {
    it('should NOT snapshot when committee code is the same as stored', async () => {
      const row = makeRow({ managementCommitteCode: 'CG001' });
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      // Existing child has managementCommitteCode = CG001 (same as row)
      childRepo.findByDocumentNumber.mockResolvedValue(makeExistingChild({ managementCommitteCode: 'CG001' }));
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      expect(historyRepo.save).not.toHaveBeenCalled();
    });

    it('should snapshot child to history BEFORE updating when committee code changes', async () => {
      const row = makeRow({ managementCommitteCode: 'CG002' });
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(
        Committee.fromPrimitives({ id: 'c2', committeeId: 'CG002', name: 'Comité 2' }),
      );
      // Existing child still has old committee CG001
      childRepo.findByDocumentNumber.mockResolvedValue(makeExistingChild({ managementCommitteCode: 'CG001' }));
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      expect(historyRepo.save).toHaveBeenCalledTimes(1);
      const snapshot: ChildHistory = historyRepo.save.mock.calls[0][0];
      expect(snapshot.reason).toBe('committee_change');
      expect(snapshot.documentNumber).toBe('12345678');
    });

    it('should call upsertByDni AFTER saving the history snapshot', async () => {
      const callOrder: string[] = [];
      historyRepo.save.mockImplementation(async () => { callOrder.push('snapshot'); });
      childRepo.upsertByDni.mockImplementation(async () => {
        callOrder.push('upsert');
        return makeExistingChild();
      });

      const row = makeRow({ managementCommitteCode: 'CG002' });
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(
        Committee.fromPrimitives({ id: 'c2', committeeId: 'CG002', name: 'Comité 2' }),
      );
      childRepo.findByDocumentNumber.mockResolvedValue(makeExistingChild({ managementCommitteCode: 'CG001' }));

      await useCase.execute(MOCK_FILE, 'CG001');

      expect(callOrder).toEqual(['snapshot', 'upsert']);
    });

    it('should NOT snapshot a form-originated child (no managementCommitteCode) when its resolved committee matches the Excel row', async () => {
      const row = makeRow({ managementCommitteCode: 'CG001' });
      excelReader.read.mockResolvedValue([row]);
      // Current Excel row hall + committee resolve to CG001
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      // Stored child is FORM-originated: has communityHallId but NO managementCommitteCode
      const formChild = Child.fromPrimitives({
        id: '507f1f77bcf86cd799439011',
        documentNumber: '12345678',
        firstName: 'PEDRO',
        lastName: 'GOMEZ RIOS',
        fullName: 'PEDRO GOMEZ RIOS',
        birthday: new Date('2018-03-10'),
        admissionDate: new Date('2025-01-01'),
        birthdayImported: null,
        admissionDateImported: null,
        communityHallId: 'hallMongoId-001',
        userId: 'userId-001',
        // managementCommitteCode intentionally omitted — form children don't carry it
      });
      childRepo.findByDocumentNumber.mockResolvedValue(formChild);
      childRepo.upsertByDni.mockResolvedValue(formChild);
      // Stored-side resolution chain: communityHallId -> hall -> committeeRef -> committee
      hallRepo.findById.mockResolvedValue(makeHall());
      committeeRepo.findById.mockResolvedValue(makeCommittee());

      await useCase.execute(MOCK_FILE, 'CG001');

      expect(historyRepo.save).not.toHaveBeenCalled();
    });

    it('should NOT snapshot when the stored committee cannot be resolved (no communityHallId)', async () => {
      const row = makeRow({ managementCommitteCode: 'CG002' });
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(
        Committee.fromPrimitives({ id: 'c2', committeeId: 'CG002', name: 'Comité 2' }),
      );
      // Existing child has NO communityHallId → stored committee is unresolvable
      const childWithoutHall = Child.fromPrimitives({
        id: '507f1f77bcf86cd799439011',
        documentNumber: '12345678',
        firstName: 'PEDRO',
        lastName: 'GOMEZ RIOS',
        fullName: 'PEDRO GOMEZ RIOS',
        birthday: new Date('2018-03-10'),
        admissionDate: new Date('2025-01-01'),
        birthdayImported: null,
        admissionDateImported: null,
        communityHallId: null,
        userId: 'userId-001',
        managementCommitteCode: 'CG001',
      });
      childRepo.findByDocumentNumber.mockResolvedValue(childWithoutHall);
      childRepo.upsertByDni.mockResolvedValue(childWithoutHall);

      await useCase.execute(MOCK_FILE, 'CG001');

      // Cannot prove a committee change → no snapshot (avoids false positives)
      expect(historyRepo.save).not.toHaveBeenCalled();
    });

    it('should NOT snapshot when child does not exist yet (new insert)', async () => {
      const row = makeRow();
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      expect(historyRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('non-destructive date merge', () => {
    it('should pass birthdayImported when Excel date differs from stored birthday', async () => {
      const existingChild = Child.fromPrimitives({
        id: '507f1f77bcf86cd799439011',
        documentNumber: '12345678',
        firstName: 'PEDRO',
        lastName: 'GOMEZ',
        birthday: new Date('2018-03-10'), // authoritative form date
        admissionDate: new Date('2025-01-01'),
        birthdayImported: null,
        admissionDateImported: null,
        communityHallId: 'hallMongoId-001',
        userId: 'userId-001',
        managementCommitteCode: 'CG001',
      });

      // Excel row has a different birthday
      const row = makeRow({ birthday: '15/04/2018' }); // differs from 10/03/2018
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      childRepo.findByDocumentNumber.mockResolvedValue(existingChild);
      childRepo.upsertByDni.mockResolvedValue(existingChild);

      await useCase.execute(MOCK_FILE, 'CG001');

      const upsertArg = childRepo.upsertByDni.mock.calls[0][0];
      expect(upsertArg.birthdayImported).toBeDefined();
      expect(upsertArg.birthdayImported).not.toBeNull();
    });

    it('should NOT overwrite birthday with the Excel value', async () => {
      const existingChild = Child.fromPrimitives({
        id: '507f1f77bcf86cd799439011',
        documentNumber: '12345678',
        firstName: 'PEDRO',
        lastName: 'GOMEZ',
        birthday: new Date('2018-03-10'),
        admissionDate: new Date('2025-01-01'),
        birthdayImported: null,
        admissionDateImported: null,
        communityHallId: 'hallMongoId-001',
        userId: 'userId-001',
        managementCommitteCode: 'CG001',
      });

      const row = makeRow({ birthday: '15/04/2018' });
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      childRepo.findByDocumentNumber.mockResolvedValue(existingChild);
      childRepo.upsertByDni.mockResolvedValue(existingChild);

      await useCase.execute(MOCK_FILE, 'CG001');

      const upsertArg = childRepo.upsertByDni.mock.calls[0][0];
      // The diverging Excel value is parked in birthdayImported, NOT used to
      // overwrite the authoritative form birthday. (The adapter routes the
      // passed-through `birthday` to $setOnInsert, so it can only seed a brand
      // new record — never clobber an existing one.)
      expect(upsertArg.birthdayImported).toEqual(new Date(Date.UTC(2018, 3, 15)));
    });
  });

  describe('new child insert — date provenance (spec: imported MUST be null)', () => {
    it('should set authoritative birthday/admissionDate from Excel and leave imported fields null', async () => {
      const row = makeRow({ birthday: '10/03/2018', admissionDate: '01/01/2025' });
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      childRepo.findByDocumentNumber.mockResolvedValue(null); // new insert
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      const upsertArg = childRepo.upsertByDni.mock.calls[0][0];
      // Excel dates become the authoritative primary fields (adapter routes to $setOnInsert)
      expect(upsertArg.birthday).toEqual(new Date(Date.UTC(2018, 2, 10)));
      expect(upsertArg.admissionDate).toEqual(new Date(Date.UTC(2025, 0, 1)));
      // Imported provenance fields MUST be null on a pure insert
      expect(upsertArg.birthdayImported).toBeNull();
      expect(upsertArg.admissionDateImported).toBeNull();
    });
  });

  describe('non-destructive date merge — existing child edge cases', () => {
    const makeExistingWithImported = (overrides: {
      birthdayImported?: Date | null;
      admissionDateImported?: Date | null;
    }) =>
      Child.fromPrimitives({
        id: '507f1f77bcf86cd799439011',
        documentNumber: '12345678',
        firstName: 'PEDRO',
        lastName: 'GOMEZ',
        birthday: new Date('2018-03-10'),
        admissionDate: new Date('2025-01-01'),
        birthdayImported: overrides.birthdayImported ?? null,
        admissionDateImported: overrides.admissionDateImported ?? null,
        communityHallId: 'hallMongoId-001',
        userId: 'userId-001',
        managementCommitteCode: 'CG001',
      });

    it('should leave admissionDateImported null when Excel admissionDate matches the stored value', async () => {
      // stored admissionDate 2025-01-01, Excel admissionDate 01/01/2025 (same)
      const row = makeRow({ admissionDate: '01/01/2025', birthday: '10/03/2018' });
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      childRepo.findByDocumentNumber.mockResolvedValue(
        makeExistingWithImported({}),
      );
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      const upsertArg = childRepo.upsertByDni.mock.calls[0][0];
      expect(upsertArg.admissionDateImported).toBeNull();
      expect(upsertArg.birthdayImported).toBeNull();
    });

    it('should overwrite a prior birthdayImported when a re-import provides a different birthday', async () => {
      // stored form birthday 2018-03-10, prior import had 2018-01-20; new Excel 15/04/2018
      const row = makeRow({ birthday: '15/04/2018' });
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      childRepo.findByDocumentNumber.mockResolvedValue(
        makeExistingWithImported({ birthdayImported: new Date('2018-01-20') }),
      );
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      const upsertArg = childRepo.upsertByDni.mock.calls[0][0];
      expect(upsertArg.birthdayImported).toEqual(new Date(Date.UTC(2018, 3, 15)));
    });
  });

  describe('importBatchRef tagging', () => {
    it('should stamp every error log with the import file name as importBatchRef', async () => {
      const row = makeRow({ documentNumber: 'INVALID' });
      excelReader.read.mockResolvedValue([row]);

      await useCase.execute(MOCK_FILE, 'CG001');

      const logs: ImportErrorLog[] = errorLogRepo.bulkSave.mock.calls[0][0];
      expect(logs[0].importBatchRef).toBe('import-2026.xlsx');
    });
  });

  describe('upsertByDni call shape', () => {
    it('should pass normalized DNI to upsertByDni', async () => {
      const row = makeRow({ documentNumber: '1234567' }); // 7 digits, pads to 01234567
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      const upsertArg = childRepo.upsertByDni.mock.calls[0][0];
      expect(upsertArg.documentNumber).toBe('01234567');
    });

    it('should pass the resolved communityHallId (ObjectId) from hall lookup', async () => {
      const row = makeRow();
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      const upsertArg = childRepo.upsertByDni.mock.calls[0][0];
      expect(upsertArg.communityHallId).toBe('hallMongoId-001');
    });

    it('should pass null communityHallId when hall is unresolved', async () => {
      const row = makeRow();
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(null);
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild({ communityHallId: null }));

      await useCase.execute(MOCK_FILE, 'CG001');

      const upsertArg = childRepo.upsertByDni.mock.calls[0][0];
      expect(upsertArg.communityHallId).toBeNull();
    });
  });

  describe('audit trail (regression: import must record per-row audit events)', () => {
    it('should record child.create for a new inserted row', async () => {
      const row = makeRow();
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      const audits = recordedAudits();
      const created = audits.find((a) => a.action === 'child.create');
      expect(created).toBeDefined();
      expect(created!.metadata?.source).toBe('excel-import');
    });

    it('should record child.update for a matched row', async () => {
      const row = makeRow();
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      childRepo.findByDocumentNumber.mockResolvedValue(makeExistingChild());
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      const audits = recordedAudits();
      expect(audits.some((a) => a.action === 'child.update')).toBe(true);
    });

    it('should record child.skip for an invalid DNI row', async () => {
      const row = makeRow({ documentNumber: 'INVALID' });
      excelReader.read.mockResolvedValue([row]);

      await useCase.execute(MOCK_FILE, 'CG001');

      const audits = recordedAudits();
      const skipped = audits.find((a) => a.action === 'child.skip');
      expect(skipped).toBeDefined();
      expect(skipped!.metadata?.source).toBe('excel-import');
    });

    it('should record child.save-with-warnings for a row saved with unresolved references', async () => {
      const row = makeRow();
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(null); // unresolved hall → warnings
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.upsertByDni.mockResolvedValue(
        makeExistingChild({ communityHallId: null }),
      );

      await useCase.execute(MOCK_FILE, 'CG001');

      const audits = recordedAudits();
      expect(audits.some((a) => a.action === 'child.save-with-warnings')).toBe(
        true,
      );
    });

    it('should tag every audit event with source excel-import', async () => {
      excelReader.read.mockResolvedValue([
        makeRow({ documentNumber: '11111111' }),
        makeRow({ documentNumber: 'INVALID' }),
      ]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      const audits = recordedAudits();
      expect(audits.length).toBeGreaterThan(0);
      expect(audits.every((a) => a.metadata?.source === 'excel-import')).toBe(
        true,
      );
    });
  });

  describe('no error logs when everything resolves cleanly', () => {
    it('should call bulkSave with an empty array when no errors occur', async () => {
      const row = makeRow();
      excelReader.read.mockResolvedValue([row]);
      hallRepo.findByLocalId.mockResolvedValue(makeHall());
      committeeRepo.findByCommitteeId.mockResolvedValue(makeCommittee());
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.upsertByDni.mockResolvedValue(makeExistingChild());

      await useCase.execute(MOCK_FILE, 'CG001');

      const logs: ImportErrorLog[] = errorLogRepo.bulkSave.mock.calls[0][0];
      expect(logs).toHaveLength(0);
    });
  });
});
