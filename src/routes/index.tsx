import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="grid w-full justify-center items-center gap-8">
      <h1 class="text-center text-4xl text-slate-500">Memory Card Game</h1>

      <h3 class="text-center">Goal:</h3>
      <p class="text-center text-lg ">Eliminate all cards from the board.</p>

      <ol class="list-decimal marker:text-gray-400 text-lg grid gap-4">
        <li class="pl-4">Pick two cards.</li>
        <li class="pl-4">
          If the numbers and colors match, they're removed from the game.
        </li>
      </ol>

      <div class="flex flex-col items-center">
        <Link href="/v3" class="text-white text-4xl py-4 px-8 border-gray-200 rounded-lg bg-slate-800 hover:bg-slate-600">
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

// function fib(n: number): number {
//   if (n === 1) {
//     return 1;
//   }
//   if (n === 2) {
//     return 2;
//   }
//   // console.log("fib", n);
//   return fib(n - 1) + fib(n - 2);
// }

// function deriveDifficulty(count: number): number {
// return fib(count);
//
// // if (count === 1) {
// // return 1;
// // }
// // if (count === 2) {
// // return 2;
// // }
// // return (deriveDifficulty(count - n));
//
//   // let total = 1;
//   // for (let i = 1; i <= pairs ; i++) {
//   //   total += i / (i + 1);
//   // }
//   // return total;
// }
// console.log("guaging difficulty", {
//   pairs3: fib(3),
//   // pairs6: fib(6),
//   // pairs9: fib(9),
//   // pairs12: fib(12),
//   // pairs52: fib(52),
// });

// const result = {
//   pairs3: 2.8333333333333335,
//   pairs6: 3.45,
//   pairs9: 3.828968253968254,
//   pairs12: 4.1032106782106785,
//   pairs52: 5.538043950697446,
// };
// const result2 = {
//   pairs3: 3.45,
//   pairs6: 4.1032106782106785,
//   pairs9: 4.495108078196313,
//   pairs12: 4.775958177753506,
//   pairs52: 6.22640655178672,
// };
