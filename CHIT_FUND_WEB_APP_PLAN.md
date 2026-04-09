# Friends Chit Fund Web Application Plan

## 1. Purpose

Build a simple, transparent web application to manage the Friends Chit savings rotation. The app should help the group:

- Track members, monthly contributions, payout recipients, and cycle status.
- Record urgency-based payout requests and group decisions.
- Run a fair random name picker when there is no emergency or when multiple members ask.
- Keep a clear history of every completed chit cycle.
- Reduce confusion by making payment status, eligible members, and completed payouts visible to all.

This application is for a non-profit friends' savings rotation. It is not intended to calculate interest, profit, bidding, commission, or auction-based chit fund returns.

## 2. Existing Chit History

### Cycle 1: June 2025 to October 2025

- Members: Sumanth S, Sumanth SD, Gururaj, Mahesh, Rohit
- Monthly contribution per member: Rs. 10,000
- Total monthly payout: Rs. 50,000
- Draw date: 10th of every month
- Status: Closed
- Completion: 5 of 5 members received payout

| Month | Payout Recipient | Selection Method | Status | Notes |
| --- | --- | --- | --- | --- |
| June 2025 | Rohit | Urgency | Completed | Urgent case, payout given |
| July 2025 | Mahesh | Urgency | Completed | Urgent case, payout given |
| August 2025 | Sumanth SD | Urgency | Completed | Urgent case, payout given |
| September 2025 | Sumanth S | Urgency | Completed | Urgent case, payout given |
| October 2025 | Gururaj | Last Draw | Completed | Last remaining member, payout given |

### Cycle 2: November 2025 to April 2026

- Members: Sumanth S, Sumanth SD, Gururaj, Mahesh, Rohit, Basavaraj
- Monthly contribution per member: Rs. 15,000
- Total monthly payout: Rs. 90,000
- Draw date: 5th of every month
- Status: Closed
- Completion: 6 of 6 members received payout

| Month | Payout Recipient | Selection Method | Status | Notes |
| --- | --- | --- | --- | --- |
| November 2025 | Mahesh | Chits | Completed | Two members asked, draw selected Mahesh |
| December 2025 | Basavaraj | Urgency | Completed | Urgent case, payout given |
| January 2026 | Sumanth S | Urgency | Completed | Urgent case, payout given |
| February 2026 | Sumanth SD | Urgency | Completed | Urgent case, payout given |
| March 2026 | Rohit | Urgency | Completed | Urgent case, payout given |
| April 2026 | Gururaj | Last Draw | Completed | Last remaining member, payout given |

## 3. Proposed Cycle 3 Setup

The third cycle should be created from the app as a new cycle instead of editing old records.

Recommended default setup:

- Cycle name: Third Cycle
- Start month: May 2026
- Duration: 6 months
- Expected end month: October 2026
- Members: Sumanth S, Sumanth SD, Gururaj, Mahesh, Rohit, Basavaraj
- Monthly contribution per member: Rs. 15,000
- Monthly payout amount: Rs. 90,000
- Preferred collection and draw date: 5th of every month
- Coordinator: Sumanth S
- Document coordinator: Sumanth SD
- Selection method: Urgency first, otherwise random draw

The app should allow these values to be changed before activating the cycle, in case the group decides to change members, amount, start date, or coordinator.

## 4. Execution Rules

### Monthly Collection

1. The coordinator opens the active month in the app.
2. The app shows all members and their payment status for that month.
3. Each member is marked as `Pending`, `Paid`, or `Delayed`.
4. The monthly draw should be finalized only after all active members are marked `Paid`, unless the group explicitly agrees to proceed.
5. The amount transferred date should be recorded.

### Payout Selection

1. If a member has a genuine emergency, the coordinator records the request in the app.
2. The group reviews the request and marks it as `Approved` or `Rejected`.
3. If exactly one eligible member has an approved emergency, that member receives the payout.
4. If multiple eligible members have approved urgency requests, the group can either mutually choose one member or use the random picker among those urgent members.
5. If there is no urgency, the random picker is used among eligible members who have not received a payout in the current cycle.
6. Once a member receives a payout, the member is excluded from future draws in the same cycle.
7. If only one eligible member remains, the app should automatically mark that member as the last draw recipient after payment confirmation.

### Random Name Picker

The random picker should:

- Include only eligible members for the current cycle.
- Exclude members who already received payout in the current cycle.
- Allow filtering to only urgency-approved members when multiple urgent requests exist.
- Display the input name list before draw.
- Show a clear `Pick Random Winner` action.
- Display the selected member with the draw timestamp.
- Save the result to the monthly chit record.
- Prevent rerunning the draw after finalization unless an admin records a reason.

For fairness, the first version can use browser or server-side secure random selection. A later version can add a visible animation, audit log, and downloadable draw proof.

## 5. Web Application Modules

### Dashboard

- Show active cycle summary.
- Show current month collection progress.
- Show members completed versus total members.
- Show next draw date.
- Show remaining eligible members.
- Show recent activity.

### Cycles

- Create a new chit cycle.
- View current and previous cycles.
- Configure contribution amount, members, duration, draw date, and coordinator.
- Close a completed cycle.
- Restart a new cycle only if all members agree.

### Members

- Add, edit, activate, or deactivate members.
- Store member name and optional contact details.
- Show member payment and payout history.

### Monthly Payments

- Track contribution status per member per month.
- Record payment date and notes.
- Show monthly collection total.
- Highlight unpaid or delayed members.

