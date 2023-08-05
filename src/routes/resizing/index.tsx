import {
  $,
  component$,
  useOnWindow,
  useSignal,
  useStore,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
const CARD_COUNT = 18;
// const cards = new Array(CARD_COUNT).fill(0).map((_, i) => i);
const CARD_RATIO = 2.25 / 3.5;

export default component$(() => {
  const store = useStore({
    boardLayout: {
      width: 0,
      height: 0,
      area: 0,
      rows: 0,
      columns: 0,
    },
    cardLayout: {
      width: 0,
      height: 0,
      area: 0,
    },
  });
  const boardRef = useSignal<HTMLDivElement>();
  const cardsSliderSignal = useSignal<number>(CARD_COUNT);
  const cards = useSignal<number[]>([]);

  const calculateBoard = $(() => {
    const boardWidth = boardRef.value?.offsetWidth || 0;
    const boardHeight = boardRef.value?.offsetHeight || 0;
    const boardArea = boardWidth * boardHeight;

    const maxAreaPerCard = boardArea / cardsSliderSignal.value;

    // w * h : 2.25 * 3.5 && w * h === maxAreaPerCard
    // maxAreaPerCard = maxWidthPerCard * maxHeightPerCard;
    // ratio = 3.5 / 2.25 ~= 1.556
    // maxHeightPerCard = maxWidthPerCard * 1.556
    //
    // maxWidthPerCard * maxWidthPerCard * 1.555 = maxAreaPerCard

    // maxAreaPerCard / 1.555 = maxWidthPerCard ^ 2

    const maxWidthPerCard = Math.sqrt(maxAreaPerCard * CARD_RATIO);
    const cardsPerRow = Math.floor(boardWidth / maxWidthPerCard);
    const rows = Math.ceil(cardsSliderSignal.value / cardsPerRow);
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
    taskCtx.track(() => cardsSliderSignal.value);
    calculateBoard();
  });

  useOnWindow(
    "resize",
    $(() => {
      calculateBoard();
    })
  );

  useTask$((taskCtx) => {
    taskCtx.track(() => cardsSliderSignal.value);
    cards.value = new Array(cardsSliderSignal.value).fill(0).map((_, i) => i);
  });

  return (
    <div class="w-full h-full p-4 flex flex-col">
      <div class="mx-auto p-4">
        <input
          type="range"
          max="52"
          min="12"
          step="2"
          value={CARD_COUNT}
          onInput$={(e, t: HTMLInputElement) => {
            console.log("input");
            cardsSliderSignal.value = Number(t?.value);
          }}
        />
      </div>
      <div
        ref={boardRef}
        class={`grid w-full h-full`}
        style={{
          gridTemplateRows: `repeat(${store.boardLayout.rows}, 1fr)`,
          gridTemplateColumns: `repeat(${store.boardLayout.columns}, 1fr)`,
        }}
      >
        {cards.value.map((card) => (
          <Card i={card} store={store} />
        ))}
      </div>
    </div>
  );
});

const Card = component$(({ i, store }: any) => {
  return (
    <div
      class={`mx-auto aspect-[2.25/3.5] bg-gray-50 border rounded-xl border-gray-400 p-4`}
      style={{
        width: store.cardLayout.width + "px",
        height: store.cardLayout.height + "px",
      }}
    >
      some text
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
