import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

/** A colour backed by a CSS variable of RGB channels (see app/globals.css) so it can swap per theme. */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

/** Shades 400–600 stay fixed (solid buttons / icons); the rest flip for dark mode. */
function themed(name: string, fixed: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const k of ['50', '100', '200', '300', '700', '800', '900', '950']) out[k] = v(`${name}-${k}`);
  for (const k of ['400', '500', '600']) out[k] = fixed[k];
  return out;
}

const zinc = Object.fromEntries(
  ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].map((k) => [k, v(`zinc-${k}`)])
);

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand red — unchanged from the original TMRDA palette (#dc2626)
        brand: themed('brand', { 400: '#f87171', 500: '#ef4444', 600: '#dc2626' }),
        emerald: themed('emerald', colors.emerald),
        amber: themed('amber', colors.amber),
        sky: themed('sky', colors.sky),
        violet: themed('violet', colors.violet),
        rose: themed('rose', colors.rose),
        zinc,
        /** Fixed dark neutrals for panels that stay dark in both themes (sidebar, hero, action bars). */
        ink: colors.zinc,
        surface: v('surface'),
        canvas: v('canvas'),
      },
      fontFamily: {
        sans: ['var(--font-body)', 'var(--font-display)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'system-ui', 'sans-serif'],
        doc: ['Sarabun', 'TH Sarabun New', 'var(--font-body)', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(24 24 27 / 0.04), 0 1px 3px 0 rgb(24 24 27 / 0.03)',
        lift: '0 8px 24px -8px rgb(24 24 27 / 0.12), 0 2px 6px -2px rgb(24 24 27 / 0.06)',
        pop: '0 24px 64px -16px rgb(24 24 27 / 0.28), 0 4px 16px -4px rgb(24 24 27 / 0.10)',
        ring: '0 0 0 4px rgb(220 38 38 / 0.12)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'none' },
        },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'none' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgb(220 38 38 / 0.45)' },
          '70%': { boxShadow: '0 0 0 10px rgb(220 38 38 / 0)' },
          '100%': { boxShadow: '0 0 0 0 rgb(220 38 38 / 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .2s ease-out both',
        'fade-up': 'fade-up .35s cubic-bezier(.2,.7,.2,1) both',
        'scale-in': 'scale-in .22s cubic-bezier(.2,.7,.2,1) both',
        'slide-in-left': 'slide-in-left .28s cubic-bezier(.2,.7,.2,1) both',
        'slide-in-right': 'slide-in-right .28s cubic-bezier(.2,.7,.2,1) both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-ring': 'pulse-ring 1.8s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
