export const THEME_STORAGE_KEY = 'tmrda_theme';

/** Runs before React hydrates (inlined in app/layout.tsx) so the page never flashes the wrong theme. */
export const themeInitScript = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}`;
