const CODE_PADDING = "px-0 md:px-1 lg:px-2" as const;
const CODE_TEXT_LIGHT = "text-slate-200" as const;
const CODE_TEXT_DARK = "text-slate-400" as const;

const COUNTER_ANIMATE_DURATION = 400 as const;

const SCORE_ANIMATION_CLASSES = "animate text-slate-100" as const;

export const header = {
  CODE_PADDING,
  CODE_TEXT_LIGHT,
  CODE_TEXT_DARK,
  COUNTER_ANIMATE_DURATION,
  SCORE_ANIMATION_CLASSES,
} as const;
