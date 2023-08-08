import {
  $,
  PropFunction,
  QRL,
  QwikChangeEvent,
  QwikMouseEvent,
  Slot,
  component$,
  useContext,
  useContextProvider,
  useSignal,
  useStore,
  useStyles$,
  useStylesScoped$,
} from "@builder.io/qwik";
import V3Board from "../v3-board/v3-board";
import { AppContext } from "../v3-context/v3.context";
import { shuffleCardPositions, v3GenerateCards } from "../utils/v3CardUtils";

const deckCardsApi = "https://deckofcardsapi.com/api/deck/new/";
const partialDeckApi =
  "https://deckofcardsapi.com/api/deck/new/shuffle/?cards=";

const deckCardsDrawApi = {
  base: "https://deckofcardsapi.com/api/deck/",
  remainder: "/draw/?count=",
  generate: function (
    this: { base: string; remainder: string; generate: any },
    deckId: string,
    cardCount: number
  ): string {
    return this.base + deckId + this.remainder + cardCount;
  },
};
const CARD_CODES = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "J",
  "Q",
  "K",
];
const CARD_SUITS = ["S", "H", "C", "D"];
export const getNewCards = async (cardCount: number) => {
  const cards = [];
  for (let i = 0; i < cardCount / 2; i++) {
    const isEven = i % 2 === 0;
    const thisCardCode = CARD_CODES[Math.floor(i / 2)];
    const newCards = [
      `${isEven ? "D" : "C"}${thisCardCode}`,
      `${isEven ? "H" : "S"}${thisCardCode}`,
    ];

    cards.push(newCards);
  }

  try {
    // get new partial deck
    const response = await fetch(partialDeckApi + cards.join(","));
    const deckJson = await response.json();
    console.log({ deckJson });

    // draw cardCount cards
    const cardsResponse = await fetch(
      deckCardsDrawApi.generate(deckJson.deck_id, cardCount)
    );
    const drawnCardsJson = await cardsResponse.json();
    console.log({ drawnCardsJson });

    // return them
    return drawnCardsJson.cards;
  } catch (err) {
    console.log({ err });
  }
};

const DEFAULT_CARD_COUNT = 18;

export type Pair = `${number}:${number}`;
//
// MIN_MAX_COLUMNS_OFFSET == computed, MIN_MAX_ROWS_OFFSET == computed, getXYFromPosition, isCardRemoved
export type V3Card = {
  id: number; // unique id
  text: string; // content of the card
  position: number; // where it lands in the order of slots on the board
  pairId: number;
  isMismatched: boolean;
};

export type AppStore = {
  boardLayout: {
    width: number;
    height: number;
    area: number;
    rows: number;
    columns: number;
    isLocked: boolean;
  };

  cardLayout: {
    width: number;
    height: number;
    area: number;
  };

  game: {
    flippedCardId: number;
    selectedCardIds: number[];
    successfulPairs: Pair[];
    cards: V3Card[];
    mismatchPairs: Pair[];
  };
  settings: {
    cardFlipAnimationDuration: number;
    columnCount: number; // default 6, should dynamically adjust
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
      minimumCards: number;
      maximumCards: number;
    };
    modal: {
      isShowing: boolean;
    };
  };
  shuffleCardPositions: QRL<() => void>;
  toggleModal: QRL<() => void>;
};

