import {
  $,
  PropFunction,
  Signal,
  component$,
  useOnWindow,
  useSignal,
  useStore,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
const INITIAL_CARD_COUNT = 18;
const CARD_RATIO = 2.25 / 3.5;

type Store = {
  game: {
    cards: number[];
    deck: {
      size: number;
      isLocked: boolean;
    };
  };
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
};

const INITIAL = {
  game: {
    cards: [],
    deck: {
      size: INITIAL_CARD_COUNT,
      isLocked: false,
    },
  },
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
};

export default component$(() => {
  const store = useStore<Store>({
    ...INITIAL,
  });
  const boardRef = useSignal<HTMLDivElement>();
  const containerRef = useSignal<HTMLDivElement>();

  const calculateBoard = $((width?: number, height?: number) => {
    const boardWidth = boardRef.value?.offsetWidth || width || 0;
    const boardHeight = boardRef.value?.offsetHeight || height || 0;
    const boardArea = boardWidth * boardHeight;

    const maxAreaPerCard = boardArea / store.game.deck.size;

    // w * h === 2.25 * 3.5 && w * h === maxAreaPerCard
    // maxAreaPerCard = maxWidthPerCard * maxHeightPerCard;
    // ratio = 3.5 / 2.25 ~= 1.556
    // maxHeightPerCard = maxWidthPerCard * 1.556
    // maxWidthPerCard * maxWidthPerCard * 1.555 = maxAreaPerCard
    // maxAreaPerCard / 1.555 = maxWidthPerCard ^ 2
    //

    // const maxWidthPerCard = Math.sqrt(maxAreaPerCard * CARD_RATIO);
    // const columns = Math.floor(boardWidth / maxWidthPerCard);
    // const rows = Math.ceil(store.game.deck.size / columns);
    // // max height per card is restricted by number of rows:
    // const newCardHeight = boardHeight / rows;
    // const newCardWidth = newCardHeight * CARD_RATIO;

    const maxHeightPerCard = Math.sqrt(maxAreaPerCard / CARD_RATIO); // get height from area
    const rows = Math.ceil(boardHeight / maxHeightPerCard); // round up to add a row for the remainder cards
    const newCardHeight = boardHeight / rows;
    const newCardWidth = newCardHeight * CARD_RATIO;

    // base off our row count, not base off how many cards can fit in the board width
    const columns = Math.ceil(store.game.deck.size / rows);

    const cardArea = newCardWidth * newCardHeight;

    store.cardLayout = {
      width: newCardWidth,
      height: newCardHeight,
      area: cardArea,
    };

    // save board width/height
    store.boardLayout = {
      ...store.boardLayout,
      width: boardWidth,
      height: boardHeight,
      area: boardArea,
      rows,
      columns,
    };

    console.log({
      board: store.boardLayout,
      card: store.cardLayout,
      columns,
      rows,
    });
  });

  // track window resizes for responsive rearrangement
  useOnWindow(
    "resize",
    $(() => {
      if (store.boardLayout.isLocked) {
        return;
      }
      calculateBoard();
    })
  );

  // track deck size changes to adjust board
  useTask$((taskCtx) => {
    taskCtx.track(() => store.game.deck.size);
    if (store.game.deck.isLocked) {
      return;
    }
    store.game.cards = new Array(store.game.deck.size).fill(0).map((_, i) => i);

    if (store.boardLayout.isLocked) {
      return;
    }
    calculateBoard();
  });

  // calculate board on mount
  useVisibleTask$(() => {
    calculateBoard();
  });

  return (
    <div
      class={` w-full max-h-full h-full p-4 grid ${
        store.boardLayout.isLocked ? "overflow-x-auto" : ""
      } `}
      style="grid-template-rows: 12% 88%;"
      ref={containerRef}
    >
      <Settings
        store={store}
        calculateBoard$={calculateBoard}
        containerRef={containerRef}
        // newCalc={newCalc}
      />
      <div
        ref={boardRef}
        class={`grid`}
        style={{
          gridTemplateColumns: `repeat(${store.boardLayout.columns || 4}, 1fr)`,
          gridTemplateRows: `repeat(${store.boardLayout.rows}, 1fr)`,
        }}
      >
        {store.game.cards.map((card) => (
          <Card i={card} store={store} />
        ))}
      </div>
    </div>
  );
});

const Lock = component$(
  ({
    text,
    onChange$,
  }: {
    text: string;
    onChange$: PropFunction<() => void>;
  }) => {
    return (
      <div class="flex gap- items-center justify-end">
        <label for={text} class="mr-2 mb-1">
          {text}
        </label>
        <input class="" type="checkbox" name={text} onChange$={onChange$} />
      </div>
    );
  }
);

const Card = component$(({ i, store }: any) => {
  return (
    <div
      class={`mx-auto aspect-[2.25/3.5] flex flex-col justify-center`}
      style={{
        width: store.cardLayout.width + "px",
        height: store.cardLayout.height + "px",
      }}
    >
      <div class="w-[90%] h-[90%] border rounded-xl border-gray-400 hover:bg-gray-200 hover:text-gray-800 transition-all p-4 mx-auto flex flex-col justify-center items-center">
        some text
      </div>
    </div>
  );
});

const Settings = component$(
  ({
    store,
    calculateBoard$,
    containerRef,
    newCalc,
  }: {
    store: Store;
    calculateBoard$: () => void;
    containerRef: Signal<HTMLDivElement | undefined>;
    newCalc?: Signal<{ board: { width: number; height: number } }>;
  }) => {
    const heightAdjSignal = useSignal({ lastTime: 0, multiplier: 1 });

    const handleAdjustHeight = $((val: number) => {
      if (!containerRef.value) return;

      const rows = containerRef.value.style.gridTemplateRows;
      const [settings, board] = rows
        .split(" ")
        .map((each) => Number(each.substring(0, each.length - 1)));

      console.log({ rows, settings, board });

      // FIXME: TODO: for consecutive button presses, ramp up the value to max of 2 per press (4x)
      // e.g. within 200ms, ramp up the value
      // else, use the incoming value (and reset it)
      const last = heightAdjSignal.value.lastTime;
      const now = Date.now();
      const interval = now - last;

      const multiplier =
        interval < 1000 ? heightAdjSignal.value.multiplier + 1 : 1;

      heightAdjSignal.value = {
        lastTime: now,
        multiplier,
      };

      const newVal = val * multiplier;

      containerRef.value.style.gridTemplateRows = `${settings + newVal}% ${
        board - newVal
      }%`;

      calculateBoard$();
    });

    return (
      <div class="mx-auto p-4 flex gap-4">
        <div class="flex gap-4">
          <Lock
            text="Lock Deck"
            onChange$={() => {
              store.game.deck.isLocked = !store.game.deck.isLocked;
            }}
          />
          <Lock
            text="Lock Board"
            onChange$={() => {
              store.boardLayout.isLocked = !store.boardLayout.isLocked;
              if (!store.boardLayout.isLocked) calculateBoard$();
            }}
          />
        </div>
        <input
          class="w-full"
          type="range"
          max="52"
          min="12"
          step="2"
          value={INITIAL_CARD_COUNT}
          onInput$={(e, t: HTMLInputElement) => {
            console.log("input");
            store.game.deck.size = Number(t?.value);
          }}
          disabled={store.game.deck.isLocked}
        />
        <button
          type="button"
          onClick$={calculateBoard$}
          class="border rounded border-white p-2"
          disabled={store.boardLayout.isLocked}
        >
          Refresh
        </button>
        <div>
          <button onClick$={() => handleAdjustHeight(-0.5)}>Up</button>
          <button onClick$={() => handleAdjustHeight(0.5)}>Down</button>
        </div>
        <div class="text-gray-400">{heightAdjSignal.value.multiplier}x</div>
        <div class="text-gray-400">
          {newCalc?.value?.board.width ?? "-"}x
          {newCalc?.value?.board.height ?? "-"}
        </div>
      </div>
    );
  }
);

/*
 *
 * take ratio of board w/h
 * e.g. 1000w / 500w = 2/1
 *
 * take ratio of card w/h
 *  e.g. 2.25 / 3.5
 *  compare the ratios??
 *
 *
 *
 * */
