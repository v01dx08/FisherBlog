# FishViet

Nền tảng FishViet.vn dành cho influencer câu cá đăng bản gốc trước khi phát hành lên mạng xã hội khác. Mỗi bài viết có dấu thời gian và fingerprint SHA-256 để đối chiếu lịch sử nội dung.

## Chạy production bằng Docker

1. Sao chép `.env.example` thành `.env`.
2. Thay toàn bộ giá trị `CHANGE_ME` bằng secret mạnh.
3. Chạy:

```bash
docker compose up --build -d
```

4. Mở `http://localhost:3000`.
5. Kiểm tra trạng thái:

```bash
docker compose ps
curl http://localhost:3000/api/health
```

Container web tự chạy Prisma migrations và chỉ tạo tài khoản admin khi DB chưa có admin. Seed demo không chạy trong production.

## Phát triển local

PostgreSQL cần chạy trước:

```bash
docker compose up -d database
npm install
npx prisma migrate deploy
npm run dev
```

## Kiểm tra

```bash
npm run lint
npm test
npm run build
npm run test:smoke
```

`test:smoke` cần app đang chạy tại `http://localhost:3000`. Có thể đổi URL bằng `SMOKE_BASE_URL`.

## Dữ liệu và backup

- PostgreSQL: Docker volume `fisherblog_postgres_data`.
- Media: Docker volume `fisherblog_uploads_data`.
- Backup DB:

```bash
docker compose exec -T database pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > fisherblog.sql
```

- Restore DB vào môi trường trống:

```bash
docker compose exec -T database psql -U "$POSTGRES_USER" "$POSTGRES_DB" < fisherblog.sql
```

Backup cả media volume trước mỗi release có thay đổi storage.

## Deploy

- Đặt reverse proxy TLS trước port `3000`.
- Không expose PostgreSQL ra Internet. Mapping hiện tại chỉ bind `127.0.0.1` để hỗ trợ development.
- Dùng volume bền vững. Nếu chạy nhiều web replica, thay local upload adapter bằng S3/R2.
- Đặt `NEXT_PUBLIC_APP_URL` thành URL HTTPS chính thức.
- Điền tên pháp nhân, địa chỉ và mã số thuế qua `NEXT_PUBLIC_LEGAL_ENTITY_*` trước khi mở dịch vụ.
- Tạo và giám sát hộp thư `legal@fishviet.vn`, `privacy@fishviet.vn` trước khi công bố chính sách.
- Rotate `JWT_SECRET` sẽ đăng xuất toàn bộ phiên hiện tại.

 ## Tài khoản admin test

  - Username: fishviet_admin
  - Email: admin.test@fishviet.vn
  - Password: FishViet@Test2026!

