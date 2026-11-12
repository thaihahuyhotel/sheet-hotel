import { useState } from 'react';
import { Booking, Room, HotelSettings } from '../types/hotel';
import { ROOM_TYPES, CHANNELS } from '../data/initialData';
import { formatVND } from '../utils/pricing';
import { Search, Calendar, User, Phone, CheckCircle, LogOut, Plus, Filter, Tag, ArrowRight } from 'lucide-react';

interface BookingListProps {
  bookings: Booking[];
  rooms: Room[];
  settings: HotelSettings;
  onOpenCheckoutModal: (booking: Booking, room: Room) => void;
  onOpenBookingModal: (room: Room, isReservation?: boolean) => void;
  onSelectBooking: (booking: Booking) => void;
}

export default function BookingList({
  bookings,
  rooms,
  settings,
  onOpenCheckoutModal,
  onOpenBookingModal,
  onSelectBooking,
}: BookingListProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const roomsMap = new Map<string, Room>();
  rooms.forEach((r) => roomsMap.set(r.id, r));

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (filterChannel !== 'all' && b.channel !== filterChannel) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        b.guestName.toLowerCase().includes(q) ||
        b.guestPhone.includes(q) ||
        b.roomNumber.includes(q) ||
        b.bookingCode.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả ({bookings.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filterStatus === 'active' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Đang ở ({bookings.filter((b) => b.status === 'active').length})
          </button>
          <button
            onClick={() => setFilterStatus('reserved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filterStatus === 'reserved' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Đặt trước ({bookings.filter((b) => b.status === 'reserved').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filterStatus === 'completed' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Đã trả phòng ({bookings.filter((b) => b.status === 'completed').length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Channel Filter */}
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="all">Mọi kênh OTA & Trực tiếp</option>
            <option value="direct">Đặt trực tiếp</option>
            <option value="agoda">Agoda</option>
            <option value="booking">Booking.com</option>
            <option value="trip">Trip.com</option>
            <option value="airbnb">Airbnb</option>
          </select>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm khách, phòng, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Mã Đặt & Phòng</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-3">Kênh Đặt</th>
                <th className="py-3 px-3">Thời Gian Lưu Trú</th>
                <th className="py-3 px-3">Doanh Thu / Đêm</th>
                <th className="py-3 px-3">Tổng Tiền</th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không tìm thấy đơn đặt phòng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const room = roomsMap.get(b.roomId);
                  const roomType = ROOM_TYPES[b.roomType] || ROOM_TYPES.standard_single;
                  const channel = CHANNELS[b.channel] || CHANNELS.direct;
                  const totalServices = b.services.reduce((s, i) => s + i.total, 0);

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Code & Room */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">
                          Phòng {b.roomNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {b.bookingCode}
                        </div>
                        <span className="text-[10px] text-indigo-700 font-medium">
                          {roomType.badgeName}
                        </span>
                      </td>

                      {/* Guest Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{b.guestName}</div>
                        <div className="text-[11px] text-slate-500">{b.guestPhone || 'Không có SĐT'}</div>
                        {b.notes && (
                          <div className="text-[10px] text-amber-700 italic truncate max-w-xs">
                            "{b.notes}"
                          </div>
                        )}
                      </td>

                      {/* Channel */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold ${channel.bgColor}`}>
                          {channel.name}
                        </span>
                        {b.channelBookingRef && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {b.channelBookingRef}
                          </span>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">
                          {b.checkInDate} → {b.checkOutDate}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {b.nights} đêm
                        </div>
                      </td>

                      {/* Price per night */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">
                          {formatVND(b.roomPricePerNight)}
                        </div>
                        {b.channel !== 'direct' && (
                          <div className="text-[10px] text-amber-700 font-semibold">
                            +150k phí QL
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-indigo-950">
                          {formatVND(b.totalRoomPrice + totalServices - (b.discount || 0))}
                        </div>
                        {totalServices > 0 && (
                          <div className="text-[10px] text-slate-500">
                            (+{formatVND(totalServices)} minibar)
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {b.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            Đang Ở
                          </span>
                        )}
                        {b.status === 'reserved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Đặt Trước
                          </span>
                        )}
                        {b.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Đã Check-out
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {b.status === 'active' && room && (
                          <button
                            onClick={() => onOpenCheckoutModal(b, room)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Trả Phòng
                          </button>
                        )}
                        {b.status === 'reserved' && room && (
                          <button
                            onClick={() => onSelectBooking(b)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                          >
                            Nhận Phòng
                          </button>
                        )}
                        {b.status === 'completed' && room && (
                          <button
                            onClick={() => onOpenCheckoutModal(b, room)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium"
                          >
                            Xem Hóa Đơn
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
