# Security Specification for David Tung 2026 App

## 1. Data Invariants
- **Owner-Only Access**: All data under `/users/{userId}` is strictly private and accessible only by the user whose UID matches `{userId}`.
- **Identity Integrity**: Any `ownerId` or similar field in the document must match `request.auth.uid`.
- **Temporal Integrity**: `createdAt` and `updatedAt` must be validated against `request.time`.
- **Schema Safety**: Data must conform to the types and sizes defined in the validation helpers.

## 2. The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to read `/users/victim_id/perf/main` as `attacker_id`.
2. **Path Poisoning**: Attempt to write a document with an ID exceeding 128 characters.
3. **Type Confusion**: Attempt to set `personalQ` as a string `"one million"`.
4. **Denial of Wallet**: Attempt to write 1MB of junk text into `wishingStatement`.
5. **Orphaned Write**: Attempt to create an event at `/users/my_id/events/event_id` without being the owner of the user path.
6. **State Hijacking**: Attempt to update another user's `dailyActivitiesLog`.
7. **Timestamp Fraud**: Attempt to set `updatedAt` to a date in the year 2099.
8. **Field Injection**: Attempt to add a `isAdmin: true` field to the user performance document.
9. **Collection Scraping**: Attempt to list all documents in `/users` without a specific UID filter.
10. **Resource Exhaustion**: Attempt to create 10,000 todo items in a single collection (mitigated by owner-only rules but worth specifying limits).
11. **Negative Bounds**: Attempt to set `weekday` to `-1` in a calendar event.
12. **Unauthenticated Access**: Attempt to read any document while `request.auth == null`.

## 3. Test Runner (Conceptual)
The `firestore.rules` will be verified against these patterns.
