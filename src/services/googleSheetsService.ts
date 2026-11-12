import { Room, Booking, HotelSettings, BookingChannel, RoomStatus, RoomType, BookingServiceItem } from '../types/hotel';
import { ROOM_TYPES, CHANNELS } from '../data/initialData';
import { calculateOtaPrice } from '../utils/pricing';

export interface SheetFieldMapping {
  tabName: string;
  fieldCount: number;
  description: string;
  fields: { key: string; label: string; type: string; example: string }[];
}

export const HOTEL_SHEET_SCHEMA: SheetFieldMapping[] = [
  {
    tabName: 'Sơ Đồ 25 Phòng',
    fieldCount: 10,
    description: 'Danh sách toàn bộ 25 phòng từ tầng 1 đến tầng 5, loại phòng và tình trạng phòng thời gian thực.',
    fields: [
      { key: 'id', label: 'Mã phòng', type: 'string', example: '101' },
      { key: 'number', label: 'Số phòng', type: 'string', example: '101' },
      { key: 'floor', label: 'Tầng', type: 'number', example: '1' },
      { key: 'type', label: 'Loại phòng', type: 'string', example: 'standard_single' },
      { key: 'bedDescription', label: 'Mô tả giường', type: 'string', example: 'Giường 1,6 m' },
      { key: 'directPrice', label: 'Giá bán trực tiếp (VNĐ)', type: 'currency', example: '800,000' },
      { key: 'status', label: 'Trạng thái', type: 'string', example: 'occupied | available | cleaning | reserved' },
      { key: 'currentBookingId', label: 'Mã đặt phòng hiện tại', type: 'string', example: 'bk-01' },
      { key: 'cleaningNote', label: 'Ghi chú dọn dẹp', type: 'string', example: 'Khách vừa check-out' },
      { key: 'lastCleanedAt', label: 'Lần dọn gần nhất', type: 'string', example: '12:30' },
    ],
  },
  {
    tabName: 'Đặt Phòng & Khách Hàng',
    fieldCount: 26,
    description: 'Sổ lưu trú khách hàng, chi tiết đặt phòng, tính toán hoa hồng OTA và phụ phí quản lý 150k/đêm.',
    fields: [
      { key: 'bookingCode', label: 'Mã đặt phòng', type: 'string', example: 'BK-101-AGO' },
      { key: 'roomNumber', label: 'Số phòng', type: 'string', example: '101' },
      { key: 'roomType', label: 'Loại phòng', type: 'string', example: 'standard_single' },
      { key: 'guestName', label: 'Tên khách hàng', type: 'string', example: 'Nguyễn Văn Minh' },
      { key: 'guestPhone', label: 'Số điện thoại', type: 'string', example: '0912 345 678' },
      { key: 'guestIdCard', label: 'CCCD / Hộ chiếu', type: 'string', example: '079095001234' },
      { key: 'channel', label: 'Kênh đặt phòng', type: 'string', example: 'agoda | direct | booking | trip | airbnb' },
      { key: 'channelBookingRef', label: 'Mã tham chiếu OTA', type: 'string', example: 'AGD-8829104' },
      { key: 'checkInDate', label: 'Ngày nhận phòng', type: 'date', example: '2026-11-03' },
      { key: 'checkOutDate', label: 'Ngày trả phòng', type: 'date', example: '2026-11-05' },
      { key: 'nights', label: 'Số đêm ở', type: 'number', example: '2' },
      { key: 'roomPricePerNight', label: 'Giá phòng/đêm (VNĐ)', type: 'currency', example: '1,118,000' },
      { key: 'totalRoomPrice', label: 'Tổng tiền phòng (VNĐ)', type: 'currency', example: '2,236,000' },
      { key: 'managementFee', label: 'Phí quản lý OTA 150k (VNĐ)', type: 'currency', example: '300,000' },
      { key: 'otaCommissionRate', label: 'Tỉ lệ hoa hồng OTA', type: 'percent', example: '15%' },
      { key: 'otaCommissionAmount', label: 'Tiền hoa hồng OTA (VNĐ)', type: 'currency', example: '335,400' },
      { key: 'servicesTotal', label: 'Tiền dịch vụ (VNĐ)', type: 'currency', example: '30,000' },
      { key: 'servicesDetail', label: 'Chi tiết dịch vụ & Minibar', type: 'string', example: 'Nước suối Lavie (x2)' },
      { key: 'deposit', label: 'Tiền cọc trước (VNĐ)', type: 'currency', example: '500,000' },
      { key: 'discount', label: 'Giảm giá (VNĐ)', type: 'currency', example: '0' },
      { key: 'grandTotal', label: 'Tổng thanh toán (VNĐ)', type: 'currency', example: '2,266,000' },
      { key: 'status', label: 'Trạng thái đặt phòng', type: 'string', example: 'active | reserved | completed | cancelled' },
      { key: 'paymentMethod', label: 'Hình thức thanh toán', type: 'string', example: 'ota_collect | transfer | cash | card' },
      { key: 'notes', label: 'Ghi chú đặc biệt', type: 'string', example: 'Yêu cầu phòng yên tĩnh' },
      { key: 'createdAt', label: 'Thời gian tạo', type: 'datetime', example: '2026-11-02 09:15' },
      { key: 'checkedOutAt', label: 'Thời gian trả phòng', type: 'datetime', example: '2026-11-05 11:30' },
    ],
  },
  {
    tabName: 'Bảng Giá OTA & Hoa Hồng',
    fieldCount: 14,
    description: 'Bảng quy chuẩn tính giá phòng bán trên các kênh OTA kèm phụ phí quản lý 150k theo công thức chuẩn Net Guaranteed.',
    fields: [
      { key: 'typeId', label: 'Mã loại phòng', type: 'string', example: 'standard_single' },
      { key: 'typeName', label: 'Tên loại phòng', type: 'string', example: 'Phòng Standard (1 Giường)' },
      { key: 'bedDescription', label: 'Quy cách giường', type: 'string', example: 'Giường 1,6 m' },
      { key: 'directPrice', label: 'Giá bán trực tiếp (VNĐ)', type: 'currency', example: '800,000' },
      { key: 'managementFee', label: 'Phí quản lý (+150k/đêm)', type: 'currency', example: '150,000' },
      { key: 'netTarget', label: 'Net kỳ vọng thu về (VNĐ)', type: 'currency', example: '950,000' },
      { key: 'agodaComm', label: 'Hoa hồng Agoda (15%)', type: 'percent', example: '15%' },
      { key: 'agodaPrice', label: 'Giá niêm yết Agoda (VNĐ)', type: 'currency', example: '1,118,000' },
      { key: 'bookingComm', label: 'Hoa hồng Booking.com (15%)', type: 'percent', example: '15%' },
      { key: 'bookingPrice', label: 'Giá niêm yết Booking (VNĐ)', type: 'currency', example: '1,118,000' },
      { key: 'tripComm', label: 'Hoa hồng Trip.com (15%)', type: 'percent', example: '15%' },
      { key: 'tripPrice', label: 'Giá niêm yết Trip.com (VNĐ)', type: 'currency', example: '1,118,000' },
      { key: 'airbnbComm', label: 'Hoa hồng Airbnb (14%)', type: 'percent', example: '14%' },
      { key: 'airbnbPrice', label: 'Giá niêm yết Airbnb (VNĐ)', type: 'currency', example: '1,105,000' },
    ],
  },
  {
    tabName: 'Menu Dịch Vụ & Minibar',
    fieldCount: 6,
    description: 'Danh mục dịch vụ minibar, giặt ủi, thuê xe và phụ thu hỗ trợ tự động tính hóa đơn.',
    fields: [
      { key: 'id', label: 'Mã dịch vụ', type: 'string', example: 'srv-cfg-1' },
      { key: 'name', label: 'Tên dịch vụ / hàng hóa', type: 'string', example: 'Nước suối Lavie 500ml' },
      { key: 'category', label: 'Nhóm danh mục', type: 'string', example: 'minibar | laundry | rental | surcharge' },
      { key: 'unit', label: 'Đơn vị tính', type: 'string', example: 'chai' },
      { key: 'price', label: 'Đơn giá (VNĐ)', type: 'currency', example: '15,000' },
      { key: 'isActive', label: 'Đang áp dụng', type: 'boolean', example: 'TRUE' },
    ],
  },
];

