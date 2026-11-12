import { useState } from 'react';
import { Booking, Room, HotelSettings, BookingServiceItem } from '../types/hotel';
import { ROOM_TYPES, CHANNELS, DEFAULT_SERVICES } from '../data/initialData';
import { formatVND } from '../utils/pricing';
import {
  generateInvoiceHtml,
  generateInvoiceText,
  downloadInvoiceHtmlFile,
  printInvoiceViaIframe,
} from '../utils/printInvoice';
import { 
  X, 
  Printer, 
  CheckCircle, 
  Plus, 
  Trash2, 
  CreditCard, 
  Receipt, 
  Sparkles, 
  Building2, 
  Clock, 
  User, 
  Phone,
  QrCode,
  DollarSign,
  Download,
  Copy,
  Check,
  FileText,
  AlertCircle,
  Eye
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  room: Room | null;
  settings: HotelSettings;
  onConfirmCheckout: (bookingId: string, roomId: string, paymentMethod: string, finalServices: BookingServiceItem[]) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  booking,
  room,
  settings,
  onConfirmCheckout,
}: CheckoutModalProps) {
  if (!isOpen || !booking || !room) return null;

  const roomType = ROOM_TYPES[room.type] || ROOM_TYPES.standard_single;
  const channel = CHANNELS[booking.channel] || CHANNELS.direct;

  const [services, setServices] = useState<BookingServiceItem[]>(booking.services || []);
  const [paymentMethod, setPaymentMethod] = useState<string>(
    booking.channel !== 'direct' ? 'ota_collect' : 'cash'
  );
  const [copiedText, setCopiedText] = useState(false);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'checkout' | 'print_preview'>('checkout');

  const availableServices = (
    settings.servicesList && settings.servicesList.length > 0
      ? settings.servicesList
      : DEFAULT_SERVICES
  ).filter((s) => s.isActive !== false);

  const handleAddService = (item: { name: string; price: number; category: any }) => {
    const existingIndex = services.findIndex((s) => s.name === item.name);
    if (existingIndex >= 0) {
      const updated = [...services];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].price;
      setServices(updated);
    } else {
      const newService: BookingServiceItem = {
        id: `srv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: item.name,
        price: item.price,
        quantity: 1,
        total: item.price,
        category: item.category,
        addedAt: new Date().toLocaleString('vi-VN'),
      };
      setServices([...services, newService]);
    }
  };

  const handleRemoveService = (serviceId: string) => {
    setServices(services.filter((s) => s.id !== serviceId));
  };

  const totalServices = services.reduce((sum, s) => sum + s.total, 0);
  const totalBill = booking.totalRoomPrice + totalServices - (booking.discount || 0);
  const remainingDue = Math.max(0, totalBill - (booking.deposit || 0));

  // 1. Direct Print using isolated iframe and fallback
  const handlePrint = () => {
    setPrintStatus('Đang mở hộp thoại in...');
    try {
      const success = printInvoiceViaIframe(booking, room, settings, services);
      if (!success) {
        // Fallback: download file
        downloadInvoiceHtmlFile(booking, room, settings, services);
        setPrintStatus('Đã tải hóa đơn về máy do trình duyệt chặn in trong iframe!');
      } else {
        setTimeout(() => setPrintStatus(null), 3000);
      }
    } catch (e) {
      console.error(e);
      downloadInvoiceHtmlFile(booking, room, settings, services);
      setPrintStatus('Đã tải hóa đơn về máy để bạn in trực tiếp!');
    }
  };

  // 2. Download standalone HTML Invoice
  const handleDownload = () => {
    downloadInvoiceHtmlFile(booking, room, settings, services);
    setPrintStatus('Đã tải file hóa đơn về máy thành công!');
    setTimeout(() => setPrintStatus(null), 3500);
  };

  // 3. Copy Text for Zalo / SMS
  const handleCopyText = () => {
    const text = generateInvoiceText(booking, room, settings, services);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCheckout = () => {
    onConfirmCheckout(booking.id, room.id, paymentMethod, services);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Trả Phòng & Hóa Đơn
                </span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  {booking.bookingCode}
                </span>
              </div>
              <h2 className="text-xl font-black text-white">
                Phòng {room.number} • {roomType.badgeName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar for Printing and Exporting */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              In Hóa Đơn (Print)
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-lg shadow-2xs transition-colors"
              title="Tải file HTML hóa đơn về máy để in hoặc lưu trữ"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Tải File Hóa Đơn (.html)
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-lg shadow-2xs transition-colors"
              title="Sao chép văn bản phiếu thanh toán để gửi qua Zalo / tin nhắn cho khách"
            >
              {copiedText ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Đã chép nội dung!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-blue-600" />
                  Gửi Zalo / Tin Nhắn
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'checkout' ? 'print_preview' : 'checkout')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                viewMode === 'print_preview'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {viewMode === 'print_preview' ? 'Về Giao Diện Thu Tiền' : 'Xem Bản In Khổ A4'}
            </button>
          </div>
        </div>

        {/* Status notification toast if print blocked or file downloaded */}
        {printStatus && (
          <div className="bg-blue-50 border-b border-blue-200 px-5 py-2 text-xs text-blue-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{printStatus}</span>
            </div>
            <button
              onClick={() => setPrintStatus(null)}
              className="text-blue-600 font-bold hover:underline"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Main Printable / Checkout Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Printable Invoice Container with specific ID for CSS @media print */}
          <div id="hotel-invoice-printable" className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-2xs">
            {/* Hotel Letterhead for Invoice */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {settings.hotelName}
                  </h3>
                  <p className="text-xs text-slate-600">{settings.hotelAddress}</p>
                  <p className="text-xs text-slate-600">
                    Hotline: <strong>{settings.hotelPhone}</strong> • Email: {settings.hotelEmail}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg uppercase font-black text-indigo-900 block tracking-wide">
                    PHIẾU THANH TOÁN
                  </span>
                  <span className="text-xs font-mono text-slate-600 block">
                    Mã đặt: <strong>{booking.bookingCode}</strong>
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Ngày in: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Guest and Stay Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Khách hàng:</span>
                <span className="font-extrabold text-slate-900 text-sm">{booking.guestName}</span>
                {booking.guestPhone && <span className="text-slate-600 block">{booking.guestPhone}</span>}
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Phòng & Hạng:</span>
                <span className="font-black text-indigo-700 text-base">Phòng {room.number}</span>
                <span className="text-slate-600 block">{roomType.badgeName}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Thời gian lưu trú:</span>
                <span className="font-bold text-slate-800">
                  {booking.checkInDate} → {booking.checkOutDate}
                </span>
                <span className="text-slate-600 block">Số lượng: <strong>{booking.nights} đêm</strong></span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Kênh đặt phòng:</span>
                <span className={`inline-block px-2 py-0.5 rounded font-bold ${channel.bgColor} mt-0.5`}>
                  {channel.name}
                </span>
                {booking.channelBookingRef && (
                  <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                    Ref: {booking.channelBookingRef}
                  </span>
                )}
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-extrabold border-b-2 border-slate-300 uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3 w-10 text-center">STT</th>
                      <th className="py-2.5 px-3">Khoản mục thanh toán</th>
                      <th className="py-2.5 px-2 text-center w-24">Số lượng</th>
                      <th className="py-2.5 px-3 text-right w-28">Đơn giá</th>
                      <th className="py-2.5 px-3 text-right w-32">Thành tiền</th>
                      <th className="py-2.5 px-2 w-8 print-hidden"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* Room rate row */}
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 text-center font-bold text-slate-500">1</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">
                          Tiền phòng {room.number} ({roomType.badgeName})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {booking.channel === 'direct'
                            ? 'Giá bán trực tiếp'
                            : `Giá niêm yết qua ${channel.name} (đã tính +150k phí quản lý sau trừ % sàn)`}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-bold">{booking.nights} đêm</td>
                      <td className="py-3 px-3 text-right font-medium">{formatVND(booking.roomPricePerNight)}</td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        {formatVND(booking.totalRoomPrice)}
                      </td>
                      <td className="print-hidden"></td>
                    </tr>

                    {/* Minibar & extra service items */}
                    {services.map((srv, idx) => (
                      <tr key={srv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center text-slate-500">{idx + 2}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800">{srv.name}</span>
                          <span className="text-[10px] text-slate-400 block">{srv.addedAt}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold">{srv.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{formatVND(srv.price)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatVND(srv.total)}
                        </td>
                        <td className="py-2.5 px-2 text-center print-hidden">
                          <button
                            type="button"
                            onClick={() => handleRemoveService(srv.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Xóa món"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Add Consumables Bar (Screen only) */}
            <div className="print-hidden p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                + Thêm đồ Minibar & Phụ thu trước khi xuất hóa đơn:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {availableServices.map((item) => (
                  <button
                    key={item.id || item.name}
                    type="button"
                    onClick={() => handleAddService(item)}
                    className="inline-flex items-center gap-1 text-[11px] bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2 py-1 rounded border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                    <span>{item.name}</span>
                    <span className="font-bold text-slate-900">({formatVND(item.price)}{item.unit ? `/${item.unit}` : ''})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bill Total Calculations */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tổng tiền phòng ({booking.nights} đêm):</span>
                <span className="font-bold text-slate-900">{formatVND(booking.totalRoomPrice)}</span>
              </div>

              {totalServices > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tổng minibar & dịch vụ:</span>
                  <span className="font-bold text-slate-900">+{formatVND(totalServices)}</span>
                </div>
              )}

              {booking.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Giảm giá khuyến mãi:</span>
                  <span className="font-bold">-{formatVND(booking.discount)}</span>
                </div>
              )}

              {booking.deposit > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Đã đặt cọc trước:</span>
                  <span className="font-bold">-{formatVND(booking.deposit)}</span>
                </div>
              )}

              <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-center text-sm">
                <div>
                  <span className="font-black text-slate-900 text-base">
                    CÒN LẠI PHẢI THU:
                  </span>
                  {booking.channel !== 'direct' && (
                    <span className="text-[11px] text-slate-500 block">
                      (Khách {channel.name} thường thanh toán trực tuyến qua thẻ hoặc sàn thu hộ)
                    </span>
                  )}
                </div>
                <span className="text-2xl font-black text-rose-600">
                  {formatVND(remainingDue)}
                </span>
              </div>
            </div>

            {/* OTA Math Breakdown badge for hotelier */}
            {booking.channel !== 'direct' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold block flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Đối soát dòng tiền nội bộ khách sạn ({channel.name}):
                </span>
                <div className="text-[11px] space-y-0.5">
                  <div>• Giá niêm yết: {formatVND(booking.roomPricePerNight)} / đêm</div>
                  <div>• Sàn khấu trừ {Math.round(booking.otaCommissionRate * 100)}% hoa hồng: -{formatVND(booking.otaCommissionAmount)}</div>
                  <div className="font-bold text-emerald-800">
                    • Thực nhận về tài khoản: {formatVND(booking.totalRoomPrice - booking.otaCommissionAmount)}
                    (đúng đủ giá gốc {formatVND(room.directPrice * booking.nights)} + {formatVND(booking.managementFee)} phí quản lý)
                  </div>
                </div>
              </div>
            )}

            {/* Signatures for Printable View */}
            <div className="grid grid-cols-2 pt-6 text-center text-xs border-t border-slate-200">
              <div>
                <span className="font-bold block uppercase text-slate-800">Khách Hàng Ký Tên</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">(Ký và ghi rõ họ tên)</span>
                <div className="h-16" />
                <span className="font-bold text-slate-800">{booking.guestName}</span>
              </div>
              <div>
                <span className="font-bold block uppercase text-slate-800">Lễ Tân Khách Sạn</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">(Ký, đóng dấu)</span>
                <div className="h-16" />
                <span className="font-bold text-slate-800">{settings.hotelName}</span>
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-400 pt-3 border-t border-dashed border-slate-200">
              Cảm ơn Quý khách đã lựa chọn {settings.hotelName}! Chúc Quý khách có chuyến đi vui vẻ và bình an!
            </div>
          </div>

          {/* Payment Method Selector (Screen only) */}
          <div className="print-hidden space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
              Hình Thức Thanh Toán Khách Sử Dụng
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                💵 Tiền Mặt
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                  paymentMethod === 'transfer'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                📲 Chuyển Khoản QR
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                💳 Quẹt Thẻ POS
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('ota_collect')}
                className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                  paymentMethod === 'ota_collect'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                🌐 Sàn OTA Thu Hộ
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="print-hidden flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center gap-1.5 border border-indigo-200 transition-colors"
              >
                <Printer className="w-4 h-4" />
                In Hóa Đơn
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Tải File HTML
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                Xác Nhận Trả Phòng & Chuyển Sang Dọn Dẹp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
