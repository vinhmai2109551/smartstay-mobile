# Improvement Log

Nhật ký đợt cải thiện chất lượng app smartstay-mobile. Mỗi task có trạng thái
✅ xong / ⏸ chờ quyết định / ⚠️ bỏ qua (kèm lý do) / ⏳ chưa làm.

Quy ước: không `git commit`/`git push`/`git stash pop|apply|drop`. Cuối mỗi
giai đoạn, dừng lại chờ xác nhận trước khi sang giai đoạn kế tiếp.

## Danh sách task

### Giai đoạn A — Nghiệp vụ cấp bách & demo
- [x] A1. Vé check-in chỉ hiện khi đơn đã được xác nhận
- [x] A2. Biến môi trường cho bản build EAS
- [x] A3. Refresh token ổn định trên native (đã chọn (b): giữ cookie)

### Giai đoạn B — Dọn nền dự án
- [x] B1. Lỗi tsc với global.css
- [x] B2. Lint (0 warning trừ checkout)
- [x] B3. README, .env.example, scripts, tên app (đã chọn: "Vika Hotel")

### Giai đoạn C — Sửa nghiệp vụ đặt phòng & thanh toán
- [ ] C1. Mã khuyến mãi bị treo
- [ ] C2. Số khách + form bằng Zod
- [ ] C3. Giá tạm tính
- [ ] C4. Luồng thanh toán PayOS (usePayosCheckout)

### Giai đoạn D — Độ bền, tính năng còn thiếu, UX
- [ ] D1. useApi chống race
- [ ] D2. Tách lưu trữ (secureStorage/plainStorage)
- [ ] D3. Quên mật khẩu
- [ ] D4. Error Boundary
- [ ] D5. Mất mạng
- [ ] D6. Accessibility
- [ ] D7. Hiệu năng danh sách

### Giai đoạn E — Kiểm thử & CI
- [ ] E1. Jest
- [ ] E2. Prettier + CI

---

## Chi tiết từng task

### A1. Vé check-in chỉ hiện khi đơn đã được xác nhận — ✅

**Đã đọc `git stash show -p stash@{0}` (không pop/apply).** Logic cũ trong stash
chỉ cho `status === 'CONFIRMED'`; quy tắc mới trong prompt lần này rộng hơn, thêm
`CHECKED_IN` ("đang trong giai đoạn check-in"). Mình triển khai theo quy tắc MỚI
(viết lại trong prompt), không theo đúng y nguyên stash — vì prompt này đã nêu rõ
quy tắc, không phải hỏi lại.

**Bảng quy tắc** (`canShowCheckInPass`, `src/utils/bookingQr.ts`):

| status | paymentMethod | paymentStatus | Hiện vé? |
|---|---|---|---|
| PENDING | bất kỳ | bất kỳ | ❌ (chưa xác nhận) |
| CONFIRMED | CASH | bất kỳ | ✅ |
| CONFIRMED | PAYOS | PAID | ✅ |
| CONFIRMED | PAYOS | UNPAID/FAILED | ❌ (chờ thanh toán) |
| CHECKED_IN | CASH | bất kỳ | ✅ |
| CHECKED_IN | PAYOS | PAID | ✅ |
| CHECKED_IN | PAYOS | UNPAID/FAILED | ❌ (chờ thanh toán — hiếm, phòng hờ) |
| CHECKED_OUT | bất kỳ | bất kỳ | ❌ (đã trả phòng) |
| CANCELLED | bất kỳ | bất kỳ | ❌ (đã huỷ) |

Không có trạng thái "từ chối/hết hạn" riêng trong `BookingStatus` hiện tại
(`PENDING | CONFIRMED | CHECKED_IN | CHECKED_OUT | CANCELLED`) — không tự đặt
thêm trạng thái mới, chỉ dùng union có sẵn.

