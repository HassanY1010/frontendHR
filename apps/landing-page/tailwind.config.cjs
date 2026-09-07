/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f5f7ff',
                    100: '#ebf0fe',
                    200: '#ced9fd',
                    300: '#b1c2fb',
                    400: '#7695f8',
                    500: '#3b67f5',
                    600: '#355ddd',
                    700: '#2c4eb8',
                    800: '#233e93',
                    900: '#1d3378',
                },
                indigo: {
                    50: '#f5f7ff',
                    100: '#ebf0fe',
                    200: '#ced9fd',
                    300: '#b1c2fb',
                    400: '#7695f8',
                    500: '#3b67f5',
                    600: '#355ddd',
                    700: '#2c4eb8',
                    800: '#233e93',
                    900: '#1d3378',
                },
            },
            fontFamily: {
                din: ['"DIN Next LT Arabic"', '"IBM Plex Sans"', 'sans-serif'],
                cairo: ['Cairo', 'sans-serif'],
                ibm: ['"IBM Plex Sans"', '"DIN Next LT Arabic"', 'sans-serif'],
                sans: ['"DIN Next LT Arabic"', '"IBM Plex Sans"', 'sans-serif'],
            },
            fontSize: {
                'xs': ['0.8125rem', { lineHeight: '1.5' }],     // 13px - Badges, dates, hints
                'sm': ['0.9375rem', { lineHeight: '1.6' }],     // 15px - Tables, menus, list items
                'base': ['1.03125rem', { lineHeight: '1.65' }], // 16.5px - Body text
                'lg': ['1.15625rem', { lineHeight: '1.6' }],    // 18.5px - Inputs, card headers
                'xl': ['1.3125rem', { lineHeight: '1.5' }],     // 21px - Section subheadings
                '2xl': ['1.625rem', { lineHeight: '1.4' }],     // 26px - Page titles
                '3xl': ['2rem', { lineHeight: '1.3' }],         // 32px
                '4xl': ['2.25rem', { lineHeight: '1.25' }],      // 36px - Large titles
                '5xl': ['3rem', { lineHeight: '1.2' }],         // 48px - Hero display
                '6xl': ['3.375rem', { lineHeight: '1.15' }],     // 54px - Hero display large
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'gradient': 'gradient 8s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                    '50%': { transform: 'translateY(-20px) rotate(1deg)' },
                },
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                }
            }
        },
    },
    plugins: [],
}
