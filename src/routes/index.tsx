import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="flex flex-col w-full h-full items-center gap-8">
      <h1 class="text-center text-4xl text-slate-500">Memory Card Game</h1>

      <p>Intro</p>

      <div>
        <h3 class="text-slate-500 mb-2 text-2xl text-center">Newest:</h3>
        <ul class="flex flex-col gap-2">
          <LinkLi href="/v3" pretext="v3" text="Third version" />
        </ul>

        <br />
        <br />

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

export type LinkLiProps = {
  href: string;
  pretext: string;
  text: string;
};
export const LinkLi = component$(({ href, pretext, text }: LinkLiProps) => {
  return (
    <li>
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

function fib(n: number): number {
  if (n === 1) {
    return 1;
  }
  if (n === 2) {
    return 2;
  }
  // console.log("fib", n);
  return fib(n - 1) + fib(n - 2);
}

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
console.log("guaging difficulty", {
  pairs3: fib(3),
  // pairs6: fib(6),
  // pairs9: fib(9),
  // pairs12: fib(12),
  // pairs52: fib(52),
});

const result = {
  pairs3: 2.8333333333333335,
  pairs6: 3.45,
  pairs9: 3.828968253968254,
  pairs12: 4.1032106782106785,
  pairs52: 5.538043950697446,
};
const result2 = {
  pairs3: 3.45,
  pairs6: 4.1032106782106785,
  pairs9: 4.495108078196313,
  pairs12: 4.775958177753506,
  pairs52: 6.22640655178672,
};
