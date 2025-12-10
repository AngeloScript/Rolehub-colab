import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'RoleHub',
        short_name: 'RoleHub',
        description: 'Encontre seu próximo rolê',
        start_url: '/',
        display: 'standalone',
        background_color: '#111111',
        theme_color: '#00FFA3',
        icons: [
            {
                src: '/icon.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
