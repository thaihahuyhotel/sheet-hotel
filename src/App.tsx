import { useState, useEffect } from 'react';
import { Room, Booking, HotelSettings, RoomStatus, BookingServiceItem } from './types/hotel';
import { loadStoredData, saveStoredData, resetToDefaults } from './utils/storage';
import Header from './components/Header';
import RoomGrid from './components/RoomGrid';
import OtaPricingCalculator from './components/OtaPricingCalculator';
import BookingList from './components/BookingList';
import AnalyticsView from './components/AnalyticsView';
import DatabaseView from './components/DatabaseView';
import BookingModal from './components/BookingModal';
import CheckoutModal from './components/CheckoutModal';
import RoomDetailModal from './components/RoomDetailModal';
import SettingsModal from './components/SettingsModal';
import {
  seedInitialRoomsIfEmpty,
  subscribeToRooms,
  subscribeToBookings,
  subscribeToSettings,
  createBookingInFirestore,
  confirmCheckoutInFirestore,
  updateRoomStatusInFirestore,
  updateBookingServicesInFirestore,
  saveSettingsInFirestore,
  updateRoomsInFirestore,
  resetFirestoreToCleanState
} from './services/firebaseService';

export default function App() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<HotelSettings>({} as HotelSettings);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);

  const [currentView, setCurrentView] = useState<'rooms' | 'ota' | 'bookings' | 'analytics' | 'database'>('rooms');

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

  // 1. Initial local load for instant UI paint
  useEffect(() => {
    const cached = loadStoredData();
    setRooms(cached.rooms);
    setBookings(cached.bookings);
    setSettings(cached.settings);
    setDataLoaded(true);

    // 2. Seed initial Firestore rooms if collection is empty
    seedInitialRoomsIfEmpty().catch((err) => {
      console.warn('Firestore seeding check:', err);
    });

    // 3. Set up real-time collaborative listeners to Firebase Firestore
    const unsubRooms = subscribeToRooms((liveRooms) => {
      if (liveRooms && liveRooms.length > 0) {
        setRooms(liveRooms);
        setIsRealtimeConnected(true);
      }
    });

    const unsubBookings = subscribeToBookings((liveBookings) => {
      setBookings(liveBookings);
      setIsRealtimeConnected(true);
    });

    const unsubSettings = subscribeToSettings((liveSettings) => {
      if (liveSettings && liveSettings.hotelName) {
        setSettings(liveSettings);
        setIsRealtimeConnected(true);
      }
    });

    return () => {
      unsubRooms();
      unsubBookings();
      unsubSettings();
    };
  }, []);

  // Save data to localStorage as warm cache on every change
  useEffect(() => {
    if (dataLoaded && rooms.length > 0) {
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

  // Action Handlers with direct Firestore sync
  const handleOpenBookingModal = (room?: Room, isReservation = false) => {
    setSelectedRoomForBooking(room || rooms[0] || null);
    setIsReservationMode(isReservation);
    setIsBookingModalOpen(true);
  };

  const handleSaveBooking = async (newBooking: Booking, targetRoomId: string, isCheckInNow: boolean) => {
    // Optimistic UI update
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

    // Save to Firestore
    try {
      await createBookingInFirestore(newBooking, targetRoomId, isCheckInNow);
    } catch (error) {
      console.error('Error saving booking to Firestore:', error);
    }
  };

  const handleOpenCheckoutModal = (booking: Booking, room: Room) => {
    setCheckoutBooking(booking);
    setCheckoutRoom(room);
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmCheckout = async (
    bookingId: string,
    roomId: string,
    paymentMethod: string,
    finalServices: BookingServiceItem[]
  ) => {
    const currentTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const cleaningNote = `Khách vừa trả phòng lúc ${currentTimeStr}`;

    // Optimistic UI update
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

    const updatedRooms = rooms.map((r) =>
      r.id === roomId
        ? {
            ...r,
            status: 'cleaning' as RoomStatus,
            currentBookingId: null,
            cleaningNote,
          }
        : r
    );
    setRooms(updatedRooms);

    // Save to Firestore
    try {
      await confirmCheckoutInFirestore(bookingId, roomId, paymentMethod, finalServices, cleaningNote);
    } catch (error) {
      console.error('Error confirming checkout in Firestore:', error);
    }
  };

  const handleQuickCleanRoom = async (roomId: string) => {
    const lastCleanedAt = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    // Optimistic UI update
    setRooms(
      rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              status: 'available',
              cleaningNote: null,
              currentBookingId: null,
              lastCleanedAt,
            }
          : r
      )
    );

    // Save to Firestore
    try {
      await updateRoomStatusInFirestore(roomId, 'available', null, lastCleanedAt);
    } catch (error) {
      console.error('Error updating clean room in Firestore:', error);
    }
  };

  const handleQuickSetStatus = async (roomId: string, status: RoomStatus, cleaningNote?: string) => {
    // Optimistic UI update
    setRooms(
      rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              status,
              cleaningNote: cleaningNote !== undefined ? cleaningNote : r.cleaningNote,
              currentBookingId: status === 'available' ? null : r.currentBookingId,
            }
          : r
      )
    );

    // Save to Firestore
    try {
      await updateRoomStatusInFirestore(roomId, status, cleaningNote !== undefined ? cleaningNote : null);
    } catch (error) {
      console.error('Error setting status in Firestore:', error);
    }
  };

  const handleOpenRoomDetail = (room: Room) => {
    setSelectedRoomDetail(room);
    setIsRoomDetailOpen(true);
  };

  const handleAddServiceToBooking = async (bookingId: string, item: BookingServiceItem) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return;
    const newServices = [...targetBooking.services, item];

    // Optimistic UI update
    setBookings(
      bookings.map((b) => (b.id === bookingId ? { ...b, services: newServices } : b))
    );

    // Save to Firestore
    try {
      await updateBookingServicesInFirestore(bookingId, newServices);
    } catch (error) {
      console.error('Error updating services in Firestore:', error);
    }
  };

  const handleRemoveServiceFromBooking = async (bookingId: string, serviceId: string) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return;
    const newServices = targetBooking.services.filter((s) => s.id !== serviceId);

    // Optimistic UI update
    setBookings(
      bookings.map((b) => (b.id === bookingId ? { ...b, services: newServices } : b))
    );

    // Save to Firestore
    try {
      await updateBookingServicesInFirestore(bookingId, newServices);
    } catch (error) {
      console.error('Error removing service in Firestore:', error);
    }
  };

  const handleResetDefaults = async () => {
    // 1. Optimistic reset local state
    const data = resetToDefaults();
    setRooms(data.rooms);
    setBookings(data.bookings);
    setSettings(data.settings);

    // 2. Reset clean state in Firestore
    try {
      await resetFirestoreToCleanState();
    } catch (error) {
      console.error('Error resetting Firestore to clean state:', error);
    }
  };

  const handleSaveSettings = async (newSettings: HotelSettings) => {
    setSettings(newSettings);
    try {
      await saveSettingsInFirestore(newSettings);
    } catch (error) {
      console.error('Error saving settings to Firestore:', error);
    }
  };

  const handleUpdateRooms = async (newRooms: Room[]) => {
    setRooms(newRooms);
    try {
      await updateRoomsInFirestore(newRooms);
    } catch (error) {
      console.error('Error updating rooms in Firestore:', error);
    }
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
        isRealtimeConnected={isRealtimeConnected}
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
            onUpdateSettings={handleSaveSettings}
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
            onNavigateToDatabase={() => setCurrentView('database')}
          />
        )}

        {currentView === 'database' && (
          <DatabaseView
            rooms={rooms}
            bookings={bookings}
            settings={settings}
            isRealtimeConnected={isRealtimeConnected}
            onNavigateToRooms={() => setCurrentView('rooms')}
            onNavigateToBookings={() => setCurrentView('bookings')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>{settings.hotelName || 'Khách Sạn'}</strong> • Quy mô 25 phòng (Standard, VIP 501, Deluxe 505, Family)
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cơ sở dữ liệu Firestore Realtime • Đồng bộ tự động đa thiết bị</span>
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
        onSaveSettings={handleSaveSettings}
        onUpdateRooms={handleUpdateRooms}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
}