**File đã đổi:**
- `src/utils/bookingQr.ts` — thêm `canShowCheckInPass(booking: Pick<Booking,'status'|'paymentMethod'|'paymentStatus'>): boolean`.
- `src/app/booking/[id].tsx` — bỏ `CHECK_IN_PASS_STATUSES`, dùng `canShowCheckInPass`; thêm Card khoá (icon `lock-closed-outline`) hiện "Chờ thanh toán" hoặc "Chờ xác nhận" khi chưa đủ điều kiện (không hiện card nào khi CHECKED_OUT/CANCELLED).
- `src/components/ChatBookingCreatedCard.tsx` — thay biến `showTicket` (chỉ check `status !== CANCELLED`, bug gốc) bằng `showCheckInPass` qua `canShowCheckInPass`; dùng `paid` thật (từ `syncPayosStatus`) thay vì field tĩnh; thêm `liveStatus` + `useBookingUpdates` để tự `bookingsApi.detail()` lại khi có event `booking:updated` (vd. lễ tân xác nhận đơn CASH ngay trong lúc khách đang xem lại thẻ trong chat) — header/tone/thông báo cập nhật theo `liveStatus`, không cần thoát chat ra vào lại.
- `src/types/chat.ts` — thắt `ConfirmedBooking.status` từ `string` thành `BookingStatus` (đúng union, bỏ khả năng gõ sai trạng thái).
- `src/i18n/locales/vi.json`, `en.json` — thêm `booking.checkInLockedPayment`, `booking.checkInLockedConfirmation` (dùng lại ở cả `booking/[id].tsx` và `ChatBookingCreatedCard.tsx`).

**Không động tới:** `src/components/CheckInPass.tsx` hiện không có nút "Lưu mã QR"
riêng (chỉ có nút copy mã) — nút lưu-QR hiện tại chỉ áp dụng cho phiếu thanh toán
PayOS (`ChatBookingCreatedCard`/`PaymentQrSlip`), đã tự nằm trong nhánh
`awaitingPayment` nên không cần sửa thêm để thoả "nút Lưu mã QR chỉ hiện khi vé
hiện".

**Cách test thủ công:**
1. Đơn CASH, status PENDING → vào `booking/[id]` và thẻ trong chat: thấy card/
   thông báo "Mã check-in sẽ hiện khi khách sạn xác nhận đơn", không thấy QR.
2. Lễ tân (web/Postman) xác nhận đơn đó → `booking/[id]` tự refetch khi focus lại
   hoặc nhận `booking:updated` (đã có từ trước); thẻ trong **chat** (đang mở sẵn,
   không thoát) cũng tự đổi sang hiện vé QR mà không cần reload màn.
3. Đơn PAYOS chưa thanh toán, status CONFIRMED hoặc PENDING → không thấy vé, thấy
   "Mã check-in sẽ hiện sau khi bạn thanh toán" (`booking/[id]`) hoặc khối QR thanh
   toán (chat card, luồng cũ không đổi).
4. Đơn PAYOS đã PAID, status CONFIRMED → thấy vé QR ở cả hai nơi.
5. Đơn CHECKED_OUT hoặc CANCELLED → không thấy vé, không thấy card khoá nào.

**Commit message đề xuất:**
```
fix(booking): gate check-in pass on confirmed + payable status

Both the booking detail screen and the AI chat's booking card were showing the
check-in QR for any non-cancelled booking, including unconfirmed PENDING ones
and unpaid PAYOS bookings. Add a shared canShowCheckInPass() rule and a live
useBookingUpdates refresh in the chat card so it reflects staff confirmation
without needing to reopen the chat.
```

### A2. Biến môi trường cho bản build EAS — ✅

**File đã đổi:**
- `eas.json` — thêm `"environment": "development"|"preview"|"production"` cho từng
  build profile tương ứng, để EAS lấy biến môi trường đã khai báo trên EAS (không
  ghi giá trị thật vào repo).
- `src/config/env.ts` — gom vào `export const ENV = { API_URL, GOOGLE_*_CLIENT_ID,
  TURNSTILE_*, isMisconfigured }`; **giữ nguyên các named export cũ** (`API_URL`,
  `GOOGLE_WEB_CLIENT_ID`, ...) nên 4 chỗ import cũ (`api/client.ts`,
  `useRealtimeNotifications.ts`, `login.tsx`, `TurnstileWidget.tsx`) không cần sửa.
  `isMisconfigured = !__DEV__ && API_URL chứa localhost/127.0.0.1/10.0.2.2`.
