import { useState } from 'react'
import { storage } from '@/lib/firebase'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

interface UploadState {
  progress: number
  status: 'idle' | 'uploading' | 'success' | 'error'
  url?: string
  error?: string
}

/**
 * Hook for uploading files to Firebase Storage
 * Supports progress tracking and error handling
 */
export function useFileUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    status: 'idle',
  })

  const uploadFile = async (
    file: File,
    userId: string,
    folder: string
  ): Promise<string | null> => {
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadState({
        progress: 0,
        status: 'error',
        error: 'Dosya çok büyük (maksimum 5MB)',
      })
      return null
    }

    // Create unique filename
    const fileName = `${Date.now()}-${file.name}`
    const storageRef = ref(storage, `${userId}/${folder}/${fileName}`)
    const uploadTask = uploadBytesResumable(storageRef, file)

    setUploadState({ progress: 0, status: 'uploading' })

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadState({ progress, status: 'uploading' })
        },
        (error) => {
          console.error('Upload error:', error)
          setUploadState({
            progress: 0,
            status: 'error',
            error: 'Yükleme başarısız. Lütfen tekrar deneyin.',
          })
          reject(error)
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          setUploadState({ progress: 100, status: 'success', url })
          resolve(url)
        }
      )
    })
  }

  const resetUploadState = () => {
    setUploadState({ progress: 0, status: 'idle' })
  }

  return {
    uploadFile,
    uploadState,
    resetUploadState,
  }
}
