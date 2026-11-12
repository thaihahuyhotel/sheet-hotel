import { Room, Booking, HotelSettings } from '../types/hotel';
import { INITIAL_ROOMS, INITIAL_BOOKINGS, INITIAL_SETTINGS } from '../data/initialData';

const STORAGE_KEYS = {
  ROOMS: 'hotel25_rooms_v2_clean',
  BOOKINGS: 'hotel25_bookings_v2_clean',
  SETTINGS: 'hotel25_settings_v2_clean',
};

export function loadStoredData(): {
  rooms: Room[];
  bookings: Booking[];
  settings: HotelSettings;
} {
  try {
    const storedRooms = localStorage.getItem(STORAGE_KEYS.ROOMS);
    const storedBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    // If no v2 clean data exists, clean up legacy mock keys
    if (!storedBookings && localStorage.getItem('hotel25_bookings_v1')) {
      localStorage.removeItem('hotel25_bookings_v1');
      localStorage.removeItem('hotel25_rooms_v1');
    }

    const parsedRooms = storedRooms ? JSON.parse(storedRooms) : INITIAL_ROOMS;
    const parsedBookings = storedBookings ? JSON.parse(storedBookings) : INITIAL_BOOKINGS;
    const parsedSettings: HotelSettings = storedSettings ? JSON.parse(storedSettings) : INITIAL_SETTINGS;

    if (!parsedSettings.servicesList || !Array.isArray(parsedSettings.servicesList) || parsedSettings.servicesList.length === 0) {
      parsedSettings.servicesList = INITIAL_SETTINGS.servicesList;
    }

    return {
      rooms: parsedRooms,
      bookings: parsedBookings,
      settings: parsedSettings,
    };
  } catch (error) {
    console.error('Error reading localStorage, reverting to defaults:', error);
    return {
      rooms: INITIAL_ROOMS,
      bookings: INITIAL_BOOKINGS,
      settings: INITIAL_SETTINGS,
    };
  }
}

export function saveStoredData(
  rooms: Room[],
  bookings: Booking[],
  settings: HotelSettings
): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function resetToDefaults(): {
  rooms: Room[];
  bookings: Booking[];
  settings: HotelSettings;
} {
  try {
    localStorage.removeItem(STORAGE_KEYS.ROOMS);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem('hotel25_rooms_v1');
    localStorage.removeItem('hotel25_bookings_v1');
    localStorage.removeItem('hotel25_settings_v1');

    // Immediately save clean empty state
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  } catch (e) {
    console.error('Error during resetToDefaults:', e);
  }
  return {
    rooms: INITIAL_ROOMS,
    bookings: INITIAL_BOOKINGS,
    settings: INITIAL_SETTINGS,
  };
}
