import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    startAfter,
    DocumentSnapshot,
    updateDoc
  } from 'firebase/firestore';
  import { db, DEFAULT_COMPANY_ID } from '@/lib/firebase';
  import { UserProfile, signUp, getUsersByCompany } from '@/lib/authService';
  import { getCompany, updateCompany, uploadCompanyLogo } from '@/services/companyService';
  import { getDashboardMetrics } from '@/services/dashboardService';
  import { Company, DashboardMetrics } from '@/types';
  
  const USERS_COLLECTION = 'users';
  
  /**
   * Create employee user
   */
  export const createEmployee = async (
    companyId: string,
    email: string,
    password: string,
    displayName: string,
    phoneNumber?: string
  ): Promise<UserProfile> => {
    try {
      return signUp({
        email,
        password,
        displayName,
        role: 'employee',
        companyId,
        phoneNumber
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  };
  
  /**
   * Get company users with pagination
   */
  export const getCompanyUsersPaginated = async (
    companyId: string,
    pageSize: number = 20,
    lastVisible?: DocumentSnapshot | null
  ): Promise<{
    users: UserProfile[];
    lastVisible: DocumentSnapshot | null;
    hasMore: boolean;
  }> => {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      
      let q;
      if (lastVisible) {
        q = query(
          usersRef,
          where('companyId', '==', companyId),
          orderBy('displayName', 'asc'),
          startAfter(lastVisible),
          limit(pageSize + 1) // Get one extra to check if there are more
        );
      } else {
        q = query(
          usersRef,
          where('companyId', '==', companyId),
          orderBy('displayName', 'asc'),
          limit(pageSize + 1) // Get one extra to check if there are more
        );
      }
      
      const snapshot = await getDocs(q);
      
      const hasMore = snapshot.docs.length > pageSize;
      const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
      
      const users = docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          lastLogin: data.lastLogin?.toDate()
        } as UserProfile;
      });
      
      const newLastVisible = docs.length > 0 ? docs[docs.length - 1] : null;
      
      return {
        users,
        lastVisible: newLastVisible,
        hasMore
      };
    } catch (error) {
      console.error('Error getting paginated company users:', error);
      throw error;
    }
  };
  
  /**
   * Update company user (as admin)
   * Note: Admins can only update certain fields
   */
  export const updateCompanyUser = async (
    companyId: string,
    uid: string,
    data: {
      displayName?: string;
      phoneNumber?: string;
      isActive?: boolean;
    }
  ): Promise<UserProfile> => {
    try {
      // First check if user belongs to the company
      const userRef = doc(db, USERS_COLLECTION, uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error(`User with ID ${uid} not found`);
      }
      
      const userData = userSnap.data();
      if (userData.companyId !== companyId) {
        throw new Error('User does not belong to this company');
      }
      
      // Don't allow changing role
      const updateData = { ...data };
      delete (updateData as any).role;
      delete (updateData as any).companyId;
      
      // Update the user
      await updateDoc(userRef, updateData);
      
      // Get updated user data
      const updatedSnap = await getDoc(userRef);
      const updatedData = updatedSnap.data();
      
      return {
        uid,
        ...updatedData,
      } as UserProfile;
    } catch (error) {
      console.error('Error updating company user:', error);
      throw error;
    }
  };
  
  /**
   * Search company users
   */
  export const searchCompanyUsers = async (
    companyId: string,
    filters: {
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
      const constraints: any[] = [
        where('companyId', '==', companyId)
      ];
      
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
      console.error('Error searching company users:', error);
      throw error;
    }
  };
  
  /**
   * Get company stats
   */
  export const getCompanyStats = async (
    companyId: string = DEFAULT_COMPANY_ID
  ): Promise<{
    totalUsers: number;
    activeUsers: number;
    dashboard: DashboardMetrics;
  }> => {
    try {
      // Get company users
      const users = await getUsersByCompany(companyId);
      
      // Get dashboard metrics
      const dashboard = await getDashboardMetrics(companyId);
      
      return {
        totalUsers: users.length,
        activeUsers: users.filter(user => user.isActive).length,
        dashboard
      };
    } catch (error) {
      console.error('Error getting company stats:', error);
      throw error;
    }
  };
  
  /**
   * Generate company report
   */
  export const generateCompanyReport = async (
    companyId: string,
    reportType: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date
  ): Promise<any> => {
    try {
      // This would connect to your actual data
      // For now, let's return a mock report
      return {
        companyId,
        reportType,
        startDate,
        endDate,
        generatedAt: new Date(),
        data: {
          // Report data would go here
          entries: 250,
          exits: 220,
          incidents: 20,
          topBlocks: ['A', 'C', 'B'],
          topVisitors: [
            { name: "John Smith", count: 15 },
            { name: "Jane Doe", count: 12 },
            { name: "Bob Johnson", count: 10 }
          ]
        }
      };
    } catch (error) {
      console.error('Error generating company report:', error);
      throw error;
    }
  };
  
  // Re-export existing functions that admins need
  export {
    getCompany,
    updateCompany,
    uploadCompanyLogo,
    getDashboardMetrics,
    getUsersByCompany
  };