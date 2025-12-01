import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f5f7f4',
          100: '#e8ece6',
          200: '#d4dbd0',
          300: '#b4c2ad',
          400: '#8fa584',
          500: '#6d8861',
          600: '#4a7c59',
          700: '#4b6043',
          800: '#3f4e39',
          900: '#354131',
        },
        stone: {
          50: '#f5f5f0',
          100: '#eaeae5',
          200: '#d5d5cc',
          300: '#b8b8ab',
          400: '#9a9a89',
          500: '#7d7d6b',
          600: '#636355',
          700: '#4d4d42',
          800: '#3d3d35',
          900: '#2e2e28',
        },
        sky: {
          50: '#f0f7fa',
          100: '#dceef5',
          200: '#b8dcea',
          300: '#a8c5db',
          400: '#6b8e9f',
          500: '#4a7389',
          600: '#3b5d70',
          700: '#2f4a59',
          800: '#273c48',
          900: '#1f2f38',
        },
        amber: {
          50: '#fdf8f3',
          100: '#faeee0',
          200: '#f4dbc0',
          300: '#ecc99f',
          400: '#d4a574',
          500: '#c08552',
          600: '#a66d3f',
          700: '#875733',
          800: '#6d462a',
          900: '#593a24',
        },
      },
    },
  },
  plugins: [],
}

export default config
