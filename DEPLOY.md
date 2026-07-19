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

Point your domain's DNS A-record (`app.yourdomain.uz`) at the server's IP before continuing.

## 1. Checkout the repo on the server

```bash
su - deploy
git clone https://github.com/johnkhasan/nasiya.git
cd nasiya
cp .env.production.example .env
# edit .env: DB_PASSWORD, DOMAIN, AUTH_SECRET (openssl rand -base64 32), GHCR_OWNER
```

Replace `app.YOUR_DOMAIN` with your real domain in `docker/nginx.conf` and
`docker/nginx.bootstrap.conf`.

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

Visit `https://app.yourdomain.uz` — you should hit `/login`.

## 5. GitHub Actions secrets

In the repo's Settings → Secrets and variables → Actions, add:

- `SERVER_HOST` — the server's IP or hostname
- `SSH_PRIVATE_KEY` — private key matching a public key in
  `~deploy/.ssh/authorized_keys` (a dedicated deploy key, not your personal one)

After that, every push to `main` builds both images, pushes to GHCR, then
SSHes in to run migrations and restart `app` (see
`.github/workflows/deploy.yml`).

## 6. Backups

```bash
mkdir -p /home/deploy/backups
chmod +x scripts/backup.sh scripts/disk-alert.sh
crontab -e
# 0 3 * * * /home/deploy/nasiya/scripts/backup.sh
# 0 * * * * BOT_TOKEN=... ADMIN_CHAT_ID=... /home/deploy/nasiya/scripts/disk-alert.sh
```

Test a restore at least once — `zcat backup.sql.gz | docker compose exec -T db psql -U nasiya nasiya`
against a throwaway database, not production.

## 7. Uptime Kuma

`http://<server-ip>:3001` is bound to localhost only — reach it via an SSH
tunnel (`ssh -L 3001:localhost:3001 deploy@<server-ip>`) and add a monitor
for `https://app.yourdomain.uz` with a Telegram notification.
