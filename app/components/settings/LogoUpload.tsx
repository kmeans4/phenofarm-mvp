'use client';

import { useState, useRef } from 'react';
import { Button } from '@/app/components/ui/Button';

interface LogoUploadProps {
  currentLogo?: string | null;
  onUpload: (logoBase64: string) => Promise<void>;
}

export function LogoUpload({ currentLogo, onUpload }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File too large. Maximum size is 2MB.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Convert to base64
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      const mimeType = file.type;
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      setPreview(dataUrl);
      await onUpload(dataUrl);
    } catch (err) {
      setError('Failed to upload logo. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload('');
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-6">
        {/* Logo Preview */}
        <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
          {preview ? (
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
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="outline"
              size="sm"
            >
              {uploading ? 'Uploading...' : preview ? 'Change Logo' : 'Upload Logo'}
            </Button>
            
            {preview && (
              <Button
                type="button"
                onClick={handleRemove}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
            JPG, PNG, GIF, or WebP. Max 2MB.
          </p>
        </div>
      </div>
    </div>
  );
}
