# Deploy Nhật ký ngày đi câu to an Ubuntu VPS

Quy trình triển khai bản beta một máy của `fishviet.vn` bằng Docker Compose, Nginx và Let's Encrypt.

## Prerequisites

- VPS Ubuntu 24.04 LTS, tối thiểu 2 vCPU, 4 GB RAM và 40 GB SSD.
- SSH key đã đăng nhập được bằng tài khoản có quyền `sudo`.
- DNS `A` của `fishviet.vn` trỏ tới IPv4 VPS. Chỉ thêm `AAAA` khi IPv6 hoạt động.
- Firewall nhà cung cấp chỉ mở TCP `22`, `80`, `443`.
- Quyền quản trị repo private `v01dx08/FisherBlog` để thêm SSH deploy key chỉ đọc.
- Mật khẩu admin và thông tin pháp nhân thật. Không dùng credential mẫu trong README.

## Context

Hệ thống gồm PostgreSQL 16 (`database`), migrator Prisma chạy một lần (`migrate`) và Next.js standalone (`web`). Nginx nhận HTTPS rồi chuyển tiếp vào `127.0.0.1:3000`. Database và media nằm trong Docker volume bền vững.

Đây là cấu hình beta một VPS. Trước public launch có yêu cầu chứng cứ mạnh, cần hoàn tất Object Lock/WORM, timestamp RFC 3161, ký proof bằng KMS/HSM, admin MFA, backup off-site và restore drill trong `PRODUCTION_READINESS.md`.

## Procedure

1. Cài công cụ nền.

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git jq nginx certbot python3-certbot-nginx ufw
sudo timedatectl set-timezone Asia/Ho_Chi_Minh
sudo timedatectl set-ntp true
```

2. Cài Docker Engine chính thức.

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker nginx
sudo docker compose version
```

Docker Compose phải từ `v2.24.4` trở lên.

3. Bật firewall trước khi chạy ứng dụng.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status verbose
```

Không mở `3000` hoặc `5432` trên VPS hay firewall nhà cung cấp.

4. Tạo SSH deploy key cho repo private.

```bash
sudo install -d -m 0700 /root/.ssh
sudo ssh-keygen -t ed25519 -C "fishviet-vps-readonly" -f /root/.ssh/fishviet_deploy -N ''
sudo cat /root/.ssh/fishviet_deploy.pub
```

Copy toàn bộ public key vừa in vào GitHub: repo `v01dx08/FisherBlog` → **Settings** → **Deploy keys** → **Add deploy key**. Không bật **Allow write access**. Không bao giờ copy hoặc gửi file `/root/.ssh/fishviet_deploy`.

```bash
sudo tee /root/.ssh/config >/dev/null <<'SSH'
Host github-fishviet
    HostName github.com
    User git
    IdentityFile /root/.ssh/fishviet_deploy
    IdentitiesOnly yes
SSH
sudo chmod 600 /root/.ssh/config /root/.ssh/fishviet_deploy
sudo chmod 644 /root/.ssh/fishviet_deploy.pub
ssh -T github-fishviet
```

Lần kết nối đầu, chỉ chấp nhận host key sau khi đối chiếu fingerprint với tài liệu chính thức của GitHub. Thông báo `successfully authenticated` kèm việc GitHub không cung cấp shell là kết quả đúng.

Clone mã nguồn:

```bash
sudo install -d -o root -g root /opt/fishviet
git clone --branch master --single-branch git@github-fishviet:v01dx08/FisherBlog.git /opt/fishviet
cd /opt/fishviet
git status --short
```

`git status --short` phải không có output.

5. Giữ web port khỏi Internet. File override thay mapping `0.0.0.0:3000` bằng loopback.

```bash
sudo install -d -m 0755 /etc/fishviet
sudo tee /etc/fishviet/compose.vps.yml >/dev/null <<'YAML'
services:
  web:
    ports: !override
      - "127.0.0.1:3000:3000"
