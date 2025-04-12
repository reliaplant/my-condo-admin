import { collection, getDocs, query, where, getCountFromServer, orderBy, limit, getDoc, doc, addDoc, serverTimestamp, setDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// Get system-wide statistics for the SuperAdmin dashboard
export const getSystemStats = async () => {
  try {
    // Get total companies count
    const companiesRef = collection(db, 'companies');
    const companiesSnapshot = await getCountFromServer(companiesRef);
    const totalCompanies = companiesSnapshot.data().count;
    
    // Get active companies count
    const activeCompaniesQuery = query(companiesRef, where('isActive', '==', true));
    const activeCompaniesSnapshot = await getCountFromServer(activeCompaniesQuery);
    const activeCompanies = activeCompaniesSnapshot.data().count;
    
    // Get total users count
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getCountFromServer(usersRef);
    const totalUsers = usersSnapshot.data().count;
    
    // Get active users count
    const activeUsersQuery = query(usersRef, where('isActive', '==', true));
    const activeUsersSnapshot = await getCountFromServer(activeUsersQuery);
    const activeUsers = activeUsersSnapshot.data().count;
    
    // Get count of users by role
    const usersByRole = {
      superAdmin: 0,
      admin: 0,
      user: 0
    };
    
    // Get superAdmin count
    const superAdminQuery = query(usersRef, where('role', '==', 'superAdmin'));
    const superAdminSnapshot = await getCountFromServer(superAdminQuery);
    usersByRole.superAdmin = superAdminSnapshot.data().count;
    
    // Get admin count
    const adminQuery = query(usersRef, where('role', '==', 'admin'));
    const adminSnapshot = await getCountFromServer(adminQuery);
    usersByRole.admin = adminSnapshot.data().count;
    
    // Get regular user count
    const regularUserQuery = query(usersRef, where('role', '==', 'user'));
    const regularUserSnapshot = await getCountFromServer(regularUserQuery);
    usersByRole.user = regularUserSnapshot.data().count;
    
    // Get recent companies (limited to 5)
    const recentCompaniesQuery = query(
      companiesRef,
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const recentCompaniesSnapshot = await getDocs(recentCompaniesQuery);
    const recentCompanies: any = [];
    
    recentCompaniesSnapshot.forEach((doc) => {
      const data = doc.data();
      recentCompanies.push({
        id: doc.id,
        name: data.name,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        userCount: data.userCount || 0,
        isActive: data.isActive,
        createdAt: data.createdAt.toDate()
      });
    });
    
    // Get recent users (limited to 5)
    const recentUsersQuery = query(
      usersRef,
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const recentUsersSnapshot = await getDocs(recentUsersQuery);
    const recentUsers = [];
    
    for (const docSnapshot of recentUsersSnapshot.docs) {
      const data = docSnapshot.data();
      let companyName = '';
      
      // Look up the company name if companyId exists
      if (data.companyId) {
        try {
          const companyDoc = await getDoc(doc(db, 'companies', data.companyId));
          if (companyDoc.exists()) {
            companyName = companyDoc.data().name;
          }
        } catch (error) {
          console.error('Error fetching company:', error);
        }
      }
      
      recentUsers.push({
        id: docSnapshot.id,
        name: data.name,
        email: data.email,
        role: data.role,
        companyId: data.companyId || '',
        companyName: companyName,
        isActive: data.isActive,
        lastLogin: data.lastLogin ? data.lastLogin.toDate() : null,
        createdAt: data.createdAt.toDate()
      });
    }
    
    return {
      totalCompanies,
      activeCompanies,
      totalUsers,
      activeUsers,
      usersByRole,
      recentCompanies,
      recentUsers
    };
  } catch (error) {
    console.error('Error getting system stats:', error);
    throw error;
  }
};

// Additional function to handle company creation
export const createCompany = async (companyData: any) => {
  try {
    const companiesRef = collection(db, 'companies');
    const newCompanyRef = await addDoc(companiesRef, {
      ...companyData,
      isActive: true,
      userCount: 0,
      createdAt: serverTimestamp()
    });
    
    return newCompanyRef.id;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

// Additional function to handle user creation
export const createUser = async (userData: { email: any; password: any; name: any; role: any; companyId: string; }) => {
  try {
    // First create the auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    // Then store additional user data in Firestore
    const usersRef = collection(db, 'users');
    await setDoc(doc(usersRef, userCredential.user.uid), {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      companyId: userData.companyId || null,
      isActive: true,
      createdAt: serverTimestamp(),
      lastLogin: null
    });
    
    // If the user belongs to a company, increment the company's user count
    if (userData.companyId) {
      const companyRef = doc(db, 'companies', userData.companyId);
      await updateDoc(companyRef, {
        userCount: increment(1)
      });
    }
    
    return userCredential.user.uid;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};