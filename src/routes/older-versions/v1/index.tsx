
import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import MemoryCardGame from "~/old/v1/components/memory-card-game/memory-card-game";
import HEAD_CONSTANTS from "~/v3/constants/head";

export default component$(() => {
  return (
    <>
      <MemoryCardGame />
    </>
  );
});

export const head: DocumentHead = {
  title: `v1 - ${HEAD_CONSTANTS.SITE_NAME} - ${HEAD_CONSTANTS.SITE_HOST}`,
  meta: [
    {
      name: "description",
      content: "Prototype game v1 - match pairs to clear the board",
    },
  ],
};
