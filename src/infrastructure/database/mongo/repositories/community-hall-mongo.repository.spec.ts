import { CommunityHallMongoRepository } from './community-hall-mongo.repository';

describe('CommunityHallMongoRepository', () => {
  const HALL_ID = '000000000000000000000002';
  const OTHER_HALL_ID = '000000000000000000000003';
  const COMMITTEE_ID = '00000000000000000000000a';

  describe('findByIds', () => {
    it('queries requested hall ids and maps populated committee references', async () => {
      const leanMock = jest.fn().mockResolvedValue([
        {
          _id: { toString: () => HALL_ID },
          localId: 'LOC-001',
          name: 'Local Las Flores',
          committeeRef: {
            _id: { toString: () => COMMITTEE_ID },
            committeeId: 'CG-001',
            name: 'Comité Las Flores',
          },
        },
      ]);
      const populateMock = jest.fn().mockReturnValue({ lean: leanMock });
      const findMock = jest.fn().mockReturnValue({ populate: populateMock });
      const repo = new CommunityHallMongoRepository({ find: findMock } as any);

      const result = await repo.findByIds([HALL_ID, OTHER_HALL_ID]);

      const query = findMock.mock.calls[0][0];
      expect(query._id.$in.map((id: { toString: () => string }) => id.toString())).toEqual([
        HALL_ID,
        OTHER_HALL_ID,
      ]);
      expect(populateMock).toHaveBeenCalledWith('committeeRef');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(HALL_ID);
      expect(result[0].name).toBe('Local Las Flores');
      expect(result[0].committeeRef).toBe(COMMITTEE_ID);
      expect(result[0].committee?.name).toBe('Comité Las Flores');
    });

    it('short-circuits empty hall id lists without querying Mongo', async () => {
      const findMock = jest.fn();
      const repo = new CommunityHallMongoRepository({ find: findMock } as any);

      const result = await repo.findByIds([]);

      expect(result).toEqual([]);
      expect(findMock).not.toHaveBeenCalled();
    });
  });
});
