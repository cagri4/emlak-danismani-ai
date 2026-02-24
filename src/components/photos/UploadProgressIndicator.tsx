import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { PhotoUpload } from '../../types/photo';

interface UploadProgressIndicatorProps {
  uploads: PhotoUpload[];
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
export function UploadProgressIndicator({ uploads }: UploadProgressIndicatorProps) {
  if (uploads.length === 0) return null;

  const truncateFilename = (filename: string | undefined, maxLength = 20) => {
    if (!filename) return 'Dosya';
    if (filename.length <= maxLength) return filename;
    const ext = filename.split('.').pop();
    const name = filename.substring(0, maxLength - (ext?.length || 0) - 4);
    return `${name}...${ext}`;
  };

  return (
    <div className="space-y-2 bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700">Yükleniyor...</h3>

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