YAML
sudo docker compose -f docker-compose.yml -f /etc/fishviet/compose.vps.yml config
```

Mọi lệnh Compose production phía dưới phải dùng cả hai file.

6. Tạo `.env` production.

```bash
cd /opt/fishviet
umask 077
cp .env.example .env
DB_PASSWORD="$(openssl rand -hex 32)"
JWT_SECRET="$(openssl rand -hex 48)"
ADMIN_PASSWORD="Aa1-$(openssl rand -hex 20)"
sed -i "s/CHANGE_ME_DATABASE_PASSWORD/$DB_PASSWORD/g" .env
sed -i "s/CHANGE_ME_WITH_AT_LEAST_32_RANDOM_CHARACTERS/$JWT_SECRET/" .env
sed -i "s/CHANGE_ME_STRONG_ADMIN_PASSWORD/$ADMIN_PASSWORD/" .env
chmod 600 .env
printf 'Initial admin password: %s\n' "$ADMIN_PASSWORD"
unset DB_PASSWORD JWT_SECRET ADMIN_PASSWORD
nano .env
```

Lưu mật khẩu admin vừa in vào password manager. Trong `nano`, thay `ADMIN_USERNAME`, `ADMIN_EMAIL` và toàn bộ `NEXT_PUBLIC_LEGAL_ENTITY_*`. Giữ `NEXT_PUBLIC_APP_URL="https://fishviet.vn"`.

```bash
grep -n 'CHANGE_ME\|admin@example.com' .env && echo 'ERROR: .env chưa hoàn tất'
```

Không tiếp tục nếu lệnh trên tìm thấy giá trị.

7. Build và khởi động.

```bash
cd /opt/fishviet
sudo docker compose -f docker-compose.yml -f /etc/fishviet/compose.vps.yml build --pull
sudo docker compose -f docker-compose.yml -f /etc/fishviet/compose.vps.yml up -d
sudo docker compose -f docker-compose.yml -f /etc/fishviet/compose.vps.yml ps -a
sudo docker compose -f docker-compose.yml -f /etc/fishviet/compose.vps.yml logs migrate --no-color --tail 100
curl -fsS http://127.0.0.1:3000/api/health | jq
```

`database` và `web` phải `healthy`; `migrate` phải `Exited (0)`; health phải trả `status: ok` và `database: connected`.

8. Cấu hình Nginx.

```bash
sudo tee /etc/nginx/sites-available/fishviet.vn >/dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name fishviet.vn www.fishviet.vn;

    server_tokens off;
    client_max_body_size 16m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
NGINX
sudo ln -sfn /etc/nginx/sites-available/fishviet.vn /etc/nginx/sites-enabled/fishviet.vn
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Nếu chưa có DNS `www`, xóa `www.fishviet.vn` khỏi `server_name` và lệnh Certbot.

9. Cấp TLS Let's Encrypt.

```bash
sudo certbot --nginx -d fishviet.vn -d www.fishviet.vn --redirect
sudo certbot renew --dry-run
```

10. Xác minh public endpoint.

```bash
curl -fsS https://fishviet.vn/api/health | jq
curl -sSI https://fishviet.vn | grep -Ei 'HTTP/|strict-transport-security|content-security-policy|x-frame-options|x-content-type-options'
curl -fsS https://fishviet.vn/robots.txt
curl -fsS https://fishviet.vn/sitemap.xml >/dev/null
sudo ss -lntp | grep -E ':80 |:443 |127.0.0.1:3000|127.0.0.1:5432'
```

Đăng nhập admin production rồi kiểm tra tạo bài, upload ảnh, chế độ riêng tư, link nền tảng và tải chứng nhận.

11. Backup database và media trước khi mở public, rồi trước mỗi release.

```bash
cd /opt/fishviet
set -a
. ./.env
set +a
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
sudo install -d -m 0700 /var/backups/fishviet
sudo docker compose -f docker-compose.yml -f /etc/fishviet/compose.vps.yml exec -T database pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc | sudo tee "/var/backups/fishviet/database-$STAMP.dump" >/dev/null
WEB_CONTAINER="$(sudo docker compose -f docker-compose.yml -f /etc/fishviet/compose.vps.yml ps -q web)"
UPLOAD_VOLUME="$(sudo docker inspect "$WEB_CONTAINER" --format '{{range .Mounts}}{{if eq .Destination "/app/data/uploads"}}{{.Name}}{{end}}{{end}}')"
sudo docker run --rm -v "$UPLOAD_VOLUME:/source:ro" -v /var/backups/fishviet:/backup alpine:3.22 tar -czf "/backup/uploads-$STAMP.tar.gz" -C /source .
sudo sha256sum "/var/backups/fishviet/database-$STAMP.dump" "/var/backups/fishviet/uploads-$STAMP.tar.gz" | sudo tee "/var/backups/fishviet/SHA256SUMS-$STAMP"
unset POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB DATABASE_URL JWT_SECRET ADMIN_USERNAME ADMIN_EMAIL ADMIN_PASSWORD UPLOAD_DIR PORT NEXT_PUBLIC_APP_URL NEXT_PUBLIC_LEGAL_ENTITY_NAME NEXT_PUBLIC_LEGAL_ENTITY_ADDRESS NEXT_PUBLIC_LEGAL_ENTITY_TAX_ID STAMP WEB_CONTAINER UPLOAD_VOLUME
```

