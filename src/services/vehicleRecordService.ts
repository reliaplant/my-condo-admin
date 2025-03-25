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
  orderBy,
  limit
} from 'firebase/firestore';
import { db, DEFAULT_COMPANY_ID } from '@/lib/firebase';
import { uploadFile, deleteFile } from '@/lib/firebaseStorage';
import { VehicleRecord } from '@/types';

export const getVehicleRecords = async (
  companyId: string = DEFAULT_COMPANY_ID,
  limitCount = 100
): Promise<VehicleRecord[]> => {
  const vehicleRecordsRef = collection(db, `vehicleRecords`);
  const q = query(vehicleRecordsRef, orderBy('createdAt', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      companyId,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      timestamp: data.timestamp?.toDate() || new Date()
    } as VehicleRecord;
  });
};

export const getVehicleRecord = async (
  id: string, 
  companyId: string = DEFAULT_COMPANY_ID
): Promise<VehicleRecord | null> => {
  const docRef = doc(db, `vehicleRecords`, id);
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const data = snapshot.data();
  return {
    id: snapshot.id,
    companyId,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    timestamp: data.timestamp?.toDate() || new Date()
  } as VehicleRecord;
};

export const createVehicleRecord = async (
  record: Omit<VehicleRecord, 'id'>,
  plateImageFile?: File,
  idImageFile?: File
): Promise<VehicleRecord> => {
  const { companyId = DEFAULT_COMPANY_ID, ...data } = record;
  
  // Handle image uploads if provided
  let plateImageUrl = record.plateImageUrl;
  let idImageUrl = record.idImageUrl;
  
  if (plateImageFile) {
    plateImageUrl = await uploadFile(
      plateImageFile, 
      `vehicle_images/plates/${new Date().getTime()}_plate`
    );
  }
  
  if (idImageFile) {
    idImageUrl = await uploadFile(
      idImageFile, 
      `vehicle_images/ids/${new Date().getTime()}_id`
    );
  }
  
  // Convert JS Date to Firestore Timestamp
  const recordData = {
    ...data,
    plateImageUrl,
    idImageUrl,
    createdAt: Timestamp.fromDate(record.createdAt || new Date()),
    timestamp: Timestamp.fromDate(record.timestamp || new Date()),
    processed: record.processed || false
  };
  
  const docRef = await addDoc(collection(db, `vehicleRecords`), recordData);
  
  return {
    id: docRef.id,
    companyId,
    ...data,
    plateImageUrl,
    idImageUrl
  } as VehicleRecord;
};

export const updateVehicleRecord = async (
  id: string, 
  data: Partial<VehicleRecord>,
  plateImageFile?: File,
  idImageFile?: File,
  companyId: string = DEFAULT_COMPANY_ID
): Promise<void> => {
  const docRef = doc(db, `vehicleRecords`, id);
  
  // Handle image updates if provided
  const updateData: Record<string, any> = { ...data };
  
  if (plateImageFile) {
    const plateImageUrl = await uploadFile(
      plateImageFile, 
      `vehicle_images/plates/${new Date().getTime()}_plate`
    );
    updateData.plateImageUrl = plateImageUrl;
  }
  
  if (idImageFile) {
    const idImageUrl = await uploadFile(
      idImageFile, 
      `vehicle_images/ids/${new Date().getTime()}_id`
    );
    updateData.idImageUrl = idImageUrl;
  }
  
  // Convert dates to Firestore Timestamps if provided
  if (updateData.createdAt) {
    updateData.createdAt = Timestamp.fromDate(updateData.createdAt);
  }
  
  if (updateData.timestamp) {
    updateData.timestamp = Timestamp.fromDate(updateData.timestamp);
  }
  
  await updateDoc(docRef, updateData);
};

export const deleteVehicleRecord = async (
  id: string, 
  companyId: string = DEFAULT_COMPANY_ID
): Promise<void> => {
  // Get the record to check for images
  const record = await getVehicleRecord(id, companyId);
  
  // Delete the images if they exist
  if (record?.plateImageUrl) {
    try {
      await deleteFile(record.plateImageUrl);
    } catch (error) {
      console.error('Failed to delete plate image', error);
    }
  }
  
  if (record?.idImageUrl) {
    try {
      await deleteFile(record.idImageUrl);
    } catch (error) {
      console.error('Failed to delete ID image', error);
    }
  }
  
  // Delete the record
  const docRef = doc(db, `vehicleRecords`, id);
  await deleteDoc(docRef);
};

export const markAsProcessed = async (
  id: string, 
  companyId: string = DEFAULT_COMPANY_ID
): Promise<void> => {
  const docRef = doc(db, `vehicleRecords`, id);
  await updateDoc(docRef, { processed: true });
};

export const getVehicleRecordsByBlock = async (
  block: string,
  companyId: string = DEFAULT_COMPANY_ID
): Promise<VehicleRecord[]> => {
  const vehicleRecordsRef = collection(db, `vehicleRecords`);
  const q = query(
    vehicleRecordsRef, 
    where('houseBlock', '==', block),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      companyId,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      timestamp: data.timestamp?.toDate() || new Date()
    } as VehicleRecord;
  });
};

export const getVehicleRecordsByLicensePlate = async (
  licensePlate: string,
  companyId: string = DEFAULT_COMPANY_ID
): Promise<VehicleRecord[]> => {
  const vehicleRecordsRef = collection(db, `vehicleRecords`);
  const q = query(
    vehicleRecordsRef, 
    where('licensePlate', '==', licensePlate),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      companyId,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      timestamp: data.timestamp?.toDate() || new Date()
    } as VehicleRecord;
  });
};
