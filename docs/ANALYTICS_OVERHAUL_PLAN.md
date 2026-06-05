# HRMS Analytics Overhaul — Full Implementation Plan

> Status: PLAN ONLY (no code yet). Author: senior-analyst review, 2026-06.
> Goal: one source of truth for every metric, accurate daily/monthly/yearly
> productivity, portal & company quality insight, and joined-driven invoicing.

---

## 0. Guiding principles

1. **One engine.** All metrics computed in SQL (Postgres views/endpoints). The
   browser never recomputes funnels from raw rows. Recruiter UI and Admin UI call
   the **same** endpoints, differing only by a `recruiter_id` scope.
2. **Event-date anchoring.** Every stage transition stamps its own date column.
   Metrics bucket by the event's own date, never by `updated_at`.
3. **IST everywhere.** All date bucketing uses `AT TIME ZONE 'Asia/Kolkata'`.
   No more UTC/IST mismatch at day boundaries.
4. **No silent caps.** Aggregation happens server-side; the 2000-row client cap
   is removed.
5. **Backwards compatible rollout.** New columns are nullable + backfilled;
   old screens keep working until cut over.

---

## PHASE 1 — Foundation (single source of truth)

**Outcome:** every screen shows the same number for the same metric & period.

### 1.1 Schema changes (`sourcing.applications`)

> NOTE: table is **partitioned by RANGE(`assigned_date`)**. `ADD COLUMN` propagates
> to all partitions automatically — safe. No PK change needed.

New columns (all `DATE NULL`, backfilled):

| Column | Meaning | Backfill rule |
|---|---|---|
| `selection_date` | Day the select/reject decision was recorded | `COALESCE(existing, updated_at::date)` where `selection_status IS NOT NULL` |
| `rejection_date` | Day rejected | `updated_at::date` where `interview_status='Rejected' OR selection_status=2` |
| `connected_date` | Day first connected | `call_date` where `call_status=3` |
| `interested_date` | Day interest captured | `call_date` where `interested IS NOT NULL` |

Already present (verified): `interview_date`, `joining_date`, `backout_date`,
`expected_joining_date`, `followup_date`, `turnup`, `interview_status`.

New column on `sourcing.job_roles`:

| Column | Meaning |
|---|---|
| `target_openings INT NULL` | Real headcount for the role (fixes the mislabeled "Active Roles") |

New column on `companies` (or `sourcing.companies` mapping):

| Column | Meaning |
|---|---|
| `fee_type TEXT` | `'flat'` or `'percent_ctc'` (for invoicing, Phase 5) |
| `fee_value NUMERIC` | flat amount or % of CTC |
| `guarantee_days INT` | clawback window for backout credit notes |

### 1.2 Enforce date-on-status-change (backend write path)

In the application update handler (`recruiter.service.ts` update + admin update):

- when `selection_status` set → stamp `selection_date = today_IST` if null
- when status becomes Rejected → stamp `rejection_date`
- when `joining_status=Joined` → require/stamp `joining_date`
- when `joining_status=Backed Out` → require/stamp `backout_date`
- when `call_status=Connected` → stamp `connected_date`
- when `interested` set → stamp `interested_date`

These stamps are **set-once** (only if currently null) to preserve the true event day.

### 1.3 Canonical SQL: one funnel view

Create `sourcing.v_application_facts` — one row per application, fully decorated:

```
sourcing.v_application_facts
  application_id, recruiter_id, recruiter_name,
  company_id, company_name, job_role_id, role_name,
  portal,
  assigned_date, call_date, connected_date, interested_date,
  interview_date, selection_date, rejection_date, joining_date, backout_date,
  call_status, interested, interview_status, selection_status, joining_status,
  -- boolean flags for fast filtering:
  is_connected, is_interested, is_interview_sched, is_interview_done,
  is_selected, is_rejected, is_joined, is_backout,
  ctc  -- candidate current_ctc, for invoicing & revenue
```

All downstream metrics read from this view. **Single definition of every flag.**

### 1.4 Canonical metric definitions (lock these)

| Metric | Date anchor | Condition |
|---|---|---|
| Sourced | `assigned_date` | row exists |
| Attempts | `call_date` | `call_date NOT NULL` |
| Connected | `connected_date` | `call_status=3` |
| Interested | `interested_date` | `interested=1` |
| Not Interested | `interested_date` | `interested=2` |
| Interview Scheduled | `interview_date` | `interview_date NOT NULL` |
| Interview Done | `interview_date` | `interview_status IN (Done,Not Attended,Rejected)` |
| Selected | `selection_date` | `selection_status=1` |
| Rejected | `rejection_date` | `interview_status=Rejected OR selection_status=2` |
| Joined | `joining_date` | `joining_status=1` |
| Backed Out | `backout_date` | `joining_status=4` |
| Yet to Join (state) | none (current) | `selection_status=1 AND joining_status IN (NULL,3)` |

