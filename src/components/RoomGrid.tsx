import { useState } from 'react';
import { Room, Booking, RoomStatus, RoomType, BookingChannel } from '../types/hotel';
import { ROOM_TYPES, CHANNELS } from '../data/initialData';
import { formatVND } from '../utils/pricing';
import { 
  Bed, 
  Sparkles, 
  User, 
  Calendar, 
  LogIn, 
  LogOut, 
  PlusCircle, 
  Wrench, 
  CheckCircle2, 
  Filter, 
  Layers, 
  Search,
  AlertCircle
} from 'lucide-react';

interface RoomGridProps {
  rooms: Room[];
  bookings: Booking[];
  onOpenBookingModal: (room: Room, isReservation?: boolean) => void;
  onOpenCheckoutModal: (booking: Booking, room: Room) => void;
  onOpenRoomDetail: (room: Room) => void;
  onQuickCleanRoom: (roomId: string) => void;
  onQuickSetStatus: (roomId: string, status: RoomStatus) => void;
}

export default function RoomGrid({
  rooms,
  bookings,
  onOpenBookingModal,
  onOpenCheckoutModal,
  onOpenRoomDetail,
  onQuickCleanRoom,
  onQuickSetStatus,
}: RoomGridProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Group rooms by floor (Floor 1 to Floor 5)
  const floors = [5, 4, 3, 2, 1]; // Top floor to bottom floor or 1 to 5

  // Booking map for quick lookup
  const activeBookingsMap = new Map<string, Booking>();
  bookings.forEach((b) => {
    if (b.status === 'active' || b.status === 'reserved') {
      activeBookingsMap.set(b.roomId, b);
    }
  });

  // Calculate statistics
  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter((r) => r.status === 'occupied').length;
  const availableCount = rooms.filter((r) => r.status === 'available').length;
  const cleaningCount = rooms.filter((r) => r.status === 'cleaning').length;
  const reservedCount = rooms.filter((r) => r.status === 'reserved').length;
  const maintenanceCount = rooms.filter((r) => r.status === 'maintenance').length;
  const occupancyPercent = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    if (statusFilter !== 'all' && room.status !== statusFilter) return false;
    if (typeFilter !== 'all' && room.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const booking = activeBookingsMap.get(room.id);
      const guestMatch = booking?.guestName.toLowerCase().includes(q) || booking?.guestPhone.includes(q);
      const roomMatch = room.number.toLowerCase().includes(q) || ROOM_TYPES[room.type]?.name.toLowerCase().includes(q);
      if (!guestMatch && !roomMatch) return false;
    }
    return true;
  });

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return {
          label: 'Phòng Trống',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dotClass: 'bg-emerald-500',
        };
      case 'occupied':
        return {
          label: 'Đang Ở',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
          dotClass: 'bg-rose-500 animate-pulse',
        };
      case 'reserved':
        return {
          label: 'Đặt Trước',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
          dotClass: 'bg-amber-500',
        };
      case 'cleaning':
        return {
          label: 'Cần Dọn',
          badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
          dotClass: 'bg-sky-500',
        };
      case 'maintenance':
        return {
          label: 'Bảo Trì',
          badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
          dotClass: 'bg-slate-500',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-md border-indigo-600 scale-[1.02]'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={statusFilter === 'all' ? 'text-indigo-100' : 'text-slate-500'}>Tổng số phòng</span>
            <Layers className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-2xl font-black">{totalRooms}</div>
          <div className="text-[11px] mt-1 opacity-80">Công suất: {occupancyPercent}%</div>
        </button>

        <button
          onClick={() => setStatusFilter('available')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'available'
              ? 'bg-emerald-600 text-white shadow-md border-emerald-600 scale-[1.02]'
              : 'bg-white hover:bg-emerald-50/50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={statusFilter === 'available' ? 'text-emerald-100' : 'text-slate-500'}>Phòng Trống</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 group-hover:text-emerald-700">
            {availableCount}
          </div>
          <div className="text-[11px] mt-1 text-emerald-600/80">Sẵn sàng đón khách</div>
        </button>

        <button
          onClick={() => setStatusFilter('occupied')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'occupied'
              ? 'bg-rose-600 text-white shadow-md border-rose-600 scale-[1.02]'
              : 'bg-white hover:bg-rose-50/50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={statusFilter === 'occupied' ? 'text-rose-100' : 'text-slate-500'}>Đang Có Khách</span>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-rose-600">{occupiedCount}</div>
          <div className="text-[11px] mt-1 text-rose-600/80">{occupancyPercent}% phòng đang ở</div>
        </button>

        <button
          onClick={() => setStatusFilter('reserved')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'reserved'
              ? 'bg-amber-600 text-white shadow-md border-amber-600 scale-[1.02]'
              : 'bg-white hover:bg-amber-50/50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={statusFilter === 'reserved' ? 'text-amber-100' : 'text-slate-500'}>Đặt Trước</span>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{reservedCount}</div>
          <div className="text-[11px] mt-1 text-amber-600/80">Sắp check-in</div>
        </button>

        <button
          onClick={() => setStatusFilter('cleaning')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'cleaning'
              ? 'bg-sky-600 text-white shadow-md border-sky-600 scale-[1.02]'
              : 'bg-white hover:bg-sky-50/50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={statusFilter === 'cleaning' ? 'text-sky-100' : 'text-slate-500'}>Cần Dọn Dẹp</span>
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600">{cleaningCount}</div>
          <div className="text-[11px] mt-1 text-sky-600/80">Chờ buồng phòng</div>
        </button>

        <button
          onClick={() => setStatusFilter('maintenance')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'maintenance'
              ? 'bg-slate-700 text-white shadow-md border-slate-700 scale-[1.02]'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={statusFilter === 'maintenance' ? 'text-slate-200' : 'text-slate-500'}>Bảo Trì</span>
            <Wrench className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-700">{maintenanceCount}</div>
          <div className="text-[11px] mt-1 text-slate-500">Tạm ngưng đón</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Lọc Hạng Phòng:
          </div>
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả (25 phòng)
          </button>
          <button
            onClick={() => setTypeFilter('standard_single')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'standard_single'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Standard 1 Giường (19P)
          </button>
          <button
            onClick={() => setTypeFilter('standard_twin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'standard_twin'
                ? 'bg-teal-600 text-white'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            Standard 2 Giường (P.105)
          </button>
          <button
            onClick={() => setTypeFilter('vip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'vip'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            Đơn VIP (P.501)
          </button>
          <button
            onClick={() => setTypeFilter('deluxe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'deluxe'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
            }`}
          >
            Deluxe (P.505)
          </button>
          <button
            onClick={() => setTypeFilter('family')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'family'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-900 hover:bg-rose-100'
            }`}
          >
            Family (P.201, 401)
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm số phòng, tên khách, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Floor by Floor Layout */}
      <div className="space-y-6">
        {floors.map((floorNum) => {
          const floorRooms = filteredRooms.filter((r) => r.floor === floorNum);
          if (floorRooms.length === 0) return null;

          return (
            <div key={floorNum} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center">
                  T{floorNum}
                </span>
                <h3 className="font-bold text-slate-800 text-base">
                  Tầng {floorNum}
                </h3>
                <span className="text-xs text-slate-400">
                  ({floorRooms.length} phòng)
                </span>
              </div>

              {/* Grid of rooms on this floor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {floorRooms.map((room) => {
                  const typeInfo = ROOM_TYPES[room.type] || ROOM_TYPES.standard_single;
                  const statusInfo = getStatusBadge(room.status);
                  const activeBooking = activeBookingsMap.get(room.id);
                  const channelInfo = activeBooking ? CHANNELS[activeBooking.channel] : null;

                  return (
                    <div
                      key={room.id}
                      onClick={() => onOpenRoomDetail(room)}
                      className={`relative bg-white rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer hover:shadow-lg flex flex-col justify-between ${
                        room.status === 'occupied'
                          ? 'border-rose-300 ring-1 ring-rose-200'
                          : room.status === 'cleaning'
                          ? 'border-sky-300 ring-1 ring-sky-200 bg-sky-50/20'
                          : room.status === 'reserved'
                          ? 'border-amber-300 ring-1 ring-amber-200'
                          : room.status === 'maintenance'
                          ? 'border-slate-300 opacity-70 bg-slate-50'
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {/* Top Bar: Room Number & Status Badge */}
                      <div className="p-3.5 pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">
                              {room.number}
                            </span>
                            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                              <span>🛏️ {typeInfo.bedDescription}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                              {statusInfo.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1 font-medium">
                              {typeInfo.badgeName}
                            </span>
                          </div>
                        </div>

                        {/* Direct Price Tag */}
                        <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                          <span className="text-slate-400 text-[11px]">Giá trực tiếp:</span>
                          <span className="font-bold text-emerald-700">
                            {formatVND(room.directPrice)}
                          </span>
                        </div>

                        {/* Guest / Booking Details If Occupied */}
                        {room.status === 'occupied' && activeBooking && (
                          <div className="mt-2.5 p-2 rounded-lg bg-rose-50/80 border border-rose-100 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 truncate">
                                {activeBooking.guestName}
                              </span>
                              {channelInfo && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${channelInfo.bgColor}`}>
                                  {channelInfo.shortName}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center justify-between">
                              <span>Out: {activeBooking.checkOutDate}</span>
                              <span className="font-medium text-rose-700">{activeBooking.nights} đêm</span>
                            </div>
                            {activeBooking.services.length > 0 && (
                              <div className="text-[10px] text-amber-700 font-semibold">
                                + {activeBooking.services.length} món minibar/dịch vụ
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reserved Info */}
                        {room.status === 'reserved' && activeBooking && (
                          <div className="mt-2.5 p-2 rounded-lg bg-amber-50/80 border border-amber-100 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 truncate">
                                {activeBooking.guestName}
                              </span>
                              {channelInfo && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${channelInfo.bgColor}`}>
                                  {channelInfo.shortName}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Đến: {activeBooking.checkInDate}
                            </div>
                          </div>
                        )}

                        {/* Cleaning note */}
                        {room.status === 'cleaning' && (
                          <div className="mt-2.5 p-2 rounded-lg bg-sky-50 border border-sky-100 text-[11px] text-sky-800">
                            <span className="font-semibold block">🧹 {room.cleaningNote || 'Cần dọn dẹp thay ga gối'}</span>
                          </div>
                        )}

                        {/* Maintenance note */}
                        {room.status === 'maintenance' && (
                          <div className="mt-2.5 p-2 rounded-lg bg-slate-100 text-[11px] text-slate-700">
                            <span>🛠️ {room.cleaningNote || 'Đang bảo dưỡng kỹ thuật'}</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Buttons */}
                      <div className="p-2 bg-slate-50/90 border-t border-slate-100 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {room.status === 'available' && (
                          <>
                            <button
                              onClick={() => onOpenBookingModal(room, false)}
                              className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              Nhận Phòng
                            </button>
                            <button
                              onClick={() => onOpenBookingModal(room, true)}
                              className="py-1.5 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
                              title="Đặt trước"
                            >
                              Đặt Trước
                            </button>
                          </>
                        )}

                        {room.status === 'occupied' && activeBooking && (
                          <>
                            <button
                              onClick={() => onOpenCheckoutModal(activeBooking, room)}
                              className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Trả Phòng & Hóa Đơn
                            </button>
                            <button
                              onClick={() => onOpenRoomDetail(room)}
                              className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold"
                              title="Thêm dịch vụ minibar"
                            >
                              + Dịch Vụ
                            </button>
                          </>
                        )}

                        {room.status === 'reserved' && activeBooking && (
                          <>
                            <button
                              onClick={() => onOpenBookingModal(room, false)}
                              className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              Khách Nhận Phòng
                            </button>
                          </>
                        )}

                        {room.status === 'cleaning' && (
                          <button
                            onClick={() => onQuickCleanRoom(room.id)}
                            className="w-full inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã Dọn Xong (Sẵn Sàng)
                          </button>
                        )}

                        {room.status === 'maintenance' && (
                          <button
                            onClick={() => onQuickSetStatus(room.id, 'available')}
                            className="w-full inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Xong Bảo Trì → Mở Bán
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
