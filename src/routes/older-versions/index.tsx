import { component$ } from "@builder.io/qwik";
import { LinkLi } from "..";

export default component$(() => {
  return (
    <div class="flex flex-col w-full h-full items-center gap-8">
      <h1 class="text-center text-4xl text-slate-500">Memory Card Game</h1>

      <p>Older Versions and prototypes</p>

      <div class="flex flex-col items-center">
        <h3 class="text-slate-500 mb-2 text-2xl text-center">
          Older versions:
        </h3>
        <ul class="flex flex-col gap-2">
          <LinkLi
            href="/older-versions/resize"
            pretext="v2.5"
            text="Better dynamic board resizing"
          />
          <LinkLi
            href="/older-versions/v2"
            pretext="v2"
            text="Second version"
          />
          <LinkLi
            href="/older-versions/v1.5"
            pretext="v1.5"
            text="Card flip prototype"
          />
          <LinkLi href="/older-versions/v1" pretext="v1" text="First version" />
        </ul>
      </div>
    </div>
  );
});
