'use client';

import { useState, useRef, useEffect } from 'react';
import { prepareImageUpload, uploadFile } from '@/app/components/uploads/uploadFile';
import { Button } from '@/app/components/ui/Button';
import { FILE_UPLOAD_LIMITS, IMAGE_MIME_TYPES, formatBytes, validateLogoFile } from '@/lib/upload-validation';

interface LogoUploadProps {
  currentLogo?: string | null;
  onUpload: (logoUrl: string) => Promise<void>;
  disabled?: boolean;
}

export function LogoUpload({ currentLogo, onUpload, disabled = false }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const [error, setError] = useState<string | null>(null);
  const currentLogoRef = useRef(currentLogo || null);
  currentLogoRef.current = currentLogo || null;
  useEffect(() => { setPreview(currentLogo || null); }, [currentLogo]);
  const pendingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file || pendingRef.current || disabled) return;
    pendingRef.current = true;
    const startedLogo = currentLogoRef.current;
    setError(null);
    setUploading(true);
    try {
      const prepared = await prepareImageUpload(file, FILE_UPLOAD_LIMITS.logoMaxBytes);
      const validation = validateLogoFile(prepared);
      if (!validation.ok) throw new Error(validation.error);
      const url = await uploadFile(prepared, 'logo');
      await onUpload(url);
      if (currentLogoRef.current === startedLogo) setPreview(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo. Please try again.');
      if (currentLogoRef.current === startedLogo) setPreview(currentLogoRef.current);
    } finally {
      pendingRef.current = false;
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (pendingRef.current || disabled) return;
    pendingRef.current = true;
    const startedLogo = currentLogoRef.current;
    setUploading(true);
    setError(null);
    try { await onUpload(''); if (currentLogoRef.current === startedLogo) setPreview(null); }
    catch { setError('Could not remove the logo. Please try again.'); }
    finally { pendingRef.current = false; setUploading(false); }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 sm:gap-6">
        {/* Logo Preview */}
        <div className="h-20 w-20 shrink-0 sm:h-24 sm:w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- Small upload previews also support legacy data URLs.
            <img 
              src={preview} 
              alt="Company logo" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-gray-400 text-center p-2">
              <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">No logo</span>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="min-w-0 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_MIME_TYPES.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || disabled}
              variant="outline"
              size="sm"
            >
              {uploading ? 'Uploading...' : preview ? 'Change Logo' : 'Upload Logo'}
            </Button>
            
            {preview && (
              <Button
                type="button"
                onClick={handleRemove}
                disabled={uploading || disabled}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
            JPG, PNG, or WebP. Max {formatBytes(FILE_UPLOAD_LIMITS.logoMaxBytes)}.
          </p>
        </div>
      </div>
    </div>
  );
}