- `src/app/_layout.tsx` — khi `ENV.isMisconfigured`, render `ErrorView` (component
  có sẵn, không tạo component mới) với thông báo rõ ràng, thay cho toàn bộ app.
- `src/i18n/locales/vi.json`, `en.json` — thêm `common.configErrorMessage`.

**Lưu ý:** không tìm thấy biến `EXPO_PUBLIC_*` nào khác ngoài 6 biến đã có trong
`.env.example` (đã grep toàn `src/`), nên không cần thêm biến mới — A2 chỉ là wiring
EAS + safety-net, không đổi danh sách biến.

**Cách test thủ công:**
1. Local dev (`__DEV__` true) với `.env` trỏ localhost: app chạy bình thường, không
   hiện màn lỗi (vì `__DEV__` loại trừ).
2. Build preview/production thật thì không test được ở đây — xem lệnh EAS bên dưới.
   Có thể giả lập nhanh bằng cách tạm sửa `DEV_ONLY_HOSTS` check hoặc set
   `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1` rồi build thử 1 bản preview để
   xác nhận màn lỗi hiện đúng, sau đó set lại env đúng và build lại.

**Việc bạn cần tự làm (lệnh EAS):**
> Cú pháp tham khảo theo `eas env:create` — kiểm tra lại với `eas env:create --help`
> vì có thể khác đôi chút theo phiên bản `eas-cli` bạn đang cài; mình không chạy được
> lệnh này ở đây (cần đăng nhập Expo account của bạn).

```bash
# API_URL khác nhau theo từng environment (LAN IP cho dev, domain demo/staging
# cho preview, domain thật cho production):
eas env:create --name EXPO_PUBLIC_API_URL --environment development \
  --value "http://<LAN-IP-may-ban>:3000/api/v1" --visibility plaintext
eas env:create --name EXPO_PUBLIC_API_URL --environment preview \
  --value "https://<domain-demo>/api/v1" --visibility plaintext
eas env:create --name EXPO_PUBLIC_API_URL --environment production \
  --value "https://<domain-production>/api/v1" --visibility plaintext

# Các biến còn lại thường giống nhau ở mọi environment (cùng OAuth app, cùng
# Turnstile site) — eas-cli cho chọn nhiều environment trong 1 lệnh:
eas env:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID \
  --environment development,preview,production --value "<id>.apps.googleusercontent.com" --visibility plaintext
eas env:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID \
  --environment development,preview,production --value "<id>.apps.googleusercontent.com" --visibility plaintext
eas env:create --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID \
  --environment development,preview,production --value "<id>.apps.googleusercontent.com" --visibility plaintext
eas env:create --name EXPO_PUBLIC_TURNSTILE_SITE_KEY \
  --environment development,preview,production --value "0x4AAAAAAE..." --visibility plaintext
eas env:create --name EXPO_PUBLIC_TURNSTILE_BASE_URL \
  --environment development,preview,production --value "<hostname-trong-TURNSTILE_ALLOWED_HOSTNAMES-cua-backend>" --visibility plaintext
```

Các biến `EXPO_PUBLIC_*` đều bị đóng gói vào bundle JS nên không phải bí mật thật
— `--visibility plaintext` là hợp lý (không cần `secret`/`sensitive`).

**Commit message đề xuất:**
```
feat(config): wire EAS build environments and add a build-misconfiguration guard

Builds from `eas build` had no env vars declared, so EXPO_PUBLIC_API_URL fell back
to the localhost default and preview/production APKs couldn't reach any backend.
Link each build profile to an EAS environment and show a clear error screen
instead of silently failing every request when that still happens.
```

### A3. Refresh token ổn định trên native — ✅ (đã chọn (b))

