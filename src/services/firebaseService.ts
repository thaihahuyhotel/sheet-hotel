import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDocFromServer,
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Room, Booking, HotelSettings, RoomStatus, BookingServiceItem } from '../types/hotel';
import { INITIAL_ROOMS, INITIAL_SETTINGS, INITIAL_BOOKINGS } from '../data/initialData';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore on app startup
 */
export async function testFirestoreConnection(): Promise<boolean> {
  const path = 'test/connection';
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or pending connection.');
    }
    // Non-fatal for initial boot
    return false;
  }
}

/**
 * Auto-seeds initial 25 rooms and settings in Firestore if empty
 */
export async function seedInitialRoomsIfEmpty(): Promise<void> {
  const roomsPath = 'rooms';
  try {
    const snap = await getDocs(collection(db, roomsPath));
    if (snap.empty) {
      console.log('Seeding initial 25 rooms into Firestore...');
      const batch = writeBatch(db);
      INITIAL_ROOMS.forEach((room) => {
        const roomRef = doc(db, 'rooms', room.id);
        batch.set(roomRef, room);
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, roomsPath);
  }

  const settingsPath = 'settings/config';
  try {
    const settingsDoc = await getDocFromServer(doc(db, 'settings', 'config')).catch(() => null);
    if (!settingsDoc || !settingsDoc.exists()) {
      console.log('Seeding initial hotel settings into Firestore...');
      await setDoc(doc(db, 'settings', 'config'), INITIAL_SETTINGS);
    }
  } catch (error) {
    // Non-fatal if offline
    console.warn('Settings check:', error);
  }
}

/**
 * Real-time subscription to rooms collection
 */
export function subscribeToRooms(onRoomsUpdate: (rooms: Room[]) => void): () => void {
  const path = 'rooms';
  const roomsRef = collection(db, path);
  
  return onSnapshot(
    roomsRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Fallback to initial rooms
        onRoomsUpdate(INITIAL_ROOMS);
        return;
      }
      const loadedRooms: Room[] = [];
      snapshot.forEach((docSnap) => {
        loadedRooms.push(docSnap.data() as Room);
      });
      // Sort rooms logically by floor and room number
      loadedRooms.sort((a, b) => parseInt(a.number) - parseInt(b.number));
      onRoomsUpdate(loadedRooms);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Real-time subscription to bookings collection
 */
export function subscribeToBookings(onBookingsUpdate: (bookings: Booking[]) => void): () => void {
  const path = 'bookings';
  const bookingsRef = collection(db, path);

  return onSnapshot(
    bookingsRef,
    (snapshot) => {
      const loadedBookings: Booking[] = [];
      snapshot.forEach((docSnap) => {
        loadedBookings.push(docSnap.data() as Booking);
      });
      // Sort bookings by createdAt descending
      loadedBookings.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onBookingsUpdate(loadedBookings);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Real-time subscription to hotel settings document
 */
export function subscribeToSettings(onSettingsUpdate: (settings: HotelSettings) => void): () => void {
  const path = 'settings/config';
  const settingsRef = doc(db, 'settings', 'config');

  return onSnapshot(
    settingsRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onSettingsUpdate(docSnap.data() as HotelSettings);
      } else {
        onSettingsUpdate(INITIAL_SETTINGS);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Save new booking and atomically update the room status in Firestore
 */
export async function createBookingInFirestore(
  newBooking: Booking,
  targetRoomId: string,
  isCheckInNow: boolean
): Promise<void> {
  const bookingPath = `bookings/${newBooking.id}`;
  const roomPath = `rooms/${targetRoomId}`;

  try {
    const batch = writeBatch(db);
    const bookingRef = doc(db, 'bookings', newBooking.id);
    batch.set(bookingRef, newBooking);

    const newStatus: RoomStatus = isCheckInNow ? 'occupied' : 'reserved';
    const roomRef = doc(db, 'rooms', targetRoomId);
    batch.update(roomRef, {
      status: newStatus,
      currentBookingId: newBooking.id,
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, bookingPath);
  }
}

/**
 * Confirm checkout and set room to cleaning in Firestore
 */
export async function confirmCheckoutInFirestore(
  bookingId: string,
  roomId: string,
  paymentMethod: string,
  finalServices: BookingServiceItem[],
  cleaningNote: string
): Promise<void> {
  const path = `bookings/${bookingId}`;
  try {
    const batch = writeBatch(db);
    
    // 1. Update booking
    const bookingRef = doc(db, 'bookings', bookingId);
    batch.update(bookingRef, {
      status: 'completed',
      services: finalServices,
      paymentMethod,
      checkedOutAt: new Date().toISOString(),
    });

    // 2. Update room to cleaning
    const roomRef = doc(db, 'rooms', roomId);
    batch.update(roomRef, {
      status: 'cleaning',
      currentBookingId: null,
      cleaningNote,
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Quick set room status in Firestore (e.g. cleaning to available)
 */
export async function updateRoomStatusInFirestore(
  roomId: string,
  status: RoomStatus,
  cleaningNote?: string | null,
  lastCleanedAt?: string
): Promise<void> {
  const path = `rooms/${roomId}`;
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const updates: any = { status };
    if (cleaningNote !== undefined) updates.cleaningNote = cleaningNote;
    if (lastCleanedAt !== undefined) updates.lastCleanedAt = lastCleanedAt;
    if (status === 'available') {
      updates.currentBookingId = null;
    }
    await updateDoc(roomRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Add or update services on an active booking in Firestore
 */
export async function updateBookingServicesInFirestore(
  bookingId: string,
  services: BookingServiceItem[]
): Promise<void> {
  const path = `bookings/${bookingId}`;
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, { services });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Save settings in Firestore
 */
export async function saveSettingsInFirestore(settings: HotelSettings): Promise<void> {
  const path = 'settings/config';
  try {
    const settingsRef = doc(db, 'settings', 'config');
    await setDoc(settingsRef, settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Update room configurations (e.g. prices or room types)
 */
export async function updateRoomsInFirestore(rooms: Room[]): Promise<void> {
  const path = 'rooms';
  try {
    const batch = writeBatch(db);
    rooms.forEach((r) => {
      const roomRef = doc(db, 'rooms', r.id);
      batch.set(roomRef, r, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Reset all 25 rooms to available and clear all bookings in Firestore
 */
export async function resetFirestoreToCleanState(): Promise<void> {
  const path = 'rooms';
  try {
    const batch = writeBatch(db);

    // 1. Reset all 25 rooms to available
    INITIAL_ROOMS.forEach((r) => {
      const roomRef = doc(db, 'rooms', r.id);
      batch.set(roomRef, {
        ...r,
        status: 'available',
        currentBookingId: null,
        cleaningNote: null,
      });
    });

    // 2. Delete all existing bookings in Firestore
    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    bookingsSnap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    // 3. Reset settings
    const settingsRef = doc(db, 'settings', 'config');
    batch.set(settingsRef, INITIAL_SETTINGS);

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
