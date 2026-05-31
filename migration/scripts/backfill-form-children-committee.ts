/**
 * Migration: Backfill denormalized committee fields on form children
 *
 * Form-registered children created before the denormalization change have a
 * `communityHallId` but no `communityHallName` / `managementCommitteCode` /
 * `managementCommitteName`. The alert-signals endpoint now filters by
 * `managementCommitteCode`, so those children would be invisible per committee.
 *
 * This script walks `children` that have a communityHallId but a missing
 * managementCommitteCode, resolves communityHallId -> hall -> committee, and
 * writes the three denormalized descriptors.
 *
 * IDEMPOTENT: re-running only touches children still missing the code; once
 * filled, they no longer match the query. Safe to run multiple times.
 *
 * STANDALONE: zero production src/ dependencies; uses the MongoDB driver via
 * mongoose.createConnection().
 *
 * Usage:
 *   NODE_ENV=development npx ts-node migration/scripts/backfill-form-children-committee.ts
 *   NODE_ENV=production  npx ts-node migration/scripts/backfill-form-children-committee.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

interface MigrationStats {
  scanned: number;
  updated: number;
  skippedNoHall: number;
  skippedNoCommittee: number;
}

async function run(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI ?? process.env.DATABASE_URI;
  if (!mongoUri) {
    console.error(
      'ERROR: MONGODB_URI or DATABASE_URI environment variable is required.',
    );
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  const conn = await mongoose.createConnection(mongoUri).asPromise();

  try {
    const childrenCol = conn.collection('children');
    const hallsCol = conn.collection('community_halls');
    const committeesCol = conn.collection('committees');

    // Children with a hall ref but no denormalized committee code yet.
    const candidates = await childrenCol
      .find({
        communityHallId: { $ne: null },
        $or: [
          { managementCommitteCode: { $exists: false } },
          { managementCommitteCode: null },
          { managementCommitteCode: '' },
        ],
      })
      .toArray();

    console.log(`Candidates to backfill: ${candidates.length}`);

    const stats: MigrationStats = {
      scanned: candidates.length,
      updated: 0,
      skippedNoHall: 0,
      skippedNoCommittee: 0,
    };

    // Cache hall + committee lookups to avoid repeat queries.
    const hallCache = new Map<string, any>();
    const committeeCache = new Map<string, any>();

    for (const child of candidates) {
      const hallId = child.communityHallId;
      const hallKey = String(hallId);

      let hall = hallCache.get(hallKey);
      if (hall === undefined) {
        hall = await hallsCol.findOne({ _id: hallId });
        hallCache.set(hallKey, hall ?? null);
      }
      if (!hall) {
        stats.skippedNoHall += 1;
        continue;
      }

      const committeeRefKey = String(hall.committeeRef);
      let committee = committeeCache.get(committeeRefKey);
      if (committee === undefined) {
        committee = await committeesCol.findOne({ _id: hall.committeeRef });
        committeeCache.set(committeeRefKey, committee ?? null);
      }
      if (!committee) {
        stats.skippedNoCommittee += 1;
        continue;
      }

      await childrenCol.updateOne(
        { _id: child._id },
        {
          $set: {
            communityHallName: hall.name,
            managementCommitteCode: committee.committeeId,
            managementCommitteName: committee.name,
          },
        },
      );
      stats.updated += 1;
    }

    console.log('\n=== Backfill complete ===');
    console.log(JSON.stringify(stats, null, 2));
    if (stats.skippedNoHall > 0 || stats.skippedNoCommittee > 0) {
      console.warn(
        'WARNING: some children were skipped due to unresolved hall/committee refs.',
      );
    }
  } finally {
    await conn.close();
    console.log('Connection closed.');
  }
}

if (require.main === module) {
  // Load the same env file the app uses (.env.<NODE_ENV>), falling back to .env
  dotenv.config({
    path: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
  });
  run().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
