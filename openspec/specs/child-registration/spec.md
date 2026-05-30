# Child Registration Specification

## Purpose

Defines how the web form persists child records into the unified DNI-keyed collection. The form UI remains unchanged (firstName + lastName inputs), but the DB layer concatenates them into a single `fullName` and enforces global DNI uniqueness.

## Requirements

### Requirement: Full Name Concatenation at Persistence

The system MUST concatenate `firstName` and `lastName` (trimmed, space-separated) into a single `fullName` field before persisting to the unified `children` collection. The original `firstName` and `lastName` fields MUST remain stored for backward compatibility with downstream consumers.

#### Scenario: Form submission concatenates names

- GIVEN a valid form submission with `firstName: "MARIA"` and `lastName: "GONZALEZ"`
- WHEN the child record is persisted
- THEN `fullName` SHALL be stored as `"MARIA GONZALEZ"`
- AND `firstName` and `lastName` SHALL also be stored with their original values

#### Scenario: Names with extra whitespace

- GIVEN `firstName: "  JUAN  "` and `lastName: " PEREZ "`
- WHEN the child record is persisted
- THEN `fullName` SHALL be stored as `"JUAN PEREZ"` (trimmed, single space)

### Requirement: DNI Uniqueness Enforcement

The system MUST enforce a unique constraint on `documentNumber` across the entire `children` collection. The DNI MUST be normalized to match `/^\d{8}$/` (exactly 8 digits, no spaces or hyphens) before persistence.

#### Scenario: Unique DNI accepted

- GIVEN no existing record with `documentNumber: "12345678"`
- WHEN a form submission provides `documentNumber: "12345678"`
- THEN the record SHALL be persisted successfully

#### Scenario: Duplicate DNI rejected

- GIVEN an existing record with `documentNumber: "12345678"`
- WHEN a new form submission provides `documentNumber: "12345678"`
- THEN the system MUST reject the submission with a conflict error
- AND the existing record SHALL remain unchanged

#### Scenario: DNI normalization strips non-digits

- GIVEN a form submission with `documentNumber: " 12345678 "`
- WHEN the value is normalized
- THEN it SHALL be stored as `"12345678"` (trimmed)

#### Scenario: Invalid DNI format rejected

- GIVEN a form submission with `documentNumber: "1234567"` (7 digits)
- WHEN validation runs
- THEN the system MUST reject with a validation error before reaching the DB

### Requirement: Form Duplicate Check Uses Global DNI

The system MUST check for DNI uniqueness across the ENTIRE unified collection, not scoped by `communityHallId`. (Previously: duplicate check was scoped per community hall.)

#### Scenario: Same DNI in different community halls rejected

- GIVEN an existing child with `documentNumber: "87654321"` in hall A
- WHEN a form submission provides `documentNumber: "87654321"` for hall B
- THEN the system MUST reject with a conflict error

### Requirement: Form-Originated Dates Are Source of Truth

The system MUST mark `birthday` and `admissionDate` written by the form as authoritative. These fields SHALL NOT be overwritten by subsequent Excel imports (see excel-child-import spec for merge rules).

#### Scenario: Form sets authoritative dates

- GIVEN a valid form submission with `birthday` and `admissionDate`
- WHEN the record is persisted
- THEN `birthday` and `admissionDate` SHALL be stored as the authoritative values
- AND `birthdayImported` and `admissionDateImported` SHALL be null/absent
