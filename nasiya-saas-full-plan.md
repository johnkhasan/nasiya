# Nasiya/Qarz Kuzatuv SaaS — Mukammal Loyiha Rejasi (v2)

> Kichik do'kon va savdo nuqtalari uchun mijozlarga nasiya (qarzga) sotilgan tovarlarni, qarz holatini va to'lov eslatmalarini boshqarish tizimi. Multi-tenant SaaS, yakka dasturchi tomonidan qurilib, yuritiladi. Deploy: Contabo VPS (Ubuntu).

---

# I QISM — MAHSULOT VA ARXITEKTURA

## 1. Loyiha haqida

**Muammo**: Kichik savdo nuqtalari (oziq-ovqat, texnika do'koni, servis) mijozlarga nasiyaga sotadi va buni daftarga yozadi. Kim qancha qarzdor, qachon to'lashi kerak — kuzatish qiyin, adashish tez-tez bo'ladi.

**Yechim**: Mobil-friendly web tizim — do'kon egasi mijoz qo'shadi, qarz yozadi, to'lov qabul qiladi, mijozga Telegram (keyinroq SMS) orqali eslatma boradi.

**Target**: O'zbekiston, 10-500 nafar nasiya mijozi bor kichik/o'rta do'konlar.

**Monetizatsiya**:
| Tier | Narx (oy) | Cheklov |
|---|---|---|
| Free (trial) | 0 so'm, 30 kun | 20 mijozgacha |
| Basic | ~50 000 so'm | 100 mijozgacha, Telegram eslatma |
| Pro | ~150 000 so'm | Cheksiz mijoz, multi-user, hisobotlar, SMS |

Keyingi bosqichda Payme/Click orqali onlayn to'lov qabul qilish qo'shiladi (schema shunga tayyor qilinadi).

---

## 2. Tech Stack

| Qatlam | Texnologiya | Izoh |
|---|---|---|
| Frontend + Backend | Next.js 14+ (App Router, TypeScript) | Monorepo, API Route Handlers backend vazifasini bajaradi |
| Database | PostgreSQL 16 | Docker konteynerda |
| ORM | Prisma | Migratsiyalar bilan |
| Auth | NextAuth.js (Credentials) | Keyinroq telefon+OTP qo'shiladi |
| Styling | Tailwind CSS + shadcn/ui | Tez, minimal UI |
| Grafiklar | Recharts | Dashboard uchun |
| Bildirishnoma | Telegram Bot API (grammY kutubxonasi) | P1'da; SMS (Eskiz.uz) P2'da |
| Cron | node-cron (alohida worker konteyner) | Eslatmalar uchun |
| Reverse proxy | Nginx | SSL termination |
| SSL | Let's Encrypt (certbot) | Avtomatik yangilanish |
| Konteynerlash | Docker + Docker Compose | |
| CI/CD | GitHub Actions | push → build → SSH deploy |
| Monitoring | Uptime Kuma (self-hosted) + Docker logs | |
| Backup | pg_dump + cron → tashqi storage | Har kuni |

---

## 3. Multi-Tenancy Arxitekturasi

**Yondashuv**: shared database, `shopId` ustuni bilan izolyatsiya.

- Har bir do'kon (`Shop`) = bitta tenant.
- `Customer`, `Debt`, `User` jadvallarida `shopId` bor; `Payment` esa `Debt` orqali bilvosita bog'langan.
- **Izolyatsiya qatlamı**: barcha DB so'rovlar bitta joydan — `lib/db/` ichidagi repository funksiyalar orqali o'tadi, har biri majburiy `shopId` parametrini oladi. Sahifa/API kodida to'g'ridan-to'g'ri `prisma.customer.findMany()` chaqirish taqiqlanadi (ESLint rule bilan ham himoyalasa bo'ladi).
- Session'da `shopId` saqlanadi (NextAuth JWT callback), har bir request'da tekshiriladi.

Bu 100-500 tenant uchun to'liq yetarli; keyinroq kerak bo'lsa row-level security (RLS) yoki alohida schema'ga migratsiya qilinadi.

---

## 4. Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Shop {
  id        String   @id @default(cuid())
  name      String
  phone     String
  ownerName String
  plan      String   @default("trial") // trial, basic, pro
  planExpiresAt DateTime?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  users     User[]
  customers Customer[]
  debts     Debt[]
}

model User {
  id        String   @id @default(cuid())
  shopId    String
  shop      Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  phone     String   @unique  // login telefon raqam orqali — do'konchilar uchun tabiiyroq
  password  String
  fullName  String
  role      String   @default("owner") // owner, staff
  createdAt DateTime @default(now())

  @@index([shopId])
}

model Customer {
  id             String   @id @default(cuid())
  shopId         String
  shop           Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  fullName       String
  phone          String
  telegramChatId String?
  note           String?
  createdAt      DateTime @default(now())

  debts Debt[]

  @@index([shopId])
  @@index([shopId, phone])
}

model Debt {
  id          String    @id @default(cuid())
  shopId      String
  shop        Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  customerId  String
  customer    Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  amount      Decimal   @db.Decimal(14, 2)
  paidAmount  Decimal   @default(0) @db.Decimal(14, 2) // denormalizatsiya — tez hisoblash uchun
  description String?
  dueDate     DateTime?
  status      String    @default("open") // open, partially_paid, paid
  createdAt   DateTime  @default(now())

  payments  Payment[]
  reminders ReminderLog[]

  @@index([shopId, status])
  @@index([shopId, dueDate])
}

model Payment {
  id       String   @id @default(cuid())
  debtId   String
  debt     Debt     @relation(fields: [debtId], references: [id], onDelete: Cascade)
  amount   Decimal  @db.Decimal(14, 2)
  method   String   @default("cash") // cash | payme | click (keyinroq)
  note     String?
  paidAt   DateTime @default(now())
  createdBy String? // user id — kim qabul qildi

  @@index([debtId])
}

model ReminderLog {
  id      String   @id @default(cuid())
  debtId  String
  debt    Debt     @relation(fields: [debtId], references: [id], onDelete: Cascade)
  channel String   // telegram, sms
  status  String   // sent, failed
  sentAt  DateTime @default(now())

  @@index([debtId])
}

model AuditLog {
  id        String   @id @default(cuid())
  shopId    String
  userId    String
  action    String   // debt.create, payment.create, customer.delete ...
  entityId  String?
  meta      Json?
  createdAt DateTime @default(now())

  @@index([shopId, createdAt])
}
```

**Payme/Click uchun tayyorlik**: `Payment.method` allaqachon `payme`/`click` qiymatlarini qabul qiladi. Keyinroq faqat `PaymentProvider` jadvali + `/api/webhooks/payme` va `/api/webhooks/click` route'lari qo'shiladi — mavjud tuzilma o'zgarmaydi.

---

## 5. Feature Ro'yxati (Prioritet)

**P0 — MVP majburiy**
- Shop ro'yxatdan o'tish + login (telefon + parol)
- Mijozlar CRUD, qidiruv
- Qarz yozish (summa, tavsif, muddat)
- To'lov qabul qilish (naqd), qisman/to'liq yopish, status avtomatik
- Dashboard: umumiy qarzdorlik, muddati o'tganlar, top qarzdorlar, bugungi to'lovlar
- Mijoz kartochkasi: to'liq tarix
- Mobil-first responsive UI

**P1 — MVP'dan keyin darhol**
- Telegram bot: mijoz ulanishi, muddat eslatmasi (cron)
- Multi-user: owner + staff rollari
- Excel eksport (oylik hisobot)
- AuditLog UI

**P2 — Kelajak**
- Payme/Click integratsiyasi
- SMS (Eskiz.uz)
- Self-service billing (obuna to'lovi)
- PWA / mobil ilova
- Analitika: qarzdorlik trendi, mijoz "kredit reytingi"

---

## 6. Papka Tuzilishi

```
/app
  /(auth)/login, /register
  /(dashboard)
    /dashboard          — statistika
    /customers, /customers/[id]
    /debts
    /reports
    /settings           — do'kon sozlamalari, xodimlar
  /api
    /auth/[...nextauth]
    /customers, /debts, /payments
    /webhooks/telegram
/lib
  /db/                  — repository qatlami (shopId majburiy)
  /auth.ts
  /telegram.ts
/prisma/schema.prisma
/components/ui, /forms, /dashboard
/worker
  /reminder-cron.ts     — alohida konteynerda ishlaydigan cron
/docker
  /Dockerfile.app
  /Dockerfile.worker
  /nginx.conf
docker-compose.yml
```

---

# II QISM — CONTABO SERVER SETUP VA DEPLOY

## 7. Faza -1: Serverni tayyorlash (loyiha boshlashdan OLDIN, 1 kun)

Serverda hozir OnlyOffice Docker instansi ishlaydi va **disk deyarli to'lgan** — bu birinchi hal qilinishi kerak bo'lgan masala, aks holda PostgreSQL va Docker build'lar ishlamay qoladi.

### 7.1. Disk tozalash

```bash
# Holatni ko'rish
df -h
docker system df

# Docker keraksiz narsalarini tozalash (eng ko'p joy shu yerda ketadi)
docker system prune -a --volumes   # DIQQAT: ishlatilmayotgan image/volume'larni o'chiradi
                                   # avval `docker ps -a` va `docker volume ls` bilan tekshir

# Log fayllar
journalctl --disk-usage
journalctl --vacuum-size=200M
du -sh /var/log/* | sort -h

# OnlyOffice loglari/keshini tekshirish
docker exec <onlyoffice-container> du -sh /var/log/onlyoffice
```

Agar OnlyOffice endi kerak bo'lmasa (TipTap stack'ga o'tgan bo'lsang) — konteyner va uning volume'larini butunlay o'chirish eng katta joyni bo'shatadi:

```bash
docker stop <onlyoffice> && docker rm <onlyoffice>
docker volume ls | grep onlyoffice   # tegishli volume'larni aniqlab o'chir
```

**Maqsad**: kamida 15-20 GB bo'sh joy (PostgreSQL + Docker build cache + loglar uchun).

### 7.2. Docker log limitini o'rnatish (kelajakda disk to'lmasligi uchun)

`/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
```
```bash
sudo systemctl restart docker
```

### 7.3. Xavfsizlik hardening

```bash
# Yangilash
sudo apt update && sudo apt upgrade -y

# UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# fail2ban (SSH brute-force himoyasi)
sudo apt install fail2ban -y
sudo systemctl enable --now fail2ban

# SSH: faqat key bilan kirish (parol o'chirish)
# /etc/ssh/sshd_config:
#   PasswordAuthentication no
#   PermitRootLogin prohibit-password
sudo systemctl restart ssh

# Deploy uchun alohida user (root'da ishlamaslik)
sudo adduser deploy
sudo usermod -aG docker deploy
# SSH kalitingni deploy user'ga ham qo'sh: ~deploy/.ssh/authorized_keys
```

### 7.4. Domain va DNS

1. Domain sotib ol (masalan `nasiya.uz` yoki shunga o'xshash — ahtnomer.uz / cctld.uz orqali .uz domain).
2. A-record → Contabo server IP.
3. `app.<domain>` subdomain ham qo'shib qo'y (keyinroq landing sahifa asosiy domenda, ilova subdomenida bo'lishi mumkin).

---

## 8. Docker Compose Arxitekturasi

`docker-compose.yml` (serverda):

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: nasiya
      POSTGRES_USER: nasiya
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    # Port TASHQARIGA OCHILMAYDI — faqat ichki network
    networks: [internal]

  app:
    image: ghcr.io/<username>/nasiya-app:latest
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://nasiya:${DB_PASSWORD}@db:5432/nasiya
      NEXTAUTH_URL: https://app.<domain>
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
    depends_on: [db]
    networks: [internal]

  worker:
    image: ghcr.io/<username>/nasiya-worker:latest
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://nasiya:${DB_PASSWORD}@db:5432/nasiya
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
    depends_on: [db]
    networks: [internal]

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - certbot-etc:/etc/letsencrypt:ro
      - certbot-www:/var/www/certbot
    depends_on: [app]
    networks: [internal]

  certbot:
    image: certbot/certbot
    volumes:
      - certbot-etc:/etc/letsencrypt
      - certbot-www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h; done'"

  uptime-kuma:
    image: louislam/uptime-kuma:1
    restart: unless-stopped
    ports: ["127.0.0.1:3001:3001"]   # faqat SSH tunnel orqali kirish
    volumes:
      - kuma-data:/app/data

volumes:
  pgdata:
  certbot-etc:
  certbot-www:
  kuma-data:

networks:
  internal:
```

**Muhim tamoyillar**:
- PostgreSQL porti internetga ochilmaydi (faqat Docker ichki tarmog'ida).
- App image'lari GitHub Container Registry (ghcr.io)'da build qilinadi — serverda build qilinmaydi (disk va CPU tejaladi).
- `.env` fayl serverda, git'da EMAS.

### 8.1. Nginx konfiguratsiya (asosiy qismlar)

```nginx
server {
    listen 80;
    server_name app.<domain>;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name app.<domain>;

    ssl_certificate     /etc/letsencrypt/live/app.<domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.<domain>/privkey.pem;

    # Rate limiting (brute-force himoya)
    limit_req_zone $binary_remote_addr zone=applimit:10m rate=20r/s;
    limit_req zone=applimit burst=40 nodelay;

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 8.2. Birinchi marta SSL olish

```bash
# nginx'ni faqat 80-port bilan ishga tushirib, keyin:
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot -d app.<domain> --email <email> --agree-tos
docker compose restart nginx
```

---

## 9. CI/CD — GitHub Actions

`.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & push app image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile.app
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/nasiya-app:latest

      - name: Build & push worker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile.worker
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/nasiya-worker:latest

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/deploy/nasiya
            docker compose pull app worker
            docker compose up -d app worker
            docker compose exec -T app npx prisma migrate deploy
            docker image prune -f
```

**GitHub Secrets**: `SERVER_HOST`, `SSH_PRIVATE_KEY` (deploy user uchun alohida kalit).

**Dockerfile.app** (Next.js standalone):

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json prisma ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

(`next.config.js`'da `output: 'standalone'` yoqilishi kerak.)

---

## 10. Backup Strategiyasi

Moliyaviy ma'lumot — backup MAJBURIY, birinchi kundan.

```bash
# /home/deploy/scripts/backup.sh
#!/bin/bash
DATE=$(date +%F_%H%M)
docker compose -f /home/deploy/nasiya/docker-compose.yml exec -T db \
  pg_dump -U nasiya nasiya | gzip > /home/deploy/backups/nasiya_$DATE.sql.gz

# 14 kundan eski backuplarni o'chirish (disk to'lmasligi uchun)
find /home/deploy/backups -name "*.sql.gz" -mtime +14 -delete
```

```bash
# crontab -e (deploy user):
0 3 * * * /home/deploy/scripts/backup.sh
```

**Off-site nusxa** (server o'lsa ham ma'lumot qolishi uchun): haftada bir marta backup faylini boshqa joyga ko'chirish — eng oddiy variant: `rclone` bilan istalgan S3-compatible storage'ga (yoki hatto shaxsiy kompyuteringga `scp` bilan tortib olish). Bu bosqichni Faza 6'da avtomatlashtir.

**Restore testi**: kamida bir marta backup'dan tiklashni sinab ko'r — sinab ko'rilmagan backup backup emas.

---

## 11. Monitoring va Loglar

- **Uptime Kuma** (compose'da bor): app URL'iga har daqiqa ping, o'chsa Telegram'ga xabar yuboradi (Telegram notification'i ichida sozlanadi).
- **Disk monitoring** (o'tmishdagi muammo qaytmasligi uchun!):

```bash
# /home/deploy/scripts/disk-alert.sh — 85% dan oshsa Telegramga xabar
#!/bin/bash
USAGE=$(df / --output=pcent | tail -1 | tr -dc '0-9')
if [ "$USAGE" -gt 85 ]; then
  curl -s "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
    -d chat_id=$ADMIN_CHAT_ID -d text="⚠️ Server disk: ${USAGE}%"
fi
```
```bash
# crontab: har soatda
0 * * * * /home/deploy/scripts/disk-alert.sh
```

- **App loglari**: `docker compose logs -f app` — jiddiy bosqichda Sentry (bepul tier) qo'shish mumkin.

---

# III QISM — ROADMAP (FAZALAR)

To'liq vaqt bilan, jami **~9-11 hafta** MVP + deploy + Telegram bot.

### Faza -1 — Server tayyorlash (1-2 kun)
- [ ] Disk tozalash (OnlyOffice/Docker prune), 15-20 GB bo'sh joy
- [ ] Docker log limiti, UFW, fail2ban, deploy user, SSH hardening
- [ ] Domain sotib olish, DNS A-record
- [ ] Disk-alert cron o'rnatish

### Faza 0 — Loyiha skeleti (3-4 kun)
- [ ] Next.js (TS, Tailwind, App Router, `output: 'standalone'`)
- [ ] Prisma + lokal PostgreSQL (Docker) — schema migratsiyasi
- [ ] Repository qatlami (`lib/db/`) skeleti — shopId majburiy pattern
- [ ] GitHub repo + GHCR + deploy workflow skeleti

### Faza 1 — Auth va onboarding (1 hafta)
- [ ] Ro'yxatdan o'tish: Shop + owner User (telefon + parol)
- [ ] NextAuth login/logout, JWT'da shopId
- [ ] Middleware: dashboard route'lari himoyalangan
- [ ] Trial plan avtomatik (30 kun)

### Faza 2 — Mijozlar va qarzlar (1.5-2 hafta)
- [ ] Customer CRUD + qidiruv (telefon/ism bo'yicha)
- [ ] Debt yaratish, status logikasi (paidAmount asosida)
- [ ] Mijoz kartochkasi: qarzlar + to'lovlar tarixi
- [ ] Mobil-first UI (do'konchi telefondan ishlatadi!)

### Faza 3 — To'lovlar va Dashboard (1-1.5 hafta)
- [ ] Payment yozish → Debt.paidAmount/status yangilash (tranzaksiyada!)
- [ ] Dashboard: umumiy qarzdorlik, muddati o'tganlar, top qarzdorlar (Recharts)
- [ ] Excel eksport (exceljs)
- [ ] AuditLog yozish (har bir moliyaviy amal)

### Faza 4 — Birinchi deploy (3-4 kun)
- [ ] Docker Compose serverda, SSL (certbot)
- [ ] CI/CD to'liq ishga tushirish (push → auto deploy)
- [ ] Backup cron + restore testi
- [ ] Uptime Kuma sozlash
- [ ] **Shu bosqichda 2-3 ta tanish do'konga pilot sifatida berish!**

### Faza 5 — Telegram bot (1 hafta)
- [ ] Bot yaratish (grammY), webhook `/api/webhooks/telegram`
- [ ] Mijoz ulanishi: do'kon mijozga havola beradi → chat_id bog'lanadi
- [ ] Worker cron: dueDate yaqin/o'tgan qarzlar uchun eslatma
- [ ] ReminderLog yozish, spam himoyasi (kuniga 1 marta)

### Faza 6 — Multi-user va polish (1-1.5 hafta)
- [ ] Staff qo'shish, rol tekshiruvi (staff o'chira olmaydi, faqat yozadi)
- [ ] Off-site backup avtomatlashtirish
- [ ] Rate limiting, input validatsiya auditi (zod)
- [ ] Pilot feedback asosida tuzatishlar

### Faza 7 — Kommertsiyalash (davomiy)
- [ ] Landing sahifa (asosiy domen)
- [ ] Narx sahifasi, plan cheklovlari enforce qilish
- [ ] Payme/Click: obuna to'lovi qabul qilish (birinchi), keyin do'kon o'z mijozlaridan onlayn to'lov qabul qilishi (ikkinchi)
- [ ] SMS (Eskiz.uz) Pro tier uchun

---

# IV QISM — RISKLAR

| Risk | Yechim |
|---|---|
| Disk yana to'lishi | Log limitlari + backup rotatsiya + disk-alert cron (Faza -1'da hal) |
| Server o'chishi → ma'lumot yo'qolishi | Kunlik backup + off-site nusxa + restore testi |
| Moliyaviy hisob-kitob xatosi (eng jiddiy!) | Payment yozish faqat DB tranzaksiyada; Decimal tip (float EMAS); AuditLog |
| Ishonch (pul masalasi) | Bepul trial, tanish do'konlardan boshlash, oddiy UI |
| Yakka support yuki | 5-10 pilot bilan cheklanish; Telegram guruh orqali support |
| Xavfsizlik (tenant izolyatsiyasi buzilishi) | Repository qatlami, code review checklist, har feature'da izolyatsiya testi |

---

# V QISM — CLAUDE CODE UCHUN KICKOFF

Claude Code'ga quyidagicha ish tartibi bilan ber — har fazani alohida sessiyada:

**1-sessiya (Faza 0):**
```
Men "Nasiya" nomli multi-tenant SaaS quraman — kichik do'konlar uchun nasiya/qarz 
kuzatuv tizimi.

Stack: Next.js 14 App Router + TypeScript, Prisma + PostgreSQL, NextAuth (Credentials, 
telefon+parol), Tailwind + shadcn/ui, output: 'standalone'.

Multi-tenancy: shared DB, shopId ustuni. MUHIM QOIDA: barcha DB so'rovlar lib/db/ 
ichidagi repository funksiyalar orqali o'tsin, har biri shopId parametrini majburiy 
qabul qilsin. Sahifa/API kodida to'g'ridan-to'g'ri prisma.* chaqirish taqiqlangan.

Vazifa:
1. Loyihani init qil (create-next-app, TS, Tailwind, App Router)
2. docker-compose.dev.yml yoz — lokal PostgreSQL 16 uchun
3. Quyidagi Prisma schema'ni o'rnat va birinchi migratsiyani bajar:
[SCHEMA'NI 4-BO'LIMDAN NUSXALA]
4. lib/db/ repository skeletini yarat (customers.ts, debts.ts, payments.ts)

Har bosqichdan keyin qisqacha tushuntir va davom etishdan oldin tasdiq so'ra.
```

**Keyingi sessiyalar**: Faza 1 → Faza 2 → ... tartibida, har safar roadmap'dagi checklist'ni prompt sifatida ber. Deploy fazasida (Faza 4) esa II QISM'dagi compose/nginx/workflow fayllarini tayyor namuna sifatida ilova qil.

---

# Xulosa

Bu reja endi nafaqat kod, balki butun lifecycle'ni qamrab oladi: server tayyorlash (disk muammosi bilan birga), xavfsizlik, CI/CD, backup, monitoring, va bosqichma-bosqich kommertsiyalash. Eng muhim tartib: **avval Faza -1 (server)**, chunki disk to'lgan holatda deploy ham, PostgreSQL ham ishlamaydi. MVP'ni Faza 4'da darhol 2-3 pilot do'konga berish — real feedback'siz Faza 5-6'ga o'tmagan ma'qul.
