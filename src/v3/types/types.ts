import type { QRL } from "@builder.io/qwik";
import type { useTimer } from "~/v3/hooks/useTimer";
import type { iSchemas } from "../validation/schemas";
import { Score } from "../db/schemas/types";

import type { D1Database } from "@cloudflare/workers-types";

export type Env = {
  DB: D1Database;
};

export enum ThemeEnum {
  light = "light",
  dark = "dark",
}
export type iTheme = keyof typeof ThemeEnum;
export type iObj = Record<string, any>;
export type iNestedObj = Record<string, string | iObj>;
export type iEntriesStrings = [string, string][];

export type iTimer = ReturnType<typeof useTimer>;

export type iCoords = { x: number; y: number };

export type iPair = `${number}:${number}`;

// colors are inferred from the symbol
export type iPlayingCardSvgProps = {
  symbol: "diamonds" | "hearts" | "clubs" | "spades";
};

export type iCard = {
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

export enum ScoreTableColumnEnum {
  initials = "initials",
  deck_size = "deck_size",
  pairs = "pairs",
  game_time_ds = "game_time_ds",
  mismatches = "mismatches",
  created_at = "created_at",
}
export type ScoreTableColumn = keyof typeof ScoreTableColumnEnum;

export enum SortDirectionEnum {
  asc = "asc",
  desc = "desc",
}
export type SortDirection = keyof typeof SortDirectionEnum;

export type SortColumnWithDirection = {
  column: ScoreTableColumn;
  direction: SortDirection;
};

/* =====================================================
 *
 * ===================================================== */

export enum iSelectCardEnum {
  OFF,
  ONE,
  TWO,
  BOTH,
}

// settings user will be able to change
export type iUserSettings = iSchemas["userSettings"];

// settings the user will not change
export type iGameSettings = {
  [key: string]: any;
  cardFlipAnimationDuration: number;

  deck: {
    fullDeck: iCard[];
  };
};

export type iBoardLayout = {
  width: number;
  height: number;
  columns: number;
  rows: number;
  area: number;
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
  isStarted: boolean;
  flippedCardId: number;
  selectedCardIds: number[];
  successfulPairs: iPair[];
  cards: iCard[];
  mismatchPairs: iPair[];
  mismatchPair: iPair | "";
  isShaking: boolean;
  isLoading: boolean;
  shufflingState: number;
};

export type iInterfaceSettings = {
  isScrollable: boolean;
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
};

export type iGameState = {
  boardLayout: iBoardLayout;
  cardLayout: iCardLayout;

  gameData: iGameData;

  userSettings: iUserSettings;
  gameSettings: iGameSettings;

  interfaceSettings: iInterfaceSettings;
};

export type iGameHandlers = {
  shuffleCardPositions: QRL<() => void>;
  sliceDeck: QRL<() => void>;
  resetGame: QRL<(settings?: Partial<iUserSettings>) => void>;
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
  initializeDeck: QRL<(isStartup?: boolean) => void>;
  calculateAndResizeBoard: QRL<
    (boardRef: HTMLDivElement, containerRef: HTMLDivElement) => void
  >;
  startGame: QRL<() => void>;
  showSettings: QRL<() => void>;
  hideSettings: QRL<() => void>;
  endGame: QRL<(isWin: boolean) => void>;
};

export type iGameContext = {
  timer: iTimer;
} & iGameState &
  iGameHandlers;
