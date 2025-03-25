import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, DEFAULT_COMPANY_ID } from "./firebase";

/**
 * Uploads a file to Firebase Storage
 * @param file The file to upload
 * @param path The path inside the company folder (without company ID)
 * @param companyId The company ID
 * @returns The download URL of the uploaded file
 */
export const uploadFile = async (
  file: File, 
  path: string, 
  companyId: string = DEFAULT_COMPANY_ID
): Promise<string> => {
  const storageRef = ref(storage, `companies/${companyId}/${path}/${file.name}`);
  
  // Upload the file
  await uploadBytes(storageRef, file);
  
  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
};

/**
 * Deletes a file from Firebase Storage
 * @param url The full URL of the file to delete
 */
export const deleteFile = async (url: string): Promise<void> => {
  // Extract the path from the URL
  const storageRef = ref(storage, getPathFromUrl(url));
  
  // Delete the file
  await deleteObject(storageRef);
};

/**
 * Gets the storage path from a download URL
 * @param url The download URL
 * @returns The storage path
 */
const getPathFromUrl = (url: string): string => {
  // Extract the path portion from the URL
  // Note: This is a simplified approach and might need adjustment
  // based on your actual URL structure
  const pathRegex = /\/o\/(.+?)\?/;
  const match = url.match(pathRegex);
  
  if (!match || match.length < 2) {
    throw new Error("Invalid storage URL format");
  }
  
  return decodeURIComponent(match[1]);
};
