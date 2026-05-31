# Community Hall Backfill Specification

## Purpose

Defines a one-shot, idempotent migration that restores `communityHallId` on orphaned migrated children — records carried over from the legacy `alert_children` collection with `communityHallId: null` and only a `communityHallName`. Resolution is keyed on `communityHallName -> community_halls.name` (the orphans have no `communityHallLocalId`). When a name resolves to a single hall, both `communityHallId` and `communityHallLocalId` are written.

## Requirements

### Requirement: Target Only Unresolved Named Orphans

The script MUST scan only children matching `{ communityHallId: null, communityHallName: { $nin: [null, ""] } }`. Rows that already have a `communityHallId`, or that have no usable `communityHallName`, MUST NOT be touched.

#### Scenario: Already-resolved child is skipped

- GIVEN a child with `communityHallId` set to a valid ObjectId
- WHEN the backfill runs
- THEN that child SHALL NOT be queried, modified, or counted as scanned

#### Scenario: Orphan without a name is skipped

- GIVEN a child with `communityHallId: null` and `communityHallName: null`
- WHEN the backfill runs
- THEN that child SHALL NOT be modified
- AND it SHALL NOT be reported as unmatched (it is outside the target set)

### Requirement: Resolve by Community Hall Name

The script MUST build a `name -> { _id, localId }` map from `community_halls` once per run, then resolve each orphan by exact `communityHallName -> community_halls.name`. On a single match it MUST set `communityHallId = hall._id`.

#### Scenario: Orphan name matches exactly one hall

- GIVEN an orphan with `communityHallName: "VIRGEN DE PALLAGUA"`
- AND exactly one `community_halls` record has `name: "VIRGEN DE PALLAGUA"`
- WHEN the backfill runs
- THEN that orphan's `communityHallId` SHALL be set to the matching hall's `_id`

#### Scenario: Orphan name not present in community_halls

- GIVEN an orphan with `communityHallName: "NONEXISTENT HALL"`
- AND no `community_halls` record has that name
- WHEN the backfill runs
- THEN that orphan SHALL NOT be modified
- AND it SHALL be counted as unmatched
- AND the summary SHALL list the name with its orphan count

### Requirement: Backfill Community Hall LocalId

When an orphan resolves to a single hall, the script MUST also set `communityHallLocalId = hall.localId` (alongside `communityHallId`), future-proofing the record for resolution paths that prefer `localId`.

#### Scenario: Resolved orphan receives localId

- GIVEN an orphan that resolves to a hall with `localId: "LOC042"`
- WHEN the backfill updates the orphan
- THEN both `communityHallId` (the hall `_id`) AND `communityHallLocalId: "LOC042"` SHALL be set in the same update

### Requirement: Skip and Log Ambiguous Names

If a `communityHallName` maps to more than one `community_halls` record, the script MUST treat that name as ambiguous: it MUST NOT update any orphan with that name, and it MUST log the name and the number of colliding halls.

#### Scenario: Name maps to multiple halls

- GIVEN two `community_halls` records both named `"LOCAL COMUNAL"`
- AND orphans with `communityHallName: "LOCAL COMUNAL"`
- WHEN the backfill runs
- THEN those orphans SHALL NOT be modified
- AND the name SHALL be counted as ambiguous
- AND the summary SHALL list the name, the orphan count, and the number of matching halls

### Requirement: Summary Report

After processing, the script MUST print a summary containing: total scanned, updated, unmatched, and ambiguous counts. Unmatched and ambiguous names MUST be listed with their orphan counts.

#### Scenario: Mixed-outcome run report

- GIVEN 140 orphans where 136 resolve to a single hall, 3 have an unknown name, and 1 has an ambiguous name
- WHEN the backfill completes
- THEN the summary SHALL report `scanned: 140`, `updated: 136`, `unmatched: 3`, `ambiguous: 1`
- AND it SHALL list the unmatched name(s) and the ambiguous name with its count

### Requirement: Idempotent Re-Run

Re-running the script after a successful run MUST update 0 rows, because resolved orphans no longer satisfy the `communityHallId: null` target query.

#### Scenario: Second run is a no-op

- GIVEN a prior successful run that resolved all matchable orphans
- WHEN the backfill is run again
- THEN it SHALL report `updated: 0`
- AND no `community_halls` or `children` data SHALL change

### Requirement: Dry-Run Mode

When the `DRY_RUN` environment flag is set (e.g. `DRY_RUN=1`), the script MUST compute and log the full plan (which orphans would be updated, plus unmatched and ambiguous breakdowns) WITHOUT writing any change to the database.

#### Scenario: Dry run writes nothing

- GIVEN orphans that would resolve to halls
- WHEN the script is run with `DRY_RUN=1`
- THEN the summary SHALL show the would-be `updated` count
- AND no `children` document SHALL be modified
- AND a subsequent real run (without `DRY_RUN`) SHALL still find those orphans unresolved and update them
