# Caregiver Attendance Specification

## Purpose

Defines backend behavior for caregiver mother registration, scoped administration, schedule configuration, self-service and assisted attendance, exceptions, auditability, and monthly reports. Caregiver mothers are business actors, not system users.

## Requirements

### Requirement: Caregiver Identity and Lifecycle

The system MUST register caregiver mothers with `documentType`, `documentNumber`, names, phone, start date, optional end date, and status. The `(documentType, documentNumber)` pair MUST be globally unique. Self-service MAY accept document number only when the backend can safely default the type to DNI.

#### Scenario: Unique caregiver identity is accepted

- GIVEN no caregiver exists with document type DNI and number `12345678`
- WHEN an authorized user registers that caregiver
- THEN the caregiver SHALL be created with active lifecycle data

#### Scenario: Duplicate caregiver identity is rejected

- GIVEN a caregiver exists with document type DNI and number `12345678`
- WHEN another caregiver is submitted with the same identity pair
- THEN the system MUST reject the request with a conflict error

### Requirement: Scoped Caregiver Administration

The system MUST allow admin users to manage all caregiver attendance data and MUST restrict Technical Companion users to assigned Management Committees and Community Halls.

#### Scenario: AT manages an assigned hall

- GIVEN an AT is assigned to a Community Hall
- WHEN the AT manages caregivers, schedules, attendance, or reports for that hall
- THEN the system SHALL allow the operation

#### Scenario: AT cannot manage an unassigned hall

- GIVEN an AT is not assigned to a Community Hall
- WHEN the AT requests caregiver attendance data for that hall
- THEN the system MUST deny access

### Requirement: Historical Hall Assignments

