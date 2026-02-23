// apps/manager-dashboard/tailwind.config.js
import baseConfig from '@hr/tailwind-config'

/** @type {import('tailwindcss').Config} */
export default {
    ...baseConfig,
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
        '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
    ],
    theme: {
        ...baseConfig.theme,
        extend: {
            ...(baseConfig.theme?.extend || {}),
            colors: {
                ...(baseConfig.theme?.extend?.colors || {}),
                primary: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d'
                }
            }
        }
    }
}
