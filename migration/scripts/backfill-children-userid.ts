/**
 * Migration: Backfill missing userId on children
 *
 * The unified-children merge (backfill-unified-children.ts) used replaceOne and
 * did not carry over `userId`, leaving every merged child without an owner.
 * `GET /children/by-user` filters by userId, so those children became invisible
 * to their owner.
 *
 * There is a single user who registered all the children, so this script assigns
 * that user's ObjectId to every child in `children` that currently has no userId.
 *
 * IDEMPOTENT: only touches children with a missing/null userId. Re-running after
 * a full pass matches nothing. Safe to run multiple times.
 *
 * STANDALONE: zero production src/ dependencies; uses the MongoDB driver via
 * mongoose.createConnection().
 *
 * Usage:
 *   NODE_ENV=development npx ts-node migration/scripts/backfill-children-userid.ts
 *   NODE_ENV=production  npx ts-node migration/scripts/backfill-children-userid.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// The single user that owns every registered child.
const TARGET_USER_ID = '68aa22e96a69ce6891d04b87';

interface MigrationStats {
  matched: number;
  updated: number;
}

async function run(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI ?? process.env.DATABASE_URI;
  if (!mongoUri) {
    console.error(
      'ERROR: MONGODB_URI or DATABASE_URI environment variable is required.',
    );
    process.exit(1);
  }

  const userObjectId = new mongoose.Types.ObjectId(TARGET_USER_ID);

  console.log('Connecting to MongoDB...');
  const conn = await mongoose.createConnection(mongoUri).asPromise();

  try {
    const childrenCol = conn.collection('children');

    // Children with no owner: field absent or explicitly null.
    const filter = {
      $or: [{ userId: { $exists: false } }, { userId: null }],
    };

    const matched = await childrenCol.countDocuments(filter);
    console.log(`Children missing userId: ${matched}`);

    const result = await childrenCol.updateMany(filter, {
      $set: { userId: userObjectId },
    });

    const stats: MigrationStats = {
      matched,
      updated: result.modifiedCount ?? 0,
    };

    console.log('\n=== Backfill complete ===');
    console.log(JSON.stringify(stats, null, 2));
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
