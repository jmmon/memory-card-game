// import { ClassList } from "@builder.io/qwik";
// const test: ClassList = 'text-2x';

const FONT_SIZES_XL = "text-lg sm:text-xl lg:text-2xl"; // 18px 20px 24px
const FONT_SIZES_LARGE = "text-base sm:text-lg lg:text-xl"; // 16 18 20
const FONT_SIZES_STANDARD = "text-sm sm:text-base lg:text-lg"; // 14px 16px 18px
const FONT_SIZES_SMALL = "text-xs sm:text-sm lg:text-base"; // 12px 14px 16px
const FONT_SIZES_XS = "text-[11px] sm:text-xs lg:text-sm"; // 11px 12px 14px

export const FONT_SIZES = {
  XL: FONT_SIZES_XL,
  LARGE: FONT_SIZES_LARGE,
  STANDARD: FONT_SIZES_STANDARD,
  SMALL: FONT_SIZES_SMALL,
  XS: FONT_SIZES_XS,
} as const;