export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Regex to extract ID from standard Google Sheets URLs
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  // If user pasted raw spreadsheet ID (usually 44 chars)
  if (/^[a-zA-Z0-9-_]{20,70}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Fetch spreadsheet metadata to get title and tab names
 */
export async function getSpreadsheetMetadata(accessToken: string, spreadsheetId: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Lỗi truy cập Google Sheets (${response.status})`);
  }

  const data = await response.json();
  const title = data.properties?.title || 'Google Sheet Khách Sạn';
  const sheets = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId,
    title: s.properties?.title,
    index: s.properties?.index,
  }));

  return { spreadsheetId, title, sheets };
}

/**
 * Create a brand new Google Spreadsheet pre-configured with 4 tabs and all hotel fields
 */
export async function createHotelSpreadsheet(
  accessToken: string,
  hotelName: string,
  rooms: Room[],
  bookings: Booking[],
  settings: HotelSettings
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> {
  const title = `${hotelName} - Quản Lý Khách Sạn & Kênh OTA (${new Date().toLocaleDateString('vi-VN')})`;

  const createBody = {
    properties: {
      title,
      locale: 'vi_VN',
      timeZone: 'Asia/Ho_Chi_Minh',
    },
    sheets: [
      { properties: { title: 'Sơ Đồ 25 Phòng', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Đặt Phòng & Khách Hàng', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Bảng Giá OTA & Hoa Hồng', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Menu Dịch Vụ & Minibar', gridProperties: { frozenRowCount: 1 } } },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createBody),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Không thể tạo Google Sheet (${response.status})`);
  }

  const created = await response.json();
  const spreadsheetId = created.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Populate data into the newly created spreadsheet
  await exportAllToSpreadsheet(accessToken, spreadsheetId, rooms, bookings, settings);

  return { spreadsheetId, spreadsheetUrl, title };
}