**Chẩn đoán (đã đọc `types/auth.ts`, `store/authStore.ts`, `api/auth.ts`, 2 chỗ gọi
`setSession` trong `login.tsx`):**
- `LoginResponse = { accessToken: string; user: User }` — **không có `refreshToken`**.
  Có comment sẵn trong code: *"Refresh token is not returned in JSON — it is set as
  an httpOnly cookie by the backend (see doc/API.md 0.2)"*.
- `authStore.setSession(accessToken, user)` chỉ nhận access token — xác nhận
  không có refresh token nào được truyền qua tay ở phía app hiện tại.
- 2 chỗ gọi `setSession`: `login.tsx:84` (đăng nhập mật khẩu) và `login.tsx:113`
  (đăng nhập Google) — cả hai chỉ destructure `{ accessToken, user }`.
- → **Backend hiện tại chỉ trả refresh token qua cookie httpOnly, không có trong
  body.** Mình không có quyền truy cập backend repo để kiểm tra/đổi, và theo quy
  tắc không được tự đoán việc backend "có hay sẽ" trả thêm field này.

**Đã chọn: (b) giữ cookie httpOnly như hiện tại.** Đã làm:
- `docs/backend-requests.md` (mới) — đặc tả vấn đề (cờ `Secure` qua HTTP LAN, đổi
  IP/domain giữa phiên, cookie sống qua app bị kill) + đề xuất hướng cho backend,
  không tự đoán tên field/endpoint.
- `README.md` — thêm mục "Giới hạn đã biết" tóm tắt vấn đề, dẫn sang
  `docs/backend-requests.md`.

**Đã làm xong, không phụ thuộc lựa chọn (a)/(b):**
- Sửa race trong interceptor (`src/api/client.ts`): đổi từ
  `refreshPromise = refreshPromise ?? refreshAccessToken(); ...; refreshPromise = null;`
  (mỗi request đang chờ đều tự gán `null`) sang
  `refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null })`
  — chỉ nullified đúng một lần, bởi chính lệnh refresh, không phải bởi từng caller
  đang `await` nó.

**File đã đổi:** `src/api/client.ts`, `docs/backend-requests.md` (mới), `README.md`.

**Cách test thủ công (phần đã xong):** mở 2-3 màn cùng gọi API cần auth đồng thời
(vd kéo refresh ở Trang chủ + Đặt phòng của tôi liền nhau) khi access token đã hết
hạn — chỉ nên thấy **một** request `/auth/refresh` trong network log/log backend,
không phải nhiều request refresh chồng lên nhau.

**Commit message đề xuất (phần đã xong):**
```
fix(api): dedupe concurrent token refreshes via a single finally()

refreshPromise was being nulled by every caller that awaited it, not just the
one that started it, which could let a later 401 kick off a redundant second
refresh while the first was still settling for other callers.
```

### B1. Lỗi tsc với global.css — ✅

Tái hiện đúng như mô tả: đổi tên `expo-env.d.ts` → `tsc` báo
`TS2882: Cannot find module or type declarations for side-effect import of
'@/global.css'` tại `src/constants/theme.ts:6`. Nguyên nhân: ambient declaration
cho `*.css` hiện chỉ có được NHỜ `expo-env.d.ts`'s `/// <reference types="expo/types" />`
— mà file này bị gitignore, tự sinh lại (thường do `expo start` chạy lần đầu).
Một checkout mới hoàn toàn (CI chạy `npm ci` mà chưa từng `expo start`) sẽ KHÔNG
có file này → `tsc` sẽ fail đúng kiểu lỗi trên. Đây là rủi ro thật cho pipeline CI
(giai đoạn E2), không chỉ là bài tập tái hiện.

**File đã đổi:** `src/types/css.d.ts` (mới) — `declare module '*.css';`, tự ambient
declare, không phụ thuộc file tự sinh. Đã đổi tên `expo-env.d.ts` lại như cũ sau
khi kiểm tra xong (file này vẫn gitignore, không track).

