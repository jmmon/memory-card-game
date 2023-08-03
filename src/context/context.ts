import { type QRL, createContextId } from "@builder.io/qwik";

type ShuffleCardsMode =
  | "never" // never; same as setting shuffleCards to false
  | "afterMatch" // after successful match
  | "afterMismatch" // after successful mismatch
  | "afterRound" // after every 2 drawn cards
  | "afterCardSelect"; // after every card
type ShuffleCards = {
  mode: ShuffleCardsMode;
  // interval: e.g. every 3 mismatches or every 3 cards/rounds
  interval: number | "every";
};

type SlideCardsMode = "towardsFront" | "slideUp" | "outwards";
type SlideCards = {
  mode: SlideCardsMode;
  // right->left down->up
  // cascade upwards to fill gaps
  // cards slide outwards to fill gaps leaving center empty
  reverse: boolean; // affects two above settings
  runAfterEveryCardSelect: boolean; // instead of after every round (default false)
};

export type Card = {
  id: string; // unique id
  text: string; // content of the card
  position: number; // where it lands in the order of slots on the board
  pairId: string;
};

export type Coords = {
  x: number;
  y: number; 
}

export type GetXYfromPosition = QRL<(position: number, columnCount: number) => Coords>;

export type CardPair =`${number}:${number}`

export type BoardContext = {
  cards: Card[];
  selectedIds: string[]; // holds 0 or 1 or 2 ids
  pairs: CardPair[];
  mismatchCount: number;
  totalCards: number;
  getXYfromPosition: GetXYfromPosition;
};

export type SettingsContext = {
  pairCount: number; // to act as difficulty
  columnCount: number;
  /*
   * @default -1 (-1 means restriction is disabled, aka infinite)
   * On mismatch of two cards, the mismatchCount increments.
   * With this enabled, cards will slide right->left down->up to fill gaps
   */
  maxMismatchCount: number;

  /*
   * TODO:
   * @default false
   * On successful pair, gaps are left. Options to slide cards to fill gaps
   */
  slideCards: false | SlideCards;

  /*
   * TODO:
   * @default false
   * On successful pair, gaps are left. Options to shuffle the table, if you dare
   */
  shuffleCards: false | ShuffleCards;
};

export type AppContext = { board: BoardContext; settings: SettingsContext };
export const AppContext = createContextId<AppContext>("AppContext");

export const BoardContext = createContextId<BoardContext>("BoardContext");
export const SettingsContext =
  createContextId<SettingsContext>("SettingsContext");
