const CARD_RATIO = 0.714285714 as const; //2.5 / 3.5; // w / h
const CORNERS_WIDTH_RATIO = 0.05 as const;

const CARD_FLIP_ANIMATION_DURATION = 700 as const;
const CARD_SHAKE_ANIMATION_DURATION = 600 as const;

// after initial instant transform, wait this long before starting animation
const CARD_SHUFFLE_PAUSE_DURATION = 100 as const;
// animation duration
const CARD_SHUFFLE_ACTIVE_DURATION = 350 as const;

const MINIMUM_TIME_BETWEEN_CLICKS = 500 as const;
const CARD_RATIO_VS_CONTAINER = 0.9 as const;

// underside shows immediately, but hides after this far during return transition
const CARD_HIDE_UNDERSIDE_AFTER_PERCENT = 0.9 as const;

// if matching, delay return animation by this amount
// e.g. time allowed for card to vanish (before it would return to board)
const CARD_MATCH_HIDE_DELAY_DURATION_MS = 250 as const;

const BOARD = {
  CARD_RATIO,
  CORNERS_WIDTH_RATIO,
  CARD_FLIP_ANIMATION_DURATION,
  CARD_SHAKE_ANIMATION_DURATION,
  CARD_SHUFFLE_PAUSE_DURATION,
  CARD_SHUFFLE_ACTIVE_DURATION,
  MINIMUM_TIME_BETWEEN_CLICKS,
  CARD_RATIO_VS_CONTAINER,
  CARD_HIDE_UNDERSIDE_AFTER_PERCENT,
  CARD_MATCH_HIDE_DELAY_DURATION_MS,
} as const;

export default BOARD;