**Cách test:** `mv expo-env.d.ts expo-env.d.ts.bak && npx tsc --noEmit` → phải
pass (đã test, pass). Đổi tên lại, test lần nữa → vẫn pass.

**Commit message đề xuất:**
```
fix(types): declare *.css module explicitly, independent of expo-env.d.ts

tsc only resolved the @/global.css side-effect import because the gitignored,
auto-generated expo-env.d.ts happened to pull in an ambient *.css declaration.
A fresh checkout that never ran `expo start` (e.g. CI after `npm ci`) would fail
TS2882. Declare it in a tracked file instead.
```

### B2. Lint — ✅ (0 lỗi, chỉ còn warning checkout để dành cho C4)

**File đã đổi:**
- `src/app/(tabs)/profile.tsx` — bỏ import `Constants` không dùng (sẽ cần lại ở
  B3 khi hiện "Phiên bản x.y.z", sẽ thêm lại lúc đó).
- `src/app/notifications.tsx` — bỏ import `Button` không dùng (nút "đánh dấu đã
  đọc hết" đã chuyển vào `headerRight` dạng icon `Pressable`, không còn `<Button>`
  nào trong file — xác nhận không phải code chết mồ côi, chỉ import dư).
- `src/api/client.ts` — `axios.create`/`axios.isAxiosError` → named import
  `create`/`isAxiosError`; `i18next.t` → named import `t`. Đã kiểm tra bằng
  `node -e` rằng các property này là CÙNG reference với named export (không phải
  2 hàm khác nhau do ESM/CJS interop) — đổi an toàn, không đổi hành vi. `axios.post`
  (dùng trong `refreshAccessToken`) KHÔNG bị lint gắn cờ (named export `post` chỉ
  tồn tại ở JS runtime, không khai báo ở module-level trong type `.d.ts` của axios)
  nên giữ nguyên qua default import, không tự sửa thêm ngoài phạm vi lint báo.
- `src/i18n/index.ts` — `i18next.use`/`i18next.changeLanguage` → named import.
  Gặp false-positive: eslint-plugin-react-hooks (React 19 `rules-of-hooks`) coi
  bất kỳ hàm top-level tên `use`/`useXxx` là vi phạm Rules of Hooks, dù đây là
  `i18next.use()` (đăng ký plugin) không liên quan gì tới React. **Không dùng
  eslint-disable** — đổi tên biến khi import (`use as registerI18nextPlugin`) để
  né tên bị rule nhận nhầm, sạch hơn là che cảnh báo.

**Cách test:** `npx tsc --noEmit` (0 lỗi) + `npx expo lint` → 0 lỗi, còn đúng 1
warning (`checkout/[bookingId].tsx` exhaustive-deps, cố ý để dành C4).

**Commit message đề xuất:**
```
chore(lint): fix named-default-member warnings and drop unused imports

Switch axios/i18next property access to their named exports (verified identical
references, no behavior change), rename i18next's `use` import to dodge a
react-hooks/rules-of-hooks false positive on its name, and drop two dead imports
left over from UI that moved elsewhere.
```

### B3. README, .env.example, scripts, tên app — ✅ (đã chọn: "Vika Hotel")

**File đã đổi:**
- `app.json` — `"name": "smartstay-mobile"` → `"Vika Hotel"` (tên hiển thị dưới
  icon). **Không đổi** `slug`, `owner`, `extra.eas.projectId`, `scheme`,
  `ios.bundleIdentifier`/`android.package` (đúng yêu cầu). Grep "SmartStay" trong
  `src/` và `app.json` không ra chuỗi hiển thị nào cần đổi — chỗ còn ghi
  "SmartStay" chỉ là tên hệ thống/kỹ thuật (package.json name, bundle id,
  README mô tả nền tảng chung), khác với "Vika Hotel" là tên khách sạn hiển thị
  cho khách — giữ nguyên, không đổi lẫn hai khái niệm này.
- `package.json` — xoá script `reset-project` (đã xác nhận `scripts/reset-project.js`
  không tồn tại trong repo).
