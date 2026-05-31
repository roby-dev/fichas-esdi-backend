/**
 * Migration: Backfill Unified Children Collection
 *
 * Reads `children` (form-registered) and `alert_children` (Excel-imported),
 * normalizes DNIs, merges by DNI (form fields authoritative, alert_children
 * supplies Excel-only fields), bulk-upserts into the unified `children`
 * collection, and ensures a UNIQUE index on `documentNumber`.
 *
 * IDEMPOTENT: Running this script multiple times produces the same result.
 * Duplicates within a source are deduplicated (first-seen wins). The upsert
 * strategy (replaceOne with upsert:true) means re-running is safe.
 *
 * STANDALONE: Zero production src/ dependencies. Uses the MongoDB driver
 * directly via mongoose.createConnection() to write plain document objects.
 *
 * Usage:
 *   ts-node migration/scripts/backfill-unified-children.ts
 *   NODE_ENV=production ts-node migration/scripts/backfill-unified-children.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A record from the original `children` collection (web-form origin). */
export interface FormChild {
  _id: string | object;
  firstName?: string | null;
  lastName?: string | null;
  documentNumber?: string | null;
  birthday?: Date | null;
  admissionDate?: Date | null;
  communityHallId?: string | object | null;
  userId?: string | object | null;
  [key: string]: unknown;
}

/** A record from the original `alert_children` collection (Excel-import origin). */
export interface AlertChild {
  _id: string | object;
  documentNumber?: string | null;
  fullName?: string | null;
  gender?: string | null;
  childCode?: string | null;
  managementCommitteCode?: string | null;
  managementCommitteName?: string | null;
  communityHallName?: string | null;
  communityHallLocalId?: string | null;
  birthday?: Date | null;
  admissionDate?: Date | null;
  userId?: string | object | null;
  [key: string]: unknown;
}

/** The unified shape written into the `children` collection. */
export interface UnifiedChild {
  documentNumber: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  birthday: Date;
  admissionDate: Date;
  birthdayImported: Date | null;
  admissionDateImported: Date | null;
  communityHallId: string | object | null;
  gender: string | null;
  childCode: string | null;
  managementCommitteCode: string | null;
  managementCommitteName: string | null;
  communityHallName: string | null;
  communityHallLocalId: string | null;
  userId: string | object | null;
  _migratedAt: Date;
}

// ─── Pure utilities ───────────────────────────────────────────────────────────

/**
 * Normalize a raw DNI value to exactly 8 digits, zero-padded.
 * Returns null for invalid/empty/excess-digit inputs.
 * This is a local copy — the migration must NOT import from src/.
 */
export function normalizeDniMigration(
  raw: string | null | undefined,
): string | null {
  if (raw == null || raw === '') return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 0 || digits.length > 8) return null;
  return digits.padStart(8, '0');
}

/**
 * Pure merge function: takes two source arrays and returns the unified output.
 *
 * Rules:
 * 1. Normalize every documentNumber; skip records with invalid DNIs.
 * 2. Deduplicate within each source (first-seen per DNI wins).
 * 3. For a DNI present in BOTH sources:
 *    - Form fields are authoritative: firstName, lastName, birthday, admissionDate, communityHallId
 *    - Alert fields supply Excel-only: gender, childCode, managementCommitteCode/Name,
 *      communityHallName, communityHallLocalId, fullName
 *    - Date divergence: if Excel birthday ≠ form birthday → birthdayImported = Excel birthday
 *    - Same logic for admissionDate → admissionDateImported
 * 4. DNI present only in form → include with null Excel-only fields
 * 5. DNI present only in alert_children → include with null firstName/lastName
 */
