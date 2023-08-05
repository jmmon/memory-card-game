import { component$ } from "@builder.io/qwik";
import V3Game from "~/components/v3/v3-game/v3-game";

export default component$(() => {
  return (
    <div class="flex flex-col w-full h-screen items-center">
      <h1>v3 Route</h1>
      <V3Game />
    </div>
  );
});
