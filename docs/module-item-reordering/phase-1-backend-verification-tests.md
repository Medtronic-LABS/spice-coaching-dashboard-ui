# Phase 1 — Backend Verification Tests

**Repo:** `coaching-platform`  
**Prerequisite:** None (start here or in parallel with Phase 2)  
**Blocks:** Phase 5 end-to-end verification; Phase 2 merge should wait for these tests to pass

---

## Goal

Confirm the existing backend already supports card and quiz reordering via `PUT /admin/modules/{id}` — no production code changes expected. Add integration tests that lock in the contract before frontend work lands.

---

## Why this phase first

The dashboard will send:

- **Cards:** reordered `module_json.cards[]` array (array index = order)
- **Quiz:** same questions with updated `question_order` values (contiguous `1..n`)

If these invariants are untested, frontend reorder UI could ship against a misunderstood API contract.

---

## Tasks

### 1. Card array order — PUT → GET

**File:** `tests/api/test_admin_modules.py`

Add `test_card_array_order_preserved_on_put_and_get`:

1. Create a module with three cards: `C1`, `C2`, `C3`.
2. `PUT /admin/modules/{id}` with `module_json.cards` in order `[C2, C1, C3]` (same card bodies, new array order).
3. `GET /admin/modules/{new_id}` (PUT version-bumps — use returned id).
4. Assert `cards[0].title_bn == "C2"`, `cards[1] == "C1"`, `cards[2] == "C3"`.

### 2. Quiz reorder — explicit `question_order`

**File:** `tests/api/test_admin_modules.py`

Add `test_quiz_reorder_via_explicit_question_order`:

1. Create module with three quiz questions.
2. `PUT` with questions shuffled in the request body but explicit `question_order: 1, 2, 3` assigned to match desired sequence.
3. `GET` and assert `quiz` array is sorted `[1, 2, 3]` by `question_order`.

Reference existing test: `test_quiz_join_orders_by_question_order`.

### 3. Card order flows to sync bundle (optional but recommended)

**File:** `tests/api/test_admin_modules.py` or `tests/api/test_sync.py`

Add `test_card_order_flows_to_sync_bundle`:

1. Create and publish a module with cards `[A, B, C]`.
2. `PUT` reorder to `[C, A, B]` and publish (or set lifecycle to published as test harness allows).
3. `GET /sync/modules?since=...` and assert synced module’s `cards` array matches `[C, A, B]`.

### 4. Document invariants in test docstrings

Each test should note:

- PUT version-bumps (new module `id` returned).
- Quiz `question_family_id` preserved when question UUID matches existing row.
- Sync copies `cards` verbatim; quiz sorted by `question_order`.

---

## Files to modify

| Action | Path |
|--------|------|
| Add tests | `tests/api/test_admin_modules.py` |
| Optional | `tests/api/test_sync.py` |

**No changes** to `admin_modules.py`, models, or migrations.

---

## How to run

```bash
cd "/home/beehyv/Projects/Medtronics/android work/coaching-platform"
# Use project’s usual test invocation, e.g.:
pytest tests/api/test_admin_modules.py -k "card_array_order or quiz_reorder" -v
```

---

## Done checklist

- [ ] `test_card_array_order_preserved_on_put_and_get` passes
- [ ] `test_quiz_reorder_via_explicit_question_order` passes
- [ ] Sync bundle test passes (or waived with ticket + reason)
- [ ] All existing `test_admin_modules.py` tests still pass
- [ ] No production code changes required (if tests fail, fix backend before Phase 4 merge)

---

## Next phase

[Phase 2 — Frontend Order Utilities](./phase-2-frontend-order-utilities.md)