### Payouts

- Record payout recipient.
- Record payout amount and transfer date.
- Store selection method: `Urgency`, `Random Draw`, `Mutual Agreement`, or `Last Draw`.
- Store notes and proof details if needed.

### Urgency Requests

- Add urgency request for eligible members.
- Track request status: `Requested`, `Approved`, `Rejected`, or `Withdrawn`.
- Add notes without exposing sensitive personal details unnecessarily.

### Random Picker

- Show eligible members.
- Pick a recipient randomly.
- Save draw result.
- Lock result after finalization.

### Reports and History

- Show cycle-wise summary.
- Show month-wise contribution table.
- Show payout sequence.
- Export or copy summary for WhatsApp.
- Keep old cycles read-only after closing.

## 6. Suggested User Roles

For the first version, the app can stay simple:

- Admin or Coordinator: Can create cycles, update payments, run draw, and finalize payout.
- Member: Can view cycle status, payments, payout history, and draw results.

If login is not needed initially, the app can start as a local/private app with coordinator-only editing. Authentication can be added later if the app is shared publicly.

## 7. Data Model Draft

### Member

- id
- name
- phoneNumber
- isActive
- createdAt
- updatedAt

### ChitCycle

- id
- name
- startMonth
- endMonth
- contributionAmount
- payoutAmount
- drawDayOfMonth
- status: `Draft`, `Active`, `Closed`
- coordinatorMemberId
- documentCoordinatorMemberId
- createdAt
- updatedAt

### CycleMember

- id
- cycleId
- memberId
- payoutReceived
- payoutMonthId
- isActiveInCycle

### ChitMonth

- id
- cycleId
- monthLabel
- dueDate
- transferDate
- status: `Open`, `Collection Complete`, `Payout Finalized`, `Closed`
- payoutRecipientMemberId
- selectionMethod
- notes

### MonthlyContribution

- id
- chitMonthId
- memberId
- amount
- status: `Pending`, `Paid`, `Delayed`
- paidDate
- notes

### UrgencyRequest

- id
- chitMonthId
- memberId
- status: `Requested`, `Approved`, `Rejected`, `Withdrawn`
- notes
- createdAt
- decidedAt

### DrawResult

- id
- chitMonthId
- eligibleMemberIds
- selectedMemberId
- drawMode: `All Eligible` or `Urgency Approved Only`
- randomSeedOrProof
- drawnAt
- finalizedBy
- notes

## 8. Recommended Build Phases

### Phase 1: Planning and Prototype

- Create the project structure.
- Choose the app stack.
- Build a static prototype for dashboard, cycle details, payment table, and random picker.
- Use the existing first and second cycle data as sample seed data.

### Phase 2: Core App

- Add cycle creation and cycle listing.
- Add member management.
- Add monthly contribution tracking.
- Add payout finalization.
- Add random picker with eligibility filtering.

### Phase 3: Persistence

- Add database storage.
- Seed completed Cycle 1 and Cycle 2 data.
- Allow creating Cycle 3 from defaults.
- Make completed cycles read-only.

### Phase 4: Access and Sharing

- Add simple login or admin PIN if needed.
- Add member read-only view.
- Add WhatsApp-friendly summary export.

### Phase 5: Hardening

- Add audit logs for changes.
- Add validation to prevent duplicate payout in a cycle.
- Add validation to prevent draw before collection completion unless overridden.
- Add backup or export option.

## 9. Suggested Technology Stack

Recommended simple stack:

- Frontend and backend: Next.js
- Styling: Tailwind CSS
- Database: SQLite for local/private use, PostgreSQL if hosted
- ORM: Prisma
- Authentication: NextAuth/Auth.js or a simple admin PIN in the first version
- Hosting: Vercel for app, Neon/Supabase for PostgreSQL if using cloud database

If the goal is a very simple private tool, an even lighter version can be built with:

- React/Vite frontend
- Local JSON or browser storage for prototype
- Later migration to a database

## 10. First Version Scope

The first usable version should include:

- Active cycle dashboard
- Member list
- Current cycle page
- Monthly payment table
- Mark member as paid
- Add urgency request
- Random picker for eligible members
- Finalize payout
- Completed cycle history for Cycle 1 and Cycle 2
- Cycle 3 draft creation

Not required in the first version:

- Payment gateway integration
- SMS or WhatsApp API integration
- Complex legal documentation
- Interest, auction, or profit calculation
- Multi-group support

## 11. Acceptance Checklist

The app is ready for first use when:

- Cycle 1 and Cycle 2 history is visible and marked closed.
- Cycle 3 can be created as a draft with 6 members and Rs. 15,000 contribution.
- Each month shows all member contribution statuses.
- The app calculates monthly collection total as Rs. 90,000 for 6 members.
- A member who already received payout is not shown in future draw eligibility for the same cycle.
- The random picker can select from eligible members only.
- The draw result is saved and visible in the monthly record.
- The payout recipient can be finalized and the month can be closed.
- Completed cycles remain available for reference.

## 12. Important Notes

- Sensitive urgency details should be kept minimal. The app should record that urgency was approved without forcing members to share private details.
- Because this is a friends' mutual savings rotation, the app should use clear wording like `contribution`, `payout`, `cycle`, and `draw`, not `profit`, `interest`, or `auction`.
- Any member exit during an active cycle should require manual group decision and should be recorded in notes.
- Before hosting publicly, the group should decide whether authentication is needed.
