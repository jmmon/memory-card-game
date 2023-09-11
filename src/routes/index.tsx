import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";

const LI_CLASSES = "pl-2 md:pl-4";
export default component$(() => {
  return (
    <div class="grid w-full justify-center items-center gap-8 text-slate-200">
      <h1 class="text-center text-4xl text-slate-500">Memory Card Game</h1>

      <h3 class="text-center ">Goal:</h3>
      <p class="text-center text-2xl ">Eliminate all cards from the board.</p>

      <ol class=" border-box px-6 list-decimal marker:text-slate-400 text-md md:text-lg grid gap-4 w-full max-w-[50ch]">
        <li class={LI_CLASSES}>Pick two cards.</li>
        <li class={LI_CLASSES}>
          If the numbers and colors match, they're removed from the game.
        </li>
        <li class={LI_CLASSES}>Match all the cards to win!</li>
        <li class={`text-slate-500 ${LI_CLASSES}`}>
          (COMING SOON:) Save your score, and see how you compare to other
          players!
        </li>
      </ol>

      <div class="flex flex-col items-center">
        <Link
          href="/v3"
          class="text-slate-200 hover:text-white text-4xl py-4 px-8 border-slate-200 rounded-lg bg-slate-800 hover:bg-slate-700"
        >
          Play
        </Link>

        <br />
        <br />

        <Link
          href="/older-versions"
          class=" text-slate-500 text-center underline hover:text-slate-300"
        >
          Older versions...
        </Link>
      </div>
    </div>
  );
});

export type LinkLiProps = {
  href: string;
  pretext: string;
  text: string;
};
export const LinkLi = component$(({ href, pretext, text }: LinkLiProps) => {
  return (
    <li class="hover:underline">
      <Link href={href}>
        <div class="w-8 text-slate-500 inline-block text-right mr-2">
          {pretext}:
        </div>
        <span>{text}</span>
      </Link>
    </li>
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
