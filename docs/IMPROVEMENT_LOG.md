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
- [x] C1. Mã khuyến mãi bị treo
- [x] C2. Số khách + form bằng Zod (numberOfGuests: chỉ thêm type, không gửi)
- [x] C3. Giá tạm tính (không có endpoint báo giá — đổi nhãn + chú thích)
- [x] C4. Luồng thanh toán PayOS (usePayosCheckout)

### Giai đoạn D — Độ bền, tính năng còn thiếu, UX
- [x] D1. useApi chống race
- [x] D2. Tách lưu trữ (secureStorage/plainStorage)
- [x] D3. Quên mật khẩu
- [x] D4. Error Boundary
- [x] D5. Mất mạng
- [x] D6. Accessibility
- [x] D7. Hiệu năng danh sách

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

### Rà soát "nhìn chuyên nghiệp hơn" (ngoài kế hoạch A–E) — ✅ cả 5 việc

Bạn yêu cầu đọc lại toàn bộ code, tìm chỗ cần nâng cấp cho chuyên nghiệp hơn.
Đã đọc các màn chưa từng đụng trong phiên này (Trang chủ, Tìm phòng, Đơn của
tôi, Chi tiết phòng, Đặt phòng mới, Onboarding) + component dùng chung
(HeroCarousel, BookingCard, RoomTypeCard, PromoTicket, StatusBadge,
SectionHeader) + quét `console.log`/`TODO`/`Alert.alert`/màu hex cứng toàn repo.
Nhận xét chung: nền tảng đã khá chuyên nghiệp (token nhất quán, dark mode không
rò màu cứng, skeleton/empty/error state đều đặn, animation tôn trọng "Reduce
Motion", không có code rác). 5 việc cụ thể bạn chọn làm luôn:

1. **Khung tìm kiếm Trang chủ không còn "giả"** — thêm `src/store/searchPrefsStore.ts`
   (Zustand, chỉ lưu trong phiên, không persist) ghi lại ngày/số khách của lần
   tìm gần nhất. `search.tsx` ghi vào đây sau khi tìm thành công, và đọc ra làm
   giá trị mặc định khi mở lại màn (thay vì luôn ngày mai/mốt). `(tabs)/index.tsx`
   hiện đúng ngày/số khách đã tìm thay vì chữ tĩnh "Chọn ngày"/"Thêm khách".
2. **Lỗi tìm phòng chuyển sang `toast.error`** thay vì dòng chữ đỏ tĩnh trong
   card — đồng nhất với cách báo lỗi còn lại của app (`(tabs)/search.tsx`).
3. **Pull-to-refresh không còn nuốt lỗi âm thầm** — `useApi.ts` thêm option
   `toastOnRefreshError` (mặc định `false`, không đổi hành vi chỗ nào chưa bật).
   Bật ở 3 nơi dữ liệu chính: `roomTypes`+`promotions` (Trang chủ), `bookings`
   (Đơn của tôi), `booking` (chi tiết đơn). **Cố ý không bật** cho `myReviews` ở
   cả 2 nơi dùng nó — giữ đúng thiết kế "decorative, im lặng nếu lỗi" đã có sẵn
   trong comment gốc.
4. **`PromoTicket` copy mã khuyến mãi** giờ có haptic (`Haptics.selectionAsync`)
   + `toast.success` giống mọi chỗ copy khác trong app (CheckInPass, đổi mật
   khẩu...), bỏ state `copied`/đổi icon-tại-chỗ cũ (giờ dư thừa vì đã có toast).
5. **Skeleton cho `PromoTicket`** khi `promotions.loading` — trước đó không có
   gì hiện ra, nội dung "nhảy" vào khi mạng chậm. (Kiểm tra lại: `ExperienceGallery`
   là ảnh demo tĩnh, không gọi API, nên không cần skeleton — bỏ ý ban đầu về
   gallery, chỉ còn đúng promo ticket.)

**File đã đổi:** `src/store/searchPrefsStore.ts` (mới), `src/app/(tabs)/search.tsx`,
`src/app/(tabs)/index.tsx`, `src/app/(tabs)/bookings.tsx`, `src/app/booking/[id].tsx`,
`src/hooks/useApi.ts`, `src/components/PromoTicket.tsx`.

**Không có key i18n mới** — toàn bộ tái dùng key có sẵn (`common.guest`,
`home.searchDate`, `home.searchAddGuests`, `promo.copied`).

**Cách test thủ công:**
1. Trang chủ → kéo xuống làm mới trong lúc tắt mạng → thấy toast lỗi (trước đây im lặng).
2. Tìm phòng với ngày/số khách bất kỳ → bấm Tìm → thành công → quay lại Trang
   chủ → ô tìm kiếm hiện đúng ngày + số khách vừa tìm (không phải chữ tĩnh).
3. Mở lại tab Tìm phòng → ngày/số khách giữ nguyên lần tìm trước (không phải
   luôn ngày mai/mốt + 2 khách).
4. Tắt mạng rồi bấm Tìm phòng → thấy toast đỏ (không phải dòng chữ trong card).
5. Trang chủ lúc đang tải khuyến mãi → thấy khối skeleton xám nhấp nháy thay vì
   khoảng trống/nhảy layout.
6. Có khuyến mãi đang chạy → bấm vào vé khuyến mãi → rung nhẹ + toast "Đã sao
   chép" (không còn icon đổi thành dấu tick tại chỗ).

**Commit message đề xuất:**
```
feat(ux): reflect real search state on home and surface silent failures

The home search card always showed static placeholder text, refresh failures
on home/bookings/booking-detail had no visible sign once data was already
loaded, and the search screen's error used a different pattern (inline text)
than the rest of the app (toast). Add a session-only search-prefs store, an
opt-in toastOnRefreshError flag on useApi, and align PromoTicket's copy
feedback with the haptic+toast pattern used elsewhere.
```

### C1. Mã khuyến mãi bị treo — ✅

Thêm `appliedPromoCode: string | null` trong `booking/new.tsx` — chỉ khác
`null` ngay sau một `handleValidatePromo()` thành công, cho đúng mã đang có
trong ô nhập lúc đó. Bị reset về `null` (+ `discountAmount = 0` + thông báo
"Danh sách dịch vụ đã thay đổi, vui lòng áp dụng lại mã") ở 2 nơi: `toggleService`
(không dùng `useEffect`, đúng như prompt yêu cầu) và khi sửa ô mã sau khi đã áp
(`handlePromoCodeChange`). Khi submit: `promotionCode: appliedPromoCode &&
appliedPromoCode === promoCode.trim() ? appliedPromoCode : undefined` — chỉ gửi
đúng khi còn khớp với ô nhập hiện tại.

**File đã đổi:** `src/app/booking/new.tsx`, `src/i18n/locales/vi.json`/`en.json`
(key mới `booking.promoNeedsReapply`).

**Cách test:** đặt phòng → áp mã khuyến mãi hợp lệ (giảm giá hiện ra) → tick
thêm 1 dịch vụ → phải thấy ngay thông báo "Danh sách dịch vụ đã thay đổi..." và
tổng tiền tự bỏ phần giảm giá → nếu bấm Đặt luôn mà không áp lại mã, đơn tạo ra
**không có** `promotionCode`. Tương tự khi sửa chữ trong ô mã sau khi đã áp.

**Commit message đề xuất:**
```
fix(booking): invalidate the applied promo when services or the code change

discountAmount stayed applied (and was submitted) even after changing the
service selection or editing the code field, so the booking could be created
with a discount that no longer matched what the backend would compute. Track
the exact code the discount is for and clear it whenever either changes.
```

### C2. Số khách + form bằng Zod — ✅

**Số khách:** đọc `docs/API.md` (repo backend sibling) mục 5.1 `POST /bookings`
— body chỉ có `roomTypeId, checkIn, checkOut, guestInfo{fullName,phone,email},
extraServiceIds, promotionCode, paymentMethod`, **không có field số khách nào**.
`guests` hiện tại chỉ dùng hiển thị, không hề gửi lên server. Đã hỏi, bạn chọn
"chỉ thêm type + TODO, không gửi" — đã thêm `numberOfGuests?: number` vào
`CreateBookingDto` (`src/types/booking.ts`) kèm comment TODO giải thích rõ chưa
xác nhận với backend; **không** đụng vào payload `bookingsApi.create()` thật.

**Form fullName/phone:** chuyển sang `react-hook-form` + `zod`, theo đúng
pattern của `login.tsx` (Controller + zodResolver + `errors.<field>?.message`
đổ vào `TextField`). `fullName`: `trim().min(2).max(100)`. `phone`: dùng
`phoneSchema()` mới trong `src/utils/validation.ts` — bỏ hết khoảng trắng rồi
khớp `^(0|\+84)(3|5|7|8|9)\d{8}$` (đúng đầu số di động VN còn cấp). Submit
button giờ dùng `isSubmitting` từ `useForm` thay cho state `submitting` riêng.
Xoá key i18n không còn dùng: `booking.requireFullNamePhone` (thay bằng lỗi
field inline qua 2 key mới `booking.fullNameInvalid`, `booking.phoneInvalid`).

**File đã đổi:** `src/utils/validation.ts` (mới), `src/types/booking.ts`,
`src/app/booking/new.tsx`, `src/i18n/locales/vi.json`/`en.json`.

**Chưa đụng:** `register.tsx` (phone chỉ check `min(8)`, lỏng hơn) và
`account.tsx` (`PHONE_PATTERN = /^(0|\+84)\d{9,10}$/`, không giới hạn đầu số) —
không nằm trong phạm vi C2, không tự sửa. `phoneSchema()` đã đặt sẵn trong
`validation.ts` để 2 chỗ đó dùng lại sau nếu cần.

**Cách test:** bỏ trống họ tên hoặc gõ 1 ký tự → lỗi inline dưới ô, không submit
được. Gõ số điện thoại đầu số lạ (vd `021xxxxxxx`) hoặc có khoảng trắng
(`090 123 4567`) → báo lỗi / hoặc tự làm sạch khoảng trắng rồi submit đúng số.

**Commit message đề xuất:**
```
refactor(booking): move guest-info form to react-hook-form + zod

Guest name/phone were validated with a single toast on submit instead of
inline field errors like every other form in the app. Reuse the login.tsx
pattern and a shared Vietnamese phone schema; also record that the create-
booking endpoint has no guest-count field yet, without guessing one.
```

### C3. Giá tạm tính — ✅ (nhánh: không có endpoint báo giá)

Đã grep `docs/API.md` (repo backend sibling) tìm quote/preview/price/estimate —
chỉ thấy `GET /bookings/:id/checkout-preview` (xem trước hoá đơn **trả phòng**
của một đơn ĐÃ TẠO — phụ thu trễ giờ + dịch vụ, dùng lúc check-out, không liên
quan tới việc ước tính giá TRƯỚC KHI tạo đơn mới). → Không có endpoint báo giá
cho màn đặt phòng mới. Đi nhánh: đổi nhãn.

- `booking/new.tsx`: nhãn "Tổng" → "Tạm tính" (`booking.estimatedTotal`, dùng
  lại ở cả dòng tổng trong Card phân tích giá và ở `BottomBar`), thêm chú thích
  nhỏ "Giá cuối cùng được xác nhận sau khi tạo đơn." (`booking.estimatedTotalNote`)
  ngay dưới dòng tổng.
- Xoá key `booking.totalToPay` (không còn nơi nào dùng sau khi đổi).
- **Không đổi** `booking.total` — key này dùng ở `booking/[id].tsx` (đơn đã tạo,
  số liệu server) và `ChatBubble.tsx` (thẻ đề xuất đặt phòng của AI, cũng là số
  server tính) — cả hai đúng là "Tổng" thật, không phải tạm tính, nên giữ
  nguyên, không gộp nhầm với key mới.
- Xác nhận lại (không cần sửa code): `booking/[id].tsx`, `components/BookingCard.tsx`,
  `components/ChatBookingCreatedCard.tsx` đều đã hiển thị `totalAmount` lấy
  trực tiếp từ response server (`Booking`/`ConfirmedBooking`), không tính lại ở
  client — đúng yêu cầu, không cần đổi gì thêm.

**File đã đổi:** `src/app/booking/new.tsx`, `src/i18n/locales/vi.json`/`en.json`.

**Cách test:** vào màn đặt phòng mới → dòng tổng tiền giờ ghi "Tạm tính" kèm
chú thích nhỏ bên dưới, ở cả khối chi tiết giá và thanh dưới cùng. Các màn khác
(chi tiết đơn, thẻ đơn trong "Đơn của tôi", thẻ đặt phòng trong chat) vẫn ghi
"Tổng" như cũ.

**Commit message đề xuất:**
```
fix(booking): label the pre-booking total as an estimate

There's no quote/preview endpoint for a booking that hasn't been created yet
(only a checkout-preview for an existing one), so the new-booking total is a
client-side calculation that can drift from what the backend actually charges.
Label it "Tạm tính" with a note instead of implying it's final.
```

### C4. Luồng thanh toán PayOS (usePayosCheckout) — ✅

Tách toàn bộ vòng đời link PayOS ra `src/hooks/usePayosCheckout.ts` — trả về
đúng `{ phase, link, amount, error, regenerate }` như yêu cầu, `phase` là
`'loading'|'waiting'|'paid'|'expired'|'failed'|'error'`.

- **Amount có ngay:** lấy `created.amount` từ response tạo link nếu có; nếu
  không (link cũ tái dùng, không kèm amount), gọi `syncPayosStatus` **một lần
  ngay lập tức** (không chờ 4s đầu) — nếu lúc đó đã `PAID`/`FAILED` thì vào
  thẳng `paid`/`failed`, không hiện QR rồi phải đổi ngay.
- **Hết hạn bằng `setTimeout` riêng:** một effect riêng tính
  `delay = link.expiredAt * 1000 - Date.now()` rồi `setTimeout` đúng lúc đó
  chuyển sang `expired` — không còn phải chờ tới lượt poll 4s kế tiếp mới
  nhận ra đã hết hạn. **Đơn vị `expiredAt` là giây** (epoch giây, đã xác nhận
  lại qua `docs/API.md` mục 8.1: "`expiredAt`: epoch giây, link sống ~15
  phút"), nhân 1000 mới ra ms.
- **`failed` tách riêng khỏi `expired`:** trước đây cả 2 trường hợp (hết giờ
  và `paymentStatus: FAILED` từ backend) đều gộp chung vào 1 biến `expired`.
  Giờ `failed` có màn riêng (icon dấu X, "Thanh toán không thành công") với
  nút **"Xem đơn"** (`router.replace('/booking/:id')`); `expired` có nút
  **"Tạo mã mới"** gọi `regenerate()` — khi hết hạn, màn còn ẩn hẳn QR/nút mở
  app ngân hàng/khối chuyển khoản/hướng dẫn (dùng link đã chết thì vô nghĩa),
  chỉ còn pill "Mã QR đã hết hạn" + nút tạo mã mới.
- **Poll tạm dừng khi app ở background:** effect poll giờ phụ thuộc cả
  `phase === 'waiting'` **và** `appIsActive` (theo dõi qua `AppState`) — rời
  app thì effect cleanup tự `clearInterval`, không poll vô ích. Quay lại active
  thì `sync()` gọi ngay 1 lần (không chờ tick kế) rồi poll khởi động lại.
- **Dọn timer/listener khi unmount:** toàn bộ viết lại theo kiểu khai báo —
  mỗi `useEffect` tự `return` cleanup riêng (`clearInterval`/`clearTimeout`/
  `subscription.remove()`), không còn `useRef` thủ công nào phải tự nhớ dọn.
- **Sửa exhaustive-deps không dùng eslint-disable:** 2 chỗ gặp lỗi MỚI (không
  phải exhaustive-deps mà là `react-hooks/set-state-in-effect`, rule chặn gọi
  `setState` đồng bộ ngay trong thân effect):
  1. Effect gọi `createLink()` lúc mount — bọc trong hàm `async function run()`
     khai báo ngay trong effect rồi gọi `run()` (cùng kiểu đã dùng ở
     `ChatBookingCreatedCard.tsx` từ A1) — ESLint chỉ lần theo hàm khai báo
     cục bộ, không soi được vào bên trong hàm `useCallback` được truyền tới.
  2. Effect lên lịch hết hạn: bỏ nhánh rẽ `if (delay <= 0) setPhase('expired')`
     đồng bộ, thay bằng `Math.max(0, delay)` rồi luôn dùng `setTimeout` (dù 0ms
     vẫn là bất đồng bộ, không bị rule này soi).
  Cảnh báo `exhaustive-deps` CŨ ở file này (thiếu `t`) tự nhiên biến mất vì
  effect gốc gây ra nó đã không còn tồn tại sau khi viết lại.
- **TODO thêm:** comment ngay trong `createLink()` hỏi backend endpoint
  `POST /payments/payos/:bookingId/link` có idempotent không (gọi lại —
  `regenerate()` hoặc remount màn — cho đơn đã có link có trả về đúng link cũ
  hay tạo thêm 1 payment intent mới).

**File đã đổi:** `src/hooks/usePayosCheckout.ts` (mới),
`src/app/checkout/[bookingId].tsx` (dùng hook, bớt đi toàn bộ state/effect
vòng đời link; giữ nguyên các phần không liên quan: chọn app ngân hàng, copy
clipboard, khối thông tin chuyển khoản), `src/i18n/locales/vi.json`/`en.json`
(key mới `checkout.regenerateLink`, `checkout.failedTitle`,
`checkout.failedSubtitle`; sửa `checkout.expired` — bỏ câu "vui lòng quay lại
tạo đơn mới" đã sai từ khi có nút "Tạo mã mới").

**Cách test thủ công:**
1. Vào thanh toán 1 đơn PAYOS mới → thấy QR + số tiền hiện ngay (không trễ 4s).
2. Chờ hết hạn (hoặc sửa tạm `expiredAt` ngắn lại để test nhanh) → đúng lúc hết
   hạn (không phải tới tick poll kế) chuyển sang "Mã QR đã hết hạn" + nút "Tạo
   mã mới", ẩn hết QR/chuyển khoản/hướng dẫn. Bấm nút → tạo lại link mới, về
   lại trạng thái chờ bình thường.
3. Đưa app xuống nền (Home) rồi mở lại trong lúc đang chờ thanh toán → đồng bộ
   lại ngay khi mở app, không phải chờ.
4. Giả lập/chờ backend trả `paymentStatus: FAILED` → màn hiện "Thanh toán
   không thành công" + nút "Xem đơn", khác với màn hết hạn.
5. Tạo link lỗi (vd tắt mạng lúc vào màn) → `ErrorView` giờ có nút thử lại gọi
   đúng `regenerate` (trước đây không có nút thử lại nào ở bước này).

**Commit message đề xuất:**
```
refactor(checkout): extract PayOS link lifecycle into usePayosCheckout

The checkout screen managed loading/polling/expiry entirely with ad-hoc state
and a single "expired" flag that conflated time-based expiry with an explicit
backend FAILED status. Move that lifecycle into a hook with a proper phase
enum, expire exactly at expiredAt via its own timer instead of waiting for the
next 4s poll, pause polling while backgrounded, and give failed/expired their
own screens (view booking vs. regenerate a new link).
```

### D1. useApi chống race — ✅

Thêm `requestIdRef` (tăng dần, mỗi lần `load()` chạy) + `mountedRef` (set
`false` lúc unmount) trong `src/hooks/useApi.ts`. Một request chỉ được phép
`setData`/`setError`/`setLoading(false)` nếu nó vẫn là request **mới nhất**
được gọi (`requestIdRef.current === requestId` của chính nó) **và** component
còn mounted — nên 1 request cũ chạy chậm, lỡ resolve SAU một request mới hơn
(refetch() đua với refocus, đổi `fetcher` 2 lần liên tiếp...), không còn ghi đè
dữ liệu mới hơn mà request sau đã set.

**Không đổi API trả về** (`{ data, loading, error, refetch, refreshing,
refresh }`) và **không đổi hành vi `refetchOnFocus`** — đúng yêu cầu. Không
thêm thư viện.

**File đã đổi:** `src/hooks/useApi.ts`.

**Cách test thủ công:** khó tái hiện race tay trong UI bình thường (cần mạng
chậm + thao tác rất nhanh) — cách chắc ăn nhất là test đơn vị ở E1 (giả 2
fetcher, 1 chậm 1 nhanh, gọi gần nhau, assert state cuối đúng theo request mới
nhất) — mình sẽ thêm vào danh sách test khi tới E1. Tạm thời đã xác nhận không
đổi hành vi bình thường qua `tsc`/`lint` sạch và đọc lại logic tay.

**Commit message đề xuất:**
```
fix(useApi): ignore stale responses from superseded requests

A slower in-flight request resolving after a newer one (refetch racing a
focus refetch, the fetcher changing twice in quick succession) could
overwrite fresher state with stale data. Tag each load() call with an id and
only apply its result while it's still the latest one in flight.
```

### D2. Tách lưu trữ (secureStorage/plainStorage) — ✅

Cài `@react-native-async-storage/async-storage` bằng `npx expo install` (bản
2.2.0, tương thích SDK 57). **Không cần config plugin/dev client** — khác với
`expo-media-library` trước đó, AsyncStorage chạy được ngay trong Expo Go.

- `src/store/persistedStorage.ts`: export `secureStorage` (giữ đúng logic cũ:
  `expo-secure-store` trên native / `localStorage` trên web — chỉ nên dùng cho
  bí mật) và `plainStorage` (thẳng `AsyncStorage`, tự có bản web riêng nên
  không cần rẽ nhánh Platform). `persistedStorage` giữ lại làm alias
  `@deprecated` trỏ sang `secureStorage`, không ai còn import tên cũ nữa
  (đã kiểm bằng grep) — chỉ giữ phòng hờ.
- **Chỉ access token nằm trong SecureStore** (key mới `smartstay-access-token`,
  cập nhật trực tiếp trong `setSession`/`setAccessToken`/`clearSession`, không
  qua `persist` middleware vì chỉ là 1 chuỗi, không cần bọc JSON blob).
  `user`, `hasSeenOnboarding` (store Auth), toàn bộ `settingsStore`, và lịch sử
  hội thoại AI (`aiChatHistory.ts`) chuyển sang `plainStorage`. Tên key hiện có
  (`smartstay-auth`, `smartstay-settings`, `vika-ai-conversation.<userId>`,
  `checkout.lastBankAppId`) **giữ nguyên** — chỉ đổi NƠI LƯU, không đổi tên.
- **Migration 1 lần** từ blob `smartstay-auth` cũ trong SecureStore (lúc đó
  gộp cả `accessToken`+`user`+`hasSeenOnboarding`): `onRehydrateStorage` của
  `authStore` kiểm tra key mới trước; nếu chưa có mới đọc blob cũ, lấy luôn cả
  3 field (không chỉ token) áp vào store ngay trong phiên hiện tại — để người
  đang đăng nhập không bị đăng xuất **và** vẫn thấy đúng tên/thông tin của họ
  ngay, không phải chờ `GET /auth/me` chạy lại mới có. Xoá blob cũ sau khi đọc
  — hàm migration tự "hết tác dụng" từ lần chạy thứ 2 trở đi (không cần cờ
  đánh dấu đã migrate riêng).
- `hasHydrated` (authStore) chỉ bật `true` sau khi **cả 2 nửa** xong: rehydrate
  `plainStorage` (zustand tự gọi `onRehydrateStorage` sau khi xong) **và**
  bước đọc/migrate token từ SecureStore (await trong cùng callback đó).

**File đã đổi:** `package.json`/`package-lock.json`, `src/store/persistedStorage.ts`,
`src/store/authStore.ts`, `src/store/settingsStore.ts`, `src/utils/aiChatHistory.ts`,
`src/app/checkout/[bookingId].tsx` (đổi `persistedStorage` → `plainStorage` cho
"ngân hàng dùng gần nhất", không nhạy cảm).

**Cách test thủ công:**
1. **Trước khi cập nhật code này** (hoặc giả lập): đăng nhập, đóng app.
2. Cập nhật lên bản có D2, mở lại app → **vẫn đăng nhập**, vẫn thấy đúng tên
   (không phải màn trắng/tên rỗng rồi mới hiện).
3. Xoá hẳn app cài lại (fresh install) → đăng nhập bình thường, đăng xuất vào
   lại, đổi theme/ngôn ngữ, chat với AI rồi tắt mở lại app → lịch sử chat,
   theme, ngôn ngữ đều giữ đúng.

**Commit message đề xuất:**
```
refactor(storage): split secure (token) and plain (everything else) storage

persistedStorage put the access token, user profile, settings, and AI chat
history all through SecureStore — the OS keychain is unnecessary overhead for
anything that isn't a secret. Add plainStorage (AsyncStorage) for the rest,
keep secureStorage for just the token, and migrate the one existing combined
blob once so a signed-in guest isn't logged out by the switch.
```

### D3. Quên mật khẩu — ✅

**Phần đã có từ trước (xác nhận lại, không làm lại):** luồng
`forgot-password.tsx` (email) → `verify-reset-otp.tsx` (OTP, dùng `OtpInput`,
cùng phong cách `verify-otp.tsx`) → `reset-password.tsx` (mật khẩu mới) → về
`login` kèm toast — đã làm ở phiên trước, vẫn còn nguyên. Link "Quên mật
khẩu?" ở `login.tsx` cũng đã có. Đọc lại `ForgotPasswordDto`/`VerifyResetOtpDto`/
`ResetPasswordDto` (`types/auth.ts`) — **không field nào cần `turnstileToken`**,
nên không cần (và không nên) gắn `TurnstileWidget` vào 3 màn này.

**Việc mới làm trong D3 — gộp schema mật khẩu dùng chung:** đọc lại
`docs/API.md` (repo backend) thì phát hiện `register`/`reset-password` và
`change-password` **không cùng quy tắc** như câu lệnh ban đầu ngỡ:
- `register` (mục 1.1) + `reset-password` (mục 1.3): tối thiểu **6** ký tự.
- `change-password` (mục 6.x): tối thiểu **8** ký tự, **phải có cả chữ và
  số** — khác hẳn, không thể dùng chung 1 schema.

→ Tạo **2** schema riêng trong `src/utils/validation.ts`: `passwordSchema()`
(min 6, dùng ở `register.tsx` + `reset-password.tsx`) và `strongPasswordSchema()`
(min 8 + bắt buộc có chữ VÀ số, dùng ở `change-password.tsx`).

**Phát hiện và sửa luôn 1 bug thật:** `change-password.tsx` trước đây dùng
`useState` thủ công, chỉ check `newPassword.length >= 8` — **không hề kiểm
tra có chữ+số** như backend yêu cầu. Người dùng gõ mật khẩu 8 số (vd
`11111111`) vẫn qua được validate ở app, rồi mới bị backend trả 400 khó hiểu.
Đã chuyển hẳn màn này sang `react-hook-form` + `zod` (giống pattern
`reset-password.tsx`), dùng `strongPasswordSchema()`, lỗi hiện inline đúng
field. Tiện tay dùng luôn key i18n `profile.newPasswordHint` ("Tối thiểu 8 ký
tự, có cả chữ và số") đang **mồ côi** (có sẵn trong file dịch, chưa chỗ nào
gọi) làm vừa hint vừa message lỗi.

**File đã đổi:** `src/utils/validation.ts` (thêm `passwordSchema`,
`strongPasswordSchema`), `src/app/(auth)/register.tsx`, `src/app/(auth)/reset-password.tsx`
(cả 2 chỉ đổi sang gọi `passwordSchema()`, hành vi y như cũ — min 6, không
đổi gì người dùng thấy được), `src/app/change-password.tsx` (viết lại hoàn
toàn phần form, giữ nguyên giao diện/hero navy/security tip card).

**Cách test thủ công:**
1. Đổi mật khẩu → gõ mật khẩu mới toàn số (vd `12345678`, đủ 8 ký tự) → phải
   thấy lỗi inline ngay (trước đây sẽ cho qua, chỉ bị backend từ chối sau).
2. Gõ mật khẩu mới hợp lệ (có chữ+số, ≥8 ký tự) nhưng xác nhận gõ sai → lỗi
   "Mật khẩu xác nhận không khớp" ở đúng ô xác nhận.
3. Đăng ký tài khoản / đặt lại mật khẩu quên: mật khẩu 6 ký tự (không cần chữ
   số) vẫn qua được như trước — không đổi hành vi 2 màn này.

**Commit message đề xuất:**
```
fix(auth): enforce change-password's real letter+digit rule client-side

change-password only checked length >= 8, missing the letter-and-digit
requirement the backend actually enforces — an all-digit 8-character password
passed client validation and then failed on submit with a confusing 400.
Move the screen to react-hook-form + zod with a dedicated strongPasswordSchema,
and share a separate, weaker passwordSchema (min 6) between register and
reset-password, since their backend rule is genuinely different.
```

### D4. Error Boundary — ✅

Dùng đúng cơ chế có sẵn của Expo Router (không tự viết class component bọc
tay): một file route/layout export 1 named export `ErrorBoundary` thì Router
tự wrap nó bằng error boundary thật, truyền `{ error, retry }` — không cần tự
quản lý `componentDidCatch`.

- `src/components/ui/AppErrorFallback.tsx` (mới) — màn fallback chung. **Không
  dùng `useTranslation`/`useTheme`/font tuỳ biến nào** — chữ tiếng Việt viết
  thẳng, màu/size hardcode — vì chính cái hỏng có thể LÀ 1 trong các hook đó,
  hoặc i18n/font chưa kịp sẵn sàng lúc lỗi xảy ra (ví dụ lỗi ngay lúc khởi
  động). Nút "Thử lại" gọi `retry()` của Router; nút "Về trang chủ" tự
  `router.replace('/')`. **Chỉ `__DEV__`** mới hiện `error.message` +
  `error.stack` (cuộn được) trong khung đỏ; bản production chỉ thấy câu chung.
- `src/utils/logger.ts` (mới) — `logError(error, context?)`, hiện tại chỉ
  `console.error` khi `__DEV__`; có TODO ghi rõ chỗ gắn Sentry/Bugsnag sau này
  (gọi `Sentry.captureException(...)` thay thân hàm, chỗ gọi không cần đổi).
  `AppErrorFallback` tự gọi `logError(error)` 1 lần mỗi khi nhận lỗi mới
  (qua `useEffect` khoá theo `error`), không phải tự thêm ở từng layout.
- `src/app/_layout.tsx` — export `ErrorBoundary` → bắt lỗi **toàn app** (layout
  gốc, bọc hết mọi thứ).
- `src/app/(tabs)/_layout.tsx` — export `ErrorBoundary` riêng → lỗi render
  trong 1 tab không kéo sập toàn app; màn ngoài tabs (auth, modal...) vẫn có
  boundary gốc ở trên lo.
- **Nút throw lỗi test (DEV-only):** thêm vào cuối màn Hồ sơ
  (`(tabs)/profile.tsx`) — MenuRow "[DEV] Test Error Boundary" (icon
  `bug-outline`, màu danger), chỉ hiện khi `__DEV__`. Bấm vào set state rồi
  **throw ngay trong thân render** (không throw trong `onPress` trực tiếp —
  React error boundary KHÔNG bắt được lỗi throw trong event handler, chỉ bắt
  lỗi throw lúc render/lifecycle).

  **⚠️ PHẢI XOÁ nút này (và state/if đi kèm) trước khi nộp bài** — tìm bằng
  comment `"DEV-ONLY"` trong `(tabs)/profile.tsx`.

**File đã đổi:** `src/components/ui/AppErrorFallback.tsx` (mới),
`src/utils/logger.ts` (mới), `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`,
`src/app/(tabs)/profile.tsx`.

**Cách test thủ công:** vào Hồ sơ (bản dev) → cuộn xuống cuối → bấm "[DEV] Test
Error Boundary" → phải thấy màn lỗi thay cho tab Hồ sơ (không phải app bị
crash/đóng hẳn, không phải màn trắng), có khung đỏ hiện đúng message
"Test error from the dev-only button..." + stack trace cuộn được, nút "Thử
lại" bấm vào quay lại Hồ sơ bình thường (state reset), nút "Về trang chủ" đưa
về tab Trang chủ. Chuyển app sang production build (`__DEV__` false) thì
không thấy nút test này, và nếu CÓ lỗi khác xảy ra thì màn fallback chỉ hiện
câu chung, không rò `error.stack`.

**Commit message đề xuất:**
```
feat(errors): add an ErrorBoundary fallback via Expo Router's convention

A render error anywhere used to crash the whole app with no recovery path.
Export ErrorBoundary from the root and tabs layouts (Expo Router wires these
up as real error boundaries automatically) with a self-contained fallback
that doesn't depend on theme/i18n/fonts, a logError() stub for a future crash
reporter, and a dev-only button in Hồ sơ to verify it actually catches.
```

### D5. Mất mạng — ✅

Cài `@react-native-community/netinfo` bằng `npx expo install`.

- `src/hooks/useNetworkStatus.ts` (mới) — trả `boolean`; `NetInfo`'s
  `isConnected` là `null` lúc chưa có báo cáo đầu tiên (hoặc đôi khi mơ hồ) —
  coi `null` là **online** (đúng yêu cầu), vì hiện banner offline sai còn tệ
  hơn thiếu banner đúng trong chốc lát.
- `src/components/ui/OfflineBanner.tsx` (mới) — banner cố định ở đỉnh màn hình
  (trong `TopOverlay`, z-index 1900 — dưới `ToastHost` 1 chút để toast quan
  trọng không bị che). Mất mạng → đỏ "Mất kết nối mạng", hiện mãi tới khi có
  mạng lại. Có mạng lại → xanh "Đã kết nối lại" đúng 2 giây rồi tự ẩn. Có
  `accessibilityRole="alert"` + `accessibilityLiveRegion="polite"`, padding
  theo `insets.top`.
- `src/api/client.ts` — `getApiErrorMessage` giờ phân loại khi **không có
  message từ body**: `error.code === 'ERR_NETWORK'` → lỗi mạng,
  `'ECONNABORTED'` → timeout, `status >= 500` → lỗi server. **Message từ body
  luôn được ưu tiên trước** (không đổi hành vi cũ khi backend có trả message).
- `src/hooks/useRealtimeNotifications.ts` — thêm `NetInfo.addEventListener`
  song song với `AppState` listener có sẵn: có mạng lại (bỏ qua lần gọi đầu
  tiên lúc subscribe, chỉ phản ứng với chuyển trạng thái THẬT) → gọi lại
  `fetch()` của `notificationStore`. **Không tự retry các request POST** —
  đúng yêu cầu, chỉ refetch dữ liệu đọc (GET).
- `src/app/(tabs)/chat.tsx` — `canSend` thêm điều kiện `isOnline` (nút gửi mờ
  đi khi mất mạng); `sendText`/`handleCancelProposal`/`handleConfirmBooking`
  đều chặn sớm + `toast.error(t('chat.offlineBlocked'))` trước khi kịp đẩy
  bong bóng "của tôi" lên màn (tránh hiện tin đã gửi nhưng thực ra bị chặn).

**File đã đổi:** `package.json`/`package-lock.json`,
`src/hooks/useNetworkStatus.ts` (mới), `src/components/ui/OfflineBanner.tsx`
(mới), `src/api/client.ts`, `src/app/_layout.tsx`,
`src/hooks/useRealtimeNotifications.ts`, `src/app/(tabs)/chat.tsx`,
`src/i18n/locales/vi.json`/`en.json` (key mới: `common.errorNetwork/errorTimeout/
errorServer/offline/reconnected`, `chat.offlineBlocked`).

**Cách test thủ công:**
1. Bật chế độ máy bay → banner đỏ "Mất kết nối mạng" hiện ngay ở đỉnh màn,
   không tự ẩn.
2. Tắt chế độ máy bay → banner đổi xanh "Đã kết nối lại" đúng 2 giây rồi mất;
   màn Thông báo tự load lại (không cần kéo refresh tay).
3. Đang offline, mở tab Chat AI → nút gửi mờ đi; gõ rồi bấm nút bàn phím
   "gửi" (submit) → thấy toast đỏ, tin không bị đẩy lên khung chat.
4. Tắt backend (không tắt wifi) rồi gọi 1 API bất kỳ không có body lỗi rõ →
   thấy đúng câu phân loại (mạng/timeout/server) thay vì câu chung mơ hồ.

**Commit message đề xuất:**
```
feat(network): add offline banner, classify network errors, block chat sends

getApiErrorMessage fell back to a generic message for ERR_NETWORK/timeout/5xx
responses with no body, the app gave no visible sign of being offline besides
individual failed requests, and the chat screen would happily queue a message
it could never send. Add a NetInfo-backed banner, classify those error codes
(still preferring the body's own message when there is one), refetch
notifications on reconnect, and block chat sends while offline.
```

### D6. Accessibility — ✅

**Quét toàn repo** (59 `Pressable` trong 41 file, trừ `ui/Button.tsx` theo yêu
cầu). Kết quả: codebase vốn đã khá chuẩn — chỉ **2 lỗ hổng thật**:

| File | Dòng | Thiếu gì |
|---|---|---|
| `components/DateField.tsx` | 69 | backdrop đóng modal chọn ngày (iOS) có `accessibilityLabel` nhưng thiếu `accessibilityRole` |
| `components/ui/Checkbox.tsx` (qua chỗ dùng ở `register.tsx`) | — | checkbox "đồng ý điều khoản" chỉ icon, không có `accessibilityLabel` nào được truyền vào |

Đã sửa cả 2: thêm `accessibilityRole="button"` cho backdrop; checkbox đồng ý
điều khoản ở `register.tsx` giờ nhận `accessibilityLabel` ghép từ đúng các
key i18n đang hiển thị (`agreePrefix`+`agreeTerms`+`agreeAnd`+`agreePrivacy`+
`agreeSuffix`) — ghép từ key có sẵn thay vì thêm key mới, để nhãn luôn khớp
đúng chữ hiển thị nếu sau này đổi.

**4 component nêu tên trong prompt (Checkbox/Chip/Stepper/StarRatingInput):**
kiểm tra lại thì **cả 4 đã có sẵn** đầy đủ `accessibilityRole`,
`accessibilityState`/`accessibilityValue`, và hitSlop đủ 44pt (`Checkbox`:
24pt+hitSlop 10 mỗi bên; `Chip`: minHeight 36pt+hitSlop 4; `Stepper`: nút
thường 44pt, nút dense 28pt+hitSlop 8; `StarRatingInput`: có cả
`accessibilityActions` increment/decrement cho VoiceOver/TalkBack) — không
cần sửa gì, chỉ xác nhận.

**`accessible={false}` cho ảnh trang trí:** `HeroCarousel` (slide hero, caption
chữ đã nói hết), `ExperienceGallery` (mỗi ảnh có label caption riêng),
`onboarding.tsx` (ảnh nền, title/subtitle đã nói hết), `RoomTypeCard`/
`BookingCard`/`FeaturedRoomCard` (ảnh thumbnail nằm trong Pressable đã có
`accessibilityLabel` đầy đủ mô tả cả thẻ — ảnh bên trong giờ không bị đọc
trùng/thừa nữa).

**Liên kết label/lỗi cho `TextField`:** trước đây `accessibilityLabel` chỉ là
`label`, màn hình đọc không biết field đang lỗi gì ngoài nhìn chữ đỏ. Giờ ghép
`label` + `error` (hoặc `hint` nếu không lỗi) thành 1 câu, vd "Số điện thoại.
Số điện thoại không hợp lệ." — áp dụng cho MỌI `TextField` trong app cùng lúc
(sửa 1 chỗ ở component chung).

**Live region cho toast:** đã có sẵn từ trước (`ToastHost.tsx`:
`accessibilityRole="alert"` + `accessibilityLiveRegion="polite"`) — xác nhận
lại, không cần sửa.

**Không đổi giao diện** — đúng yêu cầu, mọi thay đổi đều là thuộc tính
accessibility, không style/layout nào bị động.

**Phát hiện thêm (chưa sửa):** `FeaturedRoomCard.tsx` có
`accessibilityLabel` hardcode thẳng tiếng Việt ("từ ${giá} mỗi đêm") không đi
qua i18n — người dùng bật tiếng Anh vẫn nghe tiếng Việt khi dùng VoiceOver/
TalkBack ở thẻ này. Không sửa vì ngoài phạm vi D6 (D6 là thêm role/label còn
thiếu, không phải audit i18n).

**File đã đổi:** `src/components/DateField.tsx`, `src/app/(auth)/register.tsx`,
`src/components/ui/TextField.tsx`, `src/components/HeroCarousel.tsx`,
`src/components/ExperienceGallery.tsx`, `src/app/onboarding.tsx`,
`src/components/RoomTypeCard.tsx`, `src/components/BookingCard.tsx`,
`src/components/FeaturedRoomCard.tsx`.

**Cách test thủ công:** bật VoiceOver (iOS)/TalkBack (Android) → vuốt qua màn
Tìm phòng/Đơn của tôi/Trang chủ: mỗi thẻ phòng/đơn chỉ đọc 1 lần (không đọc
trùng ảnh+label), ảnh hero/onboarding/gallery bị bỏ qua (chỉ đọc chữ caption).
Vào màn Đăng ký, tích ô đồng ý điều khoản → đọc đúng câu đầy đủ "Tôi đồng ý
với Điều khoản sử dụng và Chính sách bảo mật của Vika Hotel." Gõ sai số điện
thoại ở 1 form bất kỳ rồi focus lại field đó → đọc cả label và lỗi.

**Commit message đề xuất:**
```
fix(a11y): close two Pressable gaps, mute decorative images, link field errors

A full-repo audit found the app's accessibility was already solid (Checkbox/
Chip/Stepper/StarRatingInput already had proper roles, state, and hitSlop)
with just two real gaps: a DateField backdrop missing its role, and the
register screen's agree-to-terms checkbox with no label at all. Also mark
purely decorative images (hero/gallery/card thumbnails already described by
visible captions or a parent's accessibilityLabel) accessible={false}, and
fold TextField's error/hint into its accessibilityLabel so a screen reader
hears what's wrong, not just sees it.
```

### D7. Hiệu năng danh sách — ✅

**Đo trước (bảng 5 màn nêu trong prompt):**

| Màn | Kiểu list | keyExtractor | Ảnh |
|---|---|---|---|
| Chat (`(tabs)/chat.tsx`) | `FlatList` | ⚠️ `(_, index) => String(index)` — **dùng index, không ổn định** | `ChatRoomCard` dùng `expo-image`, chưa set `cachePolicy` |
| Đơn của tôi (`(tabs)/bookings.tsx`) | `FlatList` | ✅ `item.bookingId` | `BookingCard` dùng `expo-image`, chưa set `cachePolicy` |
| Thông báo (`notifications.tsx`) | `SectionList` | ✅ `item.id` | Không có ảnh (chỉ icon) |
| Tìm phòng (`(tabs)/search.tsx`) | `FlatList` | ✅ `item.roomTypeId` | `RoomTypeCard` dùng `expo-image`, chưa set `cachePolicy` |
| Trang chủ (`(tabs)/index.tsx`) | `FlatList` ×2 (chính + carousel ngang) | ✅ `item.roomTypeId` cả 2 | `RoomTypeCard`/`FeaturedRoomCard`, chưa set `cachePolicy` |

→ 4/5 màn đã dùng `FlatList`/`SectionList` + `keyExtractor` theo id thật từ
đầu — **không có vấn đề ScrollView+map cho list dài** ở các màn này. Danh
sách của cả 5 màn cũng không đủ dài (vài chục item, có phân trang ở
Thông báo) để `initialNumToRender`/`windowSize` tạo khác biệt đo được — **cố
tình không chỉnh** 2 prop này ở bất kỳ đâu, tránh tối ưu khi chưa có vấn đề
thật (đúng nguyên tắc "sửa vấn đề có thật").

**2 vấn đề thật tìm được, đã sửa:**
1. **Chat dùng index làm key** — nguy hiểm thật, không phải lý thuyết: màn
   chat có 2 chỗ **thay nguyên mảng `messages`** (tiếp tục hội thoại cũ lúc mở
   app, và khôi phục lịch sử sau lỗi timeout) — nếu tin nhắn mới có ít/nhiều
   hơn tin cũ ở cùng vị trí, React ghép nhầm state cục bộ của `ChatBubble` (vd
   "xem thêm phòng") sang tin nhắn khác do key trùng theo index. Sửa:
   - `types/chat.ts`: `ChatMessage` thêm field `id: string`.
   - `utils/aiChatHistory.ts`: `buildMessagesFromHistory` gán `id` = đúng
     `messageId` thật từ backend (ổn định qua mọi lần tải lại).
   - `(tabs)/chat.tsx`: tin nhắn tạo mới (gửi đi, phản hồi AI, lỗi) gán `id`
     bằng `Crypto.randomUUID()` (`expo-crypto`, có sẵn trong deps, không cài
     thêm gì); tin chào mở đầu dùng id cố định `"welcome"`. `keyExtractor`
     đổi thành `(item) => item.id`.
2. **`cachePolicy` cho ảnh trong list** — mặc định `expo-image` là `'disk'`
   (đọc+decode lại mỗi lần ô FlatList bị tái sử dụng khi cuộn). Thêm
   `cachePolicy="memory-disk"` cho `RoomTypeCard`, `BookingCard`,
   `FeaturedRoomCard`, `ChatRoomCard` — đúng 4 component ảnh nằm trong list
   cuộn của 5 màn trên.

**Kiểm tra component bị React Compiler bỏ qua:** `eslint-plugin-react-compiler`
**chưa được cài** trong repo (chỉ có `eslint-plugin-react-hooks`, nguồn của
các lỗi `set-state-in-effect` đã gặp trước đây) — cài thêm plugin mới không
có trong danh sách được duyệt nên không tự thêm. Thay vào đó, quét tay các
pattern hay khiến compiler bỏ qua (mutate trực tiếp mảng/object lấy từ
props/state thay vì tạo bản mới): grep toàn bộ `.push`/`.sort`/`.splice` —
**tất cả đều gọi trên mảng cục bộ** tự tạo trong hàm (hoặc bản copy qua
spread `[...arr].sort(...)` trước khi sort), không có chỗ nào mutate thẳng
state/props. Không phát hiện bail-out rõ ràng nào qua cách kiểm tra này —
ghi nhận là **kiểm tra thủ công, không chắc 100% như công cụ chuyên dụng**,
để lần sau nếu cài `eslint-plugin-react-compiler` thì chạy lại cho chắc.

**Không thêm `memo`/`useMemo`/`useCallback` thủ công nào** — đúng yêu cầu, để
React Compiler tự xử lý.

**File đã đổi:** `src/types/chat.ts`, `src/utils/aiChatHistory.ts`,
`src/app/(tabs)/chat.tsx`, `src/components/RoomTypeCard.tsx`,
`src/components/BookingCard.tsx`, `src/components/FeaturedRoomCard.tsx`,
`src/components/ChatRoomCard.tsx`.

**Cách test thủ công:** chat với AI vài lượt, mở "thẻ phòng" bấm "Xem thêm"
để mở rộng 1 thẻ, gửi tiếp vài tin nữa → thẻ đã mở không tự đóng/thẻ khác
không tự mở do key trùng. Tắt app, mở lại (tiếp tục hội thoại cũ) → vẫn giữ
đúng trạng thái. Cuộn nhanh qua lại danh sách phòng/đơn nhiều lần → ảnh không
bị nhấp nháy/load lại từ đầu mỗi lần ô đó quay lại màn hình.

**Commit message đề xuất:**
```
perf(lists): stable chat message ids and memory-disk image caching

Chat used the array index as FlatList key, which could mis-associate a
bubble's local UI state with the wrong message whenever the whole messages
array gets replaced (resuming history, recovering from a timeout). Give
every message a real id (the backend's messageId when rebuilt from history,
a fresh UUID otherwise) and key on that. Also cache room/booking thumbnails
in memory, not just on disk, since FlatList recycles their cells on scroll.
```

## Điểm chờ quyết định (⏸)

- **A3 — lưu refresh token:** đã hỏi, bạn chọn (b) giữ cookie. Xem mục A3 và
  `docs/backend-requests.md`.
- **B3 — tên app:** đã hỏi, bạn chọn "Vika Hotel". Xem mục B3.
- **C2 — numberOfGuests:** đã hỏi, bạn chọn chỉ thêm type + TODO, không gửi
  lên server. Xem mục C2.

## Phát hiện thêm (ngoài phạm vi, chưa sửa)

- **(D6) `components/FeaturedRoomCard.tsx`** — `accessibilityLabel` hardcode
  tiếng Việt, không qua i18n (`` `${roomType.name}, từ ${formatVND(...)} mỗi đêm` ``).
  Không sửa vì ngoài phạm vi D6.
- **(sau merge dev #21) `src/utils/chatRooms.ts` (`pickRelevantRooms`) không còn
  được dùng ở đâu nữa** — `chat.tsx` giờ hiện thẳng `response.rooms` từ backend,
  không lọc qua hàm này. Liên quan trực tiếp tới task E1 (kế hoạch test ban đầu
  có nêu test `pickRelevantRooms`) — khi tới E1 cần bỏ hàm này khỏi danh sách
  test hoặc hỏi lại nếu vẫn muốn giữ hàm (hiện là dead code).

- **(B3) `account.tsx` và `edit-profile.tsx` có thể trùng chức năng:** cả hai
  đều cho sửa `fullName`/`phone`/`address` qua `usersApi.updateMe`; `account.tsx`
  có thêm field `idNumber`, `edit-profile.tsx` thì không. `profile.tsx` dẫn tới
  cả hai (card đầu trang → `/account`; MenuRow "Chỉnh sửa hồ sơ" → `/edit-profile`).
  Không rõ đây là chủ ý (ví dụ `/account` để xem chi tiết đầy đủ, `/edit-profile`
  để sửa nhanh) hay dư thừa cần gộp lại — không tự sửa vì ngoài phạm vi B3.

## Việc bạn cần tự làm

- Chạy các lệnh `eas env:create` ở mục A2 để khai báo biến môi trường cho 3
  build profile (development/preview/production).
- **(D4) Xoá nút "[DEV] Test Error Boundary" trong `(tabs)/profile.tsx`** (và
  state/`if` throw đi kèm) trước khi nộp bài — tìm theo comment "DEV-ONLY".
- Rebuild dev client (`npx expo run:android`/`run:ios`) nếu muốn test tính
  năng "Lưu mã QR" (`expo-media-library`) — không chạy được trên Expo Go.
