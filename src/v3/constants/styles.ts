// import { ClassList } from "@builder.io/qwik";

const FONT_SIZES_STANDARD = "text-sm sm:text-base lg:text-lg"; // 14px 16px 18px
const FONT_SIZES_SMALL = "text-xs sm:text-sm lg:text-base"; // 12px 14px 16px
const FONT_SIZES_XS = "text-[11px] sm:text-xs lg:text-sm"; // 11px 12px 14px


export const FONT_SIZES = {
  STANDARD: FONT_SIZES_STANDARD,
  SMALL: FONT_SIZES_SMALL,
  XS: FONT_SIZES_XS,
} as const;
