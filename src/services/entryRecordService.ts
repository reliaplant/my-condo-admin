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
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db, DEFAULT_COMPANY_ID } from '@/lib/firebase';
import { uploadFile, deleteFile } from '@/lib/firebaseStorage';
import { EntryRecord } from '@/types';

export const getEntryRecords = async (companyId: string = DEFAULT_COMPANY_ID): Promise<EntryRecord[]> => {
  const entryRecordsRef = collection(db, `entryRecords`);
  const q = query(entryRecordsRef, orderBy('entryTime', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      companyId,
      ...data,
      entryTime: data.entryTime?.toDate(),
      exitTime: data.exitTime?.toDate() || undefined
    } as EntryRecord;
  });
};

export const getEntryRecord = async (id: string, companyId: string = DEFAULT_COMPANY_ID): Promise<EntryRecord | null> => {
  const docRef = doc(db, `entryRecords`, id);
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const data = snapshot.data();
  return {
    id: snapshot.id,
    companyId,
    ...data,
    entryTime: data.entryTime?.toDate(),
    exitTime: data.exitTime?.toDate() || undefined
  } as EntryRecord;
};

export const createEntryRecord = async (
  record: Omit<EntryRecord, 'id'>, 
  visitorPhotoFile?: File
): Promise<EntryRecord> => {
  const { companyId = DEFAULT_COMPANY_ID, ...data } = record;
  
  // Handle visitor photo upload if provided
  let visitorPhoto = record.visitorPhoto;
  if (visitorPhotoFile) {
    visitorPhoto = await uploadFile(visitorPhotoFile, 'visitorPhotos', companyId);
  }
  
  // Convert JS Date to Firestore Timestamp
  const recordData = {
    ...data,
    visitorPhoto,
    entryTime: Timestamp.fromDate(record.entryTime),
    exitTime: record.exitTime ? Timestamp.fromDate(record.exitTime) : null
  };
  
  const docRef = await addDoc(collection(db, `entryRecords`), recordData);
  
  return {
    id: docRef.id,
    companyId,
    ...data,
    visitorPhoto
  };
};

export const updateEntryRecord = async (
  id: string, 
  data: Partial<EntryRecord>,
  visitorPhotoFile?: File,
  companyId: string = DEFAULT_COMPANY_ID
): Promise<void> => {
  const docRef = doc(db, `entryRecords`, id);
  
  // Handle visitor photo update if provided
  let visitorPhoto = data.visitorPhoto;
  if (visitorPhotoFile) {
    // Get current record to check if there's an existing photo
    const currentRecord = await getEntryRecord(id, companyId);
    
    // Delete old photo if exists
    if (currentRecord?.visitorPhoto) {
      try {
        await deleteFile(currentRecord.visitorPhoto);
      } catch (error) {
        console.error('Failed to delete old visitor photo', error);
      }
    }
    
    // Upload new photo
    visitorPhoto = await uploadFile(visitorPhotoFile, 'visitorPhotos', companyId);
    data.visitorPhoto = visitorPhoto;
  }
  
  // Convert dates to Firestore Timestamps
  const updateData: Record<string, any> = { ...data };
  if (updateData.entryTime) {
    updateData.entryTime = Timestamp.fromDate(updateData.entryTime);
  }
  if (updateData.exitTime) {
    updateData.exitTime = Timestamp.fromDate(updateData.exitTime);
  }
  
  await updateDoc(docRef, updateData);
};

export const deleteEntryRecord = async (id: string, companyId: string = DEFAULT_COMPANY_ID): Promise<void> => {
  // Get the record to check for photo
  const record = await getEntryRecord(id, companyId);
  
  // Delete the visitor photo if exists
  if (record?.visitorPhoto) {
    try {
      await deleteFile(record.visitorPhoto);
    } catch (error) {
      console.error('Failed to delete visitor photo', error);
    }
  }
  
  // Delete the record
  const docRef = doc(db, `entryRecords`, id);
  await deleteDoc(docRef);
};

export const recordExit = async (id: string, companyId: string = DEFAULT_COMPANY_ID): Promise<void> => {
  const docRef = doc(db, `entryRecords`, id);
  
  await updateDoc(docRef, {
    exitTime: Timestamp.now()
  });
};
