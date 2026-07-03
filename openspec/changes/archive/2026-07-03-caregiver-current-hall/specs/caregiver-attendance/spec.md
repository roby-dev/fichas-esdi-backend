# Delta for Caregiver Attendance

## MODIFIED Requirements

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
