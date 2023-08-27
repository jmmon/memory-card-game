import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="flex flex-col w-full h-full items-center gap-8">
      <h1 class="text-center text-4xl text-slate-500">Memory Card Game</h1>

      <p>Intro</p>

      <div>
        <h3 class="text-slate-500 mb-2 text-2xl text-center">Links:</h3>
        <ul class="flex flex-col gap-2">
          <LinkLi href="/v3" pretext="v3" text="Third version" />
          <LinkLi href="/resize" pretext="v2.5" text="Better dynamic board resizing" />
          <LinkLi href="/v2" pretext="v2" text="Second version" />
          <LinkLi href="/v1.5" pretext="v1.5" text="Card flip prototype" />
          <LinkLi href="/v1" pretext="v1" text="First version" />
        </ul>
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
    <li>
      <Link href={href}>
        <div class="w-8 text-slate-500 inline-block text-right mr-2">{pretext}:</div>
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
