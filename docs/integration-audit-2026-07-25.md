# Integration Audit — CloudShop Marketplace

**Date:** 2026-07-25
**Scope:** End-to-end review of every integration seam — frontend ↔ backend, backend ↔ DynamoDB, EventBridge/SES, Terraform wiring, and CI/CD — cross-checked against `PENDIENTE.md`, `PENDIENTES.md`, and `docs/spec-plans/*`.

## Top-line status

The infrastructure layer (Terraform: all 11 modules, IAM grants, module wiring) is solid and internally consistent. The **frontend has no real backend integration at all** (fully mocked/hardcoded), and the **cart/order flow is broken by a live DynamoDB key mismatch** that would fail in production today. Most gaps below were already known and tracked in `PENDIENTE.md`/`PENDIENTES.md`; this audit confirms them against current code, corrects two entries that had gone stale, and adds newly found issues.

## Critical bugs (would fail in production today)

1. **Cart/order DynamoDB key mismatch.** Table `cloudshop-carts` has hash key `ClientId` (`infraestructure/modules/dynamodb/main.tf:7`), but every cart and order Lambda reads/writes `CustomerId` instead (`carts/add_product`, `carts/clear_cart`, `carts/modify_quantity`, `carts/remove_product`, `orders/create_order`). Every call raises `ValidationException`. This blocks the entire purchase flow. **Note:** `PENDIENTE.md`/`PENDIENTES.md` describe an older shape of this bug (`ClientId` vs `UserId`) — that description is now stale; code is uniformly `CustomerId`, table is `ClientId`.
2. **`register-user` Cognito call is invalid.** `MessageAction='SUPPRESS_DETAIL_MESSAGE'` is not a valid `MessageActionType` (valid: `RESEND`/`SUPPRESS`) — registration always throws. Also never calls `admin_set_user_password(Permanent=True)` or `admin_add_user_to_group`, so even a fixed call would leave users stuck in `FORCE_CHANGE_PASSWORD` with no RBAC group. (Tracked: `PENDIENTES.md` #2/#3.)
3. **Non-serialized Lambda response bodies.** `users/*` (all 4 handlers) and `notifications/send-order-notification` return `{'body': {...}}` (raw dict) instead of `json.dumps(...)`. Under `AWS_PROXY` integration (confirmed in `api-gateway/routes.tf`), this produces malformed responses/502s.
4. **Cart item routes ignore the path parameter.** API Gateway defines `POST/PATCH/DELETE /carts/{id}/products/{productId}`, but the Lambdas read `ProductId` from the JSON body instead of `pathParameters`. Breaks `DELETE` in particular, which typically has no body.

## Incomplete integrations

- **Frontend has zero API/Cognito wiring.** `frontend/src/services/` only contains `mockAuth.ts` (hardcoded users, fake JWT). No `fetch`/`axios`/`VITE_API` usage anywhere. Every page renders hardcoded literal arrays instead of calling any of the 25 real routes defined in Terraform.
- **`frontend/src/features/**` (~30 files) is dead code** — a second, unused page tree never imported by `router.tsx`.
- Most forms (Register, CreateProduct, CreateStore, EditProduct, EditStore) have no submit handler; Search/Filter controls in `Catalog.tsx` are inert (state set but never applied).
- **`OrderCreated` events never carry `Items`** (`orders/create_order/lambda_function.py`), so `send-order-notification` (which requires a non-empty `items` array) always fails. EventBridge's `input_transformer` hardcodes `"items": []` as an acknowledged placeholder. (Tracked: `PENDIENTE.md` #3.)
- **`GET /carts/{id}` and the entire `dashboard` domain have no backend code** — Terraform reserves the Lambda slots (guarded by `fileexists()`), but `backend/lambdas/carts/get_cart/` and `backend/lambdas/dashboard/` don't exist. (Tracked: `PENDIENTE.md` #5/#6.)
- **No frontend CI/CD and no deploy mechanism for the SPA.** Only `backend-python.yml` and `terraform.yml` exist; nothing builds the Vite app or syncs it to the provisioned S3/CloudFront. The distribution is live infrastructure with no content pipeline.
- **`update_order_status` is missing `EN_PREPARACION`** from `VALID_STATUSES`. (Tracked: `PENDIENTES.md` #9.)
- Cognito role naming drift: Terraform group is `"cliente"`, frontend/mock RBAC uses `"client"` — not yet an active bug since it's mocked, but will break once real auth lands.

## Stale documentation (corrected by this audit)

- `PENDIENTE.md` #4 / `PENDIENTES.md` #1 describe the cart key bug as `ClientId` vs `UserId`; actual code is uniformly `CustomerId` vs table's `ClientId`. Following the doc's suggested fix as written would not resolve the real bug.
- `PENDIENTES.md` #8 claims the cart route is implemented at `/carts/items`; current Terraform actually defines the spec-correct `/carts/{id}/products/{productId}`. The real remaining gap is that the Lambda ignores the path param (see Critical Bugs #4).
- `infraestructure/modules/lambdas/main.tf:173` comment claims stores Lambdas have "no code yet" — they do exist and are non-trivial. Harmless (doesn't affect `fileexists()` gating) but misleading.

## What's working correctly

- Terraform root wiring: all 11 modules instantiated and correctly threaded (DynamoDB → IAM, Cognito → IAM/API Gateway, Lambdas → API Gateway, S3/WAF → CloudFront).
- IAM grants match each Lambda's actual AWS API usage — no missing permissions found.
- EventBridge rules for `OrderCreated`/`OrderStatusChanged`/`OrderCancelled` correctly route to the audit and notification targets (aside from the empty `Items` gap).
- Backend CI (`backend-python.yml`) covers every Lambda directory via `compileall` + `ruff` (no unit tests yet, but no directory excluded).
- No `users` DynamoDB table — intentional, since user data lives in Cognito, not confirmed as a gap.

## Recommended priority order

1. Fix the cart/order DynamoDB key mismatch (`CustomerId` → `ClientId`, or migrate the table) — unblocks the entire purchase flow.
2. Fix `register-user`'s Cognito calls (`MessageAction`, password, group assignment) — unblocks account creation and RBAC.
3. Fix response serialization (`json.dumps`) in `users/*` and `notifications/send-order-notification`.
4. Wire the frontend to real endpoints (start with auth + catalog + cart), replacing `mockAuth.ts` and hardcoded arrays.
5. Add a frontend build+deploy CI job targeting the S3/CloudFront already provisioned.
6. Fill remaining backend gaps: `GET /carts/{id}`, `dashboard` domain, `Items` in `OrderCreated`, cart path-param handling, `EN_PREPARACION` status.
7. Update `PENDIENTE.md`/`PENDIENTES.md` to reflect the corrected bug descriptions above, and remove `frontend/src/features/**` dead code (or wire it in and delete `pages/` — pick one).