/**
 * Format rooms data into rows for Google Sheet
 */
function buildRoomsRows(rooms: Room[]): any[][] {
  const headers = [
    'Mã phòng',
    'Số phòng',
    'Tầng',
    'Loại phòng',
    'Mô tả giường',
    'Giá trực tiếp (VNĐ)',
    'Trạng thái',
    'Mã đặt phòng hiện tại',
    'Ghi chú dọn dẹp',
    'Lần dọn gần nhất',
  ];

  const rows = rooms.map((r) => [
    r.id,
    r.number,
    r.floor,
    ROOM_TYPES[r.type]?.name || r.type,
    r.bedDescription,
    r.directPrice,
    r.status === 'occupied'
      ? 'Đang ở'
      : r.status === 'available'
      ? 'Trống'
      : r.status === 'reserved'
      ? 'Đã đặt'
      : r.status === 'cleaning'
      ? 'Cần dọn'
      : 'Bảo trì',
    r.currentBookingId || '',
    r.cleaningNote || '',
    r.lastCleanedAt || '',
  ]);

  return [headers, ...rows];
}

/**
 * Format bookings data into rows for Google Sheet
 */
function buildBookingsRows(bookings: Booking[]): any[][] {
  const headers = [
    'Mã đặt phòng',
    'Số phòng',
    'Loại phòng',
    'Tên khách hàng',
    'Số điện thoại',
    'CCCD/Hộ chiếu',
    'Kênh đặt',
    'Mã tham chiếu OTA',
    'Ngày nhận phòng',
    'Ngày trả phòng',
    'Số đêm',
    'Giá phòng/đêm (VNĐ)',
    'Tổng tiền phòng (VNĐ)',
    'Phí quản lý OTA 150k (VNĐ)',
    'Tỉ lệ hoa hồng OTA (%)',
    'Tiền hoa hồng OTA (VNĐ)',
    'Tiền dịch vụ (VNĐ)',
    'Chi tiết dịch vụ',
    'Tiền cọc (VNĐ)',
    'Giảm giá (VNĐ)',
    'Tổng thanh toán (VNĐ)',
    'Trạng thái',
    'Phương thức thanh toán',
    'Ghi chú',
    'Thời gian tạo',
    'Thời gian trả phòng',
  ];

  const rows = bookings.map((b) => {
    const servicesTotal = (b.services || []).reduce((sum, s) => sum + s.total, 0);
    const servicesDetail = (b.services || [])
      .map((s) => `${s.name} (x${s.quantity}): ${s.total.toLocaleString()}đ`)
      .join('; ');
    const grandTotal = b.totalRoomPrice + servicesTotal - b.discount;

    const channelName = CHANNELS[b.channel]?.name || b.channel;
    const statusText =
      b.status === 'active'
        ? 'Đang ở'
        : b.status === 'reserved'
        ? 'Đã đặt trước'
        : b.status === 'completed'
        ? 'Đã trả phòng'
        : 'Đã hủy';

    const paymentText =
      b.paymentMethod === 'ota_collect'
        ? 'OTA thu hộ'
        : b.paymentMethod === 'transfer'
        ? 'Chuyển khoản'
        : b.paymentMethod === 'card'
        ? 'Thẻ tín dụng'
        : 'Tiền mặt';

    return [
      b.bookingCode,
      b.roomNumber,
      ROOM_TYPES[b.roomType]?.badgeName || b.roomType,
      b.guestName,
      b.guestPhone,
      b.guestIdCard || '',
      channelName,
      b.channelBookingRef || '',
      b.checkInDate,
      b.checkOutDate,
      b.nights,
      b.roomPricePerNight,
      b.totalRoomPrice,
      b.managementFee,
      `${(b.otaCommissionRate * 100).toFixed(0)}%`,
      b.otaCommissionAmount,
      servicesTotal,
      servicesDetail,
      b.deposit,
      b.discount,
      grandTotal,
      statusText,
      paymentText,
      b.notes || '',
      b.createdAt,
      b.checkedOutAt || '',
    ];
  });

  return [headers, ...rows];
}

