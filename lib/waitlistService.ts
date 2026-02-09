import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Firebase Schema Structure:
 *
 * waitlist/{entryId}
 *   - firstName: string
 *   - lastName: string
 *   - email: string
 *   - destinationCity: string
 *   - interests: string[]
 *   - createdAt: Timestamp
 */

// ============= INTERFACES =============

export interface WaitlistEntry {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  destinationCity: string;
  interests: string[];
  createdAt: Timestamp;
}

export interface WaitlistEntryClient {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  destinationCity: string;
  interests: string[];
  createdAt: string; // ISO string
}

// ============= CONVERSION FUNCTIONS =============

function waitlistEntryToFirestore(
  entry: Omit<WaitlistEntryClient, "id" | "createdAt">
): Omit<WaitlistEntry, "id"> {
  return {
    firstName: entry.firstName,
    lastName: entry.lastName,
    email: entry.email,
    destinationCity: entry.destinationCity,
    interests: entry.interests,
    createdAt: Timestamp.now(),
  };
}

function waitlistEntryFromFirestore(
  id: string,
  data: WaitlistEntry
): WaitlistEntryClient {
  return {
    id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    destinationCity: data.destinationCity,
    interests: data.interests,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

// ============= CRUD OPERATIONS =============

/**
 * Add a new entry to the waitlist
 * Uses email as document ID to prevent duplicates without needing read access
 */
export async function addToWaitlist(
  entryData: Omit<WaitlistEntryClient, "id" | "createdAt">
): Promise<string> {
  try {
    const normalizedEmail = entryData.email.trim().toLowerCase();
    console.log("🔍 Adding to waitlist:", normalizedEmail);

    // Use email as document ID (sanitized for Firestore)
    // Replace special characters that aren't allowed in document IDs
    const emailAsId = normalizedEmail.replace(/[.#$[\]]/g, "_");
    
    const waitlistRef = doc(db, "waitlist", emailAsId);
    
    // Check if document already exists by trying to get it
    // Note: This will fail with permission denied if rules don't allow read
    // So we'll just try to create and catch the error
    const entryDoc = waitlistEntryToFirestore({
      ...entryData,
      email: normalizedEmail,
    });

    // Use set without merge - will fail if document exists (handled by Firestore rules)
    await setDoc(waitlistRef, entryDoc);

    console.log("✅ Added to waitlist successfully:", emailAsId);
    return emailAsId;
  } catch (error: any) {
    console.error("❌ Error adding to waitlist:", error);
    
    // Check if it's a "already exists" type error
    if (error.code === "permission-denied") {
      throw new Error("This email may already be on the waitlist, or there was a permission error.");
    }
    
    throw new Error(error.message || "Failed to add to waitlist");
  }
}

/**
 * Get a waitlist entry by ID
 */
export async function getWaitlistEntry(
  entryId: string
): Promise<WaitlistEntryClient | null> {
  try {
    const entryRef = doc(db, "waitlist", entryId);
    const entrySnap = await getDoc(entryRef);

    if (!entrySnap.exists()) {
      return null;
    }

    return waitlistEntryFromFirestore(
      entrySnap.id,
      entrySnap.data() as WaitlistEntry
    );
  } catch (error: any) {
    console.error("❌ Error fetching waitlist entry:", error.message);
    return null;
  }
}

/**
 * Get a waitlist entry by email
 */
export async function getWaitlistEntryByEmail(
  email: string
): Promise<WaitlistEntryClient | null> {
  try {
    const waitlistRef = collection(db, "waitlist");
    const q = query(waitlistRef, where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return waitlistEntryFromFirestore(doc.id, doc.data() as WaitlistEntry);
  } catch (error: any) {
    console.error("❌ Error fetching waitlist entry by email:", error.message);
    return null;
  }
}

/**
 * Get all waitlist entries (for admin purposes)
 */
export async function getAllWaitlistEntries(): Promise<WaitlistEntryClient[]> {
  try {
    const waitlistRef = collection(db, "waitlist");
    const q = query(waitlistRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const entries: WaitlistEntryClient[] = querySnapshot.docs.map((doc) =>
      waitlistEntryFromFirestore(doc.id, doc.data() as WaitlistEntry)
    );

    console.log(`✅ Retrieved ${entries.length} waitlist entries`);
    return entries;
  } catch (error: any) {
    console.error("❌ Error getting waitlist entries:", error);
    return [];
  }
}

/**
 * Get waitlist count
 */
export async function getWaitlistCount(): Promise<number> {
  try {
    const waitlistRef = collection(db, "waitlist");
    const querySnapshot = await getDocs(waitlistRef);
    return querySnapshot.size;
  } catch (error: any) {
    console.error("❌ Error getting waitlist count:", error.message);
    return 0;
  }
}
