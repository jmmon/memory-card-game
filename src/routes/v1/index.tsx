
import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import MemoryCardGame from "~/components/v1/memory-card-game/memory-card-game";

export default component$(() => {
  return (
    <>
      <MemoryCardGame />
    </>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
