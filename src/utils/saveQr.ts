import { File, Paths } from "expo-file-system";
import { Asset, requestPermissionsAsync } from "expo-media-library";

/**
 * Lưu một ảnh đã chụp (file tạm, vd. từ captureRef của react-native-view-shot) vào thư
 * viện ảnh của máy, dưới tên `fileName` — giống nút "Lưu mã QR" / "Lưu vé QR" bên web
 * (utils/downloadQr.js). Dùng chung cho phiếu thanh toán PayOS và vé nhận phòng.
 *
 * Trả 'denied' khi khách không cho quyền, để nơi gọi hiện đúng câu nhắc. Các lỗi khác
 * (chép file, lưu ảnh) được ném ra cho nơi gọi tự bắt.
 */
export async function saveImageToLibrary(
  uri: string,
  fileName: string,
): Promise<"saved" | "denied"> {
  // true = chỉ xin quyền GHI (không đọc ảnh có sẵn của khách); 'photo' = chỉ ảnh, không
  // xin video/âm thanh (có tác dụng trên Android 13+).
  const permission = await requestPermissionsAsync(true, ["photo"]);
  if (!permission.granted) return "denied";
  // Ảnh chụp có tên ngẫu nhiên — chép sang tên dễ nhận ra trước khi đưa vào thư viện.
  // overwrite: lưu lại cùng một mã lần 2 không bị lỗi "file đã tồn tại".
  const named = new File(Paths.cache, fileName);
  await new File(uri).copy(named, { overwrite: true });
  await Asset.create(named.uri);
  return "saved";
}
