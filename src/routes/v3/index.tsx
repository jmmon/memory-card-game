import { component$ } from "@builder.io/qwik";
import V3Game from "~/components/v3/v3-game/v3-game";

export default component$(() => {
  return (
    <div class="flex flex-col w-full h-full items-center">
      <h1 class="text-sm md:text-lg lg:text-2xl text-slate-400">v3 Route</h1>
      <V3Game />
    </div>
  );
});