- `.env.example` — dịch toàn bộ comment sang tiếng Việt; đã grep lại toàn `src/`,
  xác nhận đủ cả 6 biến `EXPO_PUBLIC_*` đang được dùng trong code (API_URL, 3
  Google client ID, 2 Turnstile). `.gitignore` chỉ chặn `.env`/`.env*.local`,
  không chặn `.env.example`.
- `src/app/(tabs)/profile.tsx` — bật lại khối "Phiên bản x.y.z" vốn đang bị
  comment (dùng `expo-constants`), thêm lại import `Constants` (đã bỏ ở B2 vì
  lúc đó chưa dùng).
- `README.md` — viết lại theo code thật: giới thiệu, công nghệ, bảng tính năng
  theo `src/app` (Turnstile, Google, PayOS, vé check-in + lưu QR, chat AI lưu
  lịch sử, thông báo realtime, sửa hồ sơ, đổi mật khẩu, dark mode, vi/en), cấu
  trúc thư mục, cài đặt + `.env` (IP LAN/10.0.2.2/localhost), cách chạy bằng dev
  client (nêu rõ Expo Go không dùng được tính năng lưu QR), build APK demo bằng
  EAS (dẫn sang `eas env:create` ở A2), bảng scripts, thành viên nhóm. **Đã xoá**
  2 đoạn lỗi thời: "đăng nhập mật khẩu không dùng được" (sai — đã có Turnstile)
  và "/reviews, /notifications trả 404" (sai — cả hai đã hoạt động). Giữ lại +
  viết rõ hơn mục "Giới hạn đã biết" (refresh token qua cookie) từ A3.

**Phát hiện thêm (không tự sửa — xem mục riêng cuối file):** `account.tsx` và
`edit-profile.tsx` có vẻ trùng chức năng sửa hồ sơ (cùng gọi `usersApi.updateMe`,
chỉ khác bộ field: account.tsx có thêm `idNumber`). Không chắc đây là chủ ý
(hai luồng khác nhau) hay dư thừa — không tự xoá/gộp vì ngoài phạm vi B3.

**Cách test thủ công:**
1. Mở app, vào Hồ sơ → cuối màn thấy "Vika Hotel · phiên bản 1.0.0".
2. `npm run reset-project` không còn trong `package.json`; `npm run <tab>` không
   còn gợi ý lệnh này.
3. Đọc `README.md` từ đầu, làm theo đúng từng bước (cài đặt, `.env`, chạy) trên
   máy sạch — không có bước nào trỏ tới thứ không tồn tại.

**Commit message đề xuất:**
```
docs(readme): rewrite README to match current code, set display name to Vika Hotel

The README still described password login as broken and /reviews,/notifications
as 404 — both are implemented now. Rewrite it from the actual src/app routes,
set app.json's display name, drop the dead reset-project script, and translate
.env.example's comments to Vietnamese.
```

## Điểm chờ quyết định (⏸)

- **A3 — lưu refresh token:** đã hỏi, bạn chọn (b) giữ cookie. Xem mục A3 và
  `docs/backend-requests.md`.
- **B3 — tên app:** đã hỏi, bạn chọn "Vika Hotel". Xem mục B3.

## Phát hiện thêm (ngoài phạm vi, chưa sửa)

- **(B3) `account.tsx` và `edit-profile.tsx` có thể trùng chức năng:** cả hai
  đều cho sửa `fullName`/`phone`/`address` qua `usersApi.updateMe`; `account.tsx`
  có thêm field `idNumber`, `edit-profile.tsx` thì không. `profile.tsx` dẫn tới
  cả hai (card đầu trang → `/account`; MenuRow "Chỉnh sửa hồ sơ" → `/edit-profile`).
  Không rõ đây là chủ ý (ví dụ `/account` để xem chi tiết đầy đủ, `/edit-profile`
  để sửa nhanh) hay dư thừa cần gộp lại — không tự sửa vì ngoài phạm vi B3.

## Việc bạn cần tự làm

(Điền dần: lệnh EAS, xác nhận backend, xoá nút test lỗi trước khi nộp, rebuild dev client, v.v.)
