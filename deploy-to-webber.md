# Deploying the TfCA Demo App to webber

Target: `https://demo.canopyds.com`
App: Next.js 16 in `app/` — port 3001, no database

---

## Infrastructure overview

```
Internet → Cloudflare edge → cloudflared tunnel → localhost:80 → Traefik (coolify-proxy) → app container
```

- **webber** — Ubuntu 24.04, 8 CPU / 14 GB RAM, ~196 GB free
- **Coolify** — manages apps and Traefik. Dashboard: `https://coolify.canopyds.com`
- **Cloudflare tunnel** — `*.canopyds.com` is wildcarded to `localhost:80`, so `demo.canopyds.com` needs no extra DNS or tunnel config.
- **Traefik** — `coolify-proxy` Docker network. Coolify writes labels; do not configure Traefik directly.

---

## Prerequisites

1. **SSH access** — `ssh webber` goes through Cloudflare Access:
   ```
   Host webber
       HostName webber.canopyds.com
       User truehoax
       ProxyCommand cloudflared access ssh --hostname %h
   ```
   If the token is expired: `cloudflared access login https://webber.canopyds.com`

2. **Coolify API token** — generate one in the Coolify dashboard (Profile → API Tokens). Create a fresh one per session if needed.

3. **GitHub repo** — must be added to the `canopy-coolify-webber` GitHub App (GitHub → Settings → GitHub Apps → `canopy-coolify-webber` → Repository access).

   **Important:** push the contents of `app/` as the repo root — not the `demo/` folder. There's no `package.json` at the `demo/` root, so nixpacks will fail if it sees that level.

---

