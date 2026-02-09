import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { app, db } from "./firebase";

// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// User interface for Firestore
export interface UserData {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  preferences?: {
    interests?: string[];
    cities?: string[];
  };
  trips?: string[]; // Array of trip IDs
}

/**
 * Sign up a new user with email and password
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: User; userData: UserData }> => {
  try {
    // Create user in Firebase Auth
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Create user document in Firestore
    const userData: UserData = {
      uid: user.uid,
      email: user.email || email,
      displayName: displayName || null,
      photoURL: null,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      lastLoginAt: serverTimestamp() as Timestamp,
      preferences: {
        interests: [],
        cities: [],
      },
      trips: [],
    };

    await setDoc(doc(db, "users", user.uid), userData);

    console.log("✅ User signed up successfully:", user.uid);
    return { user, userData };
  } catch (error: any) {
    console.error("❌ Error signing up:", error.message);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Sign in an existing user with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ user: User; userData: UserData | null }> => {
  try {
    // Sign in with Firebase Auth
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update last login time in Firestore
    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Get user data from Firestore
    const userData = await getUserData(user.uid);

    console.log("✅ User signed in successfully:", user.uid);
    return { user, userData };
  } catch (error: any) {
    console.error("❌ Error signing in:", error.message);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<{
  user: User;
  userData: UserData;
  isNewUser: boolean;
}> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user document exists
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    let isNewUser = false;
    let userData: UserData;

    if (!userDocSnap.exists()) {
      // New user - create document
      isNewUser = true;
      userData = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        lastLoginAt: serverTimestamp() as Timestamp,
        preferences: {
          interests: [],
          cities: [],
        },
        trips: [],
      };
      await setDoc(userDocRef, userData);
      console.log("✅ New Google user created:", user.uid);
    } else {
      // Existing user - update last login
      await updateDoc(userDocRef, {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      userData = userDocSnap.data() as UserData;
      console.log("✅ Existing Google user signed in:", user.uid);
    }

    return { user, userData, isNewUser };
  } catch (error: any) {
    console.error("❌ Error signing in with Google:", error.message);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Sign out the current user
 */
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log("✅ User signed out successfully");
  } catch (error: any) {
    console.error("❌ Error signing out:", error.message);
    throw new Error("Failed to sign out");
  }
};

/**
 * Get user data from Firestore
 */
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return userDocSnap.data() as UserData;
    } else {
      console.warn("⚠️ User document not found for uid:", uid);
      return null;
    }
  } catch (error: any) {
    console.error("❌ Error getting user data:", error.message);
    return null;
  }
};

/**
 * Update user data in Firestore
 */
export const updateUserData = async (
  uid: string,
  data: Partial<UserData>
): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    console.log("✅ User data updated successfully");
  } catch (error: any) {
    console.error("❌ Error updating user data:", error.message);
    throw new Error("Failed to update user data");
  }
};

/**
 * Update user preferences (interests, cities)
 */
export const updateUserPreferences = async (
  uid: string,
  preferences: { interests?: string[]; cities?: string[] }
): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, {
      preferences,
      updatedAt: serverTimestamp(),
    });
    console.log("✅ User preferences updated successfully");
  } catch (error: any) {
    console.error("❌ Error updating user preferences:", error.message);
    throw new Error("Failed to update preferences");
  }
};

/**
 * Add a trip ID to user's trips array
 */
export const addTripToUser = async (
  uid: string,
  tripId: string
): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data() as UserData;
      const trips = userData.trips || [];

      if (!trips.includes(tripId)) {
        trips.push(tripId);
        await updateDoc(userDocRef, {
          trips,
          updatedAt: serverTimestamp(),
        });
        console.log("✅ Trip added to user successfully");
      }
    }
  } catch (error: any) {
    console.error("❌ Error adding trip to user:", error.message);
    throw new Error("Failed to add trip");
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("✅ Password reset email sent");
  } catch (error: any) {
    console.error("❌ Error sending password reset:", error.message);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Get current user's UID
 */
export const getCurrentUserUID = (): string | null => {
  return auth.currentUser?.uid || null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null;
};

/**
 * Convert Firebase error codes to user-friendly messages
 */
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please sign in instead.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/operation-not-allowed":
      return "Operation not allowed. Please contact support.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before completion.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for sign-in. Please contact the administrator.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials.";
    default:
      return "An error occurred. Please try again.";
  }
};

/**
 * Save user interests (alias for updateUserPreferences with just interests)
 */
export const saveUserInterests = async (
  uid: string,
  interests: string[]
): Promise<void> => {
  return updateUserPreferences(uid, { interests });
};

// Export auth instance for direct use if needed
export { auth };
