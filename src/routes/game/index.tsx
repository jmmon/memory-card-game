import type { Signal } from "@builder.io/qwik";
import { component$, useSignal, useTask$, useVisibleTask$ } from "@builder.io/qwik";
import {
  useNavigate,
} from "@builder.io/qwik-city";
import Game from "~/v3/components/pages/game/game";
import INITIAL_STATE from "~/v3/services/gameContext.service/initialState";
import type { iUserSettings } from "~/v3/types/types";
import useGetSavedTheme from "~/v3/hooks/useGetSavedTheme";
import logger from "~/v3/services/logger";
import { DebugTypeEnum, LogLevel } from "~/v3/constants/game";
import { useParams } from "../layout";


export const useConsumeParams = (paramsSettings: Signal<iUserSettings>) => {
  const nav = useNavigate();
  const isParamsConsumed = useSignal(false);
  const consumedSettings = useSignal<iUserSettings>(INITIAL_STATE.userSettings);

  useTask$(({ track }) => {
    track(paramsSettings);
    if (isParamsConsumed.value) return;

    isParamsConsumed.value = true;
    consumedSettings.value = paramsSettings.value;
    nav("/game/", {
      replaceState: true,
    });
  });

  return {
    isParamsConsumed,
    consumedSettings,
  };
};

export default component$(() => {
  const params = useParams();
  const { isParamsConsumed, consumedSettings } = useConsumeParams(params);

  // syncs unsavedSettings with savedTheme
  useGetSavedTheme(
    {
      unsavedUserSettings: consumedSettings,
    },
    {
      onTrack: false,
      onVisible: false,
    },
  );

  logger(DebugTypeEnum.RENDER, LogLevel.ONE, "RENDER /game route");

  useVisibleTask$(async () => {
    function loadConfetti() {
      return new Promise<(opts: any) => void>((resolve, reject) => {
        if ((globalThis as any).confetti) {
          console.log('confetti already loaded!');
          return resolve((globalThis as any).confetti as any);
        }
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js";
        script.onload = () => {
          console.log('confetti loaded!');
          resolve((globalThis as any).confetti as any);
        }
        script.onerror = reject;
        document.head.appendChild(script);
        script.remove();
      });
    }

    await loadConfetti();
  });

  return (
    <div class="flex full-height w-full flex-col items-center overflow-hidden">
      <h1 class="absolute left-0 top-0 pl-[min(1.5vw,1rem)] z-[1] text-sm text-slate-600/80 md:text-lg lg:text-2xl">
        Memory Card Game
      </h1>
      {isParamsConsumed.value && <Game settings={consumedSettings.value} />}
    </div>
  );
});
