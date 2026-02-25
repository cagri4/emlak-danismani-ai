import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { PhotoUpload } from '../../types/photo';
import { useEffect } from 'react';

interface UploadProgressIndicatorProps {
  uploads: PhotoUpload[];
  onClearCompleted?: () => void;
}

/**
 * Per-photo upload progress indicator.
 *
 * Shows individual progress for each uploading file with:
 * - Filename (truncated if > 20 chars)
 * - Progress bar with percentage
 * - Status icon: spinner (uploading), check (done), X (error)
 * - Error message if failed
 */
export function UploadProgressIndicator({ uploads, onClearCompleted }: UploadProgressIndicatorProps) {
  // Check if all uploads are done
  const allDone = uploads.length > 0 && uploads.every(u => u.status === 'done');
  const hasErrors = uploads.some(u => u.status === 'error');

  // Auto-clear completed uploads after 2 seconds
  useEffect(() => {
    if (allDone && !hasErrors && onClearCompleted) {
      const timer = setTimeout(() => {
        onClearCompleted();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [allDone, hasErrors, onClearCompleted]);

  if (uploads.length === 0) return null;

  const truncateFilename = (filename: string | undefined, maxLength = 20) => {
    if (!filename) return 'Dosya';
    if (filename.length <= maxLength) return filename;
    const ext = filename.split('.').pop();
    const name = filename.substring(0, maxLength - (ext?.length || 0) - 4);
    return `${name}...${ext}`;
  };

  // Dynamic header based on status
  const getHeader = () => {
    if (allDone && !hasErrors) return 'Yükleme Tamamlandı ✓';
    if (hasErrors) return 'Yükleme Hatası';
    return 'Yükleniyor...';
  };

  return (
    <div className={`space-y-2 rounded-lg p-4 ${allDone && !hasErrors ? 'bg-green-50' : hasErrors ? 'bg-red-50' : 'bg-gray-50'}`}>
      <h3 className={`text-sm font-medium ${allDone && !hasErrors ? 'text-green-700' : hasErrors ? 'text-red-700' : 'text-gray-700'}`}>
        {getHeader()}
      </h3>

      <div className="space-y-3">
        {uploads.map((upload) => (
          <div key={upload.id} className="space-y-1">
            {/* Filename and status */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 truncate">
                {truncateFilename(upload.file?.name)}
              </span>

              {/* Status icon */}
              {upload.status === 'uploading' || upload.status === 'pending' ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : upload.status === 'done' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                  upload.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${upload.progress}%` }}
              />
            </div>

            {/* Progress percentage or error */}
            {upload.status === 'error' ? (
              <p className="text-xs text-red-600">{upload.error || 'Yükleme başarısız'}</p>
            ) : (
              <p className="text-xs text-gray-500">{Math.round(upload.progress)}%</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
