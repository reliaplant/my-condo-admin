import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    User,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    updateEmail
  } from 'firebase/auth';
  import { doc, getDoc, setDoc, updateDoc, collection, query, getDocs, where } from 'firebase/firestore';
  import { auth, db, DEFAULT_COMPANY_ID } from './firebase';
  
  // User roles
  export type UserRole = 'superAdmin' | 'admin' | 'employee';
  
  // User profile in Firestore
  export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    companyId?: string;
    photoURL?: string;
    phoneNumber?: string;
    createdAt: Date;
    lastLogin?: Date;
    isActive: boolean;
  }
  
  // Auth state
  export interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    initialized: boolean;
    loading: boolean;
  }
  
  // Login credentials
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  // Sign up data
  export interface SignUpData {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
    companyId?: string;
    phoneNumber?: string;
  }
  
  // Collection name
  const USERS_COLLECTION = 'users';
  
  /**
   * Sign in with email and password
   */
  export const signIn = async (credentials: LoginCredentials): Promise<UserProfile> => {
    try {
      const { email, password } = credentials;
      
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;
      // Get user profile from Firestore
      const profile = await getUserProfile(user.uid);
      // Update last login
      if (profile) {
        await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
          lastLogin: new Date()
        });
        
        return {
          ...profile,
          lastLogin: new Date()
        };
      }
      
      throw new Error('User profile not found');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };
  
  /**
   * Sign out
   */
  export const logOut = async (): Promise<void> => {
    await signOut(auth);
  };
  
  /**
   * Sign up a new user
   * Note: This should only be called by superAdmin or admins
   */
  export const signUp = async (data: SignUpData): Promise<UserProfile> => {
    try {
      const { email, password, displayName, role, companyId, phoneNumber } = data;
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;
      
      // Update display name
      await updateProfile(user, { displayName });
      
      // Create user profile in Firestore
      const profile: UserProfile = {
        uid: user.uid,
        email,
        displayName,
        role,
        companyId: role === 'superAdmin' ? undefined : (companyId || DEFAULT_COMPANY_ID),
        phoneNumber,
        createdAt: new Date(),
        lastLogin: new Date(),
        isActive: true
      };
      
      await setDoc(doc(db, USERS_COLLECTION, user.uid), profile);
      
      return profile;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };
  
  /**
   * Send password reset email
   */
  export const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };
  
  /**
   * Get user profile from Firestore
   */
  export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, USERS_COLLECTION, uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          uid,
          createdAt: data.createdAt.toDate(),
          lastLogin: data.lastLogin?.toDate()
        } as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  };
  
  /**
   * Update user profile
   */
  export const updateUserProfile = async (
    uid: string, 
    data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>
  ): Promise<UserProfile> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      await updateDoc(userRef, data);
      
      const updatedProfile = await getUserProfile(uid);
      
      if (!updatedProfile) {
        throw new Error('User profile not found');
      }
      
      return updatedProfile;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  };
  
  /**
   * Get current auth state
   */
  export const getCurrentAuthState = async (): Promise<AuthState> => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const profile = await getUserProfile(user.uid);
          resolve({
            user,
            profile,
            initialized: true,
            loading: false
          });
        } else {
          resolve({
            user: null,
            profile: null,
            initialized: true,
            loading: false
          });
        }
        unsubscribe();
      });
    });
  };
  
  /**
   * Change user password
   */
  export const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user');
      }
      
      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update the password
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };
  
  /**
   * Change user email
   */
  export const changeEmail = async (
    currentPassword: string,
    newEmail: string
  ): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user');
      }
      
      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update the email
      await updateEmail(user, newEmail);
      
      // Update the user profile in Firestore
      await updateUserProfile(user.uid, { email: newEmail });
    } catch (error) {
      console.error('Change email error:', error);
      throw error;
    }
  };
  
  /**
   * Get all users
   */
  export const getUsers = async (): Promise<UserProfile[]> => {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const snapshot = await getDocs(usersRef);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          lastLogin: data.lastLogin?.toDate()
        } as UserProfile;
      });
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  };
  
  /**
   * Get users by role
   */
  export const getUsersByRole = async (role: UserRole): Promise<UserProfile[]> => {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where('role', '==', role));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          lastLogin: data.lastLogin?.toDate()
        } as UserProfile;
      });
    } catch (error) {
      console.error(`Get users by role (${role}) error:`, error);
      throw error;
    }
  };
  
  /**
   * Get users by company
   */
  export const getUsersByCompany = async (companyId: string): Promise<UserProfile[]> => {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          lastLogin: data.lastLogin?.toDate()
        } as UserProfile;
      });
    } catch (error) {
      console.error(`Get users by company (${companyId}) error:`, error);
      throw error;
    }
  };
  
  /**
   * Delete user (Firestore profile only)
   * Note: Deleting the actual auth user requires Firebase Admin SDK in a server function
   */
  export const deleteUserProfile = async (uid: string): Promise<void> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      await updateDoc(userRef, { isActive: false });
      // Note: We're soft-deleting by marking as inactive, rather than actually deleting
      // To hard delete, you would use: await deleteDoc(userRef);
    } catch (error) {
      console.error(`Delete user profile (${uid}) error:`, error);
      throw error;
    }
  };
  
  /**
   * Update user role
   */
  export const updateUserRole = async (uid: string, role: UserRole): Promise<UserProfile> => {
    return updateUserProfile(uid, { role });
  };
  
  /**
   * Assign user to company
   */
  export const assignUserToCompany = async (uid: string, companyId: string): Promise<UserProfile> => {
    return updateUserProfile(uid, { companyId });
  };
  
  /**
   * Check if user has role
   */
  export const hasRole = (
    profile: UserProfile | null, 
    roles: UserRole | UserRole[]
  ): boolean => {
    if (!profile) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(profile.role);
    }
    
    return profile.role === roles;
  };
  
  /**
   * Check if user belongs to company
   */
  export const belongsToCompany = (
    profile: UserProfile | null,
    companyId: string
  ): boolean => {
    if (!profile) return false;
    
    // SuperAdmin can access any company
    if (profile.role === 'superAdmin') return true;
    
    return profile.companyId === companyId;
  };
  
  /**
   * Listen to auth changes
   */
  export const listenToAuthChanges = (
    callback: (authState: AuthState) => void
  ): () => void => {
    let isInitialized = false;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        callback({
          user,
          profile,
          initialized: true,
          loading: false
        });
      } else {
        callback({
          user: null,
          profile: null,
          initialized: true,
          loading: false
        });
      }
      
      if (!isInitialized) {
        isInitialized = true;
      }
    });
    
    return unsubscribe;
  };