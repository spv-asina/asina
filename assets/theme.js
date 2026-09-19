// Run before paint; storage may be unavailable in private/restricted contexts.
(() => { let theme; try { theme = localStorage.getItem('asina-theme'); } catch {} const dark = matchMedia('(prefers-color-scheme: dark)').matches; document.documentElement.dataset.theme = ['light','dark'].includes(theme) ? theme : dark ? 'dark' : 'light'; })();
