import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    DocumentSnapshot
  } from 'firebase/firestore';
  import { db, DEFAULT_COMPANY_ID } from '@/lib/firebase';
  import { uploadFile, deleteFile } from '@/lib/firebaseStorage';
  import { Company } from '@/types';
  import { 
    UserProfile, 
    UserRole, 
    assignUserToCompany, 
    deleteUserProfile,
    getUsersByCompany, 
    signUp, 
    updateUserRole 
  } from '@/lib/authService';
  import { getCompanies, getCompany, createCompany, updateCompany, deleteCompany } from '@/services/companyService';
  import { generateMockDashboardData } from '@/services/dashboardService';
  
  const USERS_COLLECTION = 'users';
  
  /**
   * Get system statistics for superadmin dashboard
   */
  export const getSystemStats = async (): Promise<{
    totalCompanies: number;
    totalUsers: number;
    usersByRole: Record<UserRole, number>;
    activeUsers: number;
  }> => {
    try {
      // Get all companies
      const companies = await getCompanies();
      
      // Get all users
      const usersRef = collection(db, USERS_COLLECTION);
      const snapshot = await getDocs(usersRef);
      
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          lastLogin: data.lastLogin?.toDate()
        } as UserProfile;
      });
      
      // Count users by role
      const usersByRole = users.reduce((acc, user) => {
        if (!acc[user.role]) {
          acc[user.role] = 0;
        }
        acc[user.role]++;
        return acc;
      }, {} as Record<UserRole, number>);
      
      // Count active users
      const activeUsers = users.filter(user => user.isActive).length;
      
      return {
        totalCompanies: companies.length,
        totalUsers: users.length,
        usersByRole,
        activeUsers
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      throw error;
    }
  };
  
  /**
   * Create company with admin
   */
  export const createCompanyWithAdmin = async (
    companyData: Omit<Company, 'id'>,
    adminEmail: string,
    adminPassword: string,
    adminName: string,
    adminPhone?: string
  ): Promise<{
    company: Company;
    admin: UserProfile;
  }> => {
    try {
      // Create the company first
      const company = await createCompany(companyData);
      
      // Then create the admin user
      const admin = await signUp({
        email: adminEmail,
        password: adminPassword,
        displayName: adminName,
        role: 'admin',
        companyId: company.id,
        phoneNumber: adminPhone
      });
      
      return { company, admin };
    } catch (error) {
      console.error('Error creating company with admin:', error);
      throw error;
    }
  };
  
  /**
   * Get paginated companies
   */
  export const getPaginatedCompanies = async (
    pageSize: number = 20,
    lastVisible?: DocumentSnapshot | null
  ): Promise<{
    companies: Company[];
    lastVisible: DocumentSnapshot | null;
    hasMore: boolean;
  }> => {
    try {
      const companiesRef = collection(db, 'companies');
      
      let q;
      if (lastVisible) {
        q = query(
          companiesRef,
          orderBy('name', 'asc'),
          startAfter(lastVisible),
          limit(pageSize + 1) // Get one extra to check if there are more
        );
      } else {
        q = query(
          companiesRef,
          orderBy('name', 'asc'),
          limit(pageSize + 1) // Get one extra to check if there are more
        );
      }
      
      const snapshot = await getDocs(q);
      
      const hasMore = snapshot.docs.length > pageSize;
      const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
      
      const companies = docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Company));
      
      const newLastVisible = docs.length > 0 ? docs[docs.length - 1] : null;
      
      return {
        companies,
        lastVisible: newLastVisible,
        hasMore
      };
    } catch (error) {
      console.error('Error getting paginated companies:', error);
      throw error;
    }
  };
  
  /**
   * Search users with pagination
   */
  export const searchUsers = async (
    filters: {
      role?: UserRole;
      companyId?: string;
      nameQuery?: string;
      isActive?: boolean;
    },
    pageSize: number = 20,
    lastVisible?: DocumentSnapshot | null
  ): Promise<{
    users: UserProfile[];
    lastVisible: DocumentSnapshot | null;
    hasMore: boolean;
  }> => {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      
      // Build query constraints
      const constraints: any[] = [];
      
      if (filters.role) {
        constraints.push(where('role', '==', filters.role));
      }
      
      if (filters.companyId) {
        constraints.push(where('companyId', '==', filters.companyId));
      }
      
      if (filters.isActive !== undefined) {
        constraints.push(where('isActive', '==', filters.isActive));
      }
      
      constraints.push(orderBy('displayName', 'asc'));
      
      if (lastVisible) {
        constraints.push(startAfter(lastVisible));
      }
      
      constraints.push(limit(pageSize + 1)); // Get one extra to check if there are more
      
      const q = query(usersRef, ...constraints);
      const snapshot = await getDocs(q);
      
      const hasMore = snapshot.docs.length > pageSize;
      const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
      
      let users = docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          lastLogin: data.lastLogin?.toDate()
        } as UserProfile;
      });
      
      // Apply client-side filtering for nameQuery
      if (filters.nameQuery) {
        const query = filters.nameQuery.toLowerCase();
        users = users.filter(user => 
          user.displayName.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query)
        );
      }
      
      const newLastVisible = docs.length > 0 ? docs[docs.length - 1] : null;
      
      return {
        users,
        lastVisible: newLastVisible,
        hasMore
      };
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  };
  
  /**
   * Create admin user for a company
   */
  export const createCompanyAdmin = async (
    companyId: string,
    email: string,
    password: string,
    displayName: string,
    phoneNumber?: string
  ): Promise<UserProfile> => {
    try {
      // Verify company exists
      const company = await getCompany(companyId);
      if (!company) {
        throw new Error(`Company with ID ${companyId} not found`);
      }
      
      // Create user with admin role
      return signUp({
        email,
        password,
        displayName,
        role: 'admin',
        companyId,
        phoneNumber
      });
    } catch (error) {
      console.error('Error creating company admin:', error);
      throw error;
    }
  };
  
  /**
   * Set user active status
   */
  export const setUserActiveStatus = async (
    uid: string, 
    isActive: boolean
  ): Promise<UserProfile> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      await updateDoc(userRef, { isActive });
      
      // Get updated user profile
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        throw new Error(`User with ID ${uid} not found`);
      }
      
      const data = docSnap.data();
      return {
        uid,
        ...data,
        createdAt: data.createdAt.toDate(),
        lastLogin: data.lastLogin?.toDate()
      } as UserProfile;
    } catch (error) {
      console.error(`Error setting user (${uid}) active status:`, error);
      throw error;
    }
  };
  
  // Export existing functions from authService that are needed for superAdmin
  export { 
    signUp, 
    updateUserRole, 
    assignUserToCompany, 
    deleteUserProfile, 
    getUsersByCompany 
  };
  
  // Re-export existing functions from companyService
  export {
    getCompanies,
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany
  };