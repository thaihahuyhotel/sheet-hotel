import { useState, useEffect } from 'react';
import { HotelSettings, Room } from '../types/hotel';
import { 
  Building2, 
  Calendar, 
  Clock, 
  Plus, 
  Sliders, 
  Layers, 
  Sparkles, 
  Tag, 
  BarChart3, 
  FileText,
  BedDouble,
  FileSpreadsheet
} from 'lucide-react';

interface HeaderProps {
  currentView: 'rooms' | 'ota' | 'bookings' | 'analytics' | 'sheets';
  onChangeView: (view: 'rooms' | 'ota' | 'bookings' | 'analytics' | 'sheets') => void;
  settings: HotelSettings;
  rooms: Room[];
  onOpenQuickBooking: () => void;
  onOpenSettings: () => void;
  isSheetConnected?: boolean;
}

export default function Header({
  currentView,
  onChangeView,
  settings,
  rooms,
  onOpenQuickBooking,
  onOpenSettings,
  isSheetConnected = false,
}: HeaderProps) {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      setDate(
        now.toLocaleDateString('vi-VN', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const total = rooms.length;
  const available = rooms.filter((r) => r.status === 'available').length;
  const occupied = rooms.filter((r) => r.status === 'occupied').length;
  const cleaning = rooms.filter((r) => r.status === 'cleaning').length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Hotel Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-slate-900 text-lg tracking-tight leading-tight">
                  {settings.hotelName}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  25 Phòng
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                Quản lý phòng & Kênh OTA (+150k phí quản lý)
              </p>
            </div>
          </div>

          {/* Quick Room Occupancy Status Pills (Hidden on small mobile) */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {available} Trống
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {occupied} Đang ở
            </span>
            {cleaning > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-semibold">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                {cleaning} Cần dọn
              </span>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex flex-col text-right text-[11px] text-slate-500 border-r border-slate-200 pr-3">
              <span className="font-bold text-slate-800">{time}</span>
              <span className="capitalize">{date}</span>
            </div>

            <button
              onClick={onOpenQuickBooking}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-indigo-600/20 transition-all hover:shadow-md hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nhận Phòng / Đặt Chỗ</span>
              <span className="sm:hidden">Đặt Phòng</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              title="Cài đặt hệ thống & 25 phòng"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 -mx-2 px-2 scrollbar-none border-t border-slate-100">
          <button
            onClick={() => onChangeView('rooms')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              currentView === 'rooms'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Sơ Đồ 25 Phòng (Tầng 1 - 5)
          </button>

          <button
            onClick={() => onChangeView('ota')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              currentView === 'ota'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Bảng Giá OTA & Kênh Bán (+150k)
          </button>

          <button
            onClick={() => onChangeView('bookings')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              currentView === 'bookings'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Quản Lý Đặt Phòng
          </button>

          <button
            onClick={() => onChangeView('analytics')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              currentView === 'analytics'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Báo Cáo Doanh Thu
          </button>

          <button
            onClick={() => onChangeView('sheets')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              currentView === 'sheets'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Google Sheets & Dữ Liệu</span>
            {isSheetConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Đã kết nối Google Sheet" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
