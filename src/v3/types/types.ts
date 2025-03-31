import type { QRL } from "@builder.io/qwik";
import type { useTimer } from "../utils/useTimer";
import type { Score } from "../db/types";

import type { D1Database } from "@cloudflare/workers-types";

export type Env = {
  DB: D1Database;
};

// for mapping our current score to find how many other scores are less than it
export type LessThanOurScoreObj = Record<number, number>;
export type ScoreCountColumnOptions = "gameTime" | "mismatches";

/* =====================================================
 * Game Logic
 * ===================================================== */
export type Timer = ReturnType<typeof useTimer>;

export type Coords = { x: number; y: number };

export type ShuffleTransform = { x: number; y: number };

export type Pair = `${number}:${number}`;

export type PlayingCardSvgProps =
  | {
      color: "red";
      symbol: "diamonds" | "hearts";
    }
  | {
      color: "black";
      symbol: "clubs" | "spades";
    };

export type Card = {
  id: number;
  text: string; // alternate content of the card (if no img)
  position: number; // board slot index
  prevPosition: number | null; // used for shuffle transition calculations
  pairId: number; // id of paired card
  image?: string;
  localSVG?: string;
};

/* =====================================================
 * Scoreboard: scores and sorting
 * ===================================================== */
export type ScoreWithPercentiles = Score & {
  [key: string]: number | string | undefined;
  timePercentile?: number;
  mismatchPercentile?: number;
};

export type SortColumnWithDirection = {
  column: ScoreTableColumn;
  direction: SortDirection;
};
export enum ScoreTableColumnEnum {
  initials = "initials",
  deck_size = "deck_size",
  pairs = "pairs",
  game_time_ds = "game_time_ds",
  mismatches = "mismatches",
  // time_percentile = "time_percentile",
  // mismatch_percentile = "mismatch_percentile",
  created_at = "created_at",
}

export type ScoreTableColumn = keyof typeof ScoreTableColumnEnum;
// | "initials"
// | "deck_size"
// | "pairs"
// | "game_time_ds"
// | "mismatches"
// // | "time_percentile"
// // | "mismatch_percentile"
// | "created_at";

export type DeckSizesDictionary = { [key: string]: Score[] };

export enum SortDirectionEnum {
  asc = "asc",
  desc = "desc",
}
export type SortDirection = keyof typeof SortDirectionEnum;

/* =====================================================
 * Game Context and Settings
 * ===================================================== */
export type iGameSettings = {
  cardFlipAnimationDuration: number;
  maxAllowableMismatches: number;

  shuffleBoardAfterMismatches: number;
  shuffleBoardAfterPair: boolean;
  shuffleBoardAfterRound: boolean;

  shufflePickedAfterMismatch: boolean;

  reorgnanizeBoardOnPair: boolean;
  reorgnanizeBoardOnMismatch: boolean;
  resizeBoard: boolean;

  deck: {
    size: number;
    isLocked: boolean;
    MINIMUM_CARDS: number;
    MAXIMUM_CARDS: number;
    fullDeck: Card[];
  };
  interface: {
    showSelectedIds: boolean;
    showDimensions: boolean;
  };
};

export type iBoardLayout = {
  width: number;
  height: number;
  columns: number;
  rows: number;
  area: number;
  isLocked: boolean;
  rowHeight: number;
  colWidth: number;
};

export type iCardLayout = {
  width: number;
  height: number;
  area: number;
  roundedCornersPx: number;
  colGapPercent: number;
  rowGapPercent: number;
};

export type iGameData = {
  isSaved: boolean;
  flippedCardId: number;
  selectedCardIds: number[];
  successfulPairs: Pair[];
  cards: Card[];
  mismatchPairs: Pair[];
  mismatchPair: Pair | "";
  isShaking: boolean;
  isLoading: boolean;
  shufflingState: number;
  isFlipped: boolean;
  isFaceShowing: boolean;
  isFaceShowing_delayedOff: boolean;
  isReturned: boolean;
  isEnded: boolean;
};

export type iGameContext = {
  boardLayout: iBoardLayout;
  cardLayout: iCardLayout;

  game: iGameData;

  settings: iGameSettings;

  interface: {
    successAnimation: boolean;
    mismatchAnimation: boolean;
    inverseSettingsModal: {
      isShowing: boolean;
    };
    settingsModal: {
      isShowing: boolean;
    };
    endOfGameModal: {
      isShowing: boolean;
      isWin: boolean;
    };
    scoresModal: {
      isShowing: boolean;
      scores: Array<ScoreWithPercentiles | Score>;
    };
  };
  shuffleCardPositions: QRL<() => void>;
  sliceDeck: QRL<() => void>;
  resetGame: QRL<(settings?: Partial<iGameSettings>) => void>;
  isGameEnded: QRL<
    () =>
      | { isEnded: false }
      | {
          isEnded: true;
          isWin: boolean;
        }
  >;
  startShuffling: QRL<(count?: number) => void>;
  stopShuffling: QRL<() => void>;
  initializeDeck: QRL<() => void>;
  calculateAndResizeBoard: QRL<
    (boardRef: HTMLDivElement, containerRef: HTMLDivElement) => void
  >;
  startGame: QRL<() => void>;
  showSettings: QRL<() => void>;
  hideSettings: QRL<() => void>;
  endGame: QRL<(isWin: boolean) => void>;
  timer: Timer;
  fetchScores: QRL<() => Promise<Score[] | undefined>>;
};