/**
 * Format OTA pricing matrix into rows
 */
function buildOtaPricingRows(settings: HotelSettings): any[][] {
  const headers = [
    'Mã loại phòng',
    'Tên loại phòng',
    'Quy cách giường',
    'Giá bán trực tiếp (VNĐ)',
    'Phí quản lý (+150k/đêm)',
    'Net kỳ vọng thu về (VNĐ)',
    'Hoa hồng Agoda',
    'Giá niêm yết Agoda (+150k)',
    'Hoa hồng Booking.com',
    'Giá niêm yết Booking (+150k)',
    'Hoa hồng Trip.com',
    'Giá niêm yết Trip.com (+150k)',
    'Hoa hồng Airbnb',
    'Giá niêm yết Airbnb (+150k)',
  ];

  const rows = Object.values(ROOM_TYPES).map((typeInfo) => {
    const agoda = calculateOtaPrice(typeInfo.directPrice, 'agoda', settings.channelCommissions.agoda, settings.defaultManagementFee, settings.pricingFormula, settings.roundingMethod);
    const booking = calculateOtaPrice(typeInfo.directPrice, 'booking', settings.channelCommissions.booking, settings.defaultManagementFee, settings.pricingFormula, settings.roundingMethod);
    const trip = calculateOtaPrice(typeInfo.directPrice, 'trip', settings.channelCommissions.trip, settings.defaultManagementFee, settings.pricingFormula, settings.roundingMethod);
    const airbnb = calculateOtaPrice(typeInfo.directPrice, 'airbnb', settings.channelCommissions.airbnb, settings.defaultManagementFee, settings.pricingFormula, settings.roundingMethod);

    return [
      typeInfo.id,
      typeInfo.name,
      typeInfo.bedDescription,
      typeInfo.directPrice,
      settings.defaultManagementFee,
      typeInfo.directPrice + settings.defaultManagementFee,
      `${(settings.channelCommissions.agoda * 100).toFixed(0)}%`,
      agoda.listedPrice,
      `${(settings.channelCommissions.booking * 100).toFixed(0)}%`,
      booking.listedPrice,
      `${(settings.channelCommissions.trip * 100).toFixed(0)}%`,
      trip.listedPrice,
      `${(settings.channelCommissions.airbnb * 100).toFixed(0)}%`,
      airbnb.listedPrice,
    ];
  });

  return [headers, ...rows];
}

