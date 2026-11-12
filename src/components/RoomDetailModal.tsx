import { useState } from 'react';
import { Room, Booking, RoomStatus, HotelSettings, BookingServiceItem } from '../types/hotel';
import { ROOM_TYPES, CHANNELS, DEFAULT_SERVICES } from '../data/initialData';
import { calculateOtaPrice, formatVND } from '../utils/pricing';
import { 
  X, 
  Bed, 
  Sparkles, 
  CheckCircle, 
  Wrench, 
  Plus, 
  Trash2, 
  LogIn, 
  LogOut, 
  Calendar,
  Layers,
  Copy,
  Check
} from 'lucide-react';

interface RoomDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  activeBooking: Booking | null;
  settings: HotelSettings;
  onUpdateRoomStatus: (roomId: string, status: RoomStatus, cleaningNote?: string) => void;
  onAddServiceToBooking: (bookingId: string, item: BookingServiceItem) => void;
  onRemoveServiceFromBooking: (bookingId: string, serviceId: string) => void;
  onOpenBookingModal: (room: Room, isReservation?: boolean) => void;
  onOpenCheckoutModal: (booking: Booking, room: Room) => void;
}

export default function RoomDetailModal({
  isOpen,
  onClose,
  room,
  activeBooking,
  settings,
  onUpdateRoomStatus,
  onAddServiceToBooking,
  onRemoveServiceFromBooking,
  onOpenBookingModal,
  onOpenCheckoutModal,
}: RoomDetailModalProps) {
  if (!isOpen || !room) return null;

  const roomType = ROOM_TYPES[room.type] || ROOM_TYPES.standard_single;
  const [cleaningNoteInput, setCleaningNoteInput] = useState<string>(room.cleaningNote || '');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const availableServices = (
    settings.servicesList && settings.servicesList.length > 0
      ? settings.servicesList
      : DEFAULT_SERVICES
  ).filter((s) => s.isActive !== false);

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleQuickAddService = (item: { name: string; price: number; category: any; unit?: string }) => {
    if (!activeBooking) return;
    const newService: BookingServiceItem = {
      id: `srv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: item.name,
      price: item.price,
      quantity: 1,
      total: item.price,
      category: item.category,
      addedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    onAddServiceToBooking(activeBooking.id, newService);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black">Phòng {room.number}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                Tầng {room.floor}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/40 text-indigo-200 border border-indigo-400/30">
                {roomType.badgeName}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <span>🛏️ {roomType.bedDescription}</span>
              <span>•</span>
              <span>Tiêu chuẩn {roomType.capacity.adults} người lớn</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status Switcher Bar */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
              Chuyển Đổi Trạng Thái Phòng
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => onUpdateRoomStatus(room.id, 'available')}
                className={`p-2 rounded-lg border text-xs font-bold text-center transition-all ${
                  room.status === 'available'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
                }`}
              >
                🟢 Phòng Trống
              </button>
              <button
                type="button"
                onClick={() => onUpdateRoomStatus(room.id, 'cleaning')}
                className={`p-2 rounded-lg border text-xs font-bold text-center transition-all ${
                  room.status === 'cleaning'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                    : 'bg-white hover:bg-sky-50 text-slate-700 border-slate-200'
                }`}
              >
                🧹 Cần Dọn
              </button>
              <button
                type="button"
                onClick={() => onUpdateRoomStatus(room.id, 'maintenance', cleaningNoteInput)}
                className={`p-2 rounded-lg border text-xs font-bold text-center transition-all ${
                  room.status === 'maintenance'
                    ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                🛠️ Bảo Trì
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeBooking) {
                    onUpdateRoomStatus(room.id, 'occupied');
                  } else {
                    onOpenBookingModal(room, false);
                  }
                }}
                className={`p-2 rounded-lg border text-xs font-bold text-center transition-all ${
                  room.status === 'occupied'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white hover:bg-rose-50 text-slate-700 border-slate-200'
                }`}
              >
                🔴 Đang Ở
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeBooking) {
                    onUpdateRoomStatus(room.id, 'reserved');
                  } else {
                    onOpenBookingModal(room, true);
                  }
                }}
                className={`p-2 rounded-lg border text-xs font-bold text-center transition-all ${
                  room.status === 'reserved'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
                }`}
              >
                🟡 Đặt Trước
              </button>
            </div>
          </div>

          {/* Current Active Guest Card (if occupied or reserved) */}
          {activeBooking && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Đơn Đang Lưu Trú
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {activeBooking.guestName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    SĐT: {activeBooking.guestPhone || 'Chưa cập nhật'} • CCCD: {activeBooking.guestIdCard || 'Chưa lưu'}
                  </p>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${CHANNELS[activeBooking.channel]?.bgColor}`}>
                    {CHANNELS[activeBooking.channel]?.name}
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    {activeBooking.checkInDate} → {activeBooking.checkOutDate} ({activeBooking.nights} đêm)
                  </span>
                </div>
              </div>

              {/* Action buttons for booking */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={() => onOpenCheckoutModal(activeBooking, room)}
                  className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Trả Phòng & Xuất Hóa Đơn
                </button>
              </div>

              {/* Minibar consumed in room */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    Dịch Vụ & Minibar Tiêu Dùng ({activeBooking.services.length} món)
                  </span>
                  <span className="text-xs font-bold text-indigo-700">
                    {formatVND(activeBooking.services.reduce((s, i) => s + i.total, 0))}
                  </span>
                </div>

                {activeBooking.services.length > 0 && (
                  <div className="divide-y divide-slate-200 text-xs bg-white rounded-lg p-2 border border-slate-200">
                    {activeBooking.services.map((item) => (
                      <div key={item.id} className="py-1 flex items-center justify-between">
                        <span className="text-slate-800">
                          {item.name} x{item.quantity}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{formatVND(item.total)}</span>
                          <button
                            onClick={() => onRemoveServiceFromBooking(activeBooking.id, item.id)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick add items */}
                <div className="flex flex-wrap gap-1.5 pt-1 max-h-28 overflow-y-auto">
                  {availableServices.map((item) => (
                    <button
                      key={item.id || item.name}
                      onClick={() => handleQuickAddService(item)}
                      className="inline-flex items-center gap-1 text-[11px] bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2 py-1 rounded border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                      <span>{item.name}</span>
                      <span className="font-bold text-slate-900">({formatVND(item.price)}{item.unit ? `/${item.unit}` : ''})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Check-in button if empty */}
          {room.status === 'available' && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-900 text-sm block">Phòng đang sẵn sàng đón khách!</span>
                <span className="text-xs text-emerald-700">Giá bán trực tiếp: {formatVND(room.directPrice)} / đêm</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenBookingModal(room, false)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Nhận Phòng Ngay
                </button>
                <button
                  onClick={() => onOpenBookingModal(room, true)}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  Đặt Trước
                </button>
              </div>
            </div>
          )}

          {/* Dedicated OTA Rates for this specific room */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Bảng Giá Niêm Yết Của Phòng {room.number}
              </h4>
              <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                +150k phí quản lý sau trừ % sàn
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Direct */}
              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block">Đặt Trực Tiếp</span>
                  <span className="text-[10px] text-emerald-700">0% hoa hồng</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-700 text-sm">{formatVND(room.directPrice)}</span>
                  <span className="text-[10px] text-emerald-600 block">Thực nhận 100%</span>
                </div>
              </div>

              {/* OTAs */}
              {(['agoda', 'booking', 'trip', 'airbnb'] as const).map((ch) => {
                const chInfo = CHANNELS[ch];
                const rate = settings.channelCommissions[ch] ?? 0.15;
                const breakdown = calculateOtaPrice(
                  room.directPrice,
                  ch,
                  rate,
                  settings.defaultManagementFee,
                  settings.pricingFormula,
                  settings.roundingMethod
                );

                return (
                  <div key={ch} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${chInfo.bgColor}`}>
                          {chInfo.name}
                        </span>
                        <span className="text-[10px] text-slate-400">-{Math.round(rate * 100)}%</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Thực nhận: <strong className="text-emerald-700">{formatVND(breakdown.netPayout)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="text-right">
                        <span className="font-bold text-slate-900 text-sm">{formatVND(breakdown.listedPrice)}</span>
                        <span className="text-[10px] text-slate-400 block">Niêm yết</span>
                      </div>
                      <button
                        onClick={() => handleCopy(breakdown.listedPrice.toString(), `room-${ch}`)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600"
                        title="Sao chép"
                      >
                        {copiedKey === `room-${ch}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
