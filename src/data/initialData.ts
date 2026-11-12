import { RoomTypeInfo, ChannelInfo, Room, Booking, HotelSettings, ServiceItemConfig } from '../types/hotel';

export const ROOM_TYPES: Record<string, RoomTypeInfo> = {
  standard_single: {
    id: 'standard_single',
    name: 'Phòng Standard (1 Giường)',
    badgeName: 'Standard 1 Giường',
    bedDescription: 'Giường 1,6 m',
    directPrice: 800000,
    totalRoomsCount: 19,
    capacity: { adults: 2, children: 1 },
    description: 'Phòng tiêu chuẩn ấm cúng, trang bị 1 giường đôi 1,6m, điều hòa, TV thông minh, tủ lạnh minibar.',
    color: 'emerald',
  },
  standard_twin: {
    id: 'standard_twin',
    name: 'Phòng Standard (2 Giường)',
    badgeName: 'Standard 2 Giường',
    bedDescription: '2 Giường (1,2 m + 1,2 m)',
    directPrice: 800000,
    totalRoomsCount: 1,
    capacity: { adults: 2, children: 1 },
    description: 'Phòng tiêu chuẩn 2 giường đơn tách biệt, thích hợp bạn bè hoặc đồng nghiệp đi công tác.',
    color: 'teal',
  },
  vip: {
    id: 'vip',
    name: 'Phòng Đơn VIP',
    badgeName: 'Đơn VIP (P.501)',
    bedDescription: 'Giường 1,8 m',
    directPrice: 1000000,
    totalRoomsCount: 1,
    capacity: { adults: 2, children: 1 },
    description: 'Phòng VIP tầng cao (501) view thoáng đẹp, trang bị giường King 1,8m cao cấp, nội thất gỗ sang trọng.',
    color: 'amber',
  },
  deluxe: {
    id: 'deluxe',
    name: 'Phòng Deluxe',
    badgeName: 'Deluxe (P.505)',
    bedDescription: 'Hai giường 1,4 m + 1,4 m',
    directPrice: 1100000,
    totalRoomsCount: 1,
    capacity: { adults: 3, children: 1 },
    description: 'Phòng Deluxe tầng 5 (505) diện tích lớn, 2 giường 1,4m rộng rãi, bồn tắm nằm và ban công thoáng.',
    color: 'indigo',
  },
  family: {
    id: 'family',
    name: 'Phòng Family',
    badgeName: 'Family (P.201, 401)',
    bedDescription: 'Hai giường 1,8 m + 1,4 m',
    directPrice: 1200000,
    totalRoomsCount: 2,
    capacity: { adults: 4, children: 2 },
    description: 'Phòng gia đình tiện nghi cao cấp (201 & 401), thiết kế 1 giường King 1,8m và 1 giường Queen 1,4m cho cả nhà.',
    color: 'rose',
  },
};

export const CHANNELS: Record<string, ChannelInfo> = {
  direct: {
    id: 'direct',
    name: 'Đặt Trực Tiếp',
    shortName: 'Trực tiếp',
    defaultCommissionRate: 0,
    color: '#059669', // emerald
    bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    logoText: 'Direct',
    description: 'Khách vãng lai, gọi hotline, đặt qua fanpage hoặc website riêng khách sạn (0% hoa hồng).',
  },
  agoda: {
    id: 'agoda',
    name: 'Agoda',
    shortName: 'Agoda',
    defaultCommissionRate: 0.15, // 15%
    color: '#3b82f6', // blue
    bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    logoText: 'agoda',
    description: 'Kênh OTA Agoda YCS, phí hoa hồng mặc định 15%.',
  },
  booking: {
    id: 'booking',
    name: 'Booking.com',
    shortName: 'Booking',
    defaultCommissionRate: 0.15, // 15%
    color: '#1e3a8a', // dark blue
    bgColor: 'bg-sky-50 text-sky-800 border-sky-200',
    textColor: 'text-sky-800',
    borderColor: 'border-sky-300',
    logoText: 'Booking.com',
    description: 'Kênh Booking.com Extranet, phí hoa hồng mặc định 15%.',
  },
  trip: {
    id: 'trip',
    name: 'Trip.com',
    shortName: 'Trip.com',
    defaultCommissionRate: 0.15, // 15%
    color: '#ea580c', // orange
    bgColor: 'bg-orange-50 text-orange-700 border-orange-200',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    logoText: 'Trip.com',
    description: 'Kênh Trip.com e-Booking, thị trường khách quốc tế & Trung Quốc, hoa hồng 15%.',
  },
  airbnb: {
    id: 'airbnb',
    name: 'Airbnb',
    shortName: 'Airbnb',
    defaultCommissionRate: 0.14, // 14% split fee or 15% host-only
    color: '#e11d48', // rose
    bgColor: 'bg-rose-50 text-rose-700 border-rose-200',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-300',
    logoText: 'airbnb',
    description: 'Kênh căn hộ & trải nghiệm Airbnb, phí hoa hồng chủ nhà mặc định 14%.',
  },
};

