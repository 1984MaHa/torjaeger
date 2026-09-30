// Kleine Fach-Symbole (weiße Linien auf farbigem Kreis), damit die Fächer ohne Buchstaben auskommen.
const S=inner=>`<svg viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
export const ICONS={
  // Taschenrechner
  math:S('<rect x="6" y="3" width="20" height="26" rx="4"/><rect x="10" y="7" width="12" height="5" rx="1"/><path d="M11 18h.01M16 18h.01M21 18h.01M11 24h.01M16 24h.01M21 24h.01" stroke-width="3.4"/>'),
  // aufgeschlagenes Buch
  deu:S('<path d="M16 8c-3-2.5-7-3-11-2.5v18c4-.5 8 0 11 2.5 3-2.5 7-3 11-2.5v-18c-4-.5-8 0-11 2.5zM16 8v18"/>'),
  // Sprechblase
  eng:S('<path d="M5 5h22a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H16l-6 5v-5H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M10 13h.01M16 13h.01M22 13h.01" stroke-width="3.6"/>'),
  // Keimling
  su:S('<path d="M16 28V14"/><path d="M16 18c-6 0-9-3-9-9 6 0 9 3 9 9z"/><path d="M16 14c0-5 3-8 9-8 0 6-3 8-9 8z"/>'),
  // Würfel
  mix:S('<rect x="5" y="5" width="22" height="22" rx="5"/><path d="M11 11h.01M21 11h.01M16 16h.01M11 21h.01M21 21h.01" stroke-width="3.8"/>')
};
