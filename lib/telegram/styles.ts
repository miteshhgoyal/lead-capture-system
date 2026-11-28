/** Rewrite styles a partner can pick for broadcasts. Anything else is stored as custom text. */
export const STYLE_PRESETS = [
  "Hinglish casual",
  "Professional English",
  "Friendly and energetic",
  "Short and punchy",
  "Hindi (Devanagari script)",
  "Calm mentor, educational tone",
] as const;

export const DEFAULT_STYLE = STYLE_PRESETS[0];
export const STYLE_MAX = 300;

export const isPresetStyle = (s: string | undefined | null): boolean =>
  !!s && (STYLE_PRESETS as readonly string[]).includes(s);
