# Deployment and Integration Strategy

This document describes how to deploy the Micro-Learning Analytics Dashboard (AI Coaching) and how it integrates with the Spice UHIS admin web for authentication and access.

## Overview

| Concern | Approach |
|---------|----------|
| Hosting | Static SPA (Vite build) served by nginx under `VITE_ROUTE_PREFIX` (default `/ai-coaching/`) |
| Auth | Session cookies from Spice UHIS (no separate login in this app) |
| Access control | Spice `suiteAccess` must include `coaching` (configurable) |
| Entry | Users are redirected from Spice UHIS admin web into this dashboard |

---

## Same-host requirement (cookies)

This dashboard does **not** implement its own login. On load it calls the Spice user profile API with browser credentials and expects the existing Spice session cookie.

**Deploy this dashboard on the same host (same site) as Spice UHIS admin web** so:

1. The Spice session cookie is sent with profile and API requests.
2. Browser cookie `SameSite` / domain rules allow the session to be shared.
3. Users who are already logged into Spice UHIS can open the coaching dashboard without re-authenticating.

If the dashboard is served from a different origin (different domain or scheme), the Spice cookie will typically not be available, auth bootstrap will fail, and the user will be redirected back to the Spice web login URL (`VITE_SPICE_WEB_LOGIN_URL`).

**Recommended layout (example):**

```text
https://<spice-uhis-host>/                    → Spice UHIS admin web
https://<spice-uhis-host><VITE_ROUTE_PREFIX>/ → AI Coaching dashboard
# default: https://<spice-uhis-host>/ai-coaching/
```

Path and reverse-proxy details may vary by environment, but the **registrable domain / cookie domain must match** what Spice sets for the session.

---

## Suite access (`coaching`)

Entry is gated on Spice profile `suiteAccess`.

- Required value (default): `coaching`
- Configurable via build-time env: `VITE_COACHING_SUITE_ACCESS`

**For every user who should use this dashboard**, an administrator must add `coaching` to that user’s Spice `suiteAccess` list (alongside any other suites they already have).

| Outcome | Behavior |
|---------|----------|
| Valid Spice session **and** `suiteAccess` includes `coaching` | Dashboard loads; session is stored for the app shell |
| Missing / invalid session | Redirect to Spice UHIS web (`VITE_SPICE_WEB_LOGIN_URL`) |
| Valid session but **no** `coaching` suite access | Redirect to Spice UHIS web |

Without `coaching` in `suiteAccess`, the user cannot use this dashboard even if they are a valid Spice admin.

---

## How users access the dashboard after deployment

1. User signs in to **Spice UHIS admin web** as usual.
2. From Spice UHIS, the user is **redirected** (link / menu / deep link) to the coaching dashboard URL, for example:
   - `https://<same-host>/ai-coaching/` (or whatever `VITE_ROUTE_PREFIX` is set to)
3. The dashboard bootstraps auth:
   - Reads the Spice session cookie (same host).
   - Fetches the Spice user profile.
   - Checks `suiteAccess` for `coaching`.
4. If checks pass, the user lands in AI Coaching (module library, ingest, admin configs, etc.).
5. If checks fail, the browser is sent back to Spice UHIS login / home.

There is no standalone “login page” for this product; Spice UHIS remains the identity and session source.

---

## Deployment

### Build artifacts

- Production image: multi-stage Docker build (`Dockerfile`).
- Static assets are served from `VITE_ROUTE_PREFIX` (default `/ai-coaching/`; see `nginx/default.conf.template`).
- `VITE_*` values are **baked in at image build time**.

### Environment variables

