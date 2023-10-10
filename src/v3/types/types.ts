import type { QRL } from "@builder.io/qwik";
import type { useTimer } from "../utils/useTimer";


export type iObj = { [key: string]: any };
export type iObjEntries = { [key: string]: any };

export type iNestedObj = { [key: string]: string | iObj };

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

// settings user will be able to change
export type iUserSettings = {
  [key: string]: any;
  maxAllowableMismatches: number;

  shuffleBoardAfterMismatches: number;
  shuffleBoardAfterPair: boolean;
  shuffleBoardAfterRound: boolean;

  shufflePickedAfterMismatch: boolean;

  reorgnanizeBoardOnPair: boolean;
  reorgnanizeBoardOnMismatch: boolean;

  deck: {
    size: number;
    isLocked: boolean;
  };

  board: {
    resize: boolean;
    isLocked: boolean;
  };

  interface: {
    showSelectedIds: boolean;
    showDimensions: boolean;
  };
};

// settings the user will not change
export type iGameSettings = {
  [key: string]: any;
  cardFlipAnimationDuration: number;

  deck: {
    MINIMUM_CARDS: number;
    MAXIMUM_CARDS: number;
    fullDeck: Card[];
  };
};

export type BoardLayout = {
  width: number;
  height: number;
  columns: number;
  rows: number;
  area: number;
  rowHeight: number;
  colWidth: number;
};

export type CardLayout = {
  width: number;
  height: number;
  area: number;
  roundedCornersPx: number;
  colGapPercent: number;
  rowGapPercent: number;
};

export type GameData = {
  isStarted: boolean;
  flippedCardId: number;
  selectedCardIds: number[];
  successfulPairs: Pair[];
  cards: Card[];
  mismatchPairs: Pair[];
  mismatchPair: Pair | "";
  isShaking: boolean;
  isLoading: boolean;
  shufflingState: number;
};

export type iGameContext = {
  boardLayout: BoardLayout;
  cardLayout: CardLayout;

  game: GameData;

  userSettings: iUserSettings;
  gameSettings: iGameSettings;

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
  };

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
  initializeDeck: QRL<() => void>;
  calculateAndResizeBoard: QRL<
    (boardRef: HTMLDivElement, containerRef: HTMLDivElement) => void
  >;
  startGame: QRL<() => void>;
  showSettings: QRL<() => void>;
  hideSettings: QRL<() => void>;
  endGame: QRL<(isWin: boolean) => void>;
  timer: Timer;
};