/**
 * Format services menu into rows
 */
function buildServicesRows(settings: HotelSettings): any[][] {
  const headers = ['Mã dịch vụ', 'Tên dịch vụ / đồ uống', 'Phân loại', 'Đơn vị tính', 'Đơn giá (VNĐ)', 'Đang áp dụng'];
  const rows = (settings.servicesList || []).map((s) => [
    s.id,
    s.name,
    s.category,
    s.unit || 'món',
    s.price,
    s.isActive !== false ? 'TRUE' : 'FALSE',
  ]);
  return [headers, ...rows];
}

/**
 * Export all hotel data to the given Google Spreadsheet
 */
export async function exportAllToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  rooms: Room[],
  bookings: Booking[],
  settings: HotelSettings
): Promise<void> {
  // Check if tabs exist or ensure tabs are named properly
  const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
  const existingSheetTitles = meta.sheets.map((s: any) => s.title);

  // If standard sheets don't exist, we can add them via batchUpdate
  const missingTabs = ['Sơ Đồ 25 Phòng', 'Đặt Phòng & Khách Hàng', 'Bảng Giá OTA & Hoa Hồng', 'Menu Dịch Vụ & Minibar'].filter(
    (t: string) => !existingSheetTitles.includes(t)
  );

  if (missingTabs.length > 0) {
    const addSheetRequests = missingTabs.map((title) => ({
      addSheet: {
        properties: {
          title,
          gridProperties: { frozenRowCount: 1 },
        },
      },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: addSheetRequests }),
    });
  }

  // Clear existing ranges and write fresh data
  const roomsData = buildRoomsRows(rooms);
  const bookingsData = buildBookingsRows(bookings);
  const otaData = buildOtaPricingRows(settings);
  const servicesData = buildServicesRows(settings);

  // Clear tabs first
  for (const tab of ['Sơ Đồ 25 Phòng', 'Đặt Phòng & Khách Hàng', 'Bảng Giá OTA & Hoa Hồng', 'Menu Dịch Vụ & Minibar']) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tab)}!A1:Z500:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  // Batch update values
  const batchData = [
    { range: `'Sơ Đồ 25 Phòng'!A1`, values: roomsData },
    { range: `'Đặt Phòng & Khách Hàng'!A1`, values: bookingsData },
    { range: `'Bảng Giá OTA & Hoa Hồng'!A1`, values: otaData },
    { range: `'Menu Dịch Vụ & Minibar'!A1`, values: servicesData },
  ];

  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData,
      }),
    }
  );

  if (!updateResponse.ok) {
    const err = await updateResponse.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi cập nhật dữ liệu lên Google Sheets (${updateResponse.status})`);
  }
}

/**
 * Preview raw values from a specific tab in Google Sheet
 */
export async function readSheetRange(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi đọc dữ liệu từ tab ${range}`);
  }

  const result = await response.json();
  return result.values || [];
}

