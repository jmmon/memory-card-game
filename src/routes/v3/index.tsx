import { component$ } from "@builder.io/qwik";
import V3Game from "~/components/v3/v3-game/v3-game";

export default component$(() => {
  return (
    <div class="flex flex-col w-full h-full items-center">
      <h1 class="absolute top-0 left-0 text-sm md:text-lg lg:text-2xl text-slate-600 z-[-1]">v3 Route</h1>
      <V3Game />
    </div>
  );
});
