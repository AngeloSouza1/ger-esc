// src/lib/qr.service.ts
import QRCode from "qrcode";
export async function makeQR(data: string) {
  return QRCode.toDataURL(data);
}
