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
  setDoc
} from 'firebase/firestore';
import { db, DEFAULT_COMPANY_ID } from '@/lib/firebase';
import { uploadFile, deleteFile } from '@/lib/firebaseStorage';
import { Company } from '@/types';

const COMPANIES_COLLECTION = 'companies';

// Make sure "thandi" company exists in Firestore
export const ensureDefaultCompany = async (): Promise<void> => {
  const companyRef = doc(db, COMPANIES_COLLECTION, DEFAULT_COMPANY_ID);
  const snapshot = await getDoc(companyRef);
  
  if (!snapshot.exists()) {
    const defaultCompany: Omit<Company, 'id'> = {
      name: 'Thandi Inc.',
      address: '123 Main Street',
      contactPerson: 'Admin User',
      contactEmail: 'admin@thandi.com',
      contactPhone: '123-456-7890'
    };
    
    await setDoc(companyRef, defaultCompany);
    console.log('Default company created');
  }
};

export const getCompanies = async (): Promise<Company[]> => {
  const companiesRef = collection(db, COMPANIES_COLLECTION);
  const snapshot = await getDocs(companiesRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Company));
};

export const getCompany = async (id: string = DEFAULT_COMPANY_ID): Promise<Company | null> => {
  const docRef = doc(db, COMPANIES_COLLECTION, id);
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return {
    id: snapshot.id,
    ...snapshot.data()
  } as Company;
};

export const createCompany = async (company: Omit<Company, 'id'>): Promise<Company> => {
  const docRef = await addDoc(collection(db, COMPANIES_COLLECTION), company);
  
  return {
    id: docRef.id,
    ...company
  };
};

export const updateCompany = async (id: string = DEFAULT_COMPANY_ID, data: Partial<Company>): Promise<void> => {
  const docRef = doc(db, COMPANIES_COLLECTION, id);
  await updateDoc(docRef, data);
};

export const deleteCompany = async (id: string): Promise<void> => {
  const docRef = doc(db, COMPANIES_COLLECTION, id);
  await deleteDoc(docRef);
};

export const uploadCompanyLogo = async (
  file: File, 
  companyId: string = DEFAULT_COMPANY_ID
): Promise<string> => {
  // Get current company data
  const company = await getCompany(companyId);
  
  // If there's an existing logo, delete it
  if (company?.logo) {
    try {
      await deleteFile(company.logo);
    } catch (error) {
      console.error('Failed to delete old logo', error);
    }
  }
  
  // Upload new logo
  const logoUrl = await uploadFile(file, 'logos', companyId);
  
  // Update company record with new logo URL
  await updateCompany(companyId, { logo: logoUrl });
  
  return logoUrl;
};
