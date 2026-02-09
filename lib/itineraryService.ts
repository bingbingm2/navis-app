import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  writeBatch,
  Timestamp,
  GeoPoint,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Firebase Schema Structure:
 *
 * itinerary/{tripId}
 *   - userId: string
 *   - destination: string
 *   - startDate: Timestamp
 *   - endDate: Timestamp
 *   - interests: string[]
 *   - createdAt: Timestamp
 *   - updatedAt: Timestamp
 *
 *   /days/{dayId}
 *     - date: Timestamp
 *     - dayNumber: number
 *     - notes?: string
 *
 *     /activities/{activityId}
 *       - name: string
 *       - locationName: string
 *       - locationGeo: GeoPoint
 *       - timeStart: Timestamp
 *       - timeEnd: Timestamp
 *       - tags: string[]
 *       - description: string
 *       - url?: string
 *       - order: number
 */

// ============= INTERFACES =============

export interface Activity {
  id?: string;
  name: string;
  locationName: string;
  locationGeo: GeoPoint;
  timeStart: Timestamp;
  timeEnd: Timestamp;
  tags: string[];
  description: string;
  url?: string;
  order: number;
}

export interface Day {
  id?: string;
  date: Timestamp;
  dayNumber: number;
  notes?: string;
  activities?: Activity[]; // Populated when fetching
}

export interface Itinerary {
  id?: string;
  userId: string;
  destination: string;
  startDate: Timestamp;
  endDate: Timestamp;
  interests: string[];
  timezone?: string; // IANA timezone (e.g., "America/New_York")
  createdAt: Timestamp;
  updatedAt: Timestamp;
  days?: Day[]; // Populated when fetching
}

// ============= CLIENT-SIDE INTERFACES (ISO Strings) =============

export interface ActivityClient {
  id?: string;
  name: string;
  locationName: string;
  locationGeo: {
    latitude: number;
    longitude: number;
  };
  timeStart: string; // ISO string
  timeEnd: string; // ISO string
  tags: string[];
  description: string;
  url?: string;
  order: number;
}

export interface DayClient {
  id?: string;
  date: string; // ISO string
  dayNumber: number;
  notes?: string;
  activities?: ActivityClient[];
}

export interface ItineraryClient {
  id?: string;
  userId: string;
  destination: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  interests: string[];
  timezone?: string; // IANA timezone (e.g., "America/New_York")
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  days?: DayClient[];
}

// ============= CONVERSION FUNCTIONS =============

function activityToFirestore(activity: ActivityClient): Activity {
  return {
    name: activity.name,
    locationName: activity.locationName,
    locationGeo: new GeoPoint(
      activity.locationGeo.latitude,
      activity.locationGeo.longitude
    ),
    timeStart: Timestamp.fromDate(new Date(activity.timeStart)),
    timeEnd: Timestamp.fromDate(new Date(activity.timeEnd)),
    tags: activity.tags,
    description: activity.description,
    url: activity.url,
    order: activity.order,
  };
}

function activityFromFirestore(id: string, data: Activity): ActivityClient {
  return {
    id,
    name: data.name,
    locationName: data.locationName,
    locationGeo: {
      latitude: data.locationGeo.latitude,
      longitude: data.locationGeo.longitude,
    },
    timeStart: data.timeStart.toDate().toISOString(),
    timeEnd: data.timeEnd.toDate().toISOString(),
    tags: data.tags,
    description: data.description,
    url: data.url,
    order: data.order,
  };
}

function dayToFirestore(day: DayClient): Omit<Day, "activities"> {
  return {
    date: Timestamp.fromDate(new Date(day.date)),
    dayNumber: day.dayNumber,
    notes: day.notes,
  };
}

function dayFromFirestore(id: string, data: Day): DayClient {
  return {
    id,
    date: data.date.toDate().toISOString(),
    dayNumber: data.dayNumber,
    notes: data.notes,
    activities: [],
  };
}

function itineraryToFirestore(
  itinerary: ItineraryClient
): Omit<Itinerary, "id" | "days"> {
  return {
    userId: itinerary.userId,
    destination: itinerary.destination,
    startDate: Timestamp.fromDate(new Date(itinerary.startDate)),
    endDate: Timestamp.fromDate(new Date(itinerary.endDate)),
    interests: itinerary.interests,
    timezone: itinerary.timezone,
    createdAt: Timestamp.fromDate(new Date(itinerary.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(itinerary.updatedAt)),
  };
}

function itineraryFromFirestore(id: string, data: Itinerary): ItineraryClient {
  return {
    id,
    userId: data.userId,
    destination: data.destination,
    startDate: data.startDate.toDate().toISOString(),
    endDate: data.endDate.toDate().toISOString(),
    interests: data.interests,
    timezone: data.timezone,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
    days: [],
  };
}

// ============= CRUD OPERATIONS =============

/**
 * Create a new trip with days and activities
 */
export async function createItinerary(
  itineraryData: ItineraryClient
): Promise<string> {
  try {
    // DEBUG: Log what we're trying to save
    console.log("🔍 DEBUG - Creating itinerary with data:");
    console.log("  userId:", itineraryData.userId);
    console.log("  destination:", itineraryData.destination);
    console.log("  interests:", itineraryData.interests);
    console.log("  days:", itineraryData.days?.length || 0);

    const batch = writeBatch(db);

    // Create main itinerary document
    const itineraryRef = doc(collection(db, "itinerary"));
    const tripId = itineraryRef.id;

    const itineraryDoc = itineraryToFirestore(itineraryData);

    // DEBUG: Log the Firestore document
    console.log("🔍 DEBUG - Firestore document:", itineraryDoc);

    batch.set(itineraryRef, itineraryDoc);

    // Create days and activities subcollections
    if (itineraryData.days && itineraryData.days.length > 0) {
      for (const dayData of itineraryData.days) {
        const dayRef = doc(collection(itineraryRef, "days"));
        const dayDoc = dayToFirestore(dayData);
        batch.set(dayRef, dayDoc);

        // Create activities for this day
        if (dayData.activities && dayData.activities.length > 0) {
          for (const activityData of dayData.activities) {
            const activityRef = doc(collection(dayRef, "activities"));
            const activityDoc = activityToFirestore(activityData);
            batch.set(activityRef, activityDoc);
          }
        }
      }
    }

    console.log("🔍 DEBUG - About to commit batch write...");
    await batch.commit();
    console.log("✅ Itinerary created successfully:", tripId);

    // Update user's trips array
    await addItineraryToUser(itineraryData.userId, tripId);

    return tripId;
  } catch (error: any) {
    console.error("❌ Error creating itinerary:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error code:", error.code);
    throw new Error("Failed to create itinerary: " + error.message);
  }
}

/**
 * Get a complete itinerary with all days and activities
 */
export async function getItinerary(
  tripId: string
): Promise<ItineraryClient | null> {
  try {
    console.log("🔍 Fetching itinerary:", tripId);

    const itineraryRef = doc(db, "itinerary", tripId);
    const itinerarySnap = await getDoc(itineraryRef);

    if (!itinerarySnap.exists()) {
      console.warn("⚠️ Itinerary not found:", tripId);
      return null;
    }

    const itineraryData = itineraryFromFirestore(
      itinerarySnap.id,
      itinerarySnap.data() as Itinerary
    );

    console.log("🔍 Itinerary main doc fetched, getting days...");

    // Fetch days
    const daysRef = collection(itineraryRef, "days");
    const daysQuery = query(daysRef, orderBy("dayNumber", "asc"));
    const daysSnap = await getDocs(daysQuery);

    console.log("🔍 Found", daysSnap.docs.length, "days");

    const days: DayClient[] = [];

    for (const dayDoc of daysSnap.docs) {
      const dayData = dayFromFirestore(dayDoc.id, dayDoc.data() as Day);

      // Fetch activities for this day
      const activitiesRef = collection(dayDoc.ref, "activities");
      const activitiesQuery = query(activitiesRef, orderBy("order", "asc"));
      const activitiesSnap = await getDocs(activitiesQuery);

      console.log(
        "🔍 Day",
        dayData.dayNumber,
        "has",
        activitiesSnap.docs.length,
        "activities"
      );

      const activities: ActivityClient[] = activitiesSnap.docs.map((actDoc) =>
        activityFromFirestore(actDoc.id, actDoc.data() as Activity)
      );

      dayData.activities = activities;
      days.push(dayData);
    }

    itineraryData.days = days;

    console.log("✅ Itinerary fetched successfully:", tripId);
    return itineraryData;
  } catch (error: any) {
    console.error("❌ Error fetching itinerary:", error.message);
    console.error("❌ Error details:", error);
    return null;
  }
}

/**
 * Get all itineraries for a user
 */
export async function getUserItineraries(
  userId: string
): Promise<ItineraryClient[]> {
  try {
    console.log("🔍 getUserItineraries called for userId:", userId);

    const itinerariesRef = collection(db, "itinerary");

    // Simplified query without orderBy to avoid composite index requirement
    const q = query(itinerariesRef, where("userId", "==", userId));

    console.log("🔍 Executing query...");
    const querySnapshot = await getDocs(q);
    console.log("🔍 Query returned", querySnapshot.docs.length, "documents");

    const itineraries: ItineraryClient[] = [];

    for (const docSnap of querySnapshot.docs) {
      console.log("🔍 Fetching itinerary:", docSnap.id);
      const itinerary = await getItinerary(docSnap.id);
      if (itinerary) {
        itineraries.push(itinerary);
      }
    }

    // Sort in JavaScript instead of Firestore (avoids composite index)
    itineraries.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log(
      `✅ Retrieved ${itineraries.length} itineraries for user ${userId}`
    );
    return itineraries;
  } catch (error: any) {
    console.error("❌ Error getting user itineraries:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
    return [];
  }
}

/**
 * Get activities for a specific day
 */
export async function getDayActivities(
  tripId: string,
  dayId: string
): Promise<ActivityClient[]> {
  try {
    const activitiesRef = collection(
      db,
      "itinerary",
      tripId,
      "days",
      dayId,
      "activities"
    );
    const q = query(activitiesRef, orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);

    const activities: ActivityClient[] = querySnapshot.docs.map((doc) =>
      activityFromFirestore(doc.id, doc.data() as Activity)
    );

    console.log(
      `✅ Retrieved ${activities.length} activities for day ${dayId}`
    );
    return activities;
  } catch (error: any) {
    console.error("❌ Error fetching day activities:", error.message);
    return [];
  }
}

/**
 * Update an itinerary (main document only)
 */
export async function updateItinerary(
  tripId: string,
  updates: Partial<ItineraryClient>
): Promise<void> {
  try {
    const itineraryRef = doc(db, "itinerary", tripId);

    const updateData: any = {};
    if (updates.destination) updateData.destination = updates.destination;
    if (updates.startDate)
      updateData.startDate = Timestamp.fromDate(new Date(updates.startDate));
    if (updates.endDate)
      updateData.endDate = Timestamp.fromDate(new Date(updates.endDate));
    if (updates.interests) updateData.interests = updates.interests;

    updateData.updatedAt = Timestamp.now();

    await setDoc(itineraryRef, updateData, { merge: true });
    console.log("✅ Itinerary updated successfully:", tripId);
  } catch (error: any) {
    console.error("❌ Error updating itinerary:", error.message);
    throw new Error("Failed to update itinerary: " + error.message);
  }
}

/**
 * Delete an itinerary and all its subcollections
 */
export async function deleteItinerary(
  tripId: string,
  userId: string
): Promise<void> {
  try {
    // Verify ownership
    const itinerary = await getItinerary(tripId);
    if (!itinerary || itinerary.userId !== userId) {
      throw new Error("Itinerary not found or unauthorized");
    }

    const batch = writeBatch(db);

    // Delete all activities in all days
    const daysRef = collection(db, "itinerary", tripId, "days");
    const daysSnap = await getDocs(daysRef);

    for (const dayDoc of daysSnap.docs) {
      const activitiesRef = collection(dayDoc.ref, "activities");
      const activitiesSnap = await getDocs(activitiesRef);

      activitiesSnap.docs.forEach((actDoc) => {
        batch.delete(actDoc.ref);
      });

      batch.delete(dayDoc.ref);
    }

    // Delete main itinerary document
    const itineraryRef = doc(db, "itinerary", tripId);
    batch.delete(itineraryRef);

    await batch.commit();

    // Remove from user's trips array
    await removeItineraryFromUser(userId, tripId);

    console.log("✅ Itinerary deleted successfully:", tripId);
  } catch (error: any) {
    console.error("❌ Error deleting itinerary:", error.message);
    throw new Error("Failed to delete itinerary: " + error.message);
  }
}

/**
 * Add activity to a specific day
 */
export async function addActivity(
  tripId: string,
  dayId: string,
  activity: ActivityClient
): Promise<string> {
  try {
    const activitiesRef = collection(
      db,
      "itinerary",
      tripId,
      "days",
      dayId,
      "activities"
    );
    const activityRef = doc(activitiesRef);
    const activityDoc = activityToFirestore(activity);

    await setDoc(activityRef, activityDoc);

    console.log("✅ Activity added successfully:", activityRef.id);
    return activityRef.id;
  } catch (error: any) {
    console.error("❌ Error adding activity:", error.message);
    throw new Error("Failed to add activity: " + error.message);
  }
}

/**
 * Update an activity
 */
export async function updateActivity(
  tripId: string,
  dayId: string,
  activityId: string,
  updates: Partial<ActivityClient>
): Promise<void> {
  try {
    const activityRef = doc(
      db,
      "itinerary",
      tripId,
      "days",
      dayId,
      "activities",
      activityId
    );

    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.locationName) updateData.locationName = updates.locationName;
    if (updates.locationGeo)
      updateData.locationGeo = new GeoPoint(
        updates.locationGeo.latitude,
        updates.locationGeo.longitude
      );
    if (updates.timeStart)
      updateData.timeStart = Timestamp.fromDate(new Date(updates.timeStart));
    if (updates.timeEnd)
      updateData.timeEnd = Timestamp.fromDate(new Date(updates.timeEnd));
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.description) updateData.description = updates.description;
    if (updates.url !== undefined) updateData.url = updates.url;
    if (updates.order !== undefined) updateData.order = updates.order;

    await setDoc(activityRef, updateData, { merge: true });
    console.log("✅ Activity updated successfully:", activityId);
  } catch (error: any) {
    console.error("❌ Error updating activity:", error.message);
    throw new Error("Failed to update activity: " + error.message);
  }
}

/**
 * Delete an activity
 */
export async function deleteActivity(
  tripId: string,
  dayId: string,
  activityId: string
): Promise<void> {
  try {
    const activityRef = doc(
      db,
      "itinerary",
      tripId,
      "days",
      dayId,
      "activities",
      activityId
    );
    await deleteDoc(activityRef);
    console.log("✅ Activity deleted successfully:", activityId);
  } catch (error: any) {
    console.error("❌ Error deleting activity:", error.message);
    throw new Error("Failed to delete activity: " + error.message);
  }
}

// ============= HELPER FUNCTIONS =============

async function addItineraryToUser(
  userId: string,
  tripId: string
): Promise<void> {
  try {
    const { updateUserData, getUserData } = await import("./userLogin");
    const userData = await getUserData(userId);

    if (userData) {
      const trips = userData.trips || [];
      if (!trips.includes(tripId)) {
        trips.push(tripId);
        await updateUserData(userId, { trips });
      }
    }
  } catch (error: any) {
    console.error("❌ Error adding itinerary to user:", error.message);
  }
}

async function removeItineraryFromUser(
  userId: string,
  tripId: string
): Promise<void> {
  try {
    const { updateUserData, getUserData } = await import("./userLogin");
    const userData = await getUserData(userId);

    if (userData) {
      const trips = (userData.trips || []).filter((id) => id !== tripId);
      await updateUserData(userId, { trips });
    }
  } catch (error: any) {
    console.error("❌ Error removing itinerary from user:", error.message);
  }
}
