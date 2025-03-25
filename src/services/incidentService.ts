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
import { Incident } from '@/types';

export const getIncidents = async (companyId: string = DEFAULT_COMPANY_ID): Promise<Incident[]> => {
  const incidentsRef = collection(db, `incidents`);
  const q = query(incidentsRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      companyId,
      ...data,
      date: data.date?.toDate(),
      images: data.images || []
    } as Incident;
  });
};

export const getIncident = async (id: string, companyId: string = DEFAULT_COMPANY_ID): Promise<Incident | null> => {
  const docRef = doc(db, `incidents`, id);
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const data = snapshot.data();
  return {
    id: snapshot.id,
    companyId,
    ...data,
    date: data.date?.toDate(),
    images: data.images || []
  } as Incident;
};

export const createIncident = async (
  incident: Omit<Incident, 'id'>,
  imageFiles: File[] = []
): Promise<Incident> => {
  const { companyId = DEFAULT_COMPANY_ID, ...data } = incident;
  
  // Upload all image files
  const imageUrls: string[] = [];
  for (const file of imageFiles) {
    const url = await uploadFile(file, 'incidents', companyId);
    imageUrls.push(url);
  }
  
  // Combine provided images URLs with newly uploaded ones
  const allImages = [...(incident.images || []), ...imageUrls];
  
  // Convert JS Date to Firestore Timestamp
  const incidentData = {
    ...data,
    images: allImages,
    date: Timestamp.fromDate(incident.date)
  };
  
  const docRef = await addDoc(collection(db, `incidents`), incidentData);
  
  return {
    id: docRef.id,
    companyId,
    ...data,
    images: allImages
  };
};

export const updateIncident = async (
  id: string, 
  data: Partial<Incident>,
  newImageFiles: File[] = [],
  imagesToDelete: string[] = [],
  companyId: string = DEFAULT_COMPANY_ID
): Promise<void> => {
  // Get current incident data
  const currentIncident = await getIncident(id, companyId);
  if (!currentIncident) {
    throw new Error(`Incident with ID ${id} not found`);
  }
  
  // Delete images that should be removed
  for (const imageUrl of imagesToDelete) {
    try {
      await deleteFile(imageUrl);
    } catch (error) {
      console.error(`Failed to delete image: ${imageUrl}`, error);
    }
  }
  
  // Upload new images
  const newImageUrls: string[] = [];
  for (const file of newImageFiles) {
    const url = await uploadFile(file, 'incidents', companyId);
    newImageUrls.push(url);
  }
  
  // Update the images array: keep existing images except deleted ones, add new ones
  const updatedImages = [
    ...(currentIncident.images || []).filter(url => !imagesToDelete.includes(url)),
    ...newImageUrls
  ];
  
  // Prepare the data to update
  const updateData: Record<string, any> = { ...data };
  
  // Always update the images array
  updateData.images = updatedImages;
  
  // Convert date to Firestore Timestamp if provided
  if (updateData.date) {
    updateData.date = Timestamp.fromDate(updateData.date);
  }
  
  // Update the document
  const docRef = doc(db, `incidents`, id);
  await updateDoc(docRef, updateData);
};

export const deleteIncident = async (id: string, companyId: string = DEFAULT_COMPANY_ID): Promise<void> => {
  // Get the incident to check for images
  const incident = await getIncident(id, companyId);
  
  // Delete all associated images
  if (incident?.images && incident.images.length > 0) {
    for (const imageUrl of incident.images) {
      try {
        await deleteFile(imageUrl);
      } catch (error) {
        console.error(`Failed to delete image: ${imageUrl}`, error);
      }
    }
  }
  
  // Delete the incident document
  const docRef = doc(db, `incidents`, id);
  await deleteDoc(docRef);
};
