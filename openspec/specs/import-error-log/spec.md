# Import Error Log Specification

## Purpose

Defines the `import_error_logs` collection — an append-only audit table that records every row
saved with an unresolved reference during an Excel import. The import is TOLERANT (the child
record is always saved), but every tolerated anomaly MUST be logged so operators can triage and
correct data after the fact.

## Placement

This spec lives in `openspec/specs/` (main specs tree) because `import_error_logs` is a new
persistent capability that survives beyond the `excel-import-dni-merge` change. Pattern matches
`child-history`: new capability → main specs tree; per-change delta specs reference it.

## Requirements

### Requirement: Log Entry on Unresolved Community Hall

When an Excel row's `communityHallId` does not match any `community_halls.localId`, the system
MUST still save the child record AND MUST create an `import_error_logs` entry with error code
`UNKNOWN_COMMUNITY_HALL`.

#### Scenario: Unknown community hall saves child and logs error

- GIVEN an Excel row with `communityHallId: "LOC999"` and valid DNI `"12345678"`
- WHEN no `community_halls` record exists with `localId: "LOC999"`
- THEN the child record SHALL be inserted/updated with the raw `communityHallId: "LOC999"`
- AND an `import_error_logs` entry SHALL be created with `errorCode: "UNKNOWN_COMMUNITY_HALL"`
- AND the entry SHALL capture `documentNumber`, `fullName`, `childCode`, `communityHallId: "LOC999"`, and `communityHallName` from the row

### Requirement: Log Entry on Unresolved Committee Code

When an Excel row's `managementCommitteCode` does not resolve to any `committees.committeeId`,
the system MUST still save the child record AND MUST create an `import_error_logs` entry with
error code `UNRESOLVED_COMMITTEE_CODE`.

#### Scenario: Unknown committee code saves child and logs error

- GIVEN an Excel row with `managementCommitteCode: "UNKNOWN"` and valid DNI `"12345678"`
- WHEN no committee exists with `committeeId: "UNKNOWN"`
- THEN the child record SHALL be inserted/updated normally (committee fields stored as raw strings)
- AND an `import_error_logs` entry SHALL be created with `errorCode: "UNRESOLVED_COMMITTEE_CODE"`
- AND the entry SHALL capture `managementCommitteCode: "UNKNOWN"` and `managementCommitteName` from the row

### Requirement: Log Entry When Committee Detection Is Skipped

When committee-change detection is skipped because the community hall could not be resolved, the
system MUST create an `import_error_logs` entry with error code `COMMITTEE_DETECTION_SKIPPED` in
addition to the `UNKNOWN_COMMUNITY_HALL` entry.

#### Scenario: Skipped detection is logged alongside unknown hall

- GIVEN an Excel row with `communityHallId: "LOC999"` that does not resolve
- WHEN the child record is saved and committee detection is skipped
- THEN two `import_error_logs` entries SHALL exist for this row: one `UNKNOWN_COMMUNITY_HALL` and one `COMMITTEE_DETECTION_SKIPPED`
- AND both entries SHALL share the same `importBatchRef` and `documentNumber`

### Requirement: Log Entry Schema

Each `import_error_logs` document MUST capture the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `errorCode` | string | MUST | Machine-readable code (`UNKNOWN_COMMUNITY_HALL`, `UNRESOLVED_COMMITTEE_CODE`, `COMMITTEE_DETECTION_SKIPPED`, `INVALID_DNI`) |
| `errorMessage` | string | MUST | Human-readable description of the anomaly |
| `documentNumber` | string | MUST | Normalized DNI of the affected child |
| `fullName` | string | SHOULD | Full name from the Excel row |
| `childCode` | string | SHOULD | Child code from the Excel row |
| `managementCommitteCode` | string | SHOULD | Raw committee code from the row |
| `managementCommitteName` | string | SHOULD | Raw committee name from the row |
| `communityHallId` | string | SHOULD | Raw community hall id from the row |
| `communityHallName` | string | SHOULD | Raw community hall name from the row |
| `importBatchRef` | string | SHOULD | File name or batch identifier of the import run |
| `loggedAt` | datetime | MUST | UTC timestamp when the log entry was created |

#### Scenario: Log entry captures all required fields

- GIVEN an import run with `importBatchRef: "padron-mayo-2026.xlsx"` that has an unknown hall
- WHEN the log entry is created
- THEN it SHALL contain `errorCode`, `documentNumber`, `loggedAt`, and `importBatchRef`
- AND `fullName`, `childCode`, `communityHallId`, `communityHallName` SHOULD be populated from the row

### Requirement: Log Entry on Invalid DNI

When an Excel row's `documentNumber` cannot be normalized to `/^\d{8}$/`, the row cannot be keyed
into the unified collection and MUST be excluded, but the exclusion MUST be logged so it is not lost.

#### Scenario: Invalid DNI excluded and logged

- GIVEN an Excel row with `documentNumber: "ABC12345"` or empty
- WHEN normalization fails
- THEN the row SHALL be excluded from import
- AND an `import_error_logs` entry SHALL be created with `errorCode: "INVALID_DNI"`
- AND the entry SHALL capture the available row context (`fullName`, `childCode`, claimed location, `importBatchRef`)

### Requirement: Append-Only Log

The `import_error_logs` collection MUST be append-only. No existing log entry SHALL be updated or
deleted. Each import run MAY produce multiple entries for the same `documentNumber` if multiple
anomalies occur across different import batches.

#### Scenario: Multiple imports for same child produce independent log entries

- GIVEN two separate import runs that both fail to resolve `communityHallId: "LOC999"` for DNI `"12345678"`
- WHEN both complete
- THEN two separate `import_error_logs` entries SHALL exist with distinct `loggedAt` values and `importBatchRef`
- AND neither entry SHALL be updated or merged
