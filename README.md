# Vika Hotel (SmartStay Mobile)

Ứng dụng mobile (Expo / React Native) dành cho **khách hàng** của Vika Hotel —
đặt phòng, thanh toán, chat với trợ lý AI để tìm/đặt phòng, quản lý đơn và hồ
sơ cá nhân. Đây là phần mobile của đồ án SmartStay, chạy song song với backend
NestJS và frontend web (đã có ở repo khác). Phần Admin/Lễ tân (Smart Dashboard,
quản lý phòng/ca trực...) **không** nằm trong phạm vi app này.

## Công nghệ

- Expo SDK 57 + Expo Router (file-based routing, `src/app`, typed routes, React Compiler)
- React 19, TypeScript strict
- Zustand + `expo-secure-store` (native) / `localStorage` (web) để lưu phiên đăng nhập và cài đặt
- Axios với interceptor tự động refresh access token khi hết hạn (gộp các lần refresh đồng thời)
- React Hook Form + Zod cho các form (đăng nhập/đăng ký/đặt phòng/đổi mật khẩu...)
- `socket.io-client` cho thông báo realtime
- i18next + react-i18next (tiếng Việt / English), đồng bộ với `dayjs`
- React Native Reanimated cho animation (toast, dialog, bottom sheet...)
- PayOS (chuyển khoản/QR) cho thanh toán
- Cloudflare Turnstile chạy trong WebView cho đăng nhập bằng mật khẩu

## Tính năng

| Khu vực (`src/app`) | Tính năng |
|---|---|
| `(auth)/login`, `register`, `verify-otp` | Đăng ký 2 bước (OTP), đăng nhập bằng mật khẩu (qua Cloudflare Turnstile trong WebView) hoặc Google (`expo-auth-session`) |
| `(auth)/forgot-password`, `verify-reset-otp`, `reset-password` | Quên mật khẩu: gửi OTP qua email → xác minh OTP → đặt mật khẩu mới |
| `(tabs)/index`, `room/[id]` | Trang chủ, chi tiết loại phòng |
| `(tabs)/search` | Tìm phòng theo ngày/bộ lọc |
| `booking/new` | Form tạo đơn đặt phòng (dịch vụ thêm, mã khuyến mãi, chọn phương thức thanh toán) |
| `(tabs)/bookings`, `booking/[id]` | Danh sách đơn của tôi, chi tiết đơn, huỷ đơn, viết đánh giá sau khi trả phòng |
| `booking/[id]`, `components/ChatBookingCreatedCard` | Vé check-in dạng QR — chỉ hiện khi đơn đã được khách sạn xác nhận **và** thanh toán xong (PAYOS) hoặc trả bằng tiền mặt; tự cập nhật khi có thông báo realtime, không cần tải lại màn |
| `checkout/[bookingId]` | Thanh toán PayOS: QR chuyển khoản, mở app ngân hàng (VietQR deeplink), theo dõi trạng thái tự động (poll + sync khi app quay lại foreground) |
| `(tabs)/chat`, `components/ChatBubble*` | Trợ lý AI Chat-to-Book — tìm phòng, hỏi khuyến mãi/chính sách, đặt phòng qua hội thoại; lưu lại lịch sử hội thoại |
| `notifications.tsx` | Thông báo realtime (socket.io): đặt phòng, thanh toán, xác nhận, phản hồi đánh giá; đánh dấu đã đọc |
| `account.tsx`, `edit-profile.tsx` | Xem/sửa thông tin cá nhân |
| `change-password.tsx` | Đổi mật khẩu (màn riêng, có link "Quên mật khẩu hiện tại?") |
| `(tabs)/profile` | Đổi theme (Sáng/Tối/Theo hệ thống), đổi ngôn ngữ (vi/en), đăng xuất |
| Toàn app | "Lưu mã QR" — lưu phiếu thanh toán PayOS vào thư viện ảnh máy (`expo-media-library` + `react-native-view-shot`) — **cần dev client, không chạy được trên Expo Go** (xem phần "Chạy app" bên dưới) |

## Cấu trúc thư mục chính

