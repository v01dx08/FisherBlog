# Nhat ky ngay di cau - Ke hoach production readiness

Cap nhat: 2026-09-04

## Trang thai hien tai

Code hien tai san sang deploy beta mot node bang Docker Compose. Cac luong chinh da co: dang nhap, quan tri, bai viet, media rieng tu/cong khai, proof SHA-256 v2, publication links, feed SSR, SEO dong, rate limit, structured log, health check va data export.

## Da hoan tat

### P0 - Toan ven va bao mat

- Proof v2 luu canonical payload va SHA-256 cua byte media upload.
- Proof API tu bam lai payload va tra `independentlyVerified`.
- Cookie HTTP-only, same-site, secure production; CSRF same-origin; session revoke bang version.
- PostgreSQL rate limit cho upload, bai viet, binh luan, tin nhan, like, bookmark, follow, profile, password va admin.
- Upload gioi han 15 MB, kiem tra MIME signature, private access va cache policy dung theo visibility.
- Request ID tren moi request; log JSON cho startup, health va loi server.
- Dependency production: `npm audit --omit=dev` = 0 vulnerability.

### P1 - Hieu nang va van hanh

- Feed dau tien render tren server; khong con client waterfall cho noi dung chinh.
- Message unread count bo N+1 query.
- Search tag gioi han tap du lieu; Docker build co npm cache.
- Migration tach thanh service one-shot; web replica khong tu migrate.
- Runtime image standalone, read-only filesystem, drop Linux capabilities, non-root user.
- Database va web co health check; media va database co persistent volume.

### P2 - SEO va UX

- Metadata dong, canonical, Open Graph/Twitter cho bai viet va profile cong khai.
- Dynamic sitemap, robots, manifest, OG image va logo Nhat ky ngay di cau dong bo.
- Login/admin `noindex`; private/unlisted post khong co metadata indexable.
- Error, global error, loading, not-found UI; retry va loi inline thay cho alert.
- Header/sidebar fixed; feed scroll doc lap; light default; dark navy; mobile bottom navigation.
- Dialog/lightbox co semantics, Escape, focus ban dau, body scroll lock va keyboard navigation.
- Data export JSON trong Settings.

## Gate bat buoc truoc public launch

### Ha tang chung cu

1. Chuyen media sang S3/R2 tuong thich, bat versioning va Object Lock/WORM.
2. Gan trusted timestamp ben ngoai (RFC 3161 TSA hoac nha cung cap tuong duong) vao proof hash.
3. Ky proof export bang khoa tach khoi app; luu khoa trong KMS/HSM.
4. Chay backfill digest cho media cu; bai v1 van phai hien nhan `legacy`, khong tu nang cap gia.

### Tai khoan va abuse

1. Bat MFA TOTP/WebAuthn cho admin; recovery codes va revoke active sessions.
2. Them email verification, forgot-password va notification security.
3. Them workflow report/copyright case: OPEN, REVIEWING, RESOLVED, REJECTED, counter-notice, SLA va audit trail.
4. Them account deletion, retention scheduler va xoa object media theo policy.

### Recovery va observability

1. Backup PostgreSQL hang ngay; backup object storage; ma hoa; retention toi thieu 30 ngay.
2. Restore drill tren moi truong sach; ghi RPO/RTO va ket qua.
3. Day JSON log vao monitoring vendor; alert theo error rate, p95 latency, DB/storage health va disk usage.
4. Them error tracking, uptime check ngoai he thong va Core Web Vitals field data.

### Kiem thu

1. Them E2E browser tren CI cho auth, authorization matrix, private media, proof, admin va mobile.
2. Them concurrency test cho rate limit, like/follow toggle va publication uniqueness.
3. Them restore test va migration test tu database production snapshot da an danh.
4. Chay accessibility audit bang keyboard, screen reader va axe/Lighthouse tren Chrome, Safari, Firefox.

## Lenh release

```powershell
npm.cmd run check
npm.cmd audit --omit=dev
docker compose up -d --build
npm.cmd run test:smoke
docker compose ps -a
docker compose logs web migrate --no-color --tail 100
```

## Tieu chi go-live

- Tat ca lenh release pass; `database` va `web` healthy; `migrate` exit 0.
- Da thay toan bo `CHANGE_ME`; rotate/xoa tai khoan va mat khau test.
- TLS, DNS, reverse proxy, backup, monitoring va alert da hoat dong.
- Proof moi co media digest, external timestamp va immutable object version.
- Admin MFA bat buoc; report workflow co nguoi truc va SLA.
- Restore drill pass; khong chi co backup ma chua tung khoi phuc.