> **Token expansion:** every `curl` below uses `$COOLIFY_TOKEN` **unescaped** so it expands *locally* before the SSH command is sent (the token lives in this machine's Claude env and `~/.bashrc`). Do **not** escape it as `\$COOLIFY_TOKEN` expecting webber to expand it — `~/.profile` is not sourced for non-login SSH commands, so it comes through empty and you get `{"message":"Unauthenticated."}`.

## Step 1 — Project (already exists)

The **Demo Server** project already exists and is reused for whatever demo is current (it rotates by project). No need to create it.

- Project uuid: `dosgcwgwk0sk4oscs4gkswgc`
- Server uuid (webber): `joo04oggg000k08ocgswcoo0`

To create one from scratch: `POST /api/v1/projects -d '{"name":"..."}'` → returns `uuid`.

---

## Step 2 — Create the application

**Use the source-specific endpoint.** `demo` is a private repo reached through the `canopyds-github` GitHub App, so the endpoint is `/applications/private-github-app`. The bare `POST /api/v1/applications` does **not** exist and returns `{"message":"Not found."}`.

**Create fresh — never convert an existing static-build-pack app.** A static app stores Traefik `custom_labels` hardcoded to port 80 plus a `custom_nginx_configuration`. Those survive a `build_pack` change (Coolify treats labels as readonly once set) and silently route Traefik to port 80 → endless 502s even though the container is healthy on 3001. A fresh app generates correct labels from `ports_exposes`. If you must reuse a domain, delete the old app first (`DELETE /api/v1/applications/<uuid>?delete_configurations=true`).

```bash
ssh webber "curl -s -X POST http://localhost:8000/api/v1/applications/private-github-app \
  -H 'Authorization: Bearer $COOLIFY_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    \"project_uuid\": \"dosgcwgwk0sk4oscs4gkswgc\",
    \"server_uuid\": \"joo04oggg000k08ocgswcoo0\",
    \"environment_name\": \"production\",
    \"github_app_uuid\": \"u4ogwk4kww04g484w8wswswk\",
    \"git_repository\": \"Canopy-Digital-Services/demo\",
    \"git_branch\": \"main\",
    \"build_pack\": \"nixpacks\",
    \"ports_exposes\": \"3001\",
    \"base_directory\": \"/app\",
    \"name\": \"demo site\",
    \"domains\": \"http://demo.canopyds.com\",
    \"instant_deploy\": false
  }'"
```

Notes:
- The Next.js app lives in `app/`, so `base_directory` is `/app` — no need to push `app/` to the repo root.
- Field is `git_branch` (not `branch`); `git_repository` is `owner/repo` (not a full URL).
- **`domains` must use `http://`, not `https://`.** Coolify adds a Traefik redirect-to-https middleware when it sees `https://`; with Cloudflare terminating TLS before the tunnel that causes an infinite redirect loop.

Note the returned application `uuid` — that's `APP_UUID`.

---

## Step 3 — Set environment variables

Env vars are created **one per request** via `POST .../envs` (there is no bulk `data` array). The flag is `is_buildtime` (not `is_build_time`).

```bash
for kv in 'NODE_ENV production false' 'APP_URL https://demo.canopyds.com false' 'NIXPACKS_NODE_VERSION 22 true'; do
  set -- $kv
  ssh webber "curl -s -X POST http://localhost:8000/api/v1/applications/<APP_UUID>/envs \
    -H 'Authorization: Bearer $COOLIFY_TOKEN' -H 'Content-Type: application/json' \
    -d '{\"key\":\"$1\",\"value\":\"$2\",\"is_buildtime\":$3}'"
done
```

**Set `NODE_ENV` as runtime-only (`is_buildtime:false`).** If `NODE_ENV=production` is present at build time, nixpacks skips devDependencies and the Next.js build fails (no TypeScript/webpack). `NIXPACKS_NODE_VERSION` is the one that must be build-time. To update an existing var, use `PATCH` instead of `POST` (`POST` on an existing key returns "already exists").

---

## Step 4 — Deploy

```bash
ssh webber "curl -s -H 'Authorization: Bearer \$COOLIFY_TOKEN' \
  'http://localhost:8000/api/v1/deploy?uuid=<APP_UUID>&force=true'"
```

The Coolify API only accepts requests from `127.0.0.1` and `192.168.1.0/24`, so always run this through `ssh webber`. Watch build logs in the Coolify dashboard or poll:

```bash
ssh webber "curl -s -H 'Authorization: Bearer \$COOLIFY_TOKEN' \
  'http://localhost:8000/api/v1/applications/<APP_UUID>/logs'"
```

---

## Step 5 — Verify

```bash
curl -sI https://demo.canopyds.com/
# expect: HTTP/2 200
```

If you get a redirect loop, the `domains` field in Coolify has `https://` — change it to `http://` and redeploy.

If you get a 502/504, the container isn't listening on port 3001 or hasn't finished starting. Check logs.

---

## Fixed constants

| Thing | Value |
|---|---|
| Target URL | `https://demo.canopyds.com` |
| App port | `3001` |
| Demo Server project uuid | `dosgcwgwk0sk4oscs4gkswgc` |
| webber server uuid | `joo04oggg000k08ocgswcoo0` |
| GitHub App uuid | `u4ogwk4kww04g484w8wswswk` (id `4`) |
| GitHub App name | `canopyds-github` (org `Canopy-Digital-Services`) |
| Coolify dashboard | `https://coolify.canopyds.com` |
| Coolify API (from webber) | `http://localhost:8000/api/v1` |
| canopyds.com zone id | `1c29174bfed016063a1e964c98fe6366` |
| webber tunnel uuid | `f6e65907-23d6-4e4c-94bc-413c07652a64` |

---

## Gotchas

- **Never set `domains` to `https://` in Coolify** — infinite redirect loop with the Cloudflare tunnel.
- **Never convert a static app to nixpacks/dockerfile** — stale port-80 `custom_labels` + `custom_nginx_configuration` persist and cause 502s. Delete and recreate fresh (see Step 2).
- **Use the source-specific create endpoint** (`/applications/private-github-app`) — `/applications` returns "Not found."
- **`$COOLIFY_TOKEN` must expand locally** — unescaped in the SSH command. Escaped `\$COOLIFY_TOKEN` comes through empty (`~/.profile` not sourced for non-login SSH) → "Unauthenticated."
- **`NODE_ENV` must be runtime-only** — at build time it strips devDependencies and the Next.js build fails.
- **Coolify API token is stored, not per-session** — it's in this machine's Claude env + `~/.bashrc` + webber `~/.profile`. If calls return 401, regenerate in the dashboard and update those.
- **webber reboots require a physical LUKS passphrase** — don't reboot remotely unless you're at the console.
- **`sudo` required** for `/data/coolify/` and `/etc/cloudflared/` — use `ssh webber "sudo bash -c '...'"`.
