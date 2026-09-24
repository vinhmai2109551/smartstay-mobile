# SmartStay Mobile

Ứng dụng mobile (Expo / React Native) dành cho **khách hàng** của SmartStay — nền tảng đặt phòng khách sạn/homestay có trợ lý AI Chat-to-Book. Đây là phần mobile trong đồ án, chạy song song với backend NestJS và frontend web đã có.

## Công nghệ

- Expo SDK 57 + Expo Router (file-based routing, `src/app`)
- TypeScript, React 19
- Zustand + `expo-secure-store` để lưu JWT (access/refresh token)
- Axios với interceptor tự động refresh token khi accessToken hết hạn
- React Hook Form + Zod cho các form (đăng nhập/đăng ký/...)

## Cấu trúc thư mục chính

```
src/
  app/            # Màn hình (Expo Router)
    (auth)/       # Đăng nhập, đăng ký
    (tabs)/       # Trang chủ, Tìm phòng, Chat AI, Đơn của tôi, Tài khoản
    room/[id]     # Chi tiết loại phòng
    booking/new   # Form tạo đơn đặt phòng
    booking/[id]  # Chi tiết đơn, QR check-in, huỷ đơn, đánh giá
    checkout/[bookingId] # Thanh toán PayOS (QR + poll trạng thái)
    notifications # Danh sách thông báo
  api/            # Gọi API theo từng module, khớp tài liệu API backend
  types/          # Type khớp DTO backend
  store/          # Zustand store (auth)
  components/     # UI dùng chung
```

## Bắt đầu

1. Cài đặt phụ thuộc:

   ```bash
   npm install
   ```

2. Cấu hình URL backend: copy `.env.example` thành `.env` và chỉnh `EXPO_PUBLIC_API_URL` trỏ tới NestJS backend đang chạy.

   - Giả lập Android (Android Studio) chạy backend trên cùng máy: `http://10.0.2.2:<port>`
   - **Expo Go trên điện thoại thật**: phải dùng IP LAN của máy tính, ví dụ `http://192.168.1.5:<port>` (điện thoại và máy tính phải cùng mạng Wi-Fi). `localhost` sẽ KHÔNG hoạt động trong trường hợp này.
   - Giả lập iOS: `http://localhost:<port>` dùng được.

3. Chạy app:

   ```bash
   npx expo start
   ```

   Quét mã QR bằng app Expo Go (Android/iOS) hoặc mở bằng giả lập.

## Trạng thái hiện tại

Đã khớp lại toàn bộ API khách hàng theo `doc/API.md` (tài liệu đọc trực tiếp từ source code backend): `/auth` (đăng ký 2 bước + OTP, `/auth/refresh` qua cookie), `/users/me`, `/room-types`, `/rooms/availability`, `/bookings`, `/promotions`, `/services`, `/payments/payos`, `/ai-agent/chat`. Phần Admin/Lễ tân (Smart Dashboard, quản lý phòng/ca trực...) không nằm trong phạm vi app mobile này.

**Đăng nhập bằng mật khẩu tạm thời không dùng được trên mobile**: backend yêu cầu `turnstileToken` (Cloudflare Turnstile), chỉ chạy được trên web, chưa có SDK cho native app. Màn đăng nhập hiện chỉ có nút "Tiếp tục với Google" (`POST /auth/google`) — cần điền `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` trong `.env` (Google Cloud Console > OAuth 2.0 Client IDs, loại Web application) để bật được.

`/reviews` và `/notifications` chưa tồn tại ở backend — 2 màn hình liên quan (đánh giá phòng, thông báo) vẫn còn trong code nhưng sẽ lỗi 404 khi gọi thật; để lại vì sẽ bổ sung endpoint sau.
