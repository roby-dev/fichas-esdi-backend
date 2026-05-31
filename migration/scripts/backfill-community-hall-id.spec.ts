/**
 * Unit tests for the pure resolveOrphans function.
 * No DB, no mongoose — pure data transformation logic.
 */

import { resolveOrphans } from './backfill-community-hall-id';

const makeId = (n: number) => ({ toString: () => `id${n}` } as any);

describe('resolveOrphans', () => {
  const hall1 = { _id: makeId(1), name: 'VIRGEN DE PALLAGUA', localId: 'LOC001' };
  const hall2 = { _id: makeId(2), name: 'SAN JOSE', localId: 'LOC002' };
  const hall3a = { _id: makeId(3), name: 'LOCAL COMUNAL', localId: 'LOC003' };
  const hall3b = { _id: makeId(4), name: 'LOCAL COMUNAL', localId: 'LOC004' };

  describe('single name match', () => {
    it('returns an updateOne op setting communityHallId and communityHallLocalId', () => {
      const orphan = { _id: makeId(10), communityHallName: 'VIRGEN DE PALLAGUA' };
      const { ops, stats } = resolveOrphans([orphan], [hall1]);

      expect(ops).toHaveLength(1);
      expect(ops[0]).toEqual({
        updateOne: {
          filter: { _id: orphan._id },
          update: {
            $set: {
              communityHallId: hall1._id,
              communityHallLocalId: hall1.localId,
            },
          },
        },
      });
      expect(stats.scanned).toBe(1);
      expect(stats.updated).toBe(1);
      expect(stats.unmatched).toBe(0);
      expect(stats.ambiguous).toBe(0);
    });
  });

  describe('name not in halls', () => {
    it('counts as unmatched, no op emitted, name recorded with count', () => {
      const orphan1 = { _id: makeId(10), communityHallName: 'NONEXISTENT HALL' };
      const orphan2 = { _id: makeId(11), communityHallName: 'NONEXISTENT HALL' };
      const { ops, stats, unmatchedNames } = resolveOrphans([orphan1, orphan2], [hall1]);

      expect(ops).toHaveLength(0);
      expect(stats.scanned).toBe(2);
      expect(stats.updated).toBe(0);
      expect(stats.unmatched).toBe(2);
      expect(unmatchedNames).toEqual([{ name: 'NONEXISTENT HALL', count: 2 }]);
    });
  });

  describe('ambiguous name (maps to >1 hall)', () => {
    it('counts as ambiguous, no op emitted, name recorded with hall count', () => {
      const orphan = { _id: makeId(10), communityHallName: 'LOCAL COMUNAL' };
      const { ops, stats, ambiguousNames } = resolveOrphans([orphan], [hall3a, hall3b]);

      expect(ops).toHaveLength(0);
      expect(stats.scanned).toBe(1);
      expect(stats.updated).toBe(0);
      expect(stats.ambiguous).toBe(1);
      expect(ambiguousNames).toEqual([{ name: 'LOCAL COMUNAL', hallCount: 2, orphanCount: 1 }]);
    });

    it('counts multiple orphans with the same ambiguous name', () => {
      const orphan1 = { _id: makeId(10), communityHallName: 'LOCAL COMUNAL' };
      const orphan2 = { _id: makeId(11), communityHallName: 'LOCAL COMUNAL' };
      const { stats, ambiguousNames } = resolveOrphans([orphan1, orphan2], [hall3a, hall3b]);

      expect(stats.ambiguous).toBe(2);
      expect(ambiguousNames[0].orphanCount).toBe(2);
    });
  });

  describe('orphan with empty or null name', () => {
    it('excludes orphan with null communityHallName', () => {
      const orphan = { _id: makeId(10), communityHallName: null as any };
      const { ops, stats } = resolveOrphans([orphan], [hall1]);

      expect(ops).toHaveLength(0);
      expect(stats.scanned).toBe(0);
      expect(stats.unmatched).toBe(0);
    });

    it('excludes orphan with empty string communityHallName', () => {
      const orphan = { _id: makeId(10), communityHallName: '' };
      const { ops, stats } = resolveOrphans([orphan], [hall1]);

      expect(ops).toHaveLength(0);
      expect(stats.scanned).toBe(0);
    });
  });

  describe('mixed scenario', () => {
    it('handles all cases in a single run', () => {
      const orphans = [
        { _id: makeId(1), communityHallName: 'VIRGEN DE PALLAGUA' }, // match
        { _id: makeId(2), communityHallName: 'SAN JOSE' },            // match
        { _id: makeId(3), communityHallName: 'UNKNOWN HALL' },        // unmatched
        { _id: makeId(4), communityHallName: 'LOCAL COMUNAL' },       // ambiguous
        { _id: makeId(5), communityHallName: null as any },            // excluded
      ];
      const halls = [hall1, hall2, hall3a, hall3b];

      const { ops, stats, unmatchedNames, ambiguousNames } = resolveOrphans(orphans, halls);

      expect(stats.scanned).toBe(4); // null excluded
      expect(stats.updated).toBe(2);
      expect(stats.unmatched).toBe(1);
      expect(stats.ambiguous).toBe(1);
      expect(ops).toHaveLength(2);
      expect(unmatchedNames).toEqual([{ name: 'UNKNOWN HALL', count: 1 }]);
      expect(ambiguousNames).toHaveLength(1);
      expect(ambiguousNames[0].name).toBe('LOCAL COMUNAL');
    });
  });
});
