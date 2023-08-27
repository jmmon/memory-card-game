import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { FULL_DECK_COUNT, formatCards, getCardsFromApi, v3GenerateCards } from "~/components/v3/utils/v3CardUtils";
import V3Game from "~/components/v3/v3-game/v3-game";

export const useDeck = routeLoader$(async () => {
  console.log("fetching cards...");
  const cards = await getCardsFromApi(FULL_DECK_COUNT);
  if (cards === undefined || cards.length === 0) {
    return v3GenerateCards(FULL_DECK_COUNT);
  }
  console.log(`fetched!\nformatting cards...`, { cards });
  const formatted = formatCards(cards);
  console.log("done!", { formatted });

  return formatted;
});

export default component$(() => {
  return (
    <div class="flex flex-col w-full h-full items-center">
      <h1 class="text-sm md:text-lg lg:text-2xl text-slate-400">v3 Route</h1>
      <V3Game />
    </div>
  );
});
