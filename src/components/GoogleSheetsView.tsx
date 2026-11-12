import { useState, useEffect } from 'react';
import { Room, Booking, HotelSettings } from '../types/hotel';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Table, 
  Lock, 
  LogIn, 
  LogOut, 
  Layers, 
  Info,
  Calendar,
  Sparkles,
  Search,
  ArrowRight
} from 'lucide-react';
import { 
  googleSignIn, 
  logout, 
  getAccessToken, 
  getCurrentUser, 
  initAuth 
} from '../services/authService';
import { 
  HOTEL_SHEET_SCHEMA, 
  extractSpreadsheetId, 
  getSpreadsheetMetadata, 
  createHotelSpreadsheet, 
  exportAllToSpreadsheet, 
  importAllFromSpreadsheet,
  readSheetRange
} from '../services/googleSheetsService';

interface GoogleSheetsViewProps {
  rooms: Room[];
  bookings: Booking[];
  settings: HotelSettings;
  onUpdateRooms: (rooms: Room[]) => void;
  onUpdateBookings: (bookings: Booking[]) => void;
  onUpdateSettings: (settings: HotelSettings) => void;
}

export default function GoogleSheetsView({
  rooms,
  bookings,
  settings,
  onUpdateRooms,
  onUpdateBookings,
  onUpdateSettings,
}: GoogleSheetsViewProps) {
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Sheet connection state
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('hotel25_connected_sheet_id') || '';
  });
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [sheetTitle, setSheetTitle] = useState<string>(() => {
    return localStorage.getItem('hotel25_connected_sheet_title') || '';
  });
  const [sheetTabs, setSheetTabs] = useState<string[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('hotel25_last_sheet_sync') || '';
  });

  // UI state
  const [activeSchemaTab, setActiveSchemaTab] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Destructive confirmation modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'export' | 'import' | 'disconnect';
    title: string;
    description: string;
    confirmText: string;
  }>({
    isOpen: false,
    type: 'export',
    title: '',
    description: '',
    confirmText: '',
  });

  // Sheet live preview state
  const [previewTabName, setPreviewTabName] = useState<string>('Sơ Đồ 25 Phòng');
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Check auth on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Check spreadsheet metadata if ID is saved and token is available
  useEffect(() => {
    if (accessToken && spreadsheetId) {
      loadSheetMetadata(spreadsheetId, accessToken);
    }
  }, [accessToken, spreadsheetId]);

  const loadSheetMetadata = async (id: string, token: string) => {
    try {
      const meta = await getSpreadsheetMetadata(token, id);
      setSheetTitle(meta.title);
      setSheetTabs(meta.sheets.map((s: any) => s.title));
      localStorage.setItem('hotel25_connected_sheet_title', meta.title);
      localStorage.setItem('hotel25_connected_sheet_id', id);
    } catch (err: any) {
      console.warn('Could not load sheet meta:', err.message);
    }
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        setStatusMessage({ type: 'success', text: `Đã kết nối tài khoản Google: ${res.user.email}` });
        if (spreadsheetId) {
          loadSheetMetadata(spreadsheetId, res.accessToken);
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Đăng nhập Google thất bại.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    setStatusMessage({ type: 'info', text: 'Đã ngắt kết nối tài khoản Google.' });
  };

  // Connect existing sheet
  const handleConnectExistingSheet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sheetUrlInput.trim()) return;

    const extracted = extractSpreadsheetId(sheetUrlInput);
    if (!extracted) {
      setStatusMessage({
        type: 'error',
        text: 'Đường dẫn Google Sheet hoặc ID không hợp lệ. Vui lòng dán link đầy đủ (ví dụ: https://docs.google.com/spreadsheets/d/...)',
      });
      return;
    }

    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Vui lòng Đăng nhập Google trước khi kết nối file Sheet.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const meta = await getSpreadsheetMetadata(accessToken, extracted);
      setSpreadsheetId(extracted);
      setSheetTitle(meta.title);
      setSheetTabs(meta.sheets.map((s: any) => s.title));
      localStorage.setItem('hotel25_connected_sheet_id', extracted);
      localStorage.setItem('hotel25_connected_sheet_title', meta.title);
      setSheetUrlInput('');
      setStatusMessage({
        type: 'success',
        text: `Đã kết nối thành công với file "${meta.title}" (${meta.sheets.length} trang tính)!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Không thể kết nối với Google Sheet: ${err.message}. Đảm bảo bạn có quyền truy cập file này.`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-create new Google Sheet
  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Vui lòng Đăng nhập Google trước khi tạo file Sheet.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const created = await createHotelSpreadsheet(
        accessToken,
        settings.hotelName || 'Hotel25',
        rooms,
        bookings,
        settings
      );

      setSpreadsheetId(created.spreadsheetId);
      setSheetTitle(created.title);
      setSheetTabs(['Sơ Đồ 25 Phòng', 'Đặt Phòng & Khách Hàng', 'Bảng Giá OTA & Hoa Hồng', 'Menu Dịch Vụ & Minibar']);
      localStorage.setItem('hotel25_connected_sheet_id', created.spreadsheetId);
      localStorage.setItem('hotel25_connected_sheet_title', created.title);
      const nowStr = new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
      setLastSyncTime(nowStr);
      localStorage.setItem('hotel25_last_sheet_sync', nowStr);

      setStatusMessage({
        type: 'success',
        text: `Đã tự động tạo và xuất toàn bộ 25 phòng, đặt phòng & bảng giá OTA sang Google Sheet mới thành công!`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Lỗi khi tạo Google Sheet: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger export modal
  const promptExportData = () => {
    if (!spreadsheetId) {
      setStatusMessage({ type: 'error', text: 'Chưa có file Google Sheet nào được kết nối.' });
      return;
    }
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất dữ liệu lên Google Sheet',
      description: `Hành động này sẽ ghi đè toàn bộ dữ liệu hiện tại lên file Google Sheet "${sheetTitle}" bao gồm 25 phòng, danh sách đặt phòng, bảng tính OTA (+150k) và danh mục dịch vụ. Bạn có chắc chắn muốn tiến hành?`,
      confirmText: 'Xác nhận ghi dữ liệu',
    });
  };

  // Trigger import modal
  const promptImportData = () => {
    if (!spreadsheetId) {
      setStatusMessage({ type: 'error', text: 'Chưa có file Google Sheet nào được kết nối.' });
      return;
    }
    setConfirmModal({
      isOpen: true,
      type: 'import',
      title: 'Xác nhận tải dữ liệu từ Google Sheet về máy',
      description: `Hành động này sẽ đọc dữ liệu từ các tab của file "${sheetTitle}" và cập nhật lại danh sách phòng, trạng thái và các đơn đặt phòng trong ứng dụng. Bạn có chắc chắn muốn nạp dữ liệu?`,
      confirmText: 'Xác nhận nạp dữ liệu',
    });
  };

  // Execute confirmed action
  const handleExecuteConfirmedAction = async () => {
    const actionType = confirmModal.type;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

    if (!accessToken || !spreadsheetId) return;

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      if (actionType === 'export') {
        await exportAllToSpreadsheet(accessToken, spreadsheetId, rooms, bookings, settings);
        const nowStr = new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
        setLastSyncTime(nowStr);
        localStorage.setItem('hotel25_last_sheet_sync', nowStr);
        setStatusMessage({
          type: 'success',
          text: `Đã đồng bộ thành công dữ liệu 25 phòng và các đơn đặt phòng lên Google Sheet lúc ${nowStr}!`,
        });
      } else if (actionType === 'import') {
        const result = await importAllFromSpreadsheet(
          accessToken,
          spreadsheetId,
          rooms,
          bookings,
          settings
        );
        onUpdateRooms(result.rooms);
        onUpdateBookings(result.bookings);
        onUpdateSettings(result.settings);
        const nowStr = new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
        setLastSyncTime(nowStr);
        localStorage.setItem('hotel25_last_sheet_sync', nowStr);
        setStatusMessage({
          type: 'success',
          text: `Đã nạp thành công ${result.importedRoomsCount} phòng và ${result.importedBookingsCount} bản ghi đặt phòng từ Google Sheet!`,
        });
      } else if (actionType === 'disconnect') {
        setSpreadsheetId('');
        setSheetTitle('');
        setSheetTabs([]);
        localStorage.removeItem('hotel25_connected_sheet_id');
        localStorage.removeItem('hotel25_connected_sheet_title');
        setStatusMessage({ type: 'info', text: 'Đã hủy liên kết file Google Sheet.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Thao tác thất bại: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch live preview of a tab
  const handleLoadPreview = async (tabName: string) => {
    if (!accessToken || !spreadsheetId) return;
    setIsPreviewLoading(true);
    setPreviewTabName(tabName);
    try {
      const rows = await readSheetRange(accessToken, spreadsheetId, `'${tabName}'!A1:Z15`);
      setPreviewRows(rows);
    } catch (err: any) {
      console.warn('Could not read preview:', err.message);
      setPreviewRows([]);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const activeSchema = HOTEL_SHEET_SCHEMA[activeSchemaTab] || HOTEL_SHEET_SCHEMA[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Auth Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 via-teal-50/30 to-indigo-50/40">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Kết Nối Google Sheets & Cấu Trúc Trường Dữ Liệu
                </h2>
                {spreadsheetId ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Đã liên kết Sheet
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    Chưa kết nối file
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Đồng bộ 2 chiều dữ liệu 25 phòng, sổ lưu trú khách hàng, phụ phí quản lý 150k và bảng giá OTA trực tiếp với file Google Sheet của bạn trên Google Drive.
              </p>
            </div>
          </div>

          {/* Google Sign-in / User Profile */}
          <div className="shrink-0 w-full sm:w-auto">
            {!currentUser ? (
              <button
                onClick={handleSignIn}
                disabled={authLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-sm shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{authLoading ? 'Đang kết nối...' : 'Đăng nhập Google'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google'}
                    className="w-9 h-9 rounded-full ring-2 ring-emerald-500/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'G'}
                  </div>
                )}
                <div className="text-left text-xs">
                  <div className="font-bold text-slate-900 leading-tight">
                    {currentUser.displayName || 'Tài khoản Google'}
                  </div>
                  <div className="text-slate-500 text-[11px] truncate max-w-[160px]">
                    {currentUser.email}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Đăng xuất Google"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`px-6 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-b border-rose-200'
                : 'bg-indigo-50 text-indigo-800 border-b border-indigo-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Connected Sheet Information & Actions */}
        <div className="p-6 md:p-8 space-y-6">
          {spreadsheetId ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  File Google Sheet đang kết nối
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">{sheetTitle || 'Hotel25 Google Sheet'}</h3>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                  >
                    Mở trên Google Sheets
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3 pt-1">
                  <span>Mã file: <code className="text-slate-700 font-mono text-[11px] bg-slate-200/70 px-1 rounded">{spreadsheetId.slice(0, 12)}...{spreadsheetId.slice(-6)}</code></span>
                  {lastSyncTime && (
                    <span className="flex items-center gap-1 text-slate-600">
                      <RefreshCw className="w-3 h-3 text-slate-400" />
                      Đồng bộ gần nhất: {lastSyncTime}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={promptExportData}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Xuất Lên Sheet</span>
                </button>

                <button
                  onClick={promptImportData}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Nạp Về Ứng Dụng</span>
                </button>

                <button
                  onClick={() =>
                    setConfirmModal({
                      isOpen: true,
                      type: 'disconnect',
                      title: 'Ngắt liên kết Google Sheet',
                      description: 'Bạn có chắc chắn muốn ngắt liên kết với file Google Sheet này? Dữ liệu trên file và trên ứng dụng sẽ không bị xóa.',
                      confirmText: 'Ngắt kết nối',
                    })
                  }
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
                  title="Hủy liên kết file này"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: 1-Click Auto Create */}
              <div className="p-5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Cách 1: Tự Động Tạo File Mới (Khuyên dùng)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Hệ thống sẽ tự động khởi tạo 1 file Google Sheet mới trong Google Drive của bạn, với đầy đủ 4 tab chuẩn hóa: Sơ đồ 25 phòng, Sổ đặt phòng & khách hàng, Bảng tính giá OTA (+150k) và Menu dịch vụ.
                  </p>
                </div>
                <button
                  onClick={handleCreateNewSheet}
                  disabled={isProcessing || !currentUser}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isProcessing ? 'Đang tạo Sheet...' : 'Tự Động Tạo Google Sheet Mẫu'}</span>
                </button>
              </div>

              {/* Option B: Connect Existing */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    Cách 2: Dán Link Google Sheet Có Sẵn
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Nếu bạn đã có sẵn file quản lý khách sạn trên Google Drive, hãy dán liên kết chia sẻ hoặc Spreadsheet ID vào ô bên dưới:
                  </p>
                  <form onSubmit={handleConnectExistingSheet} className="space-y-2.5">
                    <input
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0X..."
                      value={sheetUrlInput}
                      onChange={(e) => setSheetUrlInput(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    />
                    <button
                      type="submit"
                      disabled={isProcessing || !sheetUrlInput.trim() || !currentUser}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>{isProcessing ? 'Đang kiểm tra...' : 'Kết Nối File Google Sheet'}</span>
                    </button>
                  </form>
                </div>
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
                Danh Mục Các Trường Thông Tin Dữ Liệu
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Toàn bộ các cột và cấu trúc trường thông tin được map tương thích hoàn toàn với Google Sheets
            </p>
          </div>

          {/* Tab Selector for 4 Tables */}
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
                {schema.tabName} ({schema.fieldCount} cột)
              </button>
            ))}
          </div>
        </div>

        {/* Schema Details */}
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
                  <th className="py-2.5 px-4">Tên Cột (Trên Google Sheet)</th>
                  <th className="py-2.5 px-4">Mã Trường (Key)</th>
                  <th className="py-2.5 px-4 w-28">Kiểu Dữ Liệu</th>
                  <th className="py-2.5 px-4">Ví Dụ Thực Tế</th>
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

      {/* Section 3: Xem Trước Dữ Liệu Trực Tiếp Từ Sheet (Khi Đã Kết Nối) */}
      {spreadsheetId && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Xem Trước Trực Tiếp Dữ Liệu Trong File Google Sheet
                </h3>
                <p className="text-xs text-slate-500">
                  Đọc thời gian thực các dòng dữ liệu đang lưu trên Google Sheet của bạn
                </p>
              </div>
            </div>

            {/* Tab switch */}
            <div className="flex items-center gap-2">
              <select
                value={previewTabName}
                onChange={(e) => {
                  setPreviewTabName(e.target.value);
                  handleLoadPreview(e.target.value);
                }}
                className="text-xs font-semibold px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none"
              >
                {sheetTabs.length > 0 ? (
                  sheetTabs.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Sơ Đồ 25 Phòng">Sơ Đồ 25 Phòng</option>
                    <option value="Đặt Phòng & Khách Hàng">Đặt Phòng & Khách Hàng</option>
                    <option value="Bảng Giá OTA & Hoa Hồng">Bảng Giá OTA & Hoa Hồng</option>
                    <option value="Menu Dịch Vụ & Minibar">Menu Dịch Vụ & Minibar</option>
                  </>
                )}
              </select>

              <button
                onClick={() => handleLoadPreview(previewTabName)}
                disabled={isPreviewLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPreviewLoading ? 'animate-spin' : ''}`} />
                <span>Tải dữ liệu</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {isPreviewLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 text-slate-400 animate-spin mx-auto mb-2" />
                Đang nạp các dòng dữ liệu từ Google Sheet...
              </div>
            ) : previewRows.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                Nhấn <strong>"Tải dữ liệu"</strong> hoặc chọn tab bên trên để đọc các dòng từ Sheet.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold sticky top-0 border-b border-slate-200 shadow-2xs">
                      {previewRows[0]?.map((col: any, idx: number) => (
                        <th key={idx} className="py-2 px-3 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.slice(1).map((row: any[], rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-50/70">
                        {row.map((val: any, cIdx: number) => (
                          <td key={cIdx} className="py-2 px-3 whitespace-nowrap text-slate-700">
                            {String(val || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Destructive Action Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {confirmModal.title}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {confirmModal.description}
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExecuteConfirmedAction}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all ${
                  confirmModal.type === 'disconnect'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
