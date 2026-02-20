import { useRef } from 'react'
import { Paperclip, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useAuth } from '@/contexts/AuthContext'

interface AttachmentButtonProps {
  onUpload: (url: string, filename: string) => void
  onError?: (error: string) => void
}

/**
 * File attachment button with upload progress
 * Accepts images and documents (PDF, DOC, DOCX)
 * Shows upload progress as percentage
 */
export function AttachmentButton({ onUpload, onError }: AttachmentButtonProps) {
  const { user } = useAuth()
  const { uploadFile, uploadState } = useFileUpload()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      const url = await uploadFile(file, user.uid, 'chat-attachments')
      if (url) {
        onUpload(url, file.name)
      } else if (uploadState.error) {
        onError?.(uploadState.error)
      }
    } catch (err) {
      console.error('Upload error:', err)
      onError?.(uploadState.error || 'Yükleme başarısız')
    }

    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => inputRef.current?.click()}
        disabled={uploadState.status === 'uploading'}
        title={uploadState.status === 'uploading' ? 'Yükleniyor...' : 'Dosya ekle'}
        aria-label="Dosya ekle"
      >
        {uploadState.status === 'uploading' ? (
          <div className="flex items-center gap-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">{Math.round(uploadState.progress)}%</span>
          </div>
        ) : (
          <Paperclip className="h-5 w-5" />
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileSelect}
        aria-hidden="true"
      />
    </>
  )
}