Only `VITE_*` variables are exposed to the browser. They are **baked in at image/build time** (not read at container runtime). Copy `.env.example` to `.env` for local development.

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `VITE_API_BASE_URL` | **Yes** (production / tests) | _(none)_ | Coaching / Medtronic admin API origin used by RTK Query (`fetchBaseQuery`). No trailing slash after normalize (e.g. `https://host/medtronics-api`). |
| `VITE_ROUTE_PREFIX` | No | `/ai-coaching` | Public URL path where the SPA is served. Leading slash required after normalize; no trailing slash (e.g. `/ai-coaching`). Drives Vite `base`, React Router paths, and nginx locations. |
| `VITE_COACHING_SUITE_ACCESS` | No | `coaching` | Spice `suiteAccess` entry required to enter the dashboard (case-insensitive). |
| `VITE_SPICE_WEB_LOGIN_URL` | No | `http://localhost:3000/` | Spice UHIS web URL used when session cookie is missing or suite access is denied. |
| `VITE_SPICE_ADMIN_API_URL` | No | `/admin-service` | Spice admin-service base for region/facility APIs. Prefer a relative path in local/dev so cookies stay same-origin. |
| `VITE_SPICE_USER_API_URL` | No | `/user-service` | Spice user-service base for CHW / admin user listing APIs. Prefer a relative path in local/dev so cookies stay same-origin. |
| `VITE_SPICE_API_BASE_URL` | No | _(unset)_ | Spice backend origin intended as the Vite dev proxy target for `/admin-service` and `/user-service` (local development). |
| `VITE_ERROR_REPORTING_URL` | No | _(unset)_ | Optional POST endpoint for client error reports. Remote reporting is currently disabled in code until re-enabled; safe to leave empty. |

**Docker Compose (host mapping, not baked into the SPA):**

| Variable | Default | Purpose |
|----------|---------|---------|
| `WEB_PORT` | `8080` | Host port mapped to the nginx container (`docker-compose.yml`). |

**CI/CD notes**

- Required GitLab CI/CD variable for image build: `VITE_API_BASE_URL`.
- Optional build args / CI variables: `VITE_COACHING_SUITE_ACCESS`, `VITE_ROUTE_PREFIX` (and any other `VITE_*` you need for the target environment).
- Pass additional `VITE_*` values as Docker `ARG`/`ENV` in the image build if the target environment differs from defaults.

See `.env.example` for a copy-paste starter set.

### Local / standalone Docker

```bash
cp .env.example .env   # set VITE_* for your environment
docker compose up --build
```

Default compose maps the app to port `8080` (`http://localhost:8080` → redirects to `VITE_ROUTE_PREFIX`, default `/ai-coaching/`).

For cookie-based auth to work against a real Spice environment, prefer deploying behind the **same host** as Spice rather than only on localhost.

### CI/CD (GitLab)

Pipeline stages: lint → test → build → deploy.

- Build pushes an nginx image to the GitLab Container Registry.
- Deploy pulls and restarts the dashboard service (coupled with the coaching-platform compose on the target host).
- Required CI/CD variable: `VITE_API_BASE_URL`.
- Optional: `VITE_COACHING_SUITE_ACCESS` (defaults to `coaching`), `VITE_ROUTE_PREFIX` (defaults to `/ai-coaching`).

After deploy, confirm the public URL is reachable under the Spice UHIS host path (e.g. `/ai-coaching/`).

---

## Integration checklist (Spice UHIS + this dashboard)

- [ ] Dashboard is served on the **same host** as Spice UHIS admin web (cookie sharing).
- [ ] Reverse proxy routes `VITE_ROUTE_PREFIX/` (e.g. `/ai-coaching/`) to this app’s nginx container.
- [ ] Spice UHIS admin UI links/redirects eligible users to `VITE_ROUTE_PREFIX/`.
- [ ] Target users have `coaching` in Spice `suiteAccess`.
- [ ] Build-time env points at the correct API and Spice login URLs for the environment.
- [ ] Smoke test: logged-in Spice user with `coaching` opens the dashboard; user without `coaching` is redirected back to Spice.

---

## Summary

1. **Deploy** the static dashboard (Docker/nginx) so it is reachable at `VITE_ROUTE_PREFIX/` on the Spice UHIS host.
2. **Keep the same host** as Spice UHIS so session cookies work.
3. **Grant** `coaching` suite access in Spice to every user who should enter this app.
4. **Redirect** users from Spice UHIS admin web into the dashboard; auth and access are validated on bootstrap.
