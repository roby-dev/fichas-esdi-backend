# Child History Specification

## Purpose

Defines the `children_history` collection — an append-only archive that captures a snapshot of a child's active record immediately before a committee change. Each snapshot preserves the previous Comité assignment for audit and traceability.

## Requirements

### Requirement: Snapshot on Committee Change

The system MUST create a snapshot in `children_history` before updating the active `children` record when a committee change is detected during Excel import. The snapshot MUST contain all fields of the active record at the time of archival, plus metadata about the change.

#### Scenario: Snapshot created before committee update

- GIVEN an active child record with `documentNumber: "12345678"`, resolved committee `"CG001"`, and `communityHallId` pointing to hall A
- WHEN an Excel import detects committee change to `"CG002"`
- THEN a `children_history` document SHALL be inserted containing the full active record state (all fields including `"CG001"` committee)
- AND the snapshot SHALL include `snapshotDate` (timestamp of archival) and `reason: "committee_change"`
- AND the active record SHALL then be updated to `"CG002"`

#### Scenario: Snapshot preserves original identifiers

- GIVEN an active record with `_id: ObjectId("abc123")` and `documentNumber: "12345678"`
- WHEN a snapshot is created
- THEN the snapshot SHALL store `originalId: ObjectId("abc123")` and `documentNumber: "12345678"`
- AND the snapshot SHALL have its own unique `_id`

### Requirement: Append-Only Archive

The `children_history` collection MUST be append-only. No update or delete operations SHALL be performed on historical records.

#### Scenario: Multiple committee changes produce multiple snapshots

- GIVEN a child with `documentNumber: "12345678"` that has changed committees twice
- WHEN querying `children_history` for that DNI
- THEN exactly 2 snapshot documents SHALL exist
- AND each SHALL have a distinct `snapshotDate`

### Requirement: Snapshot Contains Full Record State

Each snapshot MUST capture the complete field set of the active record at the moment of archival, including form-originated fields, Excel-imported fields, and date fields.

#### Scenario: Snapshot includes both form and imported dates

- GIVEN an active record with `birthday: 2020-01-15` and `birthdayImported: 2020-01-20`
- WHEN a snapshot is created
- THEN the snapshot SHALL contain both `birthday: 2020-01-15` and `birthdayImported: 2020-01-20`

### Requirement: Atomic Snapshot-Then-Update

The snapshot insertion and active record update MUST be executed atomically. If the snapshot fails, the active record MUST NOT be updated. If the update fails, the snapshot SHALL remain (acceptable — it represents a valid historical state).

#### Scenario: Snapshot succeeds but update fails

- GIVEN a committee change is detected
- WHEN the snapshot is inserted successfully but the active record update fails
- THEN the snapshot SHALL remain in `children_history`
- AND the active record SHALL retain its previous committee
- AND the import report SHALL flag the failure for retry
