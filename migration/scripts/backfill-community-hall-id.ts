/**
 * Migration: Backfill communityHallId on orphaned migrated children
 *
 * Children migrated from the legacy alert_children collection have
 * communityHallId: null and only a communityHallName. This script resolves
 * each name against community_halls.name and writes both communityHallId and
 * communityHallLocalId when a single unambiguous match is found.
 *
 * IDEMPOTENT: query excludes children that already have communityHallId set.
 * STANDALONE: zero imports from src/.
 *
 * Usage:
 *   NODE_ENV=production npx ts-node migration/scripts/backfill-community-hall-id.ts
 *   DRY_RUN=1 NODE_ENV=production npx ts-node migration/scripts/backfill-community-hall-id.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Orphan {
  _id: any;
  communityHallName: string | null | undefined;
}

export interface Hall {
  _id: any;
  name: string;
  localId: string;
}

export interface ResolveStats {
  scanned: number;
  updated: number;
  unmatched: number;
  ambiguous: number;
}

export interface UnmatchedEntry {
  name: string;
  count: number;
}

export interface AmbiguousEntry {
  name: string;
  hallCount: number;
  orphanCount: number;
}

export interface ResolveResult {
  ops: any[];
  stats: ResolveStats;
  unmatchedNames: UnmatchedEntry[];
  ambiguousNames: AmbiguousEntry[];
}

// ---------------------------------------------------------------------------
// Pure resolver — no DB, no mongoose dependency
// ---------------------------------------------------------------------------

export function resolveOrphans(orphans: Orphan[], halls: Hall[]): ResolveResult {
  // Build name -> hall[] map to detect ambiguity
  const hallsByName = new Map<string, Hall[]>();
  for (const hall of halls) {
    const existing = hallsByName.get(hall.name) ?? [];
    existing.push(hall);
    hallsByName.set(hall.name, existing);
  }

  const ops: any[] = [];
  const stats: ResolveStats = { scanned: 0, updated: 0, unmatched: 0, ambiguous: 0 };
  const unmatchedCounts = new Map<string, number>();
  const ambiguousCounts = new Map<string, { hallCount: number; orphanCount: number }>();

  for (const orphan of orphans) {
    // Exclude orphans with empty or null name
    if (!orphan.communityHallName) {
      continue;
    }

    stats.scanned += 1;
    const name = orphan.communityHallName;
    const matches = hallsByName.get(name);

    if (!matches || matches.length === 0) {
      // Unmatched
      stats.unmatched += 1;
      unmatchedCounts.set(name, (unmatchedCounts.get(name) ?? 0) + 1);
      continue;
    }

    if (matches.length > 1) {
      // Ambiguous — do not guess
      stats.ambiguous += 1;
      const prev = ambiguousCounts.get(name);
      ambiguousCounts.set(name, {
        hallCount: matches.length,
        orphanCount: (prev?.orphanCount ?? 0) + 1,
      });
      continue;
    }

    // Single unambiguous match
    const hall = matches[0];
    ops.push({
      updateOne: {
        filter: { _id: orphan._id },
        update: {
          $set: {
            communityHallId: hall._id,
            communityHallLocalId: hall.localId,
          },
        },
      },
    });
    stats.updated += 1;
  }

  const unmatchedNames: UnmatchedEntry[] = Array.from(unmatchedCounts.entries()).map(
    ([name, count]) => ({ name, count }),
  );

  const ambiguousNames: AmbiguousEntry[] = Array.from(ambiguousCounts.entries()).map(
    ([name, { hallCount, orphanCount }]) => ({ name, hallCount, orphanCount }),
  );

  return { ops, stats, unmatchedNames, ambiguousNames };
}

// ---------------------------------------------------------------------------
// I/O wrapper
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI ?? process.env.DATABASE_URI;
  if (!mongoUri) {
    console.error('ERROR: MONGODB_URI or DATABASE_URI environment variable is required.');
    process.exit(1);
  }

  const dryRun = Boolean(process.env.DRY_RUN);
  if (dryRun) {
    console.log('[DRY RUN] No changes will be written to the database.');
  }

  console.log('Connecting to MongoDB...');
  const conn = await mongoose.createConnection(mongoUri).asPromise();

  try {
    const childrenCol = conn.collection('children');
    const hallsCol = conn.collection('community_halls');

    // Load all halls once
    const halls: Hall[] = (await hallsCol.find({}).toArray()).map((doc) => ({
      _id: doc._id,
      name: doc.name as string,
      localId: doc.localId as string,
    }));
    console.log(`Loaded ${halls.length} community halls.`);

    // Query only unresolved named orphans
    const orphanDocs = await childrenCol
      .find({ communityHallId: null, communityHallName: { $nin: [null, ''] } })
      .toArray();

    const orphans: Orphan[] = orphanDocs.map((doc) => ({
      _id: doc._id,
      communityHallName: doc.communityHallName as string,
    }));

    console.log(`Orphans to process: ${orphans.length}`);

    const { ops, stats, unmatchedNames, ambiguousNames } = resolveOrphans(orphans, halls);

    console.log('\n=== Backfill plan ===');
    console.log(JSON.stringify(stats, null, 2));

    if (unmatchedNames.length > 0) {
      console.warn('Unmatched names:');
      for (const { name, count } of unmatchedNames) {
        console.warn(`  "${name}" — ${count} orphan(s)`);
      }
    }

    if (ambiguousNames.length > 0) {
      console.warn('Ambiguous names (multiple halls with same name):');
      for (const { name, hallCount, orphanCount } of ambiguousNames) {
        console.warn(`  "${name}" — ${hallCount} halls, ${orphanCount} orphan(s)`);
      }
    }

    if (dryRun) {
      console.log('\n[DRY RUN] Skipping bulkWrite. Re-run without DRY_RUN to apply.');
      return;
    }

    if (ops.length === 0) {
      console.log('\nNothing to update.');
      return;
    }

    const result = await childrenCol.bulkWrite(ops);
    console.log(`\n=== Backfill complete ===`);
    console.log(`Modified: ${result.modifiedCount}`);
  } finally {
    await conn.close();
    console.log('Connection closed.');
  }
}

if (require.main === module) {
  // Load env file matching NODE_ENV, then fall back to .env
  dotenv.config({
    path: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
  });
  run().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