export const DEFAULT_SERVICES: ServiceItemConfig[] = [
  { id: 'srv-cfg-1', name: 'Nước suối Lavie / Aquafina 500ml', price: 15000, category: 'minibar', unit: 'chai', isActive: true },
  { id: 'srv-cfg-2', name: 'Nước ngọt Coca / Pepsi / 7Up', price: 20000, category: 'minibar', unit: 'lon', isActive: true },
  { id: 'srv-cfg-3', name: 'Bò Húc / Red Bull lon', price: 25000, category: 'minibar', unit: 'lon', isActive: true },
  { id: 'srv-cfg-4', name: 'Bia Heineken / Tiger lon', price: 30000, category: 'minibar', unit: 'lon', isActive: true },
  { id: 'srv-cfg-5', name: 'Mì ly Omachi / Modern', price: 20000, category: 'minibar', unit: 'ly', isActive: true },
  { id: 'srv-cfg-6', name: 'Snack khoai tây Lay\'s / Oishi', price: 20000, category: 'minibar', unit: 'gói', isActive: true },
  { id: 'srv-cfg-7', name: 'Giặt ủi quần áo thường', price: 40000, category: 'laundry', unit: 'kg', isActive: true },
  { id: 'srv-cfg-8', name: 'Giặt ủi lấy nhanh trong ngày', price: 70000, category: 'laundry', unit: 'kg', isActive: true },
  { id: 'srv-cfg-9', name: 'Thuê xe máy số Wave / Sirius', price: 130000, category: 'rental', unit: 'ngày', isActive: true },
  { id: 'srv-cfg-10', name: 'Thuê xe máy tay ga Air Blade / Vision', price: 160000, category: 'rental', unit: 'ngày', isActive: true },
  { id: 'srv-cfg-11', name: 'Phụ thu nhận phòng sớm (trước 12h)', price: 150000, category: 'surcharge', unit: 'lượt', isActive: true },
  { id: 'srv-cfg-12', name: 'Phụ thu trả phòng muộn (sau 14h)', price: 150000, category: 'surcharge', unit: 'lượt', isActive: true },
  { id: 'srv-cfg-13', name: 'Phụ thu thêm người (người/đêm)', price: 150000, category: 'surcharge', unit: 'người/đêm', isActive: true },
];

export const INITIAL_SETTINGS: HotelSettings = {
  hotelName: 'Thái Hà Huy Hotel',
  hotelAddress: '25 Đường Hoa Hồng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  hotelPhone: '0908 123 456',
  hotelEmail: 'thaihahuyhotel.com@gmail.com',
  defaultManagementFee: 150000, // 150.000 VNĐ
  channelCommissions: {
    direct: 0,
    agoda: 0.15,
    booking: 0.15,
    trip: 0.15,
    airbnb: 0.14,
  },
  pricingFormula: 'net_guaranteed', // (DirectPrice + 150k) / (1 - Commission)
  roundingMethod: '1000', // round to thousands
  servicesList: DEFAULT_SERVICES,
};

