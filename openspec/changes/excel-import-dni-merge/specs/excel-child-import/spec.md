# Excel Child Import Specification

## Purpose

Defines the Excel import flow as the merge entry point. Each row is matched by normalized DNI against the unified `children` collection: if found, Excel-only fields are updated with non-destructive date merge and committee-change detection; if not found, a new record is inserted.

## Requirements

### Requirement: DNI Normalization Before Match

The system MUST normalize every Excel row's `documentNumber` to `/^\d{8}$/` (strip whitespace, pad to 8 digits if shorter with leading zeros) before attempting a match against the unified collection.

#### Scenario: DNI with leading spaces

- GIVEN an Excel row with `documentNumber: "  12345678"`
- WHEN normalized
- THEN the match key SHALL be `"12345678"`

#### Scenario: DNI with fewer than 8 digits padded

- GIVEN an Excel row with `documentNumber: "1234567"` (7 digits)
- WHEN normalized
- THEN the match key SHALL be `"01234567"` (zero-padded to 8)

#### Scenario: Invalid DNI rejected

- GIVEN an Excel row with `documentNumber: "ABC12345"` or empty
- WHEN normalization runs
- THEN the row MUST be flagged as invalid and excluded from import
- AND the import report SHALL include the row number and reason

### Requirement: Insert When DNI Not Found

The system MUST insert a new record into the unified `children` collection when no existing record matches the normalized DNI.

#### Scenario: New child inserted

- GIVEN no existing record with `documentNumber: "11222333"`
- WHEN an Excel row with that DNI is processed
- THEN a new record SHALL be created with all Excel fields (`fullName`, `gender`, `childCode`, `managementCommitteCode`, `managementCommitteName`, `communityHallId`, `communityHallName`, `birthday`, `admissionDate`)
- AND `birthdayImported` and `admissionDateImported` SHALL be null

### Requirement: Update Excel-Only Fields on Match

When an existing record is matched by DNI, the system MUST update only Excel-originated fields (`gender`, `childCode`, `managementCommitteName`, `managementCommitteCode`, `communityHallName`, `fullName` from Excel). Form-originated fields (`firstName`, `lastName`, form `birthday`, form `admissionDate`) MUST NOT be overwritten.

#### Scenario: Matched record updates Excel fields

- GIVEN an existing record with `documentNumber: "11222333"` and `gender: null`
- WHEN an Excel row with that DNI provides `gender: "F"`
- THEN `gender` SHALL be updated to `"F"`
- AND `firstName`, `lastName`, and form-originated dates SHALL remain unchanged

### Requirement: Non-Destructive Date Merge

When an Excel row matches an existing record by DNI and the Excel `birthday` or `admissionDate` differs from the stored authoritative value, the system MUST store the Excel value in `birthdayImported` or `admissionDateImported` respectively. The original form values MUST remain untouched.

#### Scenario: Excel birthday differs from form

- GIVEN an existing record with `birthday: 2020-01-15` (form-originated) and `birthdayImported: null`
- WHEN an Excel row provides `birthday: 2020-01-20`
- THEN `birthday` SHALL remain `2020-01-15`
- AND `birthdayImported` SHALL be set to `2020-01-20`

#### Scenario: Excel admission date matches form

- GIVEN an existing record with `admissionDate: 2023-03-01`
- WHEN an Excel row provides the same `admissionDate: 2023-03-01`
- THEN `admissionDateImported` SHALL remain null (no divergence)

#### Scenario: Re-import overwrites previous imported dates

- GIVEN `birthdayImported: 2020-01-20` from a prior import
- WHEN a new Excel row provides `birthday: 2020-02-01`
- THEN `birthdayImported` SHALL be updated to `2020-02-01`

### Requirement: Committee Change Detection and History Snapshot

The system MUST detect committee changes by comparing the Excel row's `managementCommitteCode` against the stored child's resolved committee (via `communityHallId` -> `community_halls.committeeRef` -> `committees.committeeId`). When they differ, the system MUST first snapshot the existing record into `children_history`, then update the active record with the new committee.

#### Scenario: Committee unchanged

- GIVEN an existing child whose resolved committee is `"CG001"`
- WHEN an Excel row provides `managementCommitteCode: "CG001"`
- THEN no history snapshot SHALL be created
- AND the active record SHALL be updated normally

#### Scenario: Committee changed — snapshot then update

- GIVEN an existing child whose resolved committee is `"CG001"`
- WHEN an Excel row provides `managementCommitteCode: "CG002"`
- THEN the system MUST snapshot the current active record (with `"CG001"`) into `children_history`
- AND then update the active record's committee-related fields to `"CG002"`

#### Scenario: Excel committee code does not resolve to known committee

- GIVEN an Excel row with `managementCommitteCode: "UNKNOWN"` and a valid DNI
- WHEN no committee exists with `committeeId: "UNKNOWN"`
- THEN the child record SHALL still be inserted/updated (tolerant — committee fields stored as raw strings)
- AND an `import_error_logs` entry MUST be created with `errorCode: "UNRESOLVED_COMMITTEE_CODE"`
- AND the import report SHALL include the row number and unresolved code

#### Scenario: Community hall localId not found — tolerant with logging

- GIVEN an Excel row with `communityHallId: "LOC999"` and a valid DNI
- WHEN no `community_halls` record exists with `localId: "LOC999"`
- THEN the child record SHALL still be inserted/updated with the raw string `communityHallId: "LOC999"`
- AND committee-change detection SHALL be skipped (cannot resolve prior committee)
- AND an `import_error_logs` entry MUST be created with `errorCode: "UNKNOWN_COMMUNITY_HALL"`
- AND a second `import_error_logs` entry MUST be created with `errorCode: "COMMITTEE_DETECTION_SKIPPED"`

#### Scenario: Unknown hall does not block import row

- GIVEN a batch of 5 rows where row 3 has `communityHallId: "LOC999"` (unresolved)
- WHEN the import runs
- THEN rows 1, 2, 4, 5 SHALL be processed normally
- AND row 3 SHALL be saved with raw `communityHallId` and produce 2 log entries
- AND the import report SHALL flag row 3 as saved-with-warnings (not excluded)

### Requirement: Concurrent Import Safety

The system MUST handle concurrent imports on the same DNI atomically. The upsert operation MUST use MongoDB's atomic guarantees to prevent duplicate inserts or lost updates.

#### Scenario: Two concurrent imports on same DNI

- GIVEN no existing record with `documentNumber: "55666777"`
- WHEN two concurrent import requests process the same DNI simultaneously
- THEN exactly one record SHALL exist after both complete
- AND no duplicate key error SHALL be surfaced to the caller

### Requirement: Import Audit Trail

The system MUST record audit events for each row processed, distinguishing inserts, updates, and
skipped rows (with reason). Rows saved with unresolved references MUST appear in the audit as
`child.save-with-warnings` and MUST also produce `import_error_logs` entries (see
`openspec/specs/import-error-log/spec.md`).

#### Scenario: Successful import audit

- GIVEN an import of 10 rows (7 matched, 2 new, 1 invalid DNI)
- WHEN the import completes
- THEN audit events SHALL record 7 `child.update`, 2 `child.create`, and 1 `child.skip` with source `excel-import`

#### Scenario: Rows with warnings counted separately from skipped rows

- GIVEN an import where 1 row has an unresolved `communityHallId` and 1 row has an invalid DNI
- WHEN the import completes
- THEN the audit SHALL record 1 `child.save-with-warnings` (row saved, logs created) and 1 `child.skip` (row excluded)
- AND the `import_error_logs` collection SHALL contain entries only for the saved-with-warnings row
