import type { QRL } from "@builder.io/qwik";
import type { iSchemas } from "../validation/schemas";
import type { iTimer } from "../hooks/useTimer/types";

export enum ThemeEnum {
  light = "light",
  dark = "dark",
}
export type iTheme = keyof typeof ThemeEnum;
export type iObj = Record<string, any>;
export type iNestedObj = Record<string, string | iObj>;
export type iEntriesStrings = [string, string][];

export type iCoords = { x: number; y: number };

export type iPair = `${number}:${number}`;

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

export enum iSelectCardEnum {
  OFF,
  ONE,
  TWO,
  BOTH,
}

export enum GameStateEnum {
  IDLE = "IDLE",
  STARTED = "STARTED",
  ENDED_WIN = "ENDED_WIN",
  ENDED_LOSE = "ENDED_LOSE",
}
export type iGameState = keyof typeof GameStateEnum;

export type iGameData = {
  lastClick: number;
  gameState: GameStateEnum;
  flippedCardId: number;
  selectedCardIds: number[];
  successfulPairs: iPair[];
  cards: iCard[];
  mismatchPairs: iPair[];
  mismatchPair: iPair | "";
  isShaking: boolean;
  isLoading: boolean;
  shufflingState: number;
  startingPosition: iCoords;
  dealCardIndex: number;
};

// settings user will be able to change
export type iUserSettings = iSchemas["userSettings"] & {
  [key: string]: any;
};

// settings the user will not change
export type iGameSettings = {};

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

export type iState = {
  boardLayout: iBoardLayout;
  cardLayout: iCardLayout;

  gameData: iGameData;

  userSettings: iUserSettings;
  gameSettings: iGameSettings;

  interfaceSettings: iInterfaceSettings;
};

export type iGameHandlers = {
  dealCard: QRL<() => void>;
  shuffleCardPositions: QRL<() => void>;
  sliceDeck: QRL<() => void>;
  resetGame: QRL<(settings?: Partial<iUserSettings>, isStartup?: boolean) => void>;
  isEndGameConditionsMet: QRL<
    () =>
      | { isEnded: false }
      | {
          isEnded: true;
          isWin: boolean;
        }
  >;
  startShuffling: QRL<(hideSettings?: boolean, count?: number) => void>;
  stopShuffling: QRL<() => void>;
  calculateAndResizeBoard: QRL<() => void>;
  startGame: QRL<() => void>;
  showSettings: QRL<() => void>;
  hideSettings: QRL<() => void>;
  showEndGameModal: QRL<() => void>;
  hideEndGameModal: QRL<() => void>;
  toggleModalOnEscape: QRL<() => void>;
  endGame: QRL<(isWin: boolean) => void>;
};

// old
export type iGameContext = {
  timer: iTimer;
} & iGameState &
  iGameHandlers;
