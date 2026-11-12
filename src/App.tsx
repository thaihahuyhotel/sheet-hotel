import { useState, useEffect } from 'react';
import { Room, Booking, HotelSettings, RoomStatus, BookingServiceItem } from './types/hotel';
import { loadStoredData, saveStoredData, resetToDefaults } from './utils/storage';
import Header from './components/Header';
import RoomGrid from './components/RoomGrid';
import OtaPricingCalculator from './components/OtaPricingCalculator';
import BookingList from './components/BookingList';
import AnalyticsView from './components/AnalyticsView';
import BookingModal from './components/BookingModal';
import CheckoutModal from './components/CheckoutModal';
import RoomDetailModal from './components/RoomDetailModal';
import SettingsModal from './components/SettingsModal';
import GoogleSheetsView from './components/GoogleSheetsView';

export default function App() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<HotelSettings>({} as HotelSettings);

  const [currentView, setCurrentView] = useState<'rooms' | 'ota' | 'bookings' | 'analytics' | 'sheets'>('rooms');

  // Modals state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null);
  const [isReservationMode, setIsReservationMode] = useState(false);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const [checkoutRoom, setCheckoutRoom] = useState<Room | null>(null);

  const [isRoomDetailOpen, setIsRoomDetailOpen] = useState(false);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState<Room | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    const data = loadStoredData();
    setRooms(data.rooms);
    setBookings(data.bookings);
    setSettings(data.settings);
    setDataLoaded(true);
  }, []);

  // Save data on changes
  useEffect(() => {
    if (dataLoaded) {
      saveStoredData(rooms, bookings, settings);
    }
  }, [rooms, bookings, settings, dataLoaded]);

  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Đang khởi động hệ thống quản lý khách sạn 25 phòng...
      </div>
    );
  }

  // Helper maps
  const activeBookingsMap = new Map<string, Booking>();
  bookings.forEach((b) => {
    if (b.status === 'active' || b.status === 'reserved') {
      activeBookingsMap.set(b.roomId, b);
    }
  });

  // Action Handlers
  const handleOpenBookingModal = (room?: Room, isReservation = false) => {
    setSelectedRoomForBooking(room || rooms[0] || null);
    setIsReservationMode(isReservation);
    setIsBookingModalOpen(true);
  };

  const handleSaveBooking = (newBooking: Booking, targetRoomId: string, isCheckInNow: boolean) => {
    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);

    const newStatus: RoomStatus = isCheckInNow ? 'occupied' : 'reserved';
    const updatedRooms = rooms.map((r) =>
      r.id === targetRoomId
        ? {
            ...r,
            status: newStatus,
            currentBookingId: newBooking.id,
          }
        : r
    );
    setRooms(updatedRooms);
  };

  const handleOpenCheckoutModal = (booking: Booking, room: Room) => {
    setCheckoutBooking(booking);
    setCheckoutRoom(room);
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmCheckout = (
    bookingId: string,
    roomId: string,
    paymentMethod: string,
    finalServices: BookingServiceItem[]
  ) => {
    // 1. Mark booking completed
    const updatedBookings = bookings.map((b) =>
      b.id === bookingId
        ? {
            ...b,
            status: 'completed' as const,
            services: finalServices,
            paymentMethod: paymentMethod as any,
            checkedOutAt: new Date().toISOString(),
          }
        : b
    );
    setBookings(updatedBookings);

    // 2. Mark room as cleaning
    const currentTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const updatedRooms = rooms.map((r) =>
      r.id === roomId
        ? {
            ...r,
            status: 'cleaning' as RoomStatus,
            currentBookingId: undefined,
            cleaningNote: `Khách vừa trả phòng lúc ${currentTimeStr}`,
          }
        : r
    );
    setRooms(updatedRooms);
  };

  const handleQuickCleanRoom = (roomId: string) => {
    setRooms(
      rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              status: 'available',
              cleaningNote: undefined,
              lastCleanedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            }
          : r
      )
    );
  };

  const handleQuickSetStatus = (roomId: string, status: RoomStatus, cleaningNote?: string) => {
    setRooms(
      rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              status,
              cleaningNote: cleaningNote !== undefined ? cleaningNote : r.cleaningNote,
            }
          : r
      )
    );
  };

  const handleOpenRoomDetail = (room: Room) => {
    setSelectedRoomDetail(room);
    setIsRoomDetailOpen(true);
  };

  const handleAddServiceToBooking = (bookingId: string, item: BookingServiceItem) => {
    setBookings(
      bookings.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          services: [...b.services, item],
        };
      })
    );
  };

  const handleRemoveServiceFromBooking = (bookingId: string, serviceId: string) => {
    setBookings(
      bookings.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          services: b.services.filter((s) => s.id !== serviceId),
        };
      })
    );
  };

  const handleResetDefaults = () => {
    const data = resetToDefaults();
    setRooms(data.rooms);
    setBookings(data.bookings);
    setSettings(data.settings);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        currentView={currentView}
        onChangeView={setCurrentView}
        settings={settings}
        rooms={rooms}
        onOpenQuickBooking={() => handleOpenBookingModal()}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isSheetConnected={Boolean(localStorage.getItem('hotel25_connected_sheet_id'))}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'rooms' && (
          <RoomGrid
            rooms={rooms}
            bookings={bookings}
            onOpenBookingModal={handleOpenBookingModal}
            onOpenCheckoutModal={handleOpenCheckoutModal}
            onOpenRoomDetail={handleOpenRoomDetail}
            onQuickCleanRoom={handleQuickCleanRoom}
            onQuickSetStatus={handleQuickSetStatus}
          />
        )}

        {currentView === 'ota' && (
          <OtaPricingCalculator
            settings={settings}
            onUpdateSettings={setSettings}
          />
        )}

        {currentView === 'bookings' && (
          <BookingList
            bookings={bookings}
            rooms={rooms}
            settings={settings}
            onOpenCheckoutModal={handleOpenCheckoutModal}
            onOpenBookingModal={handleOpenBookingModal}
            onSelectBooking={(b) => {
              const r = rooms.find((rm) => rm.id === b.roomId);
              if (r) handleOpenRoomDetail(r);
            }}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            bookings={bookings}
            rooms={rooms}
            settings={settings}
            onNavigateToRooms={() => setCurrentView('rooms')}
            onNavigateToSheets={() => setCurrentView('sheets')}
          />
        )}

        {currentView === 'sheets' && (
          <GoogleSheetsView
            rooms={rooms}
            bookings={bookings}
            settings={settings}
            onUpdateRooms={setRooms}
            onUpdateBookings={setBookings}
            onUpdateSettings={setSettings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>{settings.hotelName}</strong> • Quy mô 25 phòng (Standard, VIP 501, Deluxe 505, Family)
          </div>
          <div>
            Kênh OTA: Agoda, Booking.com, Trip.com, Airbnb (+150.000₫ phí quản lý)
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedRoom={selectedRoomForBooking}
        rooms={rooms}
        settings={settings}
        isReservation={isReservationMode}
        onSaveBooking={handleSaveBooking}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        booking={checkoutBooking}
        room={checkoutRoom}
        settings={settings}
        onConfirmCheckout={handleConfirmCheckout}
      />

      <RoomDetailModal
        isOpen={isRoomDetailOpen}
        onClose={() => setIsRoomDetailOpen(false)}
        room={selectedRoomDetail}
        activeBooking={selectedRoomDetail ? activeBookingsMap.get(selectedRoomDetail.id) || null : null}
        settings={settings}
        onUpdateRoomStatus={handleQuickSetStatus}
        onAddServiceToBooking={handleAddServiceToBooking}
        onRemoveServiceFromBooking={handleRemoveServiceFromBooking}
        onOpenBookingModal={handleOpenBookingModal}
        onOpenCheckoutModal={handleOpenCheckoutModal}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        rooms={rooms}
        onSaveSettings={setSettings}
        onUpdateRooms={setRooms}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
}