> "State" metrics (Yet to Join, Pending) are point-in-time and **never** period-scoped.
> Label them clearly as "current" so nobody compares them month-over-month.

### 1.5 New unified endpoint contract

Replace the divergent client/SQL logic with ONE family:

```
GET /api/analytics/funnel
  ?scope=recruiter|company|portal|overall
  &recruiter_id=  (optional, auto-injected for recruiter role)
  &company_id=    (optional)
  &portal=        (optional)
  &from=YYYY-MM-DD&to=YYYY-MM-DD   (any range)
  &granularity=none|day|month       (none=totals, else time-series)

Response:
{
  range: {from,to},
  totals: { sourced, attempts, connected, interested, not_interested,
            interview_sched, interview_done, selected, rejected,
            joined, backout, yet_to_join },
  rates:  { connect_rate, interest_rate, interview_rate,
            select_rate, join_rate, sourced_to_join },
  series: [ { bucket:'2026-06-01', sourced, ..., joined } ]   // if granularity≠none
}
```

Date presets (Today, This Week, Last Month, This Quarter, This Year, Since
Joining, Custom) are just `from/to` pairs computed on the client.

### 1.6 Remove the client engine + 2000 cap

- `dashboard/page-client.tsx`, `reports/page.tsx`, `follow-ups/page-client.tsx`
  stop calling `getApplications({limit:2000})` for metrics.
- They call `/api/analytics/funnel` and render the returned totals/series.
- Raw-row pages (Candidates table) keep paginating — unaffected.

### 1.7 Phase-1 acceptance test

Pick one recruiter + one month. Recruiter Reports, Admin MTD, and Admin
Individual must show **identical** numbers for every funnel stage. Pick a
candidate who joined at 11 PM IST — must land in the correct IST day on both
surfaces.

**Phase 1 deliverables:** migration (4 app cols, 1 role col, 3 company cols),
write-path stamping, `v_application_facts` view, `/api/analytics/funnel`,
UI cutover, backfill script, acceptance test.

---

## PHASE 2 — Recruiter Performance v2

**Outcome:** "what has this HR contributed — this month / last month / this year /
since joining" answerable in one click; ranked by outcomes, not dialing.

### 2.1 Date-range selector
Add presets: Today · This Week · Last Month · This Quarter · This Year ·
**Since Joining** · Custom. (Backed by `from/to` → `/api/analytics/funnel`.)
"Since Joining" uses `MIN(assigned_date)` for that recruiter as `from`.

### 2.2 Per-recruiter scorecard
For the selected range, per recruiter:

- **Activity:** attempts, connect-rate, interested, interest-rate
- **Output:** interviews scheduled, interviews done, selected, **joined**
- **Quality ratios:** Interest→Interview, Interview→Select, **Select→Join**,
  Sourced→Join
- **Consistency:** active days, avg attempts / active day, best streak
- **Trend sparkline:** joined-per-month (granularity=month) since joining
- **vs target** (move targets from localStorage → `sourcing.recruiter_targets`
  table: recruiter_id, month, attempt_target, join_target) and **vs team median**

### 2.3 Leaderboard
Default sort = **joins** in range (outcome that bills), secondary = Select→Join %.
Toggle to attempts/connects for activity view. Medal styling top 3.

### 2.4 Endpoints
```
GET /api/analytics/recruiters?from=&to=&sort=joined   → array of scorecards
GET /api/analytics/recruiter/:id?from=&to=&granularity=month → detail + series
GET /api/recruiter-targets?month= / PUT /api/recruiter-targets
```

### 2.5 UI wireframe
```
[ Range: Today | Week | Last Month | Quarter | Year | Since Joining | Custom ]
┌───────────── Team KPI strip (range totals + ▲/▼ vs previous range) ─────────┐
│ Attempts  Connect%  Interested  Interviews  Selected  Joined  Select→Join%  │
└──────────────────────────────────────────────────────────────────────────────┘
[ Leaderboard table — sortable, vs-target column, sparkline per recruiter ]
[ Click a recruiter → drawer: full scorecard + monthly joined trend chart ]
```

---

## PHASE 3 — Dashboard v2 (daily / monthly / yearly)

**Outcome:** one glance shows today's ops, this-vs-last month, and the yearly
direction.

### 3.1 Three horizons (stacked)
- **① Today (operational):** attempts, connects, interviews today, selections
  today, joins today + "needs attention" (overdue follow-ups, tomorrow's
  unconfirmed interviews).
- **② This Month vs Last Month (tactical):** every stage with **▲/▼ delta** and
  **pace-vs-target** ("day 12: 40% of monthly join target — behind").
- **③ Year / Trend (strategic):** 12-month line of **Joins** and **Select→Join %**
  (seasonality + quality trajectory).

### 3.2 Funnel with leak callout
Render the canonical funnel; highlight the **worst-converting** stage in red with
absolute count lost ("Interview→Select leak: 120→18").

