import { useState, useEffect } from 'react';
import { Room, Booking, BookingChannel, HotelSettings, BookingServiceItem, ServiceItemConfig } from '../types/hotel';
import { ROOM_TYPES, CHANNELS, DEFAULT_SERVICES } from '../data/initialData';
import { calculateOtaPrice, formatVND } from '../utils/pricing';
import { X, Calendar, User, Phone, CreditCard, Sparkles, Plus, Trash2, ArrowRight } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoom: Room | null;
  rooms: Room[];
  settings: HotelSettings;
  isReservation?: boolean;
  onSaveBooking: (booking: Booking, targetRoomId: string, isCheckInNow: boolean) => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  selectedRoom,
  rooms,
  settings,
  isReservation = false,
  onSaveBooking,
}: BookingModalProps) {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [roomId, setRoomId] = useState<string>(selectedRoom?.id || rooms[0]?.id || '101');
  const [channel, setChannel] = useState<BookingChannel>('direct');
  const [channelBookingRef, setChannelBookingRef] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestIdCard, setGuestIdCard] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>(todayStr);
  const [checkOutDate, setCheckOutDate] = useState<string>(tomorrowStr);
  const [customPricePerNight, setCustomPricePerNight] = useState<number | null>(null);
  const [deposit, setDeposit] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [services, setServices] = useState<BookingServiceItem[]>([]);
  const [isCheckInNow, setIsCheckInNow] = useState<boolean>(!isReservation);
  const [formError, setFormError] = useState<string>('');

  const currentRoom = rooms.find((r) => r.id === roomId) || selectedRoom || rooms[0];
  const roomType = ROOM_TYPES[currentRoom?.type || 'standard_single'];

  // Calculate nights
  const checkInTime = new Date(checkInDate).getTime();
  const checkOutTime = new Date(checkOutDate).getTime();
  const diffDays = Math.max(1, Math.round((checkOutTime - checkInTime) / (1000 * 60 * 60 * 24)));
  const nights = isNaN(diffDays) ? 1 : diffDays;

  // Auto calculate price per night based on channel
  const commissionRate = settings.channelCommissions[channel] ?? 0.15;
  const otaCalculation = calculateOtaPrice(
    currentRoom?.directPrice || 800000,
    channel,
    commissionRate,
    settings.defaultManagementFee,
    settings.pricingFormula,
    settings.roundingMethod
  );

  const activePricePerNight = customPricePerNight !== null ? customPricePerNight : otaCalculation.listedPrice;
  const totalRoomPrice = activePricePerNight * nights;
  const totalServices = services.reduce((sum, s) => sum + s.total, 0);
  const totalManagementFee = channel !== 'direct' ? settings.defaultManagementFee * nights : 0;
  const totalOtaCommission = channel !== 'direct' ? Math.round(totalRoomPrice * commissionRate) : 0;

  // Handle channel change
  const handleChannelChange = (newChannel: BookingChannel) => {
    setChannel(newChannel);
    setCustomPricePerNight(null); // reset custom price to auto calculate
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setFormError('Vui lòng nhập tên khách hàng trước khi xác nhận!');
      return;
    }
    setFormError('');

    const bookingCode = `BK-${currentRoom.number}-${channel.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      bookingCode,
      roomId: currentRoom.id,
      roomNumber: currentRoom.number,
      roomType: currentRoom.type,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestIdCard: guestIdCard.trim(),
      channel,
      channelBookingRef: channelBookingRef.trim(),
      checkInDate,
      checkOutDate,
      nights,
      roomPricePerNight: activePricePerNight,
      totalRoomPrice,
      managementFee: totalManagementFee,
      otaCommissionRate: commissionRate,
      otaCommissionAmount: totalOtaCommission,
      services,
      deposit,
      discount,
      status: isCheckInNow ? 'active' : 'reserved',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onSaveBooking(newBooking, currentRoom.id, isCheckInNow);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 sm:p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {isCheckInNow ? 'Nhận Phòng (Check-in Ngay)' : 'Đặt Giữ Phòng Trước'}
              </span>
              <span className="text-xs text-slate-300">
                Phòng {currentRoom?.number} ({roomType?.badgeName})
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              Tạo Đơn Đặt Phòng Mới
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Room & Channel Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Chọn Phòng (Tổng 25 phòng)
              </label>
              <select
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  setCustomPricePerNight(null);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {rooms.map((r) => {
                  const t = ROOM_TYPES[r.type];
                  return (
                    <option key={r.id} value={r.id}>
                      Phòng {r.number} (T{r.floor}) - {t?.badgeName} - {formatVND(r.directPrice)}
                    </option>
                  );
                })}
              </select>
              <div className="text-[11px] text-slate-500 mt-1">
                🛏️ {roomType?.bedDescription} • Giá trực tiếp: {formatVND(currentRoom.directPrice)}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nguồn / Kênh Đặt Phòng
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['direct', 'agoda', 'booking', 'trip', 'airbnb'] as BookingChannel[]).map((ch) => {
                  const chInfo = CHANNELS[ch];
                  const isSelected = channel === ch;
                  return (
                    <button
                      type="button"
                      key={ch}
                      onClick={() => handleChannelChange(ch)}
                      className={`p-1.5 rounded-lg border text-xs font-bold transition-all text-center ${
                        isSelected
                          ? `${chInfo.bgColor} ring-2 ring-indigo-500 shadow-sm`
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {chInfo.shortName}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* OTA Pricing Notification Box */}
          {channel !== 'direct' && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Đã tự động tính giá niêm yết trên {CHANNELS[channel].name} (+150k phí quản lý):
                </span>
                <span className="font-black text-blue-950 text-sm">
                  {formatVND(otaCalculation.listedPrice)} / đêm
                </span>
              </div>
              <div className="text-slate-600 text-[11px] flex items-center justify-between">
                <span>
                  Trừ {Math.round(commissionRate * 100)}% hoa hồng ({formatVND(otaCalculation.commissionAmount)}) → Thực nhận: <strong>{formatVND(otaCalculation.netPayout)}</strong>
                </span>
                <span className="font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                  Dôi dư +150.000₫ quản lý
                </span>
              </div>
            </div>
          )}

          {/* Channel Booking Reference ID (if OTA) */}
          {channel !== 'direct' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Mã đặt phòng trên sàn {CHANNELS[channel].name} (tùy chọn)
              </label>
              <input
                type="text"
                placeholder="VD: AGD-981249, BK-1204859..."
                value={channelBookingRef}
                onChange={(e) => setChannelBookingRef(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          )}

          {/* Guest Information */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Thông Tin Khách Hàng
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Họ và tên khách *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-2.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="0912 345 678"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-2.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  CCCD / Hộ chiếu
                </label>
                <div className="relative">
                  <CreditCard className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="07909500xxxx"
                    value={guestIdCard}
                    onChange={(e) => setGuestIdCard(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-2.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dates & Rates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Ngày nhận phòng (Check-in)
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Ngày trả phòng (Check-out)
              </label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Giá phòng / đêm ({nights} đêm)
              </label>
              <input
                type="number"
                step="10000"
                value={activePricePerNight}
                onChange={(e) => setCustomPricePerNight(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-indigo-700"
              />
              <span className="text-[10px] text-slate-400">Có thể sửa giá trực tiếp nếu muốn</span>
            </div>
          </div>

          {/* Quick Add Common Services */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Dịch vụ tiêu dùng & Minibar (tùy chọn)
              </label>
              <span className="text-xs text-slate-500">
                Đã thêm {services.length} món ({formatVND(totalServices)})
              </span>
            </div>

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50/50 rounded-lg border border-slate-200/60">
              {availableServices.map((srv) => (
                <button
                  type="button"
                  key={srv.id || srv.name}
                  onClick={() => handleAddService(srv)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2 py-1 rounded-md border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-emerald-600" />
                  <span>{srv.name}</span>
                  <span className="font-bold text-slate-900">({formatVND(srv.price)}{srv.unit ? `/${srv.unit}` : ''})</span>
                </button>
              ))}
            </div>

            {/* Added services list */}
            {services.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-2.5 divide-y divide-slate-200 text-xs max-h-32 overflow-y-auto">
                {services.map((s) => (
                  <div key={s.id} className="py-1 flex items-center justify-between">
                    <span className="font-medium text-slate-800">
                      {s.name} x{s.quantity}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{formatVND(s.total)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(s.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deposit, Discount, Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Tiền cọc trước (nếu có)
              </label>
              <input
                type="number"
                step="50000"
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                placeholder="0"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Giảm giá / Ưu đãi (VNĐ)
              </label>
              <input
                type="number"
                step="50000"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Ghi chú đặc biệt
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Yêu cầu tầng cao, giường phụ, xuất hóa đơn VAT..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Price Summary Calculation Card */}
          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>
                Tiền phòng ({formatVND(activePricePerNight)} x {nights} đêm):
              </span>
              <span className="font-bold text-white">{formatVND(totalRoomPrice)}</span>
            </div>

            {channel !== 'direct' && (
              <div className="flex justify-between text-xs text-amber-300">
                <span>Phí quản lý dôi dư (+150k x {nights} đêm):</span>
                <span className="font-bold">+{formatVND(totalManagementFee)}</span>
              </div>
            )}

            {totalServices > 0 && (
              <div className="flex justify-between text-xs text-slate-300">
                <span>Dịch vụ minibar phụ trợ:</span>
                <span className="font-bold text-white">+{formatVND(totalServices)}</span>
              </div>
            )}

            {discount > 0 && (
              <div className="flex justify-between text-xs text-rose-300">
                <span>Giảm giá khuyến mãi:</span>
                <span className="font-bold">-{formatVND(discount)}</span>
              </div>
            )}

            {deposit > 0 && (
              <div className="flex justify-between text-xs text-emerald-300">
                <span>Đã đặt cọc:</span>
                <span className="font-bold">-{formatVND(deposit)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
              <span className="font-bold">Tổng dự kiến thu:</span>
              <span className="text-xl font-black text-emerald-400">
                {formatVND(totalRoomPrice + totalServices - discount - deposit)}
              </span>
            </div>
          </div>

          {/* Check-in now toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="checkInNowToggle"
              checked={isCheckInNow}
              onChange={(e) => setIsCheckInNow(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <label htmlFor="checkInNowToggle" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Khách nhận phòng ngay lúc này (Trạng thái phòng chuyển sang <span className="text-rose-600 font-bold">Đang ở</span>)
            </label>
          </div>

          {/* Form error banner */}
          {formError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              ⚠️ {formError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              {isCheckInNow ? 'Xác Nhận & Nhận Phòng' : 'Lưu Đặt Chỗ Trước'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
