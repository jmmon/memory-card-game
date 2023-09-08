import {
  component$,
  $,
  useContext,
  useContextProvider,
  useSignal,
  useStore,
  useTask$,
  useComputed$,
} from "@builder.io/qwik";
import Jabber from "jabber";
import { AppContext, CardPair } from "../../context/context";
import { Card } from "~/old/utils/cardUtils";

export default component$(() => {
  const appStore = useStore<AppContext>({
    settings: {
      pairCount: 12, // 12 means 24 cards
      columnCount: 6, // 6 cols means 24 / 6 = 4 rows, 6x4
      maxMismatchCount: -1,
      slideCards: false, // will implement later
      shuffleCards: false, // will implement later
    },
    board: {
      cards: [],
      selectedIds: [],
      pairs: [],
      mismatchCount: 0,
      totalCards: 0,
      // position is 0-based
      getXYfromPosition: $((position: number, columnCount: number) => ({
        // 23 % 6 = 5; 16 % 6 = 4;
        x: position % columnCount,
        // 23 / 6 = 3.; 16 / 6 = 2.;
        y: Math.floor(position / columnCount),
      })),
    },
  });

  // initialization
  useTask$(() => {
    const totalCards = appStore.settings.pairCount * 2;
    appStore.board.cards = generateCards(totalCards);
    appStore.board.totalCards = totalCards;
  });

  useContextProvider(AppContext, appStore);

  return (
    <div class="flex flex-col gap-2 w-full h-full">
      <h2 class="text-center text-4xl text-slate-500">Memory Card Game</h2>
      {/* <Settings /> */}
      <Board />
    </div>
  );
});

type CardsSignal = {
  [key: string]: Card;
};

export const Board = component$(() => {
  const appStore = useContext(AppContext);

  // Need a way to make sure the cards land in the correct positions.
  // 1. Have card regulate a gap on the left if it is not the next position after the previous card
  // If board were object of key<position>: value<Card>,
  // we could easily place the cards. We can use map to do this, or change the data structure.
  // For now I guess I'll just map them
  const cards = useSignal<CardsSignal>({});

  useTask$((taskCtx) => {
    taskCtx.track(() => appStore.board.cards);

    // reduce array to object with key<position>: value<Card> to hold all cards
    // creates a NEW object each time so reactivity should work
    cards.value = appStore.board.cards.reduce((accum, card) => {
      accum[card.position] = card;
      return accum;

      // alternate (creates a bunch of extra objects)
      // return {...accum, [card.position]: card};
    }, {} as CardsSignal);
  });

  return (
    <div class="p-4 flex flex-col gap-8 w-full">
      <BoardHeader />
      <div
        class="grid gap-3 w-full"
        style={{
          gridTemplateColumns: `repeat(${appStore.settings.columnCount}, 1fr)`,
          gridTemplateRows: `repeat(${Math.ceil(
            appStore.board.totalCards / appStore.settings.columnCount
          )}, 1fr)`,
        }}
      >
        {Object.entries(cards.value)
          .sort(([posA, ], [posB, ]) => Number(posA) - Number(posB))
          .map(([position, card]) => (
            <CardUnit key={position} card={card} />
          ))}
      </div>
    </div>
  );
});

export const BoardHeader = component$(() => {
  return (
    <div class="grid w-full h-4 grid-cols-3">
      <PairsWidget />
      <h2 class="text-center text-2xl">Board</h2>
      <MismatchCountWidget />
    </div>
  );
});

export const PairsWidget = component$(() => {
  const appStore = useContext(AppContext);
  return (
    <div class="m-auto">
      <h4 class="inline mr-2">Pairs:</h4>
      <span>{appStore.board.pairs.length}</span>
    </div>
  );
});
export const MismatchCountWidget = component$(() => {
  const appStore = useContext(AppContext);
  return (
    <div class="m-auto">
      <h4 class="inline mr-2">Mismatches:</h4>
      <span>{appStore.board.mismatchCount}</span>
    </div>
  );
});

export const checkMatch = (cardA: Card, cardB: Card): boolean => {
  return cardA.pairId === cardB.id && cardB.pairId === cardA.id;
};

