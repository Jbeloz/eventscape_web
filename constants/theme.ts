import { Palette } from "../assets/colors/palette";
import { Fonts } from "../assets/fonts/fonts";

export const Theme = {
  colors: {
    background: Palette.white,
    text: Palette.black,
    muted: Palette.gray700,
    border: Palette.border,
    black: Palette.black,    // for general use
    primary: "#1E90FF",      // Added primary color (example blue)
  },

  fonts: {
    regular: Fonts.regular,
    medium: Fonts.medium,
    semibold: Fonts.semibold,
    bold: Fonts.bold,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  radius: {
    sm: 6,
    md: 10,
    lg: 16,
  },
};
