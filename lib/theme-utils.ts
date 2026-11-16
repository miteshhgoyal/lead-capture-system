export interface PartnerTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/** Returns readable text color (#ffffff or #0b0b1a) to guarantee button legibility */
export function getReadableTextColor(backgroundHex: string): "#ffffff" | "#0b0b1a" {
  const lum = getLuminance(backgroundHex);
  // High contrast threshold
  return lum > 0.4 ? "#0b0b1a" : "#ffffff";
}

/** Generates CSS custom properties for partner themes in both Light and Dark modes */
export function generatePartnerThemeCss(theme?: PartnerTheme): string {
  if (!theme || !theme.primaryColor) return "";
  const primary = theme.primaryColor;
  const secondary = theme.secondaryColor || primary;
  const accent = theme.accentColor || primary;

  const lightAccentInk = getReadableTextColor(accent);
  const darkAccentInk = getReadableTextColor(accent);

  return `
    :root {
      --accent: ${accent} !important;
      --accent-2: ${secondary} !important;
      --accent-ink: ${lightAccentInk} !important;
    }
    .dark {
      --accent: ${accent} !important;
      --accent-2: ${secondary} !important;
      --accent-ink: ${darkAccentInk} !important;
    }
  `;
}
