import type { Signal } from "@builder.io/qwik";
import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import {
  // Link,
  routeLoader$,
  useNavigate,
} from "@builder.io/qwik-city";
import Game from "~/v3/components/pages/game/game";
import { typeEntryValues, unflattenObject } from "~/v3/utils/utils";
import { validate } from "~/v3/validation/validate";
import INITIAL_STATE from "~/v3/services/gameContext.service/initialState";
import schemas from "~/v3/validation/schemas";
import type { iUserSettings } from "~/v3/types/types";
import { toString } from "~/v3/utils/utils";
import useGetSavedTheme from "~/v3/hooks/useGetSavedTheme";
import logger from "~/v3/services/logger";
import { DebugTypeEnum, LogLevel } from "~/v3/constants/game";
import { getRandomBytes } from "~/v3/utils/hashUtils";
export { toString };

// for game end modal, provides default hash
export const useDefaultHash = routeLoader$(() => getRandomBytes());

// params are settings which were changed from initial values
export const useParams = routeLoader$(async (requestEvent) => {
  const unflattenedParams = unflattenObject(
    typeEntryValues(Array.from(requestEvent.url.searchParams.entries())),
  ) as Partial<iUserSettings>;

  const completedUserParams: iUserSettings = {
    ...INITIAL_STATE.userSettings,
    ...unflattenedParams,
    deck: {
      ...INITIAL_STATE.userSettings.deck,
      ...unflattenedParams.deck,
    },
    board: {
      ...INITIAL_STATE.userSettings.board,
      ...unflattenedParams.board,
    },
    interface: {
      ...INITIAL_STATE.userSettings.interface,
      ...unflattenedParams.interface,
    },
  };
  logger(DebugTypeEnum.HOOK, LogLevel.ONE, "useParams...");

  if (validate(completedUserParams, schemas.userSettings).isValid) {
    logger(DebugTypeEnum.HOOK, LogLevel.ONE, "...valid > using params");
    return completedUserParams;
  }
  logger(DebugTypeEnum.HOOK, LogLevel.ONE, "...invalid > using DEFAULTS");
  return INITIAL_STATE.userSettings;
});

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

  return (
    <div class="flex h-full w-full flex-col items-center overflow-hidden">
      <h1 class="absolute left-0 top-0 pl-[min(1.5vw,1rem)] z-[1] text-sm text-slate-600/80 md:text-lg lg:text-2xl">
        Memory Card Game
      </h1>
      {isParamsConsumed.value && <Game settings={consumedSettings.value} />}
    </div>
  );
});
