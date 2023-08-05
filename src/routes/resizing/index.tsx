import {
  $,
  PropFunction,
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
  boardLayout: {
    width: 992,
    height: 559,
    area: 554528,
    rows: 3,
    columns: 7,
  },
  cardLayout: {
    width: 119.7857142857143,
    height: 186.33333333333334,
    area: 22320.071428571435,
  },
};

export default component$(() => {
  const store = useStore<Store>({
    game: {
      cards: [],
      deck: { size: INITIAL_CARD_COUNT, isLocked: false },
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
  });
  const boardRef = useSignal<HTMLDivElement>();

  const calculateBoard = $((width?: number, height?: number) => {
    const boardWidth = boardRef.value?.offsetWidth || width || 0;
    const boardHeight = boardRef.value?.offsetHeight || height || 0;
    const boardArea = boardWidth * boardHeight;

    const maxAreaPerCard = boardArea / store.game.deck.size;

    // w * h : 2.25 * 3.5 && w * h === maxAreaPerCard
    // maxAreaPerCard = maxWidthPerCard * maxHeightPerCard;
    // ratio = 3.5 / 2.25 ~= 1.556
    // maxHeightPerCard = maxWidthPerCard * 1.556
    //
    // maxWidthPerCard * maxWidthPerCard * 1.555 = maxAreaPerCard

    // maxAreaPerCard / 1.555 = maxWidthPerCard ^ 2

    const maxWidthPerCard = Math.sqrt(maxAreaPerCard * CARD_RATIO);
    const cardsPerRow = Math.floor(boardWidth / maxWidthPerCard);
    const rows = Math.ceil(store.game.deck.size / cardsPerRow);
    // max height per card is restricted by number of rows:
    const maxHeightPerCard = boardHeight / rows;
    const newCardWidth = maxHeightPerCard * CARD_RATIO;

    store.cardLayout = {
      width: newCardWidth,
      height: maxHeightPerCard,
      area: newCardWidth * maxHeightPerCard,
    };

    // save board width/height
    store.boardLayout = {
      ...store.boardLayout,
      width: boardWidth,
      height: boardHeight,
      area: boardArea,
      rows,
      columns: cardsPerRow,
    };

    console.log({
      board: store.boardLayout,
      card: store.cardLayout,
      columns: cardsPerRow,
      rows,
    });
  });

  useVisibleTask$((taskCtx) => {
    taskCtx.track(
      () => store.game.deck.size
      // ||
      //         boardRef.value?.offsetWidth ||
      //         boardRef.value?.offsetHeight
    );
  });

  // track window resizes for responsive rearrangement (can shuffle cards around!
  useOnWindow(
    "resize",
    $(() => {
      if (store.boardLayout.isLocked) {
        return;
      }
      calculateBoard();
    })
  );

  // track deck size changes
  useTask$((taskCtx) => {
    taskCtx.track(() => store.game.deck.size);
    if (store.game.deck.isLocked) {
      return;
    }
    store.game.cards = new Array(store.game.deck.size).fill(0).map((_, i) => i);
    calculateBoard();
  });

  // initialize board on server at specific dimensions
  useTask$(() => {
    calculateBoard(INITIAL.boardLayout.width, INITIAL.boardLayout.height);
  });

  return (
    <div class="w-full h-full p-4 grid" style="grid-template-rows: 8% 92%;">
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
            }}
          />
        </div>
        <input
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
          onClick$={() => calculateBoard()}
          class="border rounded border-white bg-white p-2"
          disabled={store.boardLayout.isLocked}
        >
          Refresh
        </button>
      </div>
      <div
        ref={boardRef}
        class={`grid w-full h-full`}
        style={{
          gridTemplateRows: `repeat(${store.boardLayout.rows}, 1fr)`,
          gridTemplateColumns: `repeat(${store.boardLayout.columns}, 1fr)`,
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
        <label for={text} class="mr-2 mb-1">{text}</label>
        <input class="" type="checkbox" name={text} onChange$={onChange$} />
      </div>
    );
  }
);

const Card = component$(({ i, store }: any) => {
  return (
    <div
      class={`mx-auto aspect-[2.25/3.5] bg-gray-50 flex flex-col justify-center`}
      style={{
        width: store.cardLayout.width + "px",
        height: store.cardLayout.height + "px",
      }}
    >
      <div
        class="border rounded-xl border-gray-400 p-4 mx-auto flex flex-col justify-center items-center"
        style="width: 90%; height: 90%;"
      >
        some text
      </div>
    </div>
  );
});

/*
 *
 * take ratio of board w/h
 * e.g. 1000w / 1200h = 1/1.2
 *
 *
 *
 * */
