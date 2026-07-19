# Deploy — Contabo VPS

One-time setup to get `main` auto-deploying to production. Do these in order.

## 0. Server prep (if not already done)

```bash
# Disk: check first, PostgreSQL + image builds need real headroom
df -h
docker system df
docker system prune -a --volumes   # check `docker ps -a` / `docker volume ls` first

# Docker log limits (prevents disk from filling up again)
sudo tee /etc/docker/daemon.json <<'EOF'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }
EOF
sudo systemctl restart docker

# Firewall + brute-force protection
sudo apt update && sudo apt upgrade -y
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable
sudo apt install -y fail2ban && sudo systemctl enable --now fail2ban

# Deploy user (don't deploy as root)
sudo adduser deploy
sudo usermod -aG docker deploy
# copy your deploy SSH public key into ~deploy/.ssh/authorized_keys
```

Point your domain's DNS A-record (e.g. `app.yourdomain.uz`) at the server's
IP before continuing.

## 1. Checkout the repo on the server

Pick any directory the `deploy` user can read/write and that matches
`.github/workflows/deploy.yml`'s `cd` target (currently `/srv/nasiya`) —
adjust one or the other if you use a different path.

```bash
git clone https://github.com/johnkhasan/nasiya.git /srv/nasiya
chown -R deploy:deploy /srv/nasiya
su - deploy -c "cd /srv/nasiya && cp .env.production.example .env"
# edit .env: DB_PASSWORD, AUTH_URL (full https:// URL), AUTH_SECRET
# (openssl rand -base64 32), GHCR_OWNER
```

If this is a fresh, dedicated server, also replace `app.YOUR_DOMAIN` in
`docker/nginx.conf` and `docker/nginx.bootstrap.conf` with your real domain,
and skip straight to step 3 (standalone SSL bootstrap). If instead you're
sharing a server with another project that already owns ports 80/443, read
"Shared nginx" right below first — it replaces steps 2–3.

### Shared nginx (another project already owns 80/443)

`docker-compose.override.yml` is active by default and expects a
`SHARED_INGRESS_NETWORK` value in `.env` — the other project's Docker
Compose network name (`docker network ls`, usually `<projectdir>_default`).
`nasiya`'s own `nginx`/`certbot` stay off (they're gated behind the
`standalone-nginx` profile); `app` instead joins that network so the other
project's nginx can reach it directly as `nasiya-app-1` (or whatever
`docker compose ps` shows).

You still need a cert for your subdomain and a route to it in the other
project's nginx config — outside this repo since it's the other project's
files. In short: add an ACME-challenge webroot location to its port-80
server block, run `certbot certonly --webroot` for your subdomain, point a
new `server { listen 443 ssl; server_name your.subdomain; }` block at
`http://nasiya-app-1:3000`, and recreate that nginx container so it can
resolve the new network. Then skip to step 4.

Two gotchas hit while first setting this up (already fixed in this repo's
`docker-compose.yml`, but worth knowing if something similar resurfaces):
- If the other project *also* has a service literally named `db`, its
  nginx-adjacent containers on the shared network can resolve the plain
  `db` alias to the WRONG Postgres once `app` joins that network too —
  Prisma reports it as "password authentication failed" even though the
  credentials are fine, since it's just talking to a different database
  entirely. Fixed by giving nasiya's db an explicit unique
  `container_name` and referencing that name, not `db`, in `DATABASE_URL`.
- Next.js standalone's `server.js` binds to `process.env.HOSTNAME` if
  set, and Docker sets `HOSTNAME` to the container ID for every
  container by default — normally harmless, but with `app` on two
  networks that ID resolved to only one of them, so the other network's
  nginx got connection-refused even though the app was clearly running.
  Fixed by forcing `HOSTNAME=0.0.0.0` in `app`'s environment.

## 2. Authenticate the server to pull from GHCR

The images this repo's CI builds (`ghcr.io/<owner>/nasiya-app`,
`nasiya-migrate`) are private by default. The server needs its own login,
separate from CI's:

```bash
# on GitHub: Settings → Developer settings → Personal access tokens →
# fine-grained token with "read:packages" scope
echo '<token>' | docker login ghcr.io -u <your-github-username> --password-stdin
```

## 3. First SSL certificate (chicken-and-egg bootstrap)

`docker/nginx.conf` references certificate files that don't exist yet, so
nginx can't start with it on the very first run. Bootstrap with the
HTTP-only config first:

```bash
cp docker/nginx.bootstrap.conf docker/nginx.conf.active
# docker-compose.yml mounts docker/nginx.conf — swap it in temporarily:
cp docker/nginx.conf docker/nginx.conf.full   # keep the real one safe
cp docker/nginx.bootstrap.conf docker/nginx.conf

docker compose up -d nginx
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot -d app.yourdomain.uz --email you@example.com --agree-tos

# swap the real config back in and restart
cp docker/nginx.conf.full docker/nginx.conf
docker compose restart nginx
```

(`certbot` isn't in `docker-compose.yml`'s default `up` set for this
one-off run — either add it temporarily or run it via
`docker compose run --rm --entrypoint sh certbot -c '...certonly...'` if the
service's own entrypoint loop gets in the way.)

## 4. First deploy

```bash
docker compose run --rm migrate
docker compose up -d
```

Visit `https://<AUTH_URL host>` — you should hit `/login`.

## 5. GitHub Actions secrets

In the repo's Settings → Secrets and variables → Actions, add:

- `SERVER_HOST` — the server's IP or hostname
- `SSH_PRIVATE_KEY` — private key matching a public key in
  `~deploy/.ssh/authorized_keys` (a dedicated deploy key, not your personal one)

After that, every push to `main` builds all three images, pushes to GHCR,
then SSHes in to run migrations and restart `app` + `worker` (see
`.github/workflows/deploy.yml`).

## 6. Telegram bot

1. Talk to [@BotFather](https://t.me/BotFather), `/newbot`, get the token
   and the bot's `@username`.
2. Add to the server's `.env`: `TELEGRAM_BOT_TOKEN` and
   `TELEGRAM_BOT_USERNAME` (no `@`), then `docker compose up -d app worker`.
3. Register the webhook (one-time, replace both placeholders):

   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<AUTH_URL host>/api/webhooks/telegram"
   ```

   Optionally add `&secret_token=<random-string>` and set the same value as
   `TELEGRAM_WEBHOOK_SECRET` in `.env` — the webhook route checks it if
   present.
4. From a customer's page in the app, copy their connect link and open it
   in Telegram, press Start — their `telegramChatId` gets saved and they'll
   receive reminders. `worker` checks daily (default 09:00, configurable via
   `REMINDER_CRON_SCHEDULE`) for debts due tomorrow or overdue and messages
   any customer who has connected, at most once per day per debt.

## 7. Backups

```bash
mkdir -p /home/deploy/backups
chmod +x scripts/backup.sh scripts/disk-alert.sh
crontab -e
# 0 3 * * * /home/deploy/nasiya/scripts/backup.sh
# 0 * * * * BOT_TOKEN=... ADMIN_CHAT_ID=... /home/deploy/nasiya/scripts/disk-alert.sh
```

Test a restore at least once — `zcat backup.sql.gz | docker compose exec -T db psql -U nasiya nasiya`
against a throwaway database, not production.

## 8. Uptime Kuma

`http://<server-ip>:3001` is bound to localhost only — reach it via an SSH
tunnel (`ssh -L 3001:localhost:3001 deploy@<server-ip>`) and add a monitor
for `https://<AUTH_URL host>` with a Telegram notification.