// 25 Rooms configured exactly to user request:
// - 20 phòng Standard: 19 phòng 1 giường 1.6m (800k) + 1 phòng 2 giường (800k - P.105)
// - 1 phòng Đơn VIP: Phòng 501 (Giường 1.8m - 1.000.000đ)
// - 1 phòng Deluxe: Phòng 505 (2 giường 1.4m + 1.4m - 1.100.000đ)
// - 2 phòng Family: Phòng 201 và Phòng 401 (2 giường 1.8m + 1.4m - 1.200.000đ)
// Total: 25 rooms across 5 floors (5 rooms each floor)
export const INITIAL_ROOMS: Room[] = [
  // Tầng 1 (5 phòng: 101 - 104 Standard 1 giường, 105 Standard 2 giường)
  { id: '101', number: '101', floor: 1, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '102', number: '102', floor: 1, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '103', number: '103', floor: 1, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '104', number: '104', floor: 1, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '105', number: '105', floor: 1, type: 'standard_twin', status: 'available', bedDescription: '2 Giường (1,2 m + 1,2 m)', directPrice: 800000 },

  // Tầng 2 (5 phòng: 201 Family, 202 - 205 Standard 1 giường)
  { id: '201', number: '201', floor: 2, type: 'family', status: 'available', bedDescription: 'Hai giường 1,8 m + 1,4 m', directPrice: 1200000 },
  { id: '202', number: '202', floor: 2, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '203', number: '203', floor: 2, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '204', number: '204', floor: 2, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '205', number: '205', floor: 2, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },

  // Tầng 3 (5 phòng: 301 - 305 Standard 1 giường)
  { id: '301', number: '301', floor: 3, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '302', number: '302', floor: 3, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '303', number: '303', floor: 3, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '304', number: '304', floor: 3, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '305', number: '305', floor: 3, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },

  // Tầng 4 (5 phòng: 401 Family, 402 - 405 Standard 1 giường)
  { id: '401', number: '401', floor: 4, type: 'family', status: 'available', bedDescription: 'Hai giường 1,8 m + 1,4 m', directPrice: 1200000 },
  { id: '402', number: '402', floor: 4, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '403', number: '403', floor: 4, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '404', number: '404', floor: 4, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '405', number: '405', floor: 4, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },

  // Tầng 5 (5 phòng: 501 Đơn VIP, 502 - 504 Standard 1 giường, 505 Deluxe)
  { id: '501', number: '501', floor: 5, type: 'vip', status: 'available', bedDescription: 'Giường 1,8 m', directPrice: 1000000 },
  { id: '502', number: '502', floor: 5, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '503', number: '503', floor: 5, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '504', number: '504', floor: 5, type: 'standard_single', status: 'available', bedDescription: 'Giường 1,6 m', directPrice: 800000 },
  { id: '505', number: '505', floor: 5, type: 'deluxe', status: 'available', bedDescription: 'Hai giường 1,4 m + 1,4 m', directPrice: 1100000 },
];

// Clean initial bookings - no sample bookings
export const INITIAL_BOOKINGS: Booking[] = [];

export const COMMON_SERVICES = [
  { name: 'Nước suối Lavie / Aquafina 500ml', price: 15000, category: 'minibar' as const },
  { name: 'Nước ngọt Coca / Pepsi / 7Up', price: 20000, category: 'minibar' as const },
  { name: 'Bia Heineken / Tiger lon', price: 30000, category: 'minibar' as const },
  { name: 'Mì ly Omachi / Modern', price: 20000, category: 'minibar' as const },
  { name: 'Giặt ủi quần áo thường (kg)', price: 40000, category: 'laundry' as const },
  { name: 'Giặt ủi lấy nhanh', price: 70000, category: 'laundry' as const },
  { name: 'Thuê xe máy số (ngày)', price: 130000, category: 'rental' as const },
  { name: 'Thuê xe máy tay ga (ngày)', price: 160000, category: 'rental' as const },
  { name: 'Phụ thu nhận phòng sớm (trước 12h)', price: 150000, category: 'surcharge' as const },
  { name: 'Phụ thu trả phòng muộn (sau 14h)', price: 150000, category: 'surcharge' as const },
  { name: 'Phụ thu thêm người (người/đêm)', price: 150000, category: 'surcharge' as const },
];
