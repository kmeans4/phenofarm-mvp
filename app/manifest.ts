import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PhenoShop',
    short_name: 'PhenoShop',
    description: 'The workspace for licensed growers and dispensaries.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070b09',
    theme_color: '#070b09',
    icons: [
      { src: '/brand/phenoshop-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/phenoshop-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
