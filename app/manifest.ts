import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Infent · Investment Research', short_name: 'Infent',
    description: 'Investment research with verifiable data and sources.',
    id: '/', start_url: '/#live-agent', scope: '/', display: 'standalone',
    background_color: '#070809', theme_color: '#070809',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
