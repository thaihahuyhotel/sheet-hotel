import { useState } from 'react';
import { ROOM_TYPES, CHANNELS } from '../data/initialData';
import { BookingChannel, HotelSettings } from '../types/hotel';
import { calculateOtaPrice, formatVND, PriceBreakdown } from '../utils/pricing';
import { Calculator, Check, Copy, Info, Sparkles, TrendingUp, Sliders, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';

interface OtaPricingCalculatorProps {
  settings: HotelSettings;
  onUpdateSettings: (newSettings: HotelSettings) => void;
  onSelectBookingForRoom?: (roomType: string, channel: BookingChannel) => void;
}

export default function OtaPricingCalculator({
  settings,
  onUpdateSettings,
}: OtaPricingCalculatorProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [managementFeeInput, setManagementFeeInput] = useState<number>(settings.defaultManagementFee);
  const [commissions, setCommissions] = useState<Record<BookingChannel, number>>(settings.channelCommissions);
  const [formula, setFormula] = useState<'net_guaranteed' | 'simple_markup'>(settings.pricingFormula);
  const [activeTab, setActiveTab] = useState<'matrix' | 'cards' | 'simulator'>('matrix');

  // Simulator state
  const [simBasePrice, setSimBasePrice] = useState<number>(800000);
  const [simChannel, setSimChannel] = useState<BookingChannel>('agoda');
  const [simCommission, setSimCommission] = useState<number>(15);

  const roomTypeKeys = Object.keys(ROOM_TYPES);
  const channelKeys: BookingChannel[] = ['direct', 'agoda', 'booking', 'trip', 'airbnb'];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveSettings = () => {
    onUpdateSettings({
      ...settings,
      defaultManagementFee: managementFeeInput,
      channelCommissions: commissions,
      pricingFormula: formula,
    });
  };

  const updateCommission = (channel: BookingChannel, percent: number) => {
    const updated = { ...commissions, [channel]: percent / 100 };
    setCommissions(updated);
    onUpdateSettings({
      ...settings,
      channelCommissions: updated,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-3 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            Công thức giá OTA & Phí Quản Lý
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Bảng Tính Giá Niêm Yết Kênh OTA (+150.000₫ Phí Quản Lý)
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Quy tắc chuẩn: <span className="text-amber-300 font-semibold">Khi sàn OTA đã trừ % hoa hồng</span> (Agoda, Booking.com, Trip.com, Airbnb), số tiền chuyển về tài khoản khách sạn sẽ được <span className="text-emerald-300 font-semibold">bảo toàn giá gốc trực tiếp + cộng thêm đúng 150.000₫ phí quản lý</span>.
          </p>

          {/* Key formula summary pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
              <span className="text-xs text-slate-300 block">Phí quản lý áp dụng</span>
              <span className="text-lg font-bold text-amber-300">{formatVND(managementFeeInput)}</span>
              <span className="text-[11px] text-slate-300 block">/ phòng / đêm</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
              <span className="text-xs text-slate-300 block">Công thức niêm yết</span>
              <span className="text-sm font-bold text-emerald-300 truncate block">
                {formula === 'net_guaranteed' ? '(Giá gốc + 150k) ÷ (1 - % Hoa hồng)' : '(Giá gốc ÷ [1 - %]) + 150k'}
              </span>
              <span className="text-[11px] text-slate-300 block">Đảm bảo thực nhận về tài khoản</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
              <span className="text-xs text-slate-300 block">Quy mô khách sạn</span>
              <span className="text-lg font-bold text-white">25 Phòng · 4 Hạng phòng</span>
              <span className="text-[11px] text-slate-300 block">Standard, VIP 501, Deluxe 505, Family</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">Tùy chỉnh thông số tính giá</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'matrix' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bảng so sánh tổng hợp
              </button>
              <button
                onClick={() => setActiveTab('cards')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'cards' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chi tiết từng hạng phòng
              </button>
              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'simulator' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mô phỏng tùy biến giá
              </button>
            </div>
          </div>
        </div>

        {/* Setting sliders and controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-5 pt-4 border-t border-slate-100">
          {/* Management fee */}
          <div className="lg:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Phí quản lý cộng thêm (VNĐ)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="10000"
                min="0"
                value={managementFeeInput}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setManagementFeeInput(val);
                  onUpdateSettings({ ...settings, defaultManagementFee: val });
                }}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap font-medium">/ đêm</span>
            </div>
          </div>

          {/* Agoda commission */}
          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200/60">
            <label className="text-xs font-semibold text-blue-900 block mb-1">
              Hoa hồng Agoda
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="50"
                value={Math.round((commissions.agoda || 0.15) * 100)}
                onChange={(e) => updateCommission('agoda', Number(e.target.value))}
                className="w-16 bg-white border border-blue-300 rounded px-2 py-1 text-sm font-bold text-blue-800 text-center"
              />
              <span className="text-xs text-blue-800 font-semibold">%</span>
            </div>
          </div>

          {/* Booking.com commission */}
          <div className="bg-sky-50/50 p-3 rounded-lg border border-sky-200/60">
            <label className="text-xs font-semibold text-sky-900 block mb-1">
              Hoa hồng Booking
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="50"
                value={Math.round((commissions.booking || 0.15) * 100)}
                onChange={(e) => updateCommission('booking', Number(e.target.value))}
                className="w-16 bg-white border border-sky-300 rounded px-2 py-1 text-sm font-bold text-sky-800 text-center"
              />
              <span className="text-xs text-sky-800 font-semibold">%</span>
            </div>
          </div>

          {/* Trip.com commission */}
          <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-200/60">
            <label className="text-xs font-semibold text-orange-900 block mb-1">
              Hoa hồng Trip.com
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="50"
                value={Math.round((commissions.trip || 0.15) * 100)}
                onChange={(e) => updateCommission('trip', Number(e.target.value))}
                className="w-16 bg-white border border-orange-300 rounded px-2 py-1 text-sm font-bold text-orange-800 text-center"
              />
              <span className="text-xs text-orange-800 font-semibold">%</span>
            </div>
          </div>

          {/* Airbnb commission */}
          <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-200/60">
            <label className="text-xs font-semibold text-rose-900 block mb-1">
              Hoa hồng Airbnb
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="50"
                value={Math.round((commissions.airbnb || 0.14) * 100)}
                onChange={(e) => updateCommission('airbnb', Number(e.target.value))}
                className="w-16 bg-white border border-rose-300 rounded px-2 py-1 text-sm font-bold text-rose-800 text-center"
              />
              <span className="text-xs text-rose-800 font-semibold">%</span>
            </div>
          </div>
        </div>

        {/* Formula Toggle */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Cách tính giá niêm yết:</span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="formula"
                checked={formula === 'net_guaranteed'}
                onChange={() => {
                  setFormula('net_guaranteed');
                  onUpdateSettings({ ...settings, pricingFormula: 'net_guaranteed' });
                }}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 font-medium">
                Bảo toàn thực nhận <strong className="text-indigo-600">(Khuyên dùng: Thực nhận = Giá gốc + 150k)</strong>
              </span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="formula"
                checked={formula === 'simple_markup'}
                onChange={() => {
                  setFormula('simple_markup');
                  onUpdateSettings({ ...settings, pricingFormula: 'simple_markup' });
                }}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700">Cộng dồn phí sau chiết khấu (Giá ÷ [1 - %] + 150k)</span>
            </label>
          </div>
        </div>
      </div>

      {/* TAB 1: MASTER COMPARISON MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Bảng So Sánh Giá Niêm Yết & Thực Nhận Theo Hạng Phòng</h2>
              <p className="text-xs text-slate-500">
                Giá niêm yết là số tiền cài đặt trên Extranet sàn. Số tiền thực nhận là tiền về tài khoản ngân hàng sau khi sàn đã trừ hoa hồng.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Đảm bảo thêm 150k phí quản lý
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Hạng Phòng & Cấu Hình</th>
                  <th className="py-3 px-3 bg-emerald-50/70 text-emerald-900 border-x border-emerald-200/60">
                    <div className="flex items-center gap-1">
                      <span>Trực Tiếp</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-mono">0%</span>
                    </div>
                  </th>
                  <th className="py-3 px-3 bg-blue-50/60 text-blue-900 border-r border-blue-200/50">
                    <div className="flex items-center gap-1">
                      <span>Agoda</span>
                      <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded font-mono">
                        {Math.round((commissions.agoda || 0.15) * 100)}%
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-3 bg-sky-50/60 text-sky-950 border-r border-sky-200/50">
                    <div className="flex items-center gap-1">
                      <span>Booking.com</span>
                      <span className="text-[10px] bg-sky-200 text-sky-800 px-1.5 py-0.2 rounded font-mono">
                        {Math.round((commissions.booking || 0.15) * 100)}%
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-3 bg-orange-50/60 text-orange-950 border-r border-orange-200/50">
                    <div className="flex items-center gap-1">
                      <span>Trip.com</span>
                      <span className="text-[10px] bg-orange-200 text-orange-800 px-1.5 py-0.2 rounded font-mono">
                        {Math.round((commissions.trip || 0.15) * 100)}%
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-3 bg-rose-50/60 text-rose-950">
                    <div className="flex items-center gap-1">
                      <span>Airbnb</span>
                      <span className="text-[10px] bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded font-mono">
                        {Math.round((commissions.airbnb || 0.14) * 100)}%
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {roomTypeKeys.map((typeKey) => {
                  const roomType = ROOM_TYPES[typeKey];
                  return (
                    <tr key={typeKey} className="hover:bg-slate-50/80 transition-colors">
                      {/* Room info */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{roomType.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>🛏️ {roomType.bedDescription}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-700">{roomType.totalRoomsCount} phòng</span>
                        </div>
                      </td>

                      {/* Direct Price */}
                      <td className="py-4 px-3 bg-emerald-50/30 border-x border-emerald-100">
                        <div className="font-extrabold text-emerald-700 text-base">
                          {formatVND(roomType.directPrice)}
                        </div>
                        <div className="text-[11px] text-emerald-600">Thực nhận 100%</div>
                      </td>

                      {/* Channels */}
                      {(['agoda', 'booking', 'trip', 'airbnb'] as BookingChannel[]).map((channel) => {
                        const rate = commissions[channel] ?? 0.15;
                        const data = calculateOtaPrice(
                          roomType.directPrice,
                          channel,
                          rate,
                          managementFeeInput,
                          formula,
                          settings.roundingMethod
                        );
                        const copyKey = `${typeKey}-${channel}`;

                        return (
                          <td key={channel} className="py-4 px-3 border-r border-slate-100 last:border-none">
                            <div className="flex items-center justify-between gap-1">
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                                  Niêm yết:
                                </span>
                                <span className="font-bold text-slate-900 text-base">
                                  {formatVND(data.listedPrice)}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopy(data.listedPrice.toString(), copyKey)}
                                title="Sao chép giá niêm yết"
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                              >
                                {copiedKey === copyKey ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="mt-1 pt-1 border-t border-slate-100 text-[11px] space-y-0.5">
                              <div className="text-slate-400 flex justify-between">
                                <span>Trừ sàn ({Math.round(rate * 100)}%):</span>
                                <span className="text-rose-500 font-medium">-{formatVND(data.commissionAmount)}</span>
                              </div>
                              <div className="flex justify-between font-semibold text-emerald-700 bg-emerald-50/80 px-1 py-0.5 rounded">
                                <span>Thực nhận:</span>
                                <span>{formatVND(data.netPayout)}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 flex justify-between">
                                <span>Dôi dư (+150k):</span>
                                <span className="text-amber-600 font-bold">+{formatVND(data.profitDelta)}</span>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                <strong>Mẹo extranet:</strong> Bạn chỉ cần copy cột <strong>Giá Niêm Yết</strong> để nhập vào lịch bán phòng trên Agoda YCS, Booking Extranet, Trip e-Booking hoặc Airbnb!
              </span>
            </div>
            <div className="text-slate-500 text-[11px]">
              Tự động làm tròn đến hàng nghìn đồng ({settings.roundingMethod === '1000' ? '1.000₫' : '10.000₫'})
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED CARDS VIEW */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {roomTypeKeys.map((typeKey) => {
            const roomType = ROOM_TYPES[typeKey];
            return (
              <div key={typeKey} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Room Header */}
                <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
                        {roomType.badgeName}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">{roomType.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        🛏️ {roomType.bedDescription} • Tiêu chuẩn {roomType.capacity.adults} người lớn • Số lượng {roomType.totalRoomsCount} phòng
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block uppercase font-medium">Giá trực tiếp</span>
                      <span className="text-xl font-black text-emerald-600">{formatVND(roomType.directPrice)}</span>
                      <span className="text-[10px] text-slate-400 block">/ đêm</span>
                    </div>
                  </div>
                </div>

                {/* OTA Breakdown List */}
                <div className="p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Giá niêm yết trên các kênh (+150k phí quản lý sau trừ % sàn)
                  </h4>

                  {(['agoda', 'booking', 'trip', 'airbnb'] as BookingChannel[]).map((channel) => {
                    const channelInfo = CHANNELS[channel];
                    const rate = commissions[channel] ?? 0.15;
                    const data = calculateOtaPrice(
                      roomType.directPrice,
                      channel,
                      rate,
                      managementFeeInput,
                      formula,
                      settings.roundingMethod
                    );
                    const copyKey = `card-${typeKey}-${channel}`;

                    return (
                      <div
                        key={channel}
                        className="p-3 rounded-lg border border-slate-100 hover:border-slate-300 bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${channelInfo.bgColor}`}>
                              {channelInfo.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              Hoa hồng sàn: <strong className="text-slate-700">{Math.round(rate * 100)}%</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-xs text-slate-400 mr-1">Niêm yết:</span>
                              <span className="font-extrabold text-slate-900 text-base">
                                {formatVND(data.listedPrice)}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopy(data.listedPrice.toString(), copyKey)}
                              className="p-1.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-md text-slate-500 hover:text-indigo-600 transition-colors"
                              title="Sao chép giá niêm yết"
                            >
                              {copiedKey === copyKey ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Math Breakdown Flow */}
                        <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-slate-200/60 text-slate-600">
                          <div>
                            <span className="text-slate-400 block">Sàn trừ:</span>
                            <span className="font-medium text-rose-600">-{formatVND(data.commissionAmount)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Thực nhận về:</span>
                            <span className="font-bold text-emerald-700">{formatVND(data.netPayout)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Tiền về túi gồm:</span>
                            <span className="font-medium text-slate-800">
                              {formatVND(roomType.directPrice)} + <strong className="text-amber-600">150k</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: SIMULATOR & ARITHMETIC EXPLAINER */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulator Calculator Form */}
          <div className="lg:col-span-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full mb-2">
                <Calculator className="w-3.5 h-3.5" />
                Công cụ kiểm tra nhanh
              </div>
              <h3 className="text-lg font-bold text-slate-900">Mô Phỏng Tính Giá Bất Kỳ</h3>
              <p className="text-xs text-slate-500">
                Thử nghiệm với bất kỳ mức giá phòng gốc hoặc % hoa hồng nào để xem bảng phân tích tức thì.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Giá phòng đặt trực tiếp (VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50000"
                    value={simBasePrice}
                    onChange={(e) => setSimBasePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="text-xs text-slate-400 mt-1 flex gap-2">
                    <button
                      onClick={() => setSimBasePrice(800000)}
                      className="hover:underline text-indigo-600 font-medium"
                    >
                      Standard (800k)
                    </button>
                    •
                    <button
                      onClick={() => setSimBasePrice(1000000)}
                      className="hover:underline text-indigo-600 font-medium"
                    >
                      VIP (1.000k)
                    </button>
                    •
                    <button
                      onClick={() => setSimBasePrice(1100000)}
                      className="hover:underline text-indigo-600 font-medium"
                    >
                      Deluxe (1.100k)
                    </button>
                    •
                    <button
                      onClick={() => setSimBasePrice(1200000)}
                      className="hover:underline text-indigo-600 font-medium"
                    >
                      Family (1.200k)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Kênh OTA</label>
                  <select
                    value={simChannel}
                    onChange={(e) => {
                      const ch = e.target.value as BookingChannel;
                      setSimChannel(ch);
                      if (ch !== 'direct') {
                        setSimCommission(Math.round((commissions[ch] ?? 0.15) * 100));
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800"
                  >
                    <option value="agoda">Agoda</option>
                    <option value="booking">Booking.com</option>
                    <option value="trip">Trip.com</option>
                    <option value="airbnb">Airbnb</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Hoa hồng sàn (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={simCommission}
                    onChange={(e) => setSimCommission(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Simulated Result Card */}
            {(() => {
              const simResult = calculateOtaPrice(
                simBasePrice,
                simChannel,
                simCommission / 100,
                managementFeeInput,
                formula,
                settings.roundingMethod
              );

              return (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                      Giá Cần Đăng Bán Trên {CHANNELS[simChannel].name}
                    </span>
                    <button
                      onClick={() => handleCopy(simResult.listedPrice.toString(), 'sim-copy')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-50"
                    >
                      {copiedKey === 'sim-copy' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Sao chép
                    </button>
                  </div>

                  <div className="text-3xl font-black text-indigo-950">
                    {formatVND(simResult.listedPrice)}
                    <span className="text-xs font-medium text-slate-500 ml-2">/ đêm</span>
                  </div>

                  <div className="space-y-2 text-xs bg-white/80 backdrop-blur rounded-lg p-3 border border-indigo-100">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Khách thanh toán trên sàn:</span>
                      <span className="font-bold text-slate-900">{formatVND(simResult.listedPrice)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Sàn giữ lại {simCommission}% hoa hồng:</span>
                      <span className="font-bold text-rose-600">-{formatVND(simResult.commissionAmount)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Sàn chuyển vào tài khoản khách sạn:</span>
                      <span className="font-black text-emerald-700 text-sm">{formatVND(simResult.netPayout)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-emerald-800 font-semibold bg-emerald-50 px-2 rounded">
                      <span>Bao gồm: Giá gốc ({formatVND(simBasePrice)}) + Phí quản lý:</span>
                      <span className="text-amber-700 font-bold">+{formatVND(simResult.profitDelta)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Detailed Arithmetic Explainer Card */}
          <div className="lg:col-span-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              Giải thích cơ chế toán học
            </div>
            <h3 className="text-lg font-bold text-slate-900">Tại Sao Khách Sạn Không Bị Lỗ Khi Bán Qua OTA?</h3>

            <div className="prose prose-sm text-slate-600 space-y-3 text-xs sm:text-sm leading-relaxed">
              <p>
                Nhiều khách sạn mắc sai lầm khi chỉ đơn giản lấy <em>Giá trực tiếp + 150.000₫</em> rồi đăng lên OTA. Khi đó, sàn OTA sẽ trừ 15% trên toàn bộ số tiền đó, dẫn đến khách sạn thực nhận bị hụt đi một phần tiền quản lý.
              </p>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-xs block uppercase">Công thức chuẩn đảm bảo không hụt tiền:</span>
                <div className="font-mono bg-white p-3 rounded-lg border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold text-center">
                  Giá Niêm Yết = (Giá Trực Tiếp + 150.000₫) ÷ (1 - % Hoa Hồng Sàn)
                </div>
                <div className="text-[11px] text-slate-500">
                  Ví dụ phòng Standard: (800.000 + 150.000) ÷ (1 - 0.15) = 950.000 ÷ 0.85 = <strong>1.117.647₫</strong> (làm tròn 1.118.000₫).
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-semibold text-slate-800 text-xs uppercase">Kiểm chứng dòng tiền:</div>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                  <li>Khách đặt trên Agoda trả: <strong>1.118.000₫</strong></li>
                  <li>Agoda trừ 15% hoa hồng: <strong>167.700₫</strong></li>
                  <li>Agoda chuyển khoản cho khách sạn: 1.118.000 - 167.700 = <strong>950.300₫</strong></li>
                  <li>
                    Kết quả: Khách sạn thu về trọn vẹn <strong>800.000₫</strong> tiền phòng + <strong>150.300₫</strong> phí quản lý đúng theo yêu cầu!
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
