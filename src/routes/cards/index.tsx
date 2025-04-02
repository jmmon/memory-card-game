import { component$ } from "@builder.io/qwik";
import PlayingCardComponents from "~/v3/components/playing-card-components";
import ImageBackFace from "~/media/cards/_backWhite.png?jsx";
import type { DocumentHead } from "@builder.io/qwik-city";
import HEAD_CONSTANTS from "~/v3/constants/head";

export default component$(() => {
  return (
    <div class="mx-auto grid grid-cols-2 sm:grid-cols-4 sm:max-w-[1000px] h-screen flex-wrap justify-center">
      {Object.values(PlayingCardComponents)
        .reverse()
        .map((card, i) => (
          <div class="w-full" key={i} dangerouslySetInnerHTML={card}></div>
        ))}

      <ImageBackFace class="w-full" loading="eager" decoding="sync" />
    </div>
  );
});

export const head: DocumentHead = {
  title: `Cards - ${HEAD_CONSTANTS.SITE_NAME} - ${HEAD_CONSTANTS.SITE_HOST}`,
  meta: [
    {
      name: "description",
      content: "SVGs and image used for the playing cards",
    },
  ],
};