/**
 * Import and parse hotel data from the connected Google Sheet
 */
export async function importAllFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  currentRooms: Room[],
  currentBookings: Booking[],
  currentSettings: HotelSettings
): Promise<{
  rooms: Room[];
  bookings: Booking[];
  settings: HotelSettings;
  importedRoomsCount: number;
  importedBookingsCount: number;
}> {
  const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
  const titles = meta.sheets.map((s: any) => s.title);

  let newRooms = [...currentRooms];
  let newBookings = [...currentBookings];
  let newSettings = { ...currentSettings };
  let importedRoomsCount = 0;
  let importedBookingsCount = 0;

  // 1. Try reading rooms tab
  const roomsTab = titles.find((t: string) => t.includes('Phòng') || t.includes('Room') || t.includes('25'));
  if (roomsTab) {
    const rows = await readSheetRange(accessToken, spreadsheetId, `${roomsTab}!A1:J100`);
    if (rows.length > 1) {
      // Header is rows[0]
      const parsedRooms: Room[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[0]) continue;
        const id = String(row[0]).trim();
        const number = row[1] ? String(row[1]).trim() : id;
        const floor = parseInt(row[2]) || Math.floor(parseInt(number) / 100) || 1;
        const typeRaw = String(row[3] || '').toLowerCase();
        let type: RoomType = 'standard_single';
        if (typeRaw.includes('vip')) type = 'vip';
        else if (typeRaw.includes('deluxe')) type = 'deluxe';
        else if (typeRaw.includes('family') || typeRaw.includes('gia đình')) type = 'family';
        else if (typeRaw.includes('2 giường') || typeRaw.includes('twin')) type = 'standard_twin';

        const bedDescription = row[4] ? String(row[4]).trim() : 'Giường tiêu chuẩn';
        const priceNum = typeof row[5] === 'number' ? row[5] : parseInt(String(row[5]).replace(/\D/g, '')) || 800000;

        const statusRaw = String(row[6] || '').toLowerCase();
        let status: RoomStatus = 'available';
        if (statusRaw.includes('ở') || statusRaw.includes('occupied')) status = 'occupied';
        else if (statusRaw.includes('đặt') || statusRaw.includes('reserved')) status = 'reserved';
        else if (statusRaw.includes('dọn') || statusRaw.includes('cleaning')) status = 'cleaning';
        else if (statusRaw.includes('trì') || statusRaw.includes('maintenance')) status = 'maintenance';

        const currentBookingId = row[7] ? String(row[7]).trim() : undefined;
        const cleaningNote = row[8] ? String(row[8]).trim() : undefined;
        const lastCleanedAt = row[9] ? String(row[9]).trim() : undefined;

        parsedRooms.push({
          id,
          number,
          floor,
          type,
          bedDescription,
          directPrice: priceNum,
          status,
          currentBookingId: currentBookingId || undefined,
          cleaningNote: cleaningNote || undefined,
          lastCleanedAt: lastCleanedAt || undefined,
        });
      }

      if (parsedRooms.length > 0) {
        newRooms = parsedRooms;
        importedRoomsCount = parsedRooms.length;
      }
    }
  }

  // 2. Try reading bookings tab
  const bookingsTab = titles.find((t: string) => t.includes('Đặt Phòng') || t.includes('Khách') || t.includes('Booking'));
  if (bookingsTab) {
    const rows = await readSheetRange(accessToken, spreadsheetId, `${bookingsTab}!A1:Z500`);
    if (rows.length > 1) {
      const parsedBookings: Booking[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[0] || !row[3]) continue; // Needs code and guest name
        const bookingCode = String(row[0]).trim();
        const roomNumber = String(row[1] || '101').trim();
        const roomId = roomNumber;
        const guestName = String(row[3]).trim();
        const guestPhone = row[4] ? String(row[4]).trim() : '';
        const guestIdCard = row[5] ? String(row[5]).trim() : '';

        // Channel
        const channelRaw = String(row[6] || '').toLowerCase();
        let channel: BookingChannel = 'direct';
        if (channelRaw.includes('agoda')) channel = 'agoda';
        else if (channelRaw.includes('book')) channel = 'booking';
        else if (channelRaw.includes('trip')) channel = 'trip';
        else if (channelRaw.includes('airbnb')) channel = 'airbnb';

        const channelBookingRef = row[7] ? String(row[7]).trim() : undefined;
        const checkInDate = row[8] ? String(row[8]).trim() : new Date().toISOString().split('T')[0];
        const checkOutDate = row[9] ? String(row[9]).trim() : new Date().toISOString().split('T')[0];
        const nights = parseInt(row[10]) || 1;
        const roomPricePerNight = parseInt(String(row[11] || '0').replace(/\D/g, '')) || 800000;
        const totalRoomPrice = parseInt(String(row[12] || '0').replace(/\D/g, '')) || roomPricePerNight * nights;
        const managementFee = parseInt(String(row[13] || '0').replace(/\D/g, '')) || (channel !== 'direct' ? 150000 * nights : 0);
        
        let otaCommissionRate = 0;
        if (channel === 'agoda' || channel === 'booking' || channel === 'trip') otaCommissionRate = 0.15;
        if (channel === 'airbnb') otaCommissionRate = 0.14;

        const otaCommissionAmount = parseInt(String(row[15] || '0').replace(/\D/g, '')) || Math.round(totalRoomPrice * otaCommissionRate);
        const deposit = parseInt(String(row[18] || '0').replace(/\D/g, '')) || 0;
        const discount = parseInt(String(row[19] || '0').replace(/\D/g, '')) || 0;

        // Status
        const statusRaw = String(row[21] || '').toLowerCase();
        let status: 'active' | 'reserved' | 'completed' | 'cancelled' = 'active';
        if (statusRaw.includes('trả') || statusRaw.includes('completed')) status = 'completed';
        else if (statusRaw.includes('đặt') || statusRaw.includes('reserved')) status = 'reserved';
        else if (statusRaw.includes('hủy') || statusRaw.includes('cancelled')) status = 'cancelled';

        // Payment method
        const paymentRaw = String(row[22] || '').toLowerCase();
        let paymentMethod: any = 'cash';
        if (paymentRaw.includes('thu hộ') || paymentRaw.includes('ota')) paymentMethod = 'ota_collect';
        else if (paymentRaw.includes('chuyển') || paymentRaw.includes('transfer')) paymentMethod = 'transfer';
        else if (paymentRaw.includes('thẻ') || paymentRaw.includes('card')) paymentMethod = 'card';

        const notes = row[23] ? String(row[23]).trim() : undefined;
        const createdAt = row[24] ? String(row[24]).trim() : new Date().toISOString();
        const checkedOutAt = row[25] ? String(row[25]).trim() : undefined;

        // Room type
        const roomObj = newRooms.find((r) => r.number === roomNumber);
        const roomType: RoomType = roomObj ? roomObj.type : 'standard_single';

        parsedBookings.push({
          id: `bk-${bookingCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          bookingCode,
          roomId,
          roomNumber,
          roomType,
          guestName,
          guestPhone,
          guestIdCard: guestIdCard || undefined,
          channel,
          channelBookingRef,
          checkInDate,
          checkOutDate,
          nights,
          roomPricePerNight,
          totalRoomPrice,
          managementFee,
          otaCommissionRate,
          otaCommissionAmount,
          services: [],
          deposit,
          discount,
          status,
          notes,
          createdAt,
          checkedOutAt,
          paymentMethod,
        });
      }

      if (parsedBookings.length > 0) {
        newBookings = parsedBookings;
        importedBookingsCount = parsedBookings.length;
      }
    }
  }

  return {
    rooms: newRooms,
    bookings: newBookings,
    settings: newSettings,
    importedRoomsCount,
    importedBookingsCount,
  };
}