const INITIAL = {
  // TODO (after settings is DONE):
  // - get settings for ~1280px * 720px window for use as default
  boardLayout: {
    width: 992,
    height: 559,
    area: 554528,
    rows: 3,
    columns: 7,
    isLocked: false, // prevent recalculation of board layout
  },

  cardLayout: {
    width: 119.7857142857143,
    height: 186.33333333333334,
    area: 22320.071428571435,
  },

  game: {
    flippedCardId: -1,
    selectedCardIds: [],
    successfulPairs: [],
    cards: v3GenerateCards(DEFAULT_CARD_COUNT),
    mismatchPairs: [],
  },

  settings: {
    cardFlipAnimationDuration: 800,
    columnCount: 6,
    maxAllowableMismatches: -1,

    /* shuffle board after x mismatches
     *  0 = off
     *  1+ = every n mismatches
     * */
    shuffleBoardAfterMismatches: 0,
    /* shuffle board after successful pair */
    shuffleBoardAfterPair: false,
    /* shuffle board after success OR mismatch */
    shuffleBoardAfterRound: false,

    /* shuffle picked cards after placed back down after mismatch */
    shufflePickedAfterMismatch: false,

    /* recalculate board dimensions (eliminate empty spaces) on pair, on mismatch
     * */
    reorgnanizeBoardOnPair: false,
    reorgnanizeBoardOnMismatch: false,

    deck: {
      size: DEFAULT_CARD_COUNT,
      isLocked: false,
      minimumCards: 2,
      maximumCards: 52,
    },
    modal: { isShowing: false },
  },

  shuffleCardPositions: $(function (this: AppStore) {
    const cards = this.game.cards;
    const shuffled = shuffleCardPositions(this.game.cards);
    console.log({ cards, shuffled });
    this.game.cards = shuffled;
  }),

  toggleModal: $(function (this: AppStore) {
    this.settings.modal.isShowing = !this.settings.modal.isShowing;
  }),
};

export default component$(() => {
  // set up context
  const appStore = useStore<AppStore>({ ...INITIAL });
  const containerRef = useSignal<HTMLDivElement>();

  useContextProvider(AppContext, appStore);

  return (
    <div
      class={`w-full max-h-full h-full p-4 grid ${
        appStore.boardLayout.isLocked ? "overflow-x-auto" : ""
      }`}
      style="grid-template-rows: 12% 88%;"
      ref={containerRef}
    >
      <GameHeader />
      <V3Board />
      <SettingsModal />
      {/* maybe have the modal here */}
    </div>
  );
});

const GameHeader = component$(() => {
  const appStore = useContext(AppContext);

  return (
    <header
      class={`mx-auto text-center grid text-xs md:text-sm grid-cols-[1fr_5em_1fr] items-center w-full px-[5%]`}
    >
      <HeaderSection justify="left">
        <SelectionHeaderComponent />
        {appStore.boardLayout.isLocked && (
          <code class="bg-gray-800 text-gray-200">board locked</code>
        )}
        {appStore.settings.deck.isLocked && (
          <code class="bg-gray-800 text-gray-200">deck locked</code>
        )}
      </HeaderSection>
      <button
        onClick$={() => appStore.toggleModal()}
        class="p-2 border border-gray-200 bg-slate-700 rounded hover:bg-slate-500"
      >
        Settings
      </button>
      <HeaderSection>
        <code class="bg-gray-800 text-gray-200">
          pairs: {appStore.game.successfulPairs.length}/
          {appStore.settings.deck.size / 2}{" "}
        </code>

        <code class="bg-gray-800 text-gray-200">
          mismatches: {appStore.game.mismatchPairs.length}
          {appStore.settings.maxAllowableMismatches === -1
            ? ""
            : appStore.settings.maxAllowableMismatches === 0
            ? `/0`
            : `/${appStore.settings.maxAllowableMismatches}`}
        </code>
      </HeaderSection>
    </header>
  );
});

const SelectionHeaderComponent = component$(() => {
  const appStore = useContext(AppContext);
  return (
    <code class="bg-gray-800 flex flex-wrap text-center gap-x-4 text-gray-200">
      <div class="w-min inline-block mx-auto">selected:</div>
      <div class="grid grid-cols-[3.6em_0.6em_3.6em] mx-auto">
        <span>{appStore.game.selectedCardIds[0] ?? "-"}</span>
        <span>:</span>
        <span>{appStore.game.selectedCardIds[1] ?? "-"}</span>
      </div>
    </code>
  );
});

