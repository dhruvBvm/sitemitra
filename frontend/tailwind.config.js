/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.html"
  ],
  theme: {
    extend: {
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.25' }],   // 14px (+2)
        sm: ['1rem', { lineHeight: '1.5' }],        // 16px (+2)
        base: ['1.125rem', { lineHeight: '1.75' }], // 18px (+2)
        lg: ['1.25rem', { lineHeight: '1.75' }],   // 20px (+2)
        xl: ['1.5rem', { lineHeight: '1.75' }],    // 24px (+2)
        '2xl': ['1.75rem', { lineHeight: '2' }],    // 28px (+2)
        '3xl': ['2rem', { lineHeight: '2.25' }],   // 32px (+2)
        '4xl': ['2.25rem', { lineHeight: '2.5' }], // 36px (+2)
        '5xl': ['2.5rem', { lineHeight: '1' }],    // 40px (+2)
        '6xl': ['2.75rem', { lineHeight: '1' }],   // 44px (+2)
        '7xl': ['3rem', { lineHeight: '1' }],      // 48px (+2)
        '8xl': ['3.5rem', { lineHeight: '1' }],    // 56px (+2)
        '9xl': ['4rem', { lineHeight: '1' }]       // 64px (+2)
      },
      spacing: {
        0.5: '0.125rem', // 2px (+2 from 0)
        1: '0.25rem',    // 4px (+2 from 2)
        1.5: '0.375rem', // 6px (+2 from 4)
        2: '0.5rem',     // 8px (+2 from 6)
        2.5: '0.625rem', // 10px (+2 from 8)
        3: '0.75rem',    // 12px (+2 from 10)
        3.5: '0.875rem', // 14px (+2 from 12)
        4: '1rem',       // 16px (+2 from 14)
        5: '1.25rem',    // 20px (+2 from 18)
        6: '1.5rem',     // 24px (+2 from 22)
        7: '1.75rem',    // 28px (+2 from 26)
        8: '2rem',       // 32px (+2 from 30)
        9: '2.25rem',    // 36px (+2 from 34)
        10: '2.5rem',    // 40px (+2 from 38)
        11: '2.75rem',   // 44px (+2 from 42)
        12: '3rem',      // 48px (+2 from 46)
        14: '3.5rem',    // 56px (+2 from 54)
        16: '4rem',      // 64px (+2 from 62)
        20: '5rem',      // 80px (+2 from 78)
        24: '6rem',      // 96px (+2 from 94)
        28: '7rem',      // 112px (+2 from 110)
        32: '8rem',      // 128px (+2 from 126)
        36: '9rem',      // 144px (+2 from 142)
        40: '10rem',     // 160px (+2 from 158)
        44: '11rem',     // 176px (+2 from 174)
        48: '12rem',     // 192px (+2 from 190)
        52: '13rem',     // 208px (+2 from 206)
        56: '14rem',     // 224px (+2 from 222)
        60: '15rem',     // 240px (+2 from 238)
        64: '16rem',     // 256px (+2 from 254)
        72: '18rem',     // 288px (+2 from 286)
        80: '20rem',     // 320px (+2 from 318)
        96: '24rem'      // 384px (+2 from 382)
      }
    }
  },
  plugins: []
};
