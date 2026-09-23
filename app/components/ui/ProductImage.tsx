'use client';

import { useState, type CSSProperties } from 'react';
import { Leaf } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  productType?: string | null;
  className?: string;
  imageClassName?: string;
  imageStyle?: CSSProperties;
  placeholderClassName?: string;
  showPlaceholderLabel?: boolean;
}

const KNOWN_PLACEHOLDERS = new Set([
  '/products/edibles.jpg',
  '/products/silver-haze.jpg',
  '/products/purple-haze.jpg',
]);

export function ProductImage({ src, alt, productType, className = '', imageClassName = '', imageStyle, placeholderClassName, showPlaceholderLabel = true }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const normalizedSrc = src?.trim() || '';
  const showPlaceholder = !normalizedSrc || failedSrc === normalizedSrc || KNOWN_PLACEHOLDERS.has(normalizedSrc);

  return (
    <div className={twMerge('relative overflow-hidden bg-pf-raised', className, showPlaceholder ? placeholderClassName : '')}>
      {showPlaceholder ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-pf-raised px-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-pf-line bg-pf-surface text-pf-muted shadow-sm">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </span>
          {productType && showPlaceholderLabel ? <span className="text-[11px] font-semibold uppercase text-pf-muted">{productType}</span> : null}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={normalizedSrc}
          alt={alt}
          onError={() => setFailedSrc(normalizedSrc)}
          className={`h-full w-full object-cover ${imageClassName}`}
          style={imageStyle}
        />
      )}
    </div>
  );
}