const HeaderSection = component$(
  ({ justify = "center" }: { justify?: "left" | "right" | "center" }) => {
    return (
      <div
        class={`w-full flex gap-3 ${
          justify === "right"
            ? "justify-end"
            : justify === "left"
            ? "justify-start"
            : "justify-center"
        } `}
      >
        <Slot />
      </div>
    );
  }
);

const SettingsModal = component$(() => {
  const appStore = useContext(AppContext);

  const closeModal = $((e: QwikMouseEvent) => {
    console.log((e.target as HTMLElement).dataset.name);
    if (e.target && (e.target as HTMLElement).dataset.name === "background") {
      if (appStore.settings.modal.isShowing) {
        appStore.settings.modal.isShowing = false;
      }
    }
  });

  useStyles$(`
  .tooltip {
    position: relative;
    cursor: pointer;
  }

  .tooltip label,
  .tooltip input {
    cursor: pointer;
  }

  .tooltip .tooltiptext {
    visibility: hidden;
    width: 100%;
    background-color: #222;
    border: 1px solid #111;
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 5px 5px;

    /* position the tooltip */
    position: absolute;
    z-index: 1;
    top: 100%;
  }

  .tooltip:hover .tooltiptext {
    visibility: visible;
  }
`);

  return (
    <div
      class={` backdrop-blur-sm top-0 left-0 absolute w-full h-full bg-black flex justify-center transition-all duration-300 items-center ${
        appStore.settings.modal.isShowing
          ? "z-[100] bg-opacity-30"
          : "z-[-1] bg-opacity-0"
      }`}
      data-name="background"
      onClick$={closeModal}
    >
      <div
        class={` text-center bg-slate-700 rounded-3xl p-12 transition-all duration-300 ${
          appStore.settings.modal.isShowing
            ? "pointer-events-auto opacity-100 scale-100 z-[100]"
            : "pointer-events-none opacity-0 scale-150 z-[-1]"
        }`}
        data-name="modal"
      >
        <div class="flex gap-8 flex-col">
          <SettingsRow>
            <div class="flex gap-4 items-center tooltip">
              <label>Shuffle Cards After N Mismatches:</label>
              <input
                name="deck-shuffle-mismatches"
                id="deck-shuffle-mismatches"
                class="bg-slate-700 border border-slate-800 p-2 rounded text-center"
                type="number"
                min="0"
                max="20"
                step="1"
                value={Number(appStore.settings.shuffleBoardAfterMismatches)}
                onChange$={(e, t: HTMLInputElement) => {
                  console.log("input:", t?.value);
                  appStore.settings.shuffleBoardAfterMismatches = Number(
                    t?.value
                  );
                }}
              />
              <span class="tooltiptext">
                Count of how many mismatches before shuffling the board.
              </span>
            </div>
            <div class="w-6"></div>
            <Lock
              text="Shuffle Board After Pair:"
              tooltip="After each successful match, shuffle the board."
              onChange$={(e) => {
                appStore.settings.shuffleBoardAfterPair = (
                  e.target as HTMLInputElement
                ).checked;
              }}
            />
          </SettingsRow>

          <SettingsRow>
            <Lock
              text="Shuffle Board After Round:"
              tooltip="After each round (success or mismatch), shuffle the board."
              onChange$={(e) => {
                appStore.settings.shuffleBoardAfterRound = (
                  e.target as HTMLInputElement
                ).checked;
              }}
            />
            <div class="w-6"></div>
            <Lock
              text="Shuffle Picked Cards After Mismatch:"
              tooltip="After mismatching a pair of cards, shuffle them with two other cards."
              onChange$={(e) => {
                appStore.settings.shufflePickedAfterMismatch = (
                  e.target as HTMLInputElement
                ).checked;
              }}
            />
          </SettingsRow>

          <SettingsRow>
            <Lock
              text="Reorganize Board After Mismatch:"
              tooltip="After mismatching a pair, reorganize the board to fill in gaps and adjust to window size."
              onChange$={(e) => {
                appStore.settings.reorgnanizeBoardOnMismatch = (
                  e.target as HTMLInputElement
                ).checked;
              }}
            />
            <div class="w-6"></div>
            <Lock
              text="Reorganize Board After Pair:"
              tooltip="After a successful pair, reorganize the board to fill in gaps and adjust to window size."
              onChange$={(e) => {
                appStore.settings.reorgnanizeBoardOnPair = (
                  e.target as HTMLInputElement
                ).checked;
              }}
            />
          </SettingsRow>

          <div class="flex gap-8 justify-between">
            <div class="flex gap-8 flex-col">
              <SettingsRow>
                <Lock
                  text="Lock Deck:"
                  tooltip="Prevent deck size from changing."
                  onChange$={(e) => {
                    appStore.settings.deck.isLocked = (
                      e.target as HTMLInputElement
                    ).checked;
                  }}
                />
                <div class="w-6"></div>
                <Lock
                  text="Lock Board:"
                  tooltip="Prevent board layout from changing."
                  onChange$={(e) => {
                    appStore.boardLayout.isLocked = (
                      e.target as HTMLInputElement
                    ).checked;
                  }}
                />
              </SettingsRow>

              <SettingsRow>
                <div class="flex gap-4 items-center tooltip">
                  <label class="w-full" for="deck-card-count">
                    Deck Card Count:
                  </label>
                  <input
                    name="deck-card-count"
                    id="deck-card-count"
                    class="w-full"
                    type="range"
                    min={appStore.settings.deck.minimumCards}
                    max={appStore.settings.deck.maximumCards}
                    step="2"
                    value={appStore.settings.deck.size}
                    onInput$={(e, t: HTMLInputElement) => {
                      console.log("input");
                      appStore.settings.deck.size = Number(t?.value);
                    }}
                    disabled={appStore.settings.deck.isLocked}
                  />
                  <span class="tooltiptext">Number of cards in the deck.</span>
                </div>
              </SettingsRow>
            </div>

            <div class="flex gap-8 flex-col">
              <SettingsRow>
                <div class="flex gap-4 items-center tooltip">
                  <button
                    class="bg-slate-500 rounded p-2"
                    onClick$={() => appStore.shuffleCardPositions()}
                  >
                    Shuffle Deck
                  </button>
                  <span class="tooltiptext">Shuffle the card positions.</span>
                </div>
              </SettingsRow>
            </div>
          </div>
        </div>

        <button
          class="absolute top-3 right-3 border-slate-400 border rounded-lg p-2 transition-all bg-slate-800/90 hover:bg-slate-600"
          onClick$={() => {
            appStore.settings.modal.isShowing = false;
          }}
        >
          X
        </button>
      </div>
    </div>
  );
});

const SettingsRow = component$(() => {
  return (
    <div class="flex justify-center w-full border border-slate-800 rounded-lg p-6">
      <div class="flex justify-between gap-2">
        <Slot />
      </div>
    </div>
  );
});

const Lock = component$(
  ({
    text,
    onChange$,
    classes,
    tooltip,
  }: {
    text: string;
    onChange$: PropFunction<(e: QwikChangeEvent) => void>;
    classes?: string;
    tooltip?: string;
  }) => {
    return (
      <div
        class={`${tooltip ? "tooltip" : ""} ${
          classes ? classes : ""
        } flex gap-2 items-center justify-end `}
      >
        <label for={text} class="mr-2 mb-1 cursor-pointer">
          {text}
        </label>
        <input
          class="cursor-pointer w-6 h-6"
          type="checkbox"
          id={text}
          name={text}
          onChange$={(e) => onChange$(e)}
        />
        {tooltip && <span class="tooltiptext">{tooltip}</span>}
      </div>
    );
  }
);