```
src/
  app/                  # Màn hình (Expo Router)
    (auth)/             # Đăng nhập, đăng ký, quên mật khẩu
    (tabs)/             # Trang chủ, Tìm phòng, Chat AI, Đơn của tôi, Hồ sơ
    room/[id]           # Chi tiết loại phòng
    booking/new         # Form tạo đơn đặt phòng
    booking/[id]        # Chi tiết đơn, vé check-in, huỷ đơn, đánh giá
    checkout/[bookingId]# Thanh toán PayOS
    account.tsx         # Thông tin tài khoản
    change-password.tsx # Đổi mật khẩu
    edit-profile.tsx    # Sửa hồ sơ
    notifications.tsx   # Danh sách thông báo
  api/                  # Gọi API theo từng module, khớp tài liệu API backend
  types/                # Type khớp DTO/response backend
  store/                # Zustand store (auth, settings, toast, notification)
  hooks/                # Hook dùng chung (useApi, useBookingUpdates, ...)
  components/           # UI dùng chung và các card/sheet riêng (chat, QR, ...)
  i18n/locales/         # vi.json, en.json
```

## Cài đặt

1. Cài phụ thuộc:

   ```bash
   npm install
   ```

2. Copy `.env.example` thành `.env` và điền giá trị (xem comment trong file để biết lấy ở đâu). Biến quan trọng nhất là `EXPO_PUBLIC_API_URL` — trỏ đúng tới backend NestJS đang chạy:

   - **Giả lập Android (Android Studio)**, backend chạy trên cùng máy: `http://10.0.2.2:<port>/api/v1`
   - **Expo Go / dev client trên điện thoại thật**: dùng IP LAN của máy tính, ví dụ `http://192.168.1.5:<port>/api/v1` (điện thoại và máy tính phải cùng mạng Wi-Fi) — `localhost` sẽ **không** hoạt động trong trường hợp này.
   - **Giả lập iOS / web**: `http://localhost:<port>/api/v1` dùng được.

## Chạy app

```bash
npx expo start
```

- Hầu hết tính năng chạy được trong **Expo Go**.
- Tính năng **"Lưu mã QR"** (`expo-media-library`) cần quyền/native module không có sẵn trong Expo Go — phải chạy bằng **dev client**:

  ```bash
  npx expo run:android   # hoặc
  npx expo run:ios
  ```

  (lần đầu sẽ build và cài app dev client lên máy/giả lập; các lần sau `npx expo start` rồi mở app dev client đã cài là đủ).

## Build APK demo bằng EAS

Mỗi profile build (`development`/`preview`/`production` trong `eas.json`) được
gắn với một **EAS Environment** cùng tên — biến `EXPO_PUBLIC_*` khai báo trên EAS
(`eas env:create`, xem `docs/IMPROVEMENT_LOG.md` task A2 để có lệnh mẫu), **không**
đọc từ `.env` cục bộ khi build trên EAS. Nếu quên khai báo, `EXPO_PUBLIC_API_URL`
sẽ rơi về giá trị mặc định `localhost` và app build ra sẽ hiện màn báo lỗi cấu
hình ngay khi mở (xem `src/config/env.ts` — `isMisconfigured`), thay vì lỗi mạng
mơ hồ.

```bash
# APK cài thử nhanh (không cần Google Play)
eas build --platform android --profile preview
```

## Scripts

| Script | Mục đích |
|---|---|
| `npm run start` | Chạy Metro bundler (`expo start`) |
| `npm run start:go` | Chạy ở chế độ Expo Go qua LAN, xoá cache (`--go --lan -c`) |
| `npm run android` / `npm run ios` | Build & chạy dev client native (`expo run:android` / `run:ios`) |
| `npm run web` | Chạy bản web (`expo start --web`) |
| `npm run lint` | `expo lint` (ESLint) |
| `npm run eas:build:android:preview` / `:prod` | Build Android qua EAS |
| `npm run eas:build:ios:preview` / `:prod` | Build iOS qua EAS |

## Giới hạn đã biết

- **Refresh token qua cookie httpOnly:** app không tự cầm refresh token, hoàn toàn dựa vào cookie do backend set. Trên native, nếu cookie `refresh_token` set cờ `Secure`, nó sẽ không được gửi lại khi gọi API qua HTTP thuần (IP LAN, ngrok không TLS) — phiên sẽ không refresh được, phải đăng nhập lại. Đổi IP LAN/domain ngrok giữa lúc đang đăng nhập cũng có cùng hậu quả. Chi tiết và đề xuất hướng xử lý: `docs/backend-requests.md`.

## Thành viên nhóm

- Vinh
- Khoa
