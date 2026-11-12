import { useState, useMemo } from 'react';
import { Booking, Room, HotelSettings } from '../types/hotel';
import { ROOM_TYPES, CHANNELS } from '../data/initialData';
import { formatVND } from '../utils/pricing';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Bed, 
  Sparkles, 
  Layers, 
  CreditCard, 
  BarChart3, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  PlusCircle, 
  FileSpreadsheet, 
  CheckCircle2,
  CalendarRange,
  Clock,
  ArrowUpRight
} from 'lucide-react';

interface AnalyticsViewProps {
  bookings: Booking[];
  rooms: Room[];
  settings: HotelSettings;
  onNavigateToRooms?: () => void;
  onNavigateToSheets?: () => void;
}

export default function AnalyticsView({ 
  bookings, 
  rooms, 
  settings,
  onNavigateToRooms,
  onNavigateToSheets 
}: AnalyticsViewProps) {
  // Current date baseline
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthNum = currentDate.getMonth() + 1;
  const defaultMonthStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

  // Filter mode: 'all' or 'month'
  const [filterMode, setFilterMode] = useState<'month' | 'all'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthStr);

  // Extract all unique months that have bookings, or generate current year months
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    
    // Always include current year's months from 1 to 12
    for (let m = 1; m <= 12; m++) {
      monthSet.add(`${currentYear}-${String(m).padStart(2, '0')}`);
    }

    // Add any months present in bookings
    bookings.forEach((b) => {
      if (b.checkInDate) {
        const m = b.checkInDate.slice(0, 7);
        monthSet.add(m);
      }
    });

    return Array.from(monthSet).sort().reverse();
  }, [bookings, currentYear]);

  // Filter relevant bookings (active or completed)
  const allValidBookings = useMemo(() => {
    return bookings.filter((b) => b.status === 'active' || b.status === 'completed');
  }, [bookings]);

  // Filter bookings based on selected filter
  const filteredBookings = useMemo(() => {
    if (filterMode === 'all') {
      return allValidBookings;
    }
    return allValidBookings.filter((b) => {
      const bMonth = b.checkInDate?.slice(0, 7);
      return bMonth === selectedMonth;
    });
  }, [allValidBookings, filterMode, selectedMonth]);

  // Monthly aggregated statistics for the table view across all months
  const monthlySummaries = useMemo(() => {
    // Group all valid bookings by month
    const groups: Record<string, Booking[]> = {};
    
    // Populate all months in the current year first
    for (let m = 1; m <= 12; m++) {
      const key = `${currentYear}-${String(m).padStart(2, '0')}`;
      groups[key] = [];
    }

    allValidBookings.forEach((b) => {
      const key = b.checkInDate?.slice(0, 7) || defaultMonthStr;
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });

    return Object.entries(groups)
      .map(([monthKey, monthBookings]) => {
        const [y, m] = monthKey.split('-').map(Number);
        const daysInMonth = new Date(y, m, 0).getDate();
        const totalPossibleNights = rooms.length * daysInMonth; // 25 * days

        const bookingsCount = monthBookings.length;
        const nightsCount = monthBookings.reduce((sum, b) => sum + b.nights, 0);
        
        const gross = monthBookings.reduce((sum, b) => {
          const srv = (b.services || []).reduce((s, i) => s + i.total, 0);
          return sum + b.totalRoomPrice + srv - (b.discount || 0);
        }, 0);

        const directRevenue = monthBookings
          .filter((b) => b.channel === 'direct')
          .reduce((sum, b) => sum + b.totalRoomPrice, 0);

        const otaRevenue = monthBookings
          .filter((b) => b.channel !== 'direct')
          .reduce((sum, b) => sum + b.totalRoomPrice, 0);

        const mgmtFee = monthBookings.reduce((sum, b) => sum + (b.managementFee || 0), 0);
        const comm = monthBookings.reduce((sum, b) => sum + (b.otaCommissionAmount || 0), 0);
        const net = gross - comm;
        const occupancy = totalPossibleNights > 0 ? Math.round((nightsCount / totalPossibleNights) * 100) : 0;

        return {
          monthKey,
          label: `Tháng ${m}/${y}`,
          monthNum: m,
          year: y,
          bookingsCount,
          nightsCount,
          occupancy,
          gross,
          directRevenue,
          otaRevenue,
          mgmtFee,
          comm,
          net,
        };
      })
      .sort((a, b) => (b.monthKey > a.monthKey ? 1 : -1));
  }, [allValidBookings, rooms.length, currentYear, defaultMonthStr]);

  // Metrics for currently filtered bookings
  const totalRooms = rooms.length; // 25 rooms
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const currentOccupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const totalGrossRevenue = filteredBookings.reduce((sum, b) => {
    const srv = (b.services || []).reduce((s, i) => s + i.total, 0);
    return sum + b.totalRoomPrice + srv - (b.discount || 0);
  }, 0);

  const totalManagementFees = filteredBookings.reduce((sum, b) => sum + (b.managementFee || 0), 0);
  const totalOtaCommissions = filteredBookings.reduce((sum, b) => sum + (b.otaCommissionAmount || 0), 0);
  const totalNetRevenue = totalGrossRevenue - totalOtaCommissions;
  const totalNightsSold = filteredBookings.reduce((sum, b) => sum + b.nights, 0);
  const totalBookingsCount = filteredBookings.length;

  // Days in selected month
  const [selYear, selMonthNum] = selectedMonth.split('-').map(Number);
  const daysInSelMonth = new Date(selYear, selMonthNum, 0).getDate();
  const maxMonthlyNights = totalRooms * daysInSelMonth;
  const monthlyOccupancyRate = maxMonthlyNights > 0 ? Math.min(100, Math.round((totalNightsSold / maxMonthlyNights) * 100)) : 0;

  // Average Daily Rate (ADR)
  const adr = totalNightsSold > 0 ? Math.round(totalGrossRevenue / totalNightsSold) : 0;
  // Revenue Per Available Room (RevPAR)
  const revPar = maxMonthlyNights > 0 ? Math.round(totalNetRevenue / maxMonthlyNights) : 0;

  // Channel breakdown
  const channelStats = (['direct', 'agoda', 'booking', 'trip', 'airbnb'] as const).map((ch) => {
    const chBookings = filteredBookings.filter((b) => b.channel === ch);
    const revenue = chBookings.reduce((sum, b) => sum + b.totalRoomPrice, 0);
    const mgmtFee = chBookings.reduce((sum, b) => sum + (b.managementFee || 0), 0);
    const comm = chBookings.reduce((sum, b) => sum + (b.otaCommissionAmount || 0), 0);
    const count = chBookings.length;
    const nights = chBookings.reduce((sum, b) => sum + b.nights, 0);

    return {
      channel: ch,
      info: CHANNELS[ch],
      bookingsCount: count,
      nightsCount: nights,
      revenue,
      mgmtFee,
      comm,
      net: revenue - comm,
    };
  });

  // Room type breakdown
  const roomTypeStats = Object.keys(ROOM_TYPES).map((typeKey) => {
    const t = ROOM_TYPES[typeKey];
    const tBookings = filteredBookings.filter((b) => b.roomType === typeKey);
    const revenue = tBookings.reduce((sum, b) => sum + b.totalRoomPrice, 0);
    const nights = tBookings.reduce((sum, b) => sum + b.nights, 0);

    return {
      typeKey,
      info: t,
      bookingsCount: tBookings.length,
      nightsCount: nights,
      revenue,
    };
  });

  // Month navigation helpers
  const handlePrevMonth = () => {
    let [y, m] = selectedMonth.split('-').map(Number);
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
    setFilterMode('month');
  };

  const handleNextMonth = () => {
    let [y, m] = selectedMonth.split('-').map(Number);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
    setFilterMode('month');
  };

  const formattedMonthLabel = `Tháng ${selMonthNum} năm ${selYear}`;

  return (
    <div className="space-y-6 pb-10">
      {/* Top Filter & Month Selector Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Báo Cáo Doanh Thu Khách Sạn & Kênh OTA
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi chi tiết phát sinh theo từng tháng, phí quản lý 150k và khấu trừ hoa hồng từng kênh bán
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 text-xs font-bold">
            <button
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === 'month'
                  ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Tháng
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === 'all'
                  ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toàn Thời Gian
            </button>
          </div>

          {filterMode === 'month' && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
              <button
                onClick={handlePrevMonth}
                title="Tháng trước"
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setFilterMode('month');
                }}
                className="text-xs font-bold text-slate-800 bg-transparent px-2 py-1 focus:outline-none cursor-pointer"
              >
                {availableMonths.map((m) => {
                  const [y, mn] = m.split('-');
                  return (
                    <option key={m} value={m}>
                      Tháng {mn}/{y}
                    </option>
                  );
                })}
              </select>

              <button
                onClick={handleNextMonth}
                title="Tháng sau"
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selected Timeframe Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="font-bold text-slate-800">
            {filterMode === 'month' ? formattedMonthLabel : 'Báo cáo tổng hợp: Toàn thời gian'}
          </span>
          <span className="text-slate-400">•</span>
          <span>
            {totalBookingsCount > 0
              ? `${totalBookingsCount} đơn đặt phòng (${totalNightsSold} đêm)`
              : 'Chưa có đơn đặt phòng'}
          </span>
        </div>

        {filterMode === 'month' && (
          <span className="text-slate-500 hidden sm:inline">
            Tổng số phòng: <strong>25 phòng</strong> ({daysInSelMonth} ngày = {maxMonthlyNights} đêm tối đa)
          </span>
        )}
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Doanh Thu Thực Nhận</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {formatVND(totalNetRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Tổng niêm yết: {formatVND(totalGrossRevenue)}
          </div>
        </div>

        {/* Management Fee Bonus */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 p-5 rounded-2xl border border-amber-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-900 font-semibold mb-1">
            <span>Phí QL Thu Được (+150k)</span>
            <span className="p-1.5 rounded-lg bg-amber-200/60 text-amber-800">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-800 tracking-tight">
            {formatVND(totalManagementFees)}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">
            Phụ phí 150k/đêm kênh OTA bù chiết khấu
          </div>
        </div>

        {/* OTA Commissions Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Hoa Hồng Sàn OTA Trừ</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            {formatVND(totalOtaCommissions)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Agoda, Booking, Trip, Airbnb giữ lại
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">
              {filterMode === 'month' ? 'Công Suất Tháng' : 'Công Suất Hiện Tại'}
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Bed className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-600 tracking-tight">
            {filterMode === 'month' ? `${monthlyOccupancyRate}%` : `${currentOccupancyRate}%`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {filterMode === 'month'
              ? `${totalNightsSold} đêm đã bán / ${maxMonthlyNights} đêm`
              : `${occupiedRooms} / ${totalRooms} phòng đang ở`}
          </div>
        </div>
      </div>

      {/* Additional Hospitality Performance Metrics (ADR & RevPAR) */}
      {filterMode === 'month' && totalBookingsCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Giá Bán Bình Quân / Đêm (ADR)</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{formatVND(adr)}</div>
            </div>
            <span className="text-[11px] text-slate-400 max-w-[180px] text-right">
              Doanh thu phòng chia trên tổng số đêm phòng thực tế
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Doanh Thu / Phòng Sẵn Có (RevPAR)</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{formatVND(revPar)}</div>
            </div>
            <span className="text-[11px] text-slate-400 max-w-[180px] text-right">
              Hiệu suất bình quân trên toàn bộ 25 phòng của khách sạn
            </span>
          </div>
        </div>
      )}

      {/* Clean Data State (When 0 bookings exist) */}
      {totalBookingsCount === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              Hệ thống đang ở trạng thái Dữ Liệu Sạch (Chưa có khách đặt)
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Tất cả 25 phòng từ tầng 1 đến tầng 5 đều sẵn sàng đón khách. Khi bạn tạo đơn đặt phòng mới hoặc nạp dữ liệu từ Google Sheet, số liệu doanh thu của từng tháng sẽ tự động tổng hợp tại đây.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            {onNavigateToRooms && (
              <button
                onClick={onNavigateToRooms}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Xem Sơ Đồ & Đặt Phòng</span>
              </button>
            )}
            {onNavigateToSheets && (
              <button
                onClick={onNavigateToSheets}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Nạp Dữ Liệu Từ Google Sheet</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Section: Bảng Tổng Hợp Doanh Thu 12 Tháng Trong Năm */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">
                Bảng Tổng Hợp Doanh Thu Các Tháng Trong Năm ({currentYear})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Bấm chọn vào tháng bất kỳ để xem phân tích chi tiết theo kênh và từng hạng phòng
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tháng</th>
                <th className="py-3 px-3 text-center">Đơn / Đêm</th>
                <th className="py-3 px-3 text-center">Công Suất</th>
                <th className="py-3 px-3 text-right">Trực Tiếp</th>
                <th className="py-3 px-3 text-right">Kênh OTA</th>
                <th className="py-3 px-3 text-right">Phí QL (+150k)</th>
                <th className="py-3 px-3 text-right">Hoa Hồng Sàn</th>
                <th className="py-3 px-4 text-right">Thực Thu Về Khách Sạn</th>
                <th className="py-3 px-3 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlySummaries.map((m) => {
                const isSelected = filterMode === 'month' && selectedMonth === m.monthKey;
                return (
                  <tr
                    key={m.monthKey}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/70 font-semibold'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{m.label}</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-600 text-white font-extrabold">
                            Đang xem
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-slate-800 font-bold">{m.bookingsCount}</span>
                      <span className="text-slate-400 text-[11px] block">({m.nightsCount} đêm)</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          m.occupancy > 70
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.occupancy > 30
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {m.occupancy}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {formatVND(m.directRevenue)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {formatVND(m.otaRevenue)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-amber-600">
                      {m.mgmtFee > 0 ? `+${formatVND(m.mgmtFee)}` : '0 ₫'}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600 font-medium">
                      {m.comm > 0 ? `-${formatVND(m.comm)}` : '0 ₫'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
                      {formatVND(m.net)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedMonth(m.monthKey);
                          setFilterMode('month');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        Lọc Tháng
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Channel Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Báo Cáo Hiệu Quả Theo Kênh Bán ({filterMode === 'month' ? formattedMonthLabel : 'Toàn thời gian'})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đánh giá tỷ lệ doanh thu, chiết khấu và lợi nhuận quản lý thực tế trên từng kênh OTA
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Kênh Bán</th>
                <th className="py-3 px-3 text-center">Đơn / Đêm</th>
                <th className="py-3 px-3 text-right">Tổng Tiền Niêm Yết</th>
                <th className="py-3 px-3 text-right">Hoa Hồng Sàn Trừ</th>
                <th className="py-3 px-3 text-right">Phí Quản Lý Thu (+150k)</th>
                <th className="py-3 px-4 text-right">Thực Thu Về Khách Sạn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {channelStats.map((st) => (
                <tr key={st.channel} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded font-bold ${st.info.bgColor}`}>
                      {st.info.name}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {st.channel === 'direct' ? '0% hoa hồng' : `Hoa hồng ~${Math.round(st.info.defaultCommissionRate * 100)}%`}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="font-bold text-slate-800">{st.bookingsCount} đơn</span>
                    <span className="text-[11px] text-slate-400 block">({st.nightsCount} đêm)</span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                    {formatVND(st.revenue)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-rose-600 font-medium">
                    {st.comm > 0 ? `-${formatVND(st.comm)}` : '0 ₫'}
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-amber-600">
                    {st.mgmtFee > 0 ? `+${formatVND(st.mgmtFee)}` : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                    {formatVND(st.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Room Type Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">
            Doanh Thu Theo 4 Hạng Phòng Khách Sạn ({filterMode === 'month' ? formattedMonthLabel : 'Toàn thời gian'})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard (20 phòng: 19 1G + 1 2G), Đơn VIP (501), Deluxe (505), Family (201 & 401)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
          {roomTypeStats.map((r) => (
            <div key={r.typeKey} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-xs font-bold text-indigo-700 block uppercase">
                {r.info.badgeName}
              </span>
              <div className="font-extrabold text-slate-900 text-base">{r.info.name}</div>
              <div className="text-xs text-slate-500">
                🛏️ {r.info.bedDescription}
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-500">Giá gốc:</span>
                <span className="font-bold text-emerald-700">{formatVND(r.info.directPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Đã bán:</span>
                <span className="font-bold text-slate-800">{r.nightsCount} đêm ({r.bookingsCount} lượt)</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 font-bold">
                <span className="text-slate-700">Tổng doanh thu:</span>
                <span className="text-indigo-950 font-black">{formatVND(r.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
