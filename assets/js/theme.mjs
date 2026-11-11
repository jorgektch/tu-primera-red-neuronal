/** Built-in palettes and presentation accents; no framework dependencies. */
export const PALETTES = Object.freeze({
  dark: Object.freeze({
    background:'#0B1020', panel:'#10182A', heading:'#F5F7FF',
    accent:'#36E0C4', text:'#AAB9D0', muted:'#8799B2', border:'#30435B'
  }),
  light: Object.freeze({
    background:'#F7FAFC', panel:'#FFFFFF', heading:'#172334',
    accent:'#007C70', text:'#344054', muted:'#667085', border:'#CBD5E1'
  })
});

const DECORATIONS = Object.freeze({
  dark: Object.freeze({
    '--panel-2':'#151F31', '--surface-glow':'#13273C',
    '--diagram-bg':'#0A1421', '--code-bg':'#0A1320', '--code-fg':'#ECF5FA',
    '--inline-code-bg':'#1B283A', '--inline-code-fg':'#ACEFE2',
    '--table-stripe':'#131D2E', '--hover-bg':'#1D2A40',
    '--hover-fg':'#A6F8E8', '--mermaid-note-bg':'#162238',
    '--media-bg':'#0A1320', '--shadow-tint':'rgba(0,0,0,.30)'
  }),
  light: Object.freeze({
    '--panel-2':'#EAF0F5', '--surface-glow':'#DBEDED',
    '--diagram-bg':'#FFFFFF', '--code-bg':'#EFF4F8', '--code-fg':'#172334',
    '--inline-code-bg':'#E0F2EC', '--inline-code-fg':'#006A60',
    '--table-stripe':'#F0F5F8', '--hover-bg':'#E0F2EC',
    '--hover-fg':'#006A60', '--mermaid-note-bg':'#EAF0F5',
    '--media-bg':'#EAF0F5', '--shadow-tint':'rgba(19,44,62,.10)'
  })
});

/** Browser localStorage is scoped to the origin, not to the repository path. */
export function themeStorageKey(repositoryUrl) {
  const value = String(repositoryUrl || 'local').trim().toLowerCase();
  return `readme-to-slides.theme-choice.v2:${encodeURIComponent(value)}`;
}

export function activeThemeName(choice, systemPrefersDark = true) {
  return choice === 'auto' ? (systemPrefersDark ? 'dark' : 'light') :
    choice === 'light' ? 'light' : 'dark';
}

export function nextThemeChoice(choice) {
  return choice === 'dark' ? 'light' : choice === 'light' ? 'auto' : 'dark';
}

/** `theme.colors` is the legacy dark palette, lightColors is the light preset. */
export function resolveThemePalette(theme, activeName) {
  const mode = activeName === 'light' ? 'light' : 'dark';
  return {...PALETTES[mode], ...(mode === 'light' ? theme.lightColors : theme.colors)};
}

export function cssThemeTokens(theme, activeName) {
  const colors = resolveThemePalette(theme, activeName);
  const names = {
    background:'--bg', panel:'--panel', heading:'--heading',
    accent:'--accent', text:'--body', muted:'--muted', border:'--line'
  };
  const tokens = {...DECORATIONS[activeName]};
  for (const [key, prop] of Object.entries(names)) tokens[prop] = colors[key];
  tokens['--r-background-color'] = colors.background;
  tokens['--r-main-color'] = colors.text;
  tokens['--r-heading-color'] = colors.heading;
  tokens['--r-link-color'] = colors.accent;
  tokens['--r-link-color-hover'] = DECORATIONS[activeName]['--hover-fg'];
  tokens['--r-selection-background-color'] = colors.accent;
  tokens['--r-selection-color'] = colors.background;
  tokens['--deck-footer-background'] = colors.background;
  tokens['--deck-footer-border'] = colors.border;
  return tokens;
}

export function mermaidThemeVariables(colors, activeName, font) {
  return {
    background: colors.background, primaryColor: colors.panel,
    primaryBorderColor: colors.accent, primaryTextColor: colors.heading,
    secondaryColor: colors.panel, secondaryTextColor: colors.heading,
    secondaryBorderColor: colors.border, tertiaryColor: colors.background,
    tertiaryTextColor: colors.heading, lineColor: colors.text,
    textColor: colors.heading, fontFamily:`${font}, sans-serif`,
    noteBkgColor: DECORATIONS[activeName]['--mermaid-note-bg'],
    noteTextColor: colors.heading,
    pie1:colors.accent, pie2:colors.text, pie3:colors.muted
  };
}
