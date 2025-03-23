import { component$, useSignal, useStyles$, useTask$ } from "@builder.io/qwik";
import { Link, routeLoader$, useNavigate } from "@builder.io/qwik-city";
import styles from "./styles.css?inline";
import Game from "~/v3/components/pages/game/game";
import { typeEntryValues, unflattenObject } from "~/v3/utils/utils";
import { validate } from "~/v3/validation/validate";
import schemas from "~/v3/validation/schemas";
import { USER_SETTINGS } from "~/v3/services/gameContext.service/initialState";

import type { iUserSettings } from "~/v3/types/types";
import { USER_SETTINGS } from "~/v3/services/gameContext.service/initialState";
// import SubmitScoreModal from "~/v3/components/submit-score-modal/submit-score-modal";

import { toString } from "~/v3/utils/utils";
export { toString };

// params are settings which were changed from initial values
export const useParams = routeLoader$(async (requestEvent) => {
  // console.log("useParams loader...", {
  //   urlSearchParams: requestEvent.url.searchParams,
  // });

  const unflattenedParams = unflattenObject(
    typeEntryValues(Array.from(requestEvent.url.searchParams.entries())),
  ) as Partial<iUserSettings>;

  const completedUserParams: iUserSettings = {
    ...USER_SETTINGS,
    ...unflattenedParams,
    deck: {
      ...USER_SETTINGS.deck,
      ...unflattenedParams.deck,
    },
    board: {
      ...USER_SETTINGS.board,
      ...unflattenedParams.board,
    },
    interface: {
      ...USER_SETTINGS.interface,
      ...unflattenedParams.interface,
    },
  };
  console.log("routeloader...");

  if (validate(completedUserParams, schemas.userSettings).isValid) {
    console.log("using params");
    return completedUserParams;
  }
  console.log("using DEFAULTS");
  return USER_SETTINGS;
});

export default component$(() => {
  const paramsSettings = useParams();

  const nav = useNavigate();
  const isParamsConsumed = useSignal(false);
  const consumedSettings = useSignal<iUserSettings>(USER_SETTINGS);

  console.log({ paramsSettings: paramsSettings.value });

  useTask$(({ track }) => {
    track(() => paramsSettings.value);
    if (paramsSettings.value && !isParamsConsumed.value) {
      isParamsConsumed.value = true;
      consumedSettings.value = paramsSettings.value;
      nav("/game/");
    }
  });

  useStyles$(styles);

  return (
    <div class="flex h-full w-full flex-col items-center overflow-hidden">
      <h1 class="absolute left-0 top-0 z-[1] text-sm text-slate-600/80 md:text-lg lg:text-2xl">
        <Link href="/" class="text-slate-600/80 hover:text-slate-500/80">
          Memory Card Game
        </Link>
      </h1>
      {/* <SubmitScoreModal /> */}
      {isParamsConsumed.value && <Game settings={consumedSettings.value} />}
    </div>
  );
});
