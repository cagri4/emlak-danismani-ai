import { uploadBytesResumable, ref, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { useUploadStore } from '../stores/uploadStore';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for uploading property photos with progress tracking.
 *
 * Features:
 * - Multi-file upload with per-file progress
 * - Background uploads continue when user navigates away (zustand persistence)
 * - Automatic property document update with photo URLs
 * - Uploads to properties/{propertyId}/{id}-{filename} path
 *
 * Cloud Function automatically generates thumbnails and compresses images.
 */
export function usePhotoUpload(propertyId: string) {
  const { user } = useAuth();
  const { addUploads, updateProgress, setComplete, setError, getUploadsForProperty, clearCompleted } = useUploadStore();

  const uploadPhotos = async (files: File[]) => {
    if (!user) {
      throw new Error('User must be authenticated to upload photos');
    }

    // Add files to upload store
    addUploads(files, propertyId);

    // Get the newly added uploads
    const uploads = getUploadsForProperty(propertyId).filter((u) => u.status === 'pending');

    // Start uploads for each file
    for (const upload of uploads) {
      const storageRef = ref(
        storage,
        `properties/${propertyId}/${upload.id}-${upload.file.name}`
      );

      const uploadTask = uploadBytesResumable(storageRef, upload.file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Update progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          updateProgress(upload.id, progress);
        },
        (error) => {
          // Handle error
          console.error(`Upload error for ${upload.file.name}:`, error);
          setError(upload.id, error.message);
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Update upload store
            setComplete(upload.id, downloadURL);

            // Update property document with photo
            const propertyRef = doc(db, `users/${user.uid}/properties`, propertyId);
            await updateDoc(propertyRef, {
              photos: arrayUnion({
                id: upload.id,
                url: downloadURL,
                thumbnailUrl: downloadURL.replace(/(\.[^.]+)$/, '-thumb.jpg'),
                order: upload.order,
                isCover: upload.order === 0, // First photo is cover
                uploadedAt: new Date(),
              }),
            });

            console.log(`Upload complete: ${upload.file.name} -> ${downloadURL}`);
          } catch (error) {
            console.error(`Error finalizing upload for ${upload.file.name}:`, error);
            setError(upload.id, (error as Error).message);
          }
        }
      );
    }
  };

  const uploads = getUploadsForProperty(propertyId);
  const isUploading = uploads.some((u) => u.status === 'uploading' || u.status === 'pending');

  return {
    uploadPhotos,
    uploads,
    isUploading,
    clearCompleted,
  };
}
