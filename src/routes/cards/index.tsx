import { component$, useSignal } from "@builder.io/qwik";
import PlayingCardComponents from "~/v3/components/playing-card-components";
import ImageBackFace from "~/media/cards/_backWhite.png?jsx";
import type { DocumentHead } from "@builder.io/qwik-city";
import HEAD_CONSTANTS from "~/v3/constants/head";
import BrightnessChanger from "~/v3/components/molecules/brightness-changer/brightness-changer";
import INITIAL_STATE from "~/v3/services/gameContext.service/initialState";
import { iUserSettings } from "~/v3/types/types";

export default component$(() => {
  const unsavedUserSettings = useSignal<iUserSettings>(
    INITIAL_STATE.userSettings,
  );
  return (
    <div id="cards-route" class="w-full">
      <BrightnessChanger unsavedUserSettings={unsavedUserSettings} />

      <div class="mx-auto grid grid-cols-2 sm:grid-cols-4 sm:max-w-[1800px] h-screen flex-wrap justify-center">
        {Object.values(PlayingCardComponents)
          .reverse()
          .map((card, i) => (
            <div
              class={`w-full`}
              style={{
                filter:
                  "brightness(" +
                  unsavedUserSettings.value.interface.brightness +
                  "%)",
              }}
              key={i}
              dangerouslySetInnerHTML={card}
            ></div>
          ))}

        <ImageBackFace
          class="w-full"
          style={{
            filter:
              "brightness(" +
              unsavedUserSettings.value.interface.brightness +
              "%)",
          }}
          loading="eager"
          decoding="sync"
        />
      </div>
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