Copy backup đã mã hóa sang storage off-site. Backup cùng VPS không bảo vệ được khi VPS hoặc ổ đĩa mất.

12. Cập nhật release sau này. Backup trước `git pull`.

```bash
cd /opt/fishviet
git status --short
git fetch origin master
git log --oneline HEAD..origin/master
git pull --ff-only origin master
sudo docker compose -f docker-compose.yml -f /etc/fishviet/compose.vps.yml build --pull
sudo docker compose -f docker-compose.yml -f /etc/fishviet/compose.vps.yml up -d
sudo docker compose -f docker-compose.yml -f /etc/fishviet/compose.vps.yml ps -a
curl -fsS https://fishviet.vn/api/health | jq
```

Một VPS có gián đoạn ngắn khi web container bị recreate; cấu hình này chưa hỗ trợ rolling deployment.

## Verify

```bash
cd /opt/fishviet
sudo docker compose -f docker-compose.yml -f /etc/fishviet/compose.vps.yml ps -a
sudo docker compose -f docker-compose.yml -f /etc/fishviet/compose.vps.yml logs web migrate --no-color --tail 100
curl -fsS https://fishviet.vn/api/health | jq -e '.status == "ok" and .database == "connected"'
sudo certbot certificates
sudo ufw status verbose
```

Expected output:

```text
database   Up ... (healthy)
migrate    Exited (0)
web        Up ... (healthy)
true
```

## Rollback

Rollback code không tự rollback database. Không chạy migration ngược hoặc restore DB khi chưa có maintenance window và backup mới.

```bash
cd /opt/fishviet
git log --oneline -10
git switch --detach <KNOWN_GOOD_COMMIT>
sudo docker compose -f docker-compose.yml -f /etc/fishviet/compose.vps.yml build
sudo docker compose -f docker-compose.yml -f /etc/fishviet/compose.vps.yml up -d
curl -fsS https://fishviet.vn/api/health | jq
```

Sau khi sửa release lỗi, chạy `git switch master` rồi `git pull --ff-only origin master`.

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `migrate` thoát khác `0` | `.env` thiếu secret, admin password sai rule hoặc migration lỗi | Xem log `migrate`, sửa `.env`, chạy lại `up -d` |
| `web` unhealthy | DB/migration chưa sẵn sàng hoặc app lỗi startup | Xem `ps -a`, log `web`, log `migrate`, gọi health trên loopback |
| Certbot không xác thực domain | DNS chưa cập nhật, `AAAA` sai hoặc port 80 bị chặn | Kiểm tra `dig`, firewall VPS và firewall nhà cung cấp |
| Nginx trả `502` | Web dừng hoặc port không bind loopback | Kiểm tra Compose, health local và `ss -lntp` |
| Upload trả `413` | Giới hạn Nginx quá thấp | Giữ `client_max_body_size 16m`, test và reload Nginx |
| Đổi `ADMIN_PASSWORD` trong `.env` nhưng mật khẩu không đổi | Bootstrap chỉ tạo admin đầu tiên | Đổi mật khẩu trong giao diện |
| Ổ đĩa đầy | Image cũ, log, PostgreSQL hoặc upload tăng | Kiểm tra `docker system df`, `df -h`; backup trước khi dọn; không xóa volume |
| App cũ lỗi sau rollback | Schema mới không tương thích code cũ | Sửa forward; chỉ restore DB cùng backup tương ứng trong maintenance window |

## Runbook Maintenance

> When following this runbook, always consider whether it needs updating.
> After completing the procedure, check:
> - Were any steps unclear, outdated, or missing?
> - Did you encounter errors not covered in Troubleshooting?
> - Were there unnecessary steps, or steps that could be simplified?
> - Has the underlying system changed since this was written?
>
> **Humans**: Edit this file directly with improvements.
> **AI agents**: When this runbook is used and issues arise (errors,
> confusion, inefficiency, missing steps), suggest specific edits
> to this runbook before completing the task.
