import Image from 'next/image';

/** The approved leaf-cutout P and complete wordmark, kept as original artwork. */
export function BrandLogo({ className = 'w-40' }: { className?: string }) {
  return <Image src="/brand/phenoshop-wordmark.png" alt="PhenoShop" width={1200} height={247} unoptimized loading="eager" className={`h-auto shrink-0 object-contain ${className}`} />;
}

export function BrandMark({ className = 'h-8 w-8' }: { className?: string }) {
  return <Image src="/brand/phenoshop-icon-192.png" alt="PhenoShop" width={192} height={192} unoptimized loading="eager" className={`shrink-0 object-contain ${className}`} />;
}