export const checkForPairsIds = (card: Card, pairs: CardPair[]) => {
  const foundPairs = pairs.filter((pair) => {
    const split = pair.split(":");
    return split[0] === card.id || split[1] === card.id;
  });
  return foundPairs.length > 0;
};

// position determines slot in a css grid
// position is 0-based, so should be able to pick x to x + 1, and y to y + 1
export const CardUnit = component$(({ card }: { card: Card }) => {
  const appStore = useContext(AppContext);

  const coords = useComputed$(() =>
    appStore.board.getXYfromPosition(
      Number(card.position),
      appStore.settings.columnCount
    )
  );

  const isSelected = useComputed$(() => {
    const isIncluded = appStore.board.selectedIds.includes(card.id);
    console.log({ isSelected: isIncluded });
    return isIncluded;
  });

  const isRemoved = useComputed$(() => {
    return checkForPairsIds(card, appStore.board.pairs);
  });
  // const isRemoved = true;

  const handleClickCard = $(() => {
    console.log("clicked");
    if (
      appStore.board.selectedIds.includes(card.id) ||
      checkForPairsIds(card, appStore.board.pairs)
    ) {
      return;
    }
    appStore.board.selectedIds.push(card.id);

    const selected = appStore.board.selectedIds;

    if (selected.length >= 2) {
      const selectedCards = (
        [
          appStore.board.cards[Number(selected[0])],
          appStore.board.cards[Number(selected[1])],
        ] as Card[]
      ).sort((a, b) => Number(a.id) - Number(b.id));

      const isMatch = checkMatch(selectedCards[0], selectedCards[1]);

      if (isMatch) {
        appStore.board.pairs.push(
          `${Number(selectedCards[0].id)}:${Number(selectedCards[1].id)}`
        );
      } else {
        appStore.board.mismatchCount++;
      }

      appStore.board.selectedIds = [];
    }
    console.log("clicked card:", { card });
  });

  // so this will be a card. What I want is to have a container and it has two divs, one for the "front" and one for the "back". When clicking a card, the card will go from "facedown" to "faceup", meaning the back will flip 180* and the front will flip 180* together.
  return (
    <>
      <div
        class={`flex flex-col h-full box-border p-2 cursor-pointer border rounded-xl border-slate-900 bg-slate-800 hover:border-slate-700 hover:bg-white hover:bg-opacity-25 transition-all ${
          isRemoved.value ? "opacity-0 pointer-events-none" : "opacity-100"
        } `}
        style={{
          gridColumn: `${coords.value.x + 1} / ${coords.value.x + 2}`,
          gridRow: `${coords.value.y + 1} / ${coords.value.y + 2}`,
        }}
        onClick$={() => (isRemoved.value ? "" : handleClickCard())}
      >
        <div class="mb-2 text-slate-500 text-center">{card.id}</div>
        <p class="flex-1 text-sm">{card.text}</p>

        <div class="bg-slate-950 justify-self-end">
          <small class="flex justify-between">
            <b>Pair ID: {card.pairId}</b>
            <b class={isSelected.value ? "" : "line-through text-slate-500"}>
              SELECTED
            </b>
          </small>
        </div>
      </div>
    </>
  );
});

// for displaying settings:
export const Settings = component$(() => {
  // const appStore = useContext(AppContext);
  return (
    <div>
      <table>
        <tbody>
          {[].map((e) => (
            <SettingsRow key={e} e={e} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

export const SettingsRow = component$((props: { e: any }) => {
console.log({props});
  return (
    <tr>
      {[].map((each) => (
        <td key={each}>{each}</td>
      ))}
    </tr>
  );
});

export const generateCards = (count: number) => {
  const jabber = new Jabber();
  return new Array(count).fill(12).map(
    (e, i) =>
      ({
        id: i.toString(),
        text: jabber.createParagraph(10 + Math.ceil(8 * Math.random())),
        position: i,
        pairId: String(i % 2 == 0 ? i + 1 : i - 1),
      } as Card)
  );
};
