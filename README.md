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

Đã kết nối các API khách hàng theo tài liệu API backend: `/auth`, `/room-types`, `/rooms/availability`, `/bookings`, `/promotions`, `/services`, `/payments`, `/reviews`, `/chat`, `/notifications`. Phần Admin/Lễ tân (Smart Dashboard, quản lý phòng/ca trực...) chưa nằm trong phạm vi app mobile này.

Một số điểm cần khớp lại với backend thật khi tích hợp:

- Field chính xác của `dataCard` trả về từ `POST /chat/message` (hiện đang giả định có thể chứa `roomTypes[]` và/hoặc `booking`) — chỉnh trong `src/types/chat.ts`.
- Định dạng `qrCode` của booking và của link thanh toán PayOS (đang giả định là URL ảnh hoặc data URI dùng được trực tiếp với `<Image>`).