### 3.3 Endpoints (reuse Phase 1)
- ① `/api/analytics/funnel?from=today&to=today`
- ② two calls: this-month & last-month, compute deltas client-side
- ③ `/api/analytics/funnel?from=Jan1&to=today&granularity=month`

### 3.4 Recruiter vs Admin
Same components; recruiter view auto-scopes `recruiter_id`, admin view is
overall + a recruiter filter.

### 3.5 UI wireframe
```
TODAY  [Attempts][Connect][Interviews][Selected][Joined]   ⚠ 4 overdue · 3 interviews tmrw
THIS MONTH vs LAST   [stage  value  ▲/▼]  ...   [pace bar: 40% of join target on day 12]
YEAR    [── Joins ──  ── Select→Join% ──  line chart, 12 months ]
FUNNEL  Sourced→…→Joined  (worst stage flagged red)
```

---

## PHASE 4 — Portal & Company Quality

**Outcome:** answer "which platform's data is worth paying for" and "which client
converts."

### 4.1 Portal Quality tab (new)
Per `portal`: sourced → connect% → interest% → interview% → **join%**, plus
cost-per-join (if spend entered). Endpoint:
`/api/analytics/funnel?scope=portal&from=&to=` returns one funnel per portal.
Add optional `sourcing.portal_spend(portal, month, amount)` for cost-per-join.

### 4.2 Company Health tab (fix existing)
Lead with **Select→Join %** and **Interview→Select %** per company; add
time-to-fill (avg `joining_date - assigned_date`) and aging of "yet to join."
Flag: high-source / low-join companies (client-side problem) vs efficient
converters (scale up).
Fix denominators: Joining% = joined/**selected** (not joined/sourced).
Fix "Active Roles" → use `job_roles.target_openings`.

### 4.3 UI
Reuse the funnel + bar components; add a scatter "sourced vs join%" so outliers
(both good and bad) pop visually.

---

## PHASE 5 — Invoicing (joined-driven)

**Outcome:** a "Joined" candidate auto-creates a billable line; revenue ties back
to recruiter performance; backouts inside guarantee window auto-credit.

### 5.1 Tables
```
sourcing.billing_lines
  id, application_id, company_id, recruiter_id, candidate_id,
  join_date, ctc, fee_type, fee_value, amount,        -- computed at join
  status,  -- queued|invoiced|paid|closed|declined|credited
  invoice_id NULL, created_at

sourcing.invoices
  id, company_id, number, period_month,
  status,  -- raised|payment_pending|payment_received|closed|declined
  subtotal, tax, total, raised_at, paid_at

sourcing.credit_notes
  id, invoice_id, billing_line_id, reason, amount, created_at
```

### 5.2 Triggers / jobs
- On `joining_status → Joined`: insert `billing_lines` (status=queued), amount
  from company `fee_type/fee_value` × `ctc`.
- On `joining_status → Backed Out` within `guarantee_days` of `join_date`:
  auto-create credit_note + mark line credited.
- Admin "Billing Queue" → select lines → generate invoice (groups by company/month).

### 5.3 Endpoints
```
GET  /api/billing/queue?month=
POST /api/billing/invoices            (from selected lines)
PATCH /api/billing/invoices/:id       (status transitions)
POST /api/billing/credit-notes
GET  /api/billing/dashboard?year=     (already shaped in admin/invoices page)
```

### 5.4 Revenue in performance
Add **revenue contributed** to the recruiter scorecard (sum of paid/closed
billing_lines in range) — the ultimate productivity KPI.

### 5.5 Dependency
Phase 5 requires Phase-1 reliable `joining_date` + `backout_date`. Do not start
invoicing until Phase-1 stamping is live and backfilled.

---

## Sequencing & estimates

| Phase | Theme | Depends on | Rough effort |
|---|---|---|---|
| 1 | Foundation / single source of truth | — | Largest; do first |
| 2 | Recruiter Performance v2 | 1 | Medium |
| 3 | Dashboard v2 | 1 | Medium |
| 4 | Portal + Company quality | 1 | Small–Medium |
| 5 | Invoicing | 1 (dates) | Medium–Large |

**Rule:** Phase 1 ships and passes its acceptance test before anything else —
every later phase inherits its correctness. Phases 2–4 can then proceed in
parallel; Phase 5 last.

---

## Migration safety checklist (Phase 1)

- [ ] `ADD COLUMN ... NULL` only (no NOT NULL on partitioned parent without default)
- [ ] Backfill in batches by partition (month) to avoid long locks
- [ ] Verify partition routing unaffected (partition key `assigned_date` unchanged)
- [ ] Add indexes: `(recruiter_id, selection_date)`, `(recruiter_id, joining_date)`,
      `(portal, joining_date)`, `(company_id via job_roles, joining_date)`
- [ ] Build `v_application_facts` and benchmark on largest month
- [ ] Dual-run: keep old client numbers visible behind a debug flag, diff vs new
      endpoint for one week before removing the client engine
```