export function mergeChildrenSources(
  formChildren: FormChild[],
  alertChildren: AlertChild[],
): UnifiedChild[] {
  const now = new Date();

  // Build DNI-indexed maps (first-seen wins for dedup within source)
  const formMap = new Map<string, FormChild>();
  for (const child of formChildren) {
    const dni = normalizeDniMigration(child.documentNumber as string | null | undefined);
    if (!dni) continue;
    if (!formMap.has(dni)) {
      formMap.set(dni, child);
    }
  }

  const alertMap = new Map<string, AlertChild>();
  for (const child of alertChildren) {
    const dni = normalizeDniMigration(child.documentNumber as string | null | undefined);
    if (!dni) continue;
    if (!alertMap.has(dni)) {
      alertMap.set(dni, child);
    }
  }

  const unified: UnifiedChild[] = [];
  const processed = new Set<string>();

  // Process all form records
  for (const [dni, form] of formMap) {
    const alert = alertMap.get(dni);
    const birthday = form.birthday ?? new Date(0);
    const admissionDate = form.admissionDate ?? new Date(0);

    let birthdayImported: Date | null = null;
    let admissionDateImported: Date | null = null;

    if (alert) {
      // Date divergence check
      if (
        alert.birthday &&
        alert.birthday.getTime() !== birthday.getTime()
      ) {
        birthdayImported = alert.birthday;
      }
      if (
        alert.admissionDate &&
        alert.admissionDate.getTime() !== admissionDate.getTime()
      ) {
        admissionDateImported = alert.admissionDate;
      }
    }

    unified.push({
      documentNumber: dni,
      firstName: (form.firstName as string | null) ?? null,
      lastName: (form.lastName as string | null) ?? null,
      fullName: alert?.fullName ?? null,
      birthday,
      admissionDate,
      birthdayImported,
      admissionDateImported,
      communityHallId: (form.communityHallId as string | object | null) ?? null,
      gender: alert?.gender ?? null,
      childCode: alert?.childCode ?? null,
      managementCommitteCode: alert?.managementCommitteCode ?? null,
      managementCommitteName: alert?.managementCommitteName ?? null,
      communityHallName: alert?.communityHallName ?? null,
      communityHallLocalId: alert?.communityHallLocalId ?? null,
      // Preserve ownership: form children carry userId; fall back to the Excel
      // record's userId when the form record has none.
      userId: form.userId ?? alert?.userId ?? null,
      _migratedAt: now,
    });

    processed.add(dni);
  }

  // Process alert_children with no matching form record
  for (const [dni, alert] of alertMap) {
    if (processed.has(dni)) continue;

    const birthday = alert.birthday ?? new Date(0);
    const admissionDate = alert.admissionDate ?? new Date(0);

    unified.push({
      documentNumber: dni,
      firstName: null,
      lastName: null,
      fullName: alert.fullName ?? null,
      birthday,
      admissionDate,
      birthdayImported: null,
      admissionDateImported: null,
      communityHallId: null,
      gender: alert.gender ?? null,
      childCode: alert.childCode ?? null,
      managementCommitteCode: alert.managementCommitteCode ?? null,
      managementCommitteName: alert.managementCommitteName ?? null,
      communityHallName: alert.communityHallName ?? null,
      communityHallLocalId: alert.communityHallLocalId ?? null,
      userId: alert.userId ?? null,
      _migratedAt: now,
    });
  }

  return unified;
}

// ─── I/O wrapper (thin shell around the pure function) ────────────────────────

interface MigrationStats {
  formCount: number;
  alertCount: number;
  invalidDniSkipped: number;
  merged: number;
  upserted: number;
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
    const alertChildrenCol = conn.collection('alert_children');

    console.log('Reading source collections...');
    const formDocs = (await childrenCol.find({}).toArray()) as unknown as FormChild[];
    const alertDocs =
      (await alertChildrenCol.find({}).toArray()) as unknown as AlertChild[];

    console.log(`  children:      ${formDocs.length} records`);
    console.log(`  alert_children: ${alertDocs.length} records`);

    // Count invalid DNIs before merging (for stats)
    const validForm = formDocs.filter(
      (d) => normalizeDniMigration(d.documentNumber as string | null | undefined) !== null,
    );
    const validAlert = alertDocs.filter(
      (d) => normalizeDniMigration(d.documentNumber as string | null | undefined) !== null,
    );
    const invalidSkipped =
      formDocs.length - validForm.length + (alertDocs.length - validAlert.length);

    if (invalidSkipped > 0) {
      console.warn(`  WARNING: ${invalidSkipped} records skipped due to invalid DNI.`);
    }

    const unified = mergeChildrenSources(formDocs, alertDocs);
    console.log(`  Merged output: ${unified.length} unique DNI records`);

    if (unified.length === 0) {
      console.log('Nothing to migrate. Exiting.');
      return;
    }

    // Bulk upsert: replaceOne with upsert=true makes it idempotent.
    // A re-run will update _migratedAt but leave all domain fields identical
    // (same inputs → same merge output → same document values).
    console.log('Bulk upserting into children collection...');
    const bulkOps = unified.map((doc) => ({
      replaceOne: {
        filter: { documentNumber: doc.documentNumber },
        replacement: doc,
        upsert: true,
      },
    }));

    const bulkResult = await childrenCol.bulkWrite(bulkOps, { ordered: false });
    const upserted =
      (bulkResult.upsertedCount ?? 0) + (bulkResult.modifiedCount ?? 0);

    console.log(
      `  Upserted: ${bulkResult.upsertedCount ?? 0} new, ` +
        `${bulkResult.modifiedCount ?? 0} updated`,
    );

    // Ensure unique index on documentNumber (idempotent — createIndex is a no-op if already exists)
    console.log('Ensuring UNIQUE index on documentNumber...');
    await childrenCol.createIndex({ documentNumber: 1 }, { unique: true });
    console.log('  Index ensured.');

    const stats: MigrationStats = {
      formCount: formDocs.length,
      alertCount: alertDocs.length,
      invalidDniSkipped: invalidSkipped,
      merged: unified.length,
      upserted,
    };

    console.log('\n=== Migration complete ===');
    console.log(JSON.stringify(stats, null, 2));
  } finally {
    await conn.close();
    console.log('Connection closed.');
  }
}

// Only run when executed directly (not when imported by tests)
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
