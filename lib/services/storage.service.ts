import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}

export class StorageService {
  /**
   * Upload a file to Firebase Storage
   */
  async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      const storageRef = ref(storage, path);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        path: snapshot.ref.fullPath,
        name: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error: any) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload doctor document
   */
  async uploadDoctorDocument(
    doctorId: string,
    file: File,
    documentType: 'prc_license' | 'medical_diploma' | 'specialty_certificate' | 'other'
  ): Promise<UploadResult> {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${documentType}_${timestamp}.${extension}`;
    const path = `doctors/${doctorId}/documents/${filename}`;
    
    return this.uploadFile(file, path);
  }

  /**
   * Upload profile avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<UploadResult> {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `avatar_${timestamp}.${extension}`;
    const path = `avatars/${userId}/${filename}`;
    
    return this.uploadFile(file, path);
  }

  /**
   * Delete file from storage
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error: any) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(path: string): Promise<string[]> {
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);
      
      return result.items.map(item => item.fullPath);
    } catch (error: any) {
      throw new Error(`List files failed: ${error.message}`);
    }
  }

  /**
   * Validate file type and size
   */
  validateFile(file: File, options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}): { valid: boolean; error?: string } {
    const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options; // 10MB default
    
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }
    
    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type must be one of: ${allowedTypes.join(', ')}`
      };
    }
    
    return { valid: true };
  }

  /**
   * Get file info from URL
   */
  getFileInfoFromURL(url: string): { path: string; name: string } | null {
    try {
      const urlObj = new URL(url);
      const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
      const name = path.split('/').pop() || '';
      
      return { path, name };
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();