import { useState } from 'react';
import { Room, Booking, HotelSettings } from '../types/hotel';
import { HOTEL_SHEET_SCHEMA } from '../services/googleSheetsService';
import { 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  Download, 
  RotateCcw, 
  AlertTriangle, 
  Layers, 
  FileText, 
  Sparkles, 
  Users, 
  Table, 
  ShieldCheck, 
  Zap,
  Globe
} from 'lucide-react';
import { 
  testFirestoreConnection, 
  resetFirestoreToCleanState 
} from '../services/firebaseService';
import { formatVND } from '../utils/pricing';

interface DatabaseViewProps {
  rooms: Room[];
  bookings: Booking[];
  settings: HotelSettings;
  isRealtimeConnected: boolean;
  onNavigateToRooms: () => void;
  onNavigateToBookings: () => void;
}

export default function DatabaseView({
  rooms,
  bookings,
  settings,
  isRealtimeConnected,
  onNavigateToRooms,
  onNavigateToBookings,
}: DatabaseViewProps) {
  const [activeSchemaTab, setActiveSchemaTab] = useState(0);
  const [isPinging, setIsPinging] = useState(false);
  const [pingSuccess, setPingSuccess] = useState<boolean | null>(null);
  const [showCleanConfirm, setShowCleanConfirm] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeSchema = HOTEL_SHEET_SCHEMA[activeSchemaTab] || HOTEL_SHEET_SCHEMA[0];

  const handleTestPing = async () => {
    setIsPinging(true);
    setPingSuccess(null);
    try {
      const ok = await testFirestoreConnection();
      setPingSuccess(ok);
      setStatusMessage('Đã kết nối trực tiếp với Firestore Database! Tốc độ phản hồi cực nhanh.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e: any) {
      setPingSuccess(false);
    } finally {
      setIsPinging(false);
    }
  };

  const handleExecuteCleanReset = async () => {
    setIsCleaning(true);
    try {
      await resetFirestoreToCleanState();
      setShowCleanConfirm(false);
      setStatusMessage('Đã xóa trắng toàn bộ dữ liệu mẫu trên Firestore! Tất cả 25 phòng đã được đưa về trạng thái Trống sẵn sàng.');
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert('Lỗi làm sạch dữ liệu: ' + err.message);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleExportCSV = () => {
    // Export bookings CSV
    const headers = ['Mã Đặt Phòng', 'Số Phòng', 'Tên Khách', 'SĐT', 'Kênh', 'Ngày Đến', 'Ngày Đi', 'Số Đêm', 'Tổng Tiền', 'Phí QL 150k', 'Trạng Thái'];
    const rows = bookings.map((b) => [
      b.bookingCode,
      b.roomNumber,
      `"${b.guestName}"`,
      `"${b.guestPhone}"`,
      b.channel,
      b.checkInDate,
      b.checkOutDate,
      b.nights,
      b.totalRoomPrice,
      b.managementFee,
      b.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hotel25_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const availableRoomsCount = rooms.filter((r) => r.status === 'available').length;
  const occupiedRoomsCount = rooms.filter((r) => r.status === 'occupied').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Realtime Cloud Firestore Status */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-indigo-50/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Cơ Sở Dữ Liệu Đám Mây Firebase Firestore Realtime
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Đang Đồng Bộ Thời Gian Thực
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Toàn bộ dữ liệu 25 phòng, danh sách đặt phòng và bảng giá OTA được lưu trữ trên Firebase Firestore đám mây. 
                Khi nhiều người cùng truy cập link (lễ tân, quản lý, chủ khách sạn), mọi thao tác nhận phòng, đổi giá, trả phòng đều <strong>tự động đồng bộ tức thì cho tất cả mọi người</strong> mà không cần cấu hình file Sheet cá nhân.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleTestPing}
              disabled={isPinging}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{isPinging ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusMessage && (
          <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Live Metrics Grid */}
        <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
              <span>Quy Mô Khách Sạn</span>
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">25 Phòng</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {availableRoomsCount} trống • {occupiedRoomsCount} đang ở
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
              <span>Đơn Đặt Phòng Live</span>
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {bookings.length} Đơn
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Đồng bộ tức thời trên Firestore
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
              <span>Phí Quản Lý (+150k)</span>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-800 mt-1">
              {formatVND(settings.defaultManagementFee)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Cộng thêm trên các kênh OTA
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
              <span>Đa Người Dùng (Multi-User)</span>
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-700 mt-1">Sẵn Sàng</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Bất kỳ ai mở link đều thấy số liệu mới nhất
            </div>
          </div>
        </div>

        {/* Clean Database Action Card */}
        <div className="px-6 pb-6 md:px-8 md:pb-8">
          {!showCleanConfirm ? (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Làm Sạch Dữ Liệu Ví Dụ & Đưa Về 25 Phòng Trống Sạch
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Xóa toàn bộ các đơn đặt phòng mẫu trên Firestore và đặt toàn bộ 25 phòng về trạng thái sẵn sàng đón khách.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCleanConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa Trắng Dữ Liệu Ví Dụ</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border-2 border-rose-300 bg-rose-50/80 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Xác nhận xóa trắng dữ liệu ví dụ trên Firestore?
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Hành động này sẽ xóa toàn bộ đơn đặt phòng mẫu trên đám mây Firestore và đưa tất cả 25 phòng từ tầng 1 đến tầng 5 về trạng thái <strong>Trống (Available)</strong> cho tất cả người dùng đang mở trang web.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200">
                <button
                  type="button"
                  onClick={() => setShowCleanConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-white border border-slate-300"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCleanReset}
                  disabled={isCleaning}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs"
                >
                  {isCleaning ? 'Đang xóa...' : 'Xác Nhận Xóa Trắng Ngay'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Trường Thông Tin Dữ Liệu Chi Tiết (Data Fields Schema Viewer) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Cấu Trúc Các Trường Dữ Liệu Khách Sạn (Firestore Schema)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cấu trúc thực thể chuẩn hóa lưu trữ trực tiếp trên Firestore đám mây
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {HOTEL_SHEET_SCHEMA.map((schema, idx) => (
              <button
                key={schema.tabName}
                onClick={() => setActiveSchemaTab(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  activeSchemaTab === idx
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {schema.tabName} ({schema.fieldCount} trường)
              </button>
            ))}
          </div>
        </div>

        {/* Schema Details Table */}
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            <div>
              <span className="font-bold text-slate-900">Mô tả bảng:</span> {activeSchema.description}
            </div>
            <div className="font-semibold text-indigo-700 hidden sm:block">
              Tổng cộng {activeSchema.fieldCount} trường dữ liệu
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-4">Tên Trường (Tiếng Việt)</th>
                  <th className="py-2.5 px-4">Khóa Firestore (Field Key)</th>
                  <th className="py-2.5 px-4 w-28">Kiểu Dữ Liệu</th>
                  <th className="py-2.5 px-4">Ví Dụ Dữ Liệu Thực Tế</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeSchema.fields.map((f, i) => (
                  <tr key={f.key} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {i + 1}
                    </td>
                    <td className="py-2 px-4 font-bold text-slate-900">
                      {f.label}
                    </td>
                    <td className="py-2 px-4 font-mono text-[11px] text-indigo-600 bg-indigo-50/40 w-fit rounded">
                      {f.key}
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          f.type === 'currency'
                            ? 'bg-emerald-100 text-emerald-800'
                            : f.type === 'number'
                            ? 'bg-blue-100 text-blue-800'
                            : f.type === 'date' || f.type === 'datetime'
                            ? 'bg-amber-100 text-amber-800'
                            : f.type === 'percent'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {f.type}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-600 text-[11px]">
                      {f.example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
