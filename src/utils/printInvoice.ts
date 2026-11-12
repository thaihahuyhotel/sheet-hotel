import { Booking, Room, HotelSettings, BookingServiceItem } from '../types/hotel';
import { ROOM_TYPES, CHANNELS } from '../data/initialData';
import { formatVND } from './pricing';

export function generateInvoiceHtml(
  booking: Booking,
  room: Room,
  settings: HotelSettings,
  services: BookingServiceItem[]
): string {
  const roomType = ROOM_TYPES[room.type] || ROOM_TYPES.standard_single;
  const channel = CHANNELS[booking.channel] || CHANNELS.direct;
  const totalServices = services.reduce((sum, s) => sum + s.total, 0);
  const totalBill = booking.totalRoomPrice + totalServices - (booking.discount || 0);
  const remainingDue = Math.max(0, totalBill - (booking.deposit || 0));
  const currentDate = new Date().toLocaleDateString('vi-VN');
  const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const serviceRows = services
    .map(
      (s, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 2}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">
          <strong>${s.name}</strong>
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${s.quantity}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatVND(s.price)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formatVND(s.total)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Phiếu Thanh Toán - ${booking.bookingCode} - Phòng ${room.number}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      margin: 0;
      padding: 20px;
      color: #1e293b;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 30px;
      background: #fff;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
    }
    .hotel-name {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .invoice-title {
      font-size: 22px;
      font-weight: 900;
      color: #312e81;
      text-align: right;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-grid {
      display: flex;
      flex-wrap: wrap;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .info-col {
      flex: 1;
      min-width: 180px;
      margin-bottom: 6px;
    }
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
      display: block;
    }
    .info-val {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    .table-items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .table-items th {
      background: #f1f5f9;
      color: #334155;
      text-transform: uppercase;
      font-size: 11px;
      font-weight: 700;
      padding: 10px;
      border-bottom: 2px solid #cbd5e1;
    }
    .totals-area {
      margin-left: auto;
      width: 320px;
      margin-bottom: 30px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 13px;
    }
    .totals-row.grand {
      border-top: 2px solid #0f172a;
      padding-top: 10px;
      font-size: 16px;
      font-weight: 900;
      color: #b91c1c;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 20px;
    }
    .sig-box {
      text-align: center;
      width: 220px;
    }
    .sig-title {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 12px;
    }
    .sig-space {
      height: 70px;
    }
    .footer-note {
      text-align: center;
      font-size: 11px;
      color: #64748b;
      margin-top: 30px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 12px;
    }
    @media print {
      body {
        padding: 0;
      }
      .invoice-card {
        border: none;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div class="hotel-name">${settings.hotelName}</div>
          <div style="color: #475569; font-size: 12px;">${settings.hotelAddress}</div>
          <div style="color: #475569; font-size: 12px;">Hotline: ${settings.hotelPhone} | Email: ${settings.hotelEmail}</div>
        </td>
        <td style="vertical-align: top; text-align: right;">
          <div class="invoice-title">HÓA ĐƠN THANH TOÁN</div>
          <div style="font-family: monospace; font-size: 12px; color: #475569; margin-top: 4px;">Mã: ${booking.bookingCode}</div>
          <div style="font-size: 11px; color: #64748b;">Thời gian: ${currentTime} - ${currentDate}</div>
        </td>
      </tr>
    </table>

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-col">
        <span class="info-label">Khách hàng:</span>
        <span class="info-val">${booking.guestName}</span>
        ${booking.guestPhone ? `<div style="font-size: 12px; color: #475569;">${booking.guestPhone}</div>` : ''}
      </div>
      <div class="info-col">
        <span class="info-label">Phòng:</span>
        <span class="info-val" style="color: #4338ca; font-size: 15px;">Phòng ${room.number}</span>
        <div style="font-size: 12px; color: #475569;">${roomType.name}</div>
      </div>
      <div class="info-col">
        <span class="info-label">Thời gian lưu trú:</span>
        <span class="info-val">${booking.checkInDate} → ${booking.checkOutDate}</span>
        <div style="font-size: 12px; color: #475569;">Số lượng: <strong>${booking.nights} đêm</strong></div>
      </div>
      <div class="info-col">
        <span class="info-label">Kênh đặt phòng:</span>
        <span class="info-val" style="color: #0369a1;">${channel.name}</span>
        ${booking.channelBookingRef ? `<div style="font-size: 11px; font-family: monospace;">Ref: ${booking.channelBookingRef}</div>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table class="table-items">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">STT</th>
          <th style="text-align: left;">Dịch Vụ / Hạng Mục</th>
          <th style="width: 80px; text-align: center;">Số Lượng</th>
          <th style="width: 120px; text-align: right;">Đơn Giá</th>
          <th style="width: 140px; text-align: right;">Thành Tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">1</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
            <strong>Tiền phòng ${room.number} (${roomType.name})</strong>
            <div style="font-size: 11px; color: #64748b;">
              ${booking.channel === 'direct' ? 'Giá bán trực tiếp' : `Giá niêm yết qua ${channel.name} (đã tính +150k phí quản lý sau trừ % sàn)`}
            </div>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${booking.nights} đêm</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatVND(booking.roomPricePerNight)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;">
            ${formatVND(booking.totalRoomPrice)}
          </td>
        </tr>
        ${serviceRows}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div style="font-size: 11px; color: #64748b; max-width: 380px;">
        ${booking.channel !== 'direct' ? `
        <div style="background: #fef3c7; border: 1px solid #fde68a; padding: 8px 12px; border-radius: 6px; color: #92400e; margin-bottom: 6px;">
          <strong>* Ghi chú đối soát nội bộ ${channel.name}:</strong><br/>
          Phí sàn (${Math.round(booking.otaCommissionRate * 100)}%): -${formatVND(booking.otaCommissionAmount)} | 
          Phí quản lý dôi dư: +${formatVND(booking.managementFee)}
        </div>` : ''}
        ${booking.notes ? `<div><strong>Ghi chú đơn:</strong> ${booking.notes}</div>` : ''}
      </div>

      <div class="totals-area">
        <div class="totals-row">
          <span style="color: #475569;">Tiền phòng:</span>
          <strong>${formatVND(booking.totalRoomPrice)}</strong>
        </div>
        ${totalServices > 0 ? `
        <div class="totals-row">
          <span style="color: #475569;">Minibar & Dịch vụ:</span>
          <strong>+${formatVND(totalServices)}</strong>
        </div>` : ''}
        ${booking.discount > 0 ? `
        <div class="totals-row" style="color: #b91c1c;">
          <span>Giảm giá:</span>
          <strong>-${formatVND(booking.discount)}</strong>
        </div>` : ''}
        ${booking.deposit > 0 ? `
        <div class="totals-row" style="color: #047857;">
          <span>Đã cọc trước:</span>
          <strong>-${formatVND(booking.deposit)}</strong>
        </div>` : ''}
        <div class="totals-row grand">
          <span>TỔNG CÒN LẠI:</span>
          <span>${formatVND(remainingDue)}</span>
        </div>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="sig-box">
        <div class="sig-title">Khách Hàng</div>
        <div style="font-size: 11px; color: #64748b;">(Ký và ghi rõ họ tên)</div>
        <div class="sig-space"></div>
        <div style="font-weight: 600;">${booking.guestName}</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">Lễ Tân Khách Sạn</div>
        <div style="font-size: 11px; color: #64748b;">(Ký, đóng dấu)</div>
        <div class="sig-space"></div>
        <div style="font-weight: 600;">${settings.hotelName}</div>
      </div>
    </div>

    <!-- Footer Note -->
    <div class="footer-note">
      Cảm ơn Quý khách đã lựa chọn ${settings.hotelName}! Chúc Quý khách một chuyến đi vui vẻ và bình an!
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates plain text format for sending via Zalo / WhatsApp / SMS
 */
export function generateInvoiceText(
  booking: Booking,
  room: Room,
  settings: HotelSettings,
  services: BookingServiceItem[]
): string {
  const roomType = ROOM_TYPES[room.type] || ROOM_TYPES.standard_single;
  const channel = CHANNELS[booking.channel] || CHANNELS.direct;
  const totalServices = services.reduce((sum, s) => sum + s.total, 0);
  const totalBill = booking.totalRoomPrice + totalServices - (booking.discount || 0);
  const remainingDue = Math.max(0, totalBill - (booking.deposit || 0));

  let text = `🏨 ${settings.hotelName.toUpperCase()}\n`;
  text += `📍 ${settings.hotelAddress}\n`;
  text += `📞 Hotline: ${settings.hotelPhone}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🧾 PHIẾU THANH TOÁN TIỀN PHÒNG\n`;
  text += `Mã đặt: ${booking.bookingCode}\n`;
  text += `Khách hàng: ${booking.guestName}\n`;
  text += `Phòng: ${room.number} (${roomType.name})\n`;
  text += `Thời gian: ${booking.checkInDate} đến ${booking.checkOutDate} (${booking.nights} đêm)\n`;
  text += `Kênh đặt: ${channel.name}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `1. Tiền phòng: ${formatVND(booking.totalRoomPrice)} (${formatVND(booking.roomPricePerNight)} x ${booking.nights} đêm)\n`;

  if (services.length > 0) {
    text += `2. Dịch vụ & Minibar (${services.length} món):\n`;
    services.forEach((s) => {
      text += `  • ${s.name} x${s.quantity}: ${formatVND(s.total)}\n`;
    });
  }

  if (booking.discount > 0) {
    text += `• Giảm giá: -${formatVND(booking.discount)}\n`;
  }
  if (booking.deposit > 0) {
    text += `• Đã đặt cọc: -${formatVND(booking.deposit)}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 TỔNG CỘNG CÒN LẠI: ${formatVND(remainingDue)}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Trân trọng cảm ơn Quý khách!`;

  return text;
}

/**
 * Downloads a standalone printable HTML file
 */
export function downloadInvoiceHtmlFile(
  booking: Booking,
  room: Room,
  settings: HotelSettings,
  services: BookingServiceItem[]
): void {
  const html = generateInvoiceHtml(booking, room, settings, services);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Hoa_Don_${booking.bookingCode}_Phong_${room.number}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Prints the invoice using an isolated hidden iframe
 */
export function printInvoiceViaIframe(
  booking: Booking,
  room: Room,
  settings: HotelSettings,
  services: BookingServiceItem[]
): boolean {
  try {
    const html = generateInvoiceHtml(booking, room, settings, services);

    // Remove any previous print iframes
    const oldIframe = document.getElementById('hotel-print-iframe');
    if (oldIframe) {
      document.body.removeChild(oldIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'hotel-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return true;
    }

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print blocked by browser sandbox:', err);
        // Fallback to window.print()
        window.print();
      }
    }, 400);

    return true;
  } catch (error) {
    console.error('Print failed:', error);
    try {
      window.print();
    } catch (e) {
      console.error('Fallback window.print also failed:', e);
      return false;
    }
    return true;
  }
}
