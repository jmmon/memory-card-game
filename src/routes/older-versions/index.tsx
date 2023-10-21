import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

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
          <li class="flex gap-1">
            <div class="w-12 text-right text-slate-400 ">v2.5</div>
            <Link href="/older-versions/resize">
              - Better dynamic board resizing
            </Link>
          </li>
          <li class="flex gap-1">
            <div class="w-12 text-right text-slate-400">v2</div>
            <Link href="/older-versions/v2">- Second version</Link>
          </li>
          <li class="flex gap-1">
            <div class="w-12 text-right text-slate-400">v1.5</div>
            <Link href="/older-versions/v1.5">- Card flip prototype</Link>
          </li>
          <li class="flex gap-1">
            <div class="w-12 text-right text-slate-400">v1</div>
            <Link href="/older-versions/v1">- First version</Link>
          </li>
        </ul>
      </div>
    </div>
  );
});
