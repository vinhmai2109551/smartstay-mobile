# Yêu cầu backend: refresh token ổn định hơn trên native (mobile)

Ghi nhận từ đợt cải thiện chất lượng app mobile (xem `docs/IMPROVEMENT_LOG.md`,
task A3). Mobile team **chưa đổi gì phía app** cho mục này — chỉ ghi lại vấn đề và
đề xuất, để backend xác nhận/chọn hướng khi tiện.

## Vấn đề

Refresh token hiện chỉ tồn tại dưới dạng cookie httpOnly do backend set trên
`POST /auth/login`, `/auth/register`, `/auth/google`, `/auth/refresh` (xem
comment trong `src/types/auth.ts`). Mobile app không bao giờ tự cầm giá trị này,
hoàn toàn dựa vào cookie jar của hệ điều hành. Trên native, điều này có vài rủi ro
cụ thể mà trên web (cùng domain, luôn HTTPS khi deploy) không gặp:

1. **Cờ `Secure`:** nếu cookie `refresh_token` được set `Secure: true`, cookie đó
   sẽ không được lưu/gửi lại khi app gọi qua HTTP thuần (không TLS) — tình huống
   rất thường gặp lúc dev/demo qua IP LAN hoặc qua ngrok không bật TLS. Cần backend
   xác nhận: cookie này hiện có đang set `Secure` không, và có cấu hình riêng cho
   môi trường dev/demo không.
2. **Đổi domain/IP giữa các lần chạy:** cookie gắn theo domain đã set. Nếu đổi IP
   LAN hoặc đổi domain ngrok (ngrok free đổi domain mỗi lần restart tunnel) trong
   lúc đang có phiên đăng nhập, phiên đó sẽ không refresh được nữa — phải đăng
   nhập lại. Đây là hạn chế cố hữu của cookie, không có cách khắc phía app.
3. **App bị hệ điều hành kill rồi mở lại:** cần xác nhận cookie jar phía native có
   được giữ qua các lần app bị kill/mở lại không, và thời gian sống thực tế
   (`Max-Age`/`Expires`) của cookie `refresh_token` là bao lâu — để biết sau bao
   lâu không mở app thì chắc chắn phải đăng nhập lại.

## Đề xuất (backend quyết định hướng, mobile không tự đoán tên field/endpoint)

- **Khuyên dùng nếu backend tiện sửa:** trả thêm `refreshToken` trong JSON body
  của `/auth/login`, `/auth/register` (bước tạo tài khoản xong), `/auth/google`,
  và `/auth/refresh` — **chỉ thêm, không bỏ cookie** (web vẫn dùng cookie như cũ,
  không đổi gì phía web). Khi có field này, mobile sẽ tự lưu ở SecureStore, gửi
  lại trong body khi gọi `/auth/refresh`, hỗ trợ rotation, và gửi kèm khi logout
  để backend thu hồi.
- **Hoặc, nếu muốn giữ nguyên cơ chế cookie:** xác nhận lại 3 điểm ở trên (đặc
  biệt là cờ `Secure` cho môi trường dev/demo) và cho biết thời gian sống thực tế
  của cookie, để mobile ghi đúng giới hạn vào tài liệu người dùng/README.

## Trạng thái

Đợt này mobile **chọn giữ nguyên cơ chế cookie**, không sửa phía app. Giới hạn đã
biết được ghi vào README (phần "Giới hạn đã biết"). Sẽ quay lại nếu backend đổi
sang trả `refreshToken` trong body.