The system MUST store caregiver Community Hall assignment history with effective dates. Reports and attendance resolution MUST use the assignment active on the target date. The `GET /caregivers` and `GET /caregivers/:id` responses MUST expose the current active hall as `currentHallId` and `currentHallName`; both fields MUST be `null` when the caregiver has no active assignment. The list endpoint SHOULD resolve the current hall using a single batch query for assignments and a single batch query for hall names, regardless of page size.
(Previously: list and by-id responses did not include the caregiver's current hall; the hall was only resolved at self-service marking time.)

#### Scenario: Report uses historical assignment

- GIVEN a caregiver moved from hall A to hall B on July 10
- WHEN a July report evaluates July 5
- THEN the caregiver SHALL be counted under hall A

#### Scenario: Self-service resolves current hall

- GIVEN an active caregiver has an assignment for today
- WHEN the caregiver marks attendance by document identity
- THEN the backend SHALL resolve the caregiver and current Community Hall without caller-sent `communityHallId`

#### Scenario: List endpoint resolves current hall

- GIVEN a page of caregivers is requested and at least one caregiver has an active assignment for hall X
- WHEN `GET /caregivers` returns
- THEN each caregiver row SHALL include `currentHallId` set to the assignment's hall id
- AND each caregiver row SHALL include `currentHallName` set to the resolved hall name
- AND the endpoint SHALL issue at most two extra queries (assignments + hall names) regardless of page size

#### Scenario: By-id endpoint resolves current hall

- GIVEN a caregiver has an active assignment for hall X
- WHEN `GET /caregivers/:id` returns for that caregiver
- THEN the response SHALL include `currentHallId` set to hall X id
- AND the response SHALL include `currentHallName` set to hall X name

#### Scenario: Caregiver without active assignment returns null fields

- GIVEN a caregiver has no `validTo = null` row in `caregiver_hall_assignments`
- WHEN `GET /caregivers` or `GET /caregivers/:id` returns for that caregiver
- THEN `currentHallId` SHALL be `null`
- AND `currentHallName` SHALL be `null`
- AND no error SHALL be raised

### Requirement: Versioned Hall Schedules

Each Community Hall MUST have versioned attendance schedules with `validFrom`, optional `validTo`, configurable working days, special per-day schedules, and copy/replication to other halls. Reports MUST use the schedule active on each date.

#### Scenario: Schedule version applies by date

- GIVEN schedule V1 ends June 30 and V2 starts July 1
- WHEN a report evaluates July 3
- THEN the system SHALL use V2

#### Scenario: Schedule is copied to another hall

- GIVEN hall A has a valid schedule configuration
- WHEN an authorized user copies it to hall B
- THEN hall B SHALL receive an independent schedule version

### Requirement: Attendance Blocks and Windows

Schedules MUST support multiple daily blocks. Each block MUST define entry time, optional exit time, `exitRequired` initially false, `toleranceMinutes`, and configurable `markingWindowMinutes`; the business default marking window SHOULD be 30 minutes after entry and MUST be independent from tolerance.

#### Scenario: Late but in-window mark is accepted

- GIVEN a block starts at 08:00 with tolerance 10 and marking window 30
- WHEN the caregiver marks at 08:15
- THEN the official entry SHALL be recorded as tardy

#### Scenario: Exit is not required initially

- GIVEN a block has an exit time and `exitRequired` is false
- WHEN the caregiver records only entry
- THEN attendance SHALL NOT be rejected for missing exit

### Requirement: Self-Service Official Entry Marking

Self-service MUST accept caregiver document identity only and MUST resolve caregiver, hall, schedule, date, and current block. It MUST reject retired caregivers, missing schedule, non-working day, hall day off/holiday, duplicate official entry per caregiver/date/block, and out-of-window attempts.

#### Scenario: Valid self-service entry creates official attendance

- GIVEN an active caregiver, active assignment, working day, active schedule, and open block window
- WHEN the caregiver submits document identity
- THEN one official entry attendance SHALL be recorded for that caregiver/date/block

#### Scenario: Invalid self-service attempt is audited only

- GIVEN the caregiver is retired, duplicate, out of window, or has no eligible schedule day
- WHEN the caregiver submits document identity
- THEN no official attendance SHALL be created
- AND an attendance event SHALL record the rejection reason

### Requirement: Assisted Attendance and Corrections

Only AT users within scope and admins MAY create special assisted attendance, register attendance, or correct previous marks after the self-service window. Each operation MUST record performer, reason, timestamp, source, before/after values when applicable, and audit event.

#### Scenario: AT creates special attendance after window

- GIVEN no official mark exists and the self-service marking window has closed
- WHEN an in-scope AT records justified assisted attendance
- THEN special attendance SHALL be accepted with performer, reason, source, and timestamp

#### Scenario: Correction preserves before and after

- GIVEN an attendance mark exists
- WHEN an authorized user corrects it with a reason
- THEN the audit trail SHALL include before and after values

### Requirement: Exceptions and Justifications

The system MUST support Community Hall holidays/days off and same-day or retroactive permissions/justifications for specific dates and blocks. Exceptions MAY target a hall or caregiver where appropriate.

#### Scenario: Hall holiday blocks self-service

- GIVEN a Community Hall has a day off for today
- WHEN a caregiver attempts self-service marking
- THEN no official attendance SHALL be created
- AND the attempt SHALL be recorded as a special event

#### Scenario: Caregiver justification prevents absence

- GIVEN a caregiver has an accepted justification for a date and block
- WHEN attendance is reported for that block
- THEN the block SHALL NOT count as an unjustified absence

### Requirement: Monthly Attendance Reports

The system MUST provide monthly Community Hall detail per caregiver and Management Committee consolidated summaries across halls. Tardiness MUST count per block. Reports SHOULD default to caregivers with marks and MAY include expected caregivers without marks using `includeExpectedWithoutMarks` or an equivalent parameter.

#### Scenario: Community Hall detail includes block outcomes

- GIVEN a monthly report for one Community Hall
- WHEN attendance is calculated
- THEN each caregiver's block marks, tardiness, absences, and accepted exceptions SHALL be represented

#### Scenario: Expected-without-marks option exposes absences

- GIVEN an expected caregiver has no official or special mark for a working block
- WHEN the report is requested with expected-without-marks enabled
- THEN the caregiver/block SHALL be included as absent unless justified
