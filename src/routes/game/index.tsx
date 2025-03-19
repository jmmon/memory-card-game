import { component$, useStyles$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import styles from "./styles.css?inline";
import crypto from "node:crypto";
import Game from "~/v3/components/pages/game/game";
import { INITIAL_USER_SETTINGS } from "~/v3/context/initialState";
import { unflattenObject } from "~/v3/utils/utils";
import { validate } from "~/v3/validation/validate";
import schemas from "~/v3/validation/schemas";

import type { iUserSettings } from "~/v3/types/types";
// import SubmitScoreModal from "~/v3/components/submit-score-modal/submit-score-modal";

export const useDefaultHash = routeLoader$(() =>
  crypto.randomBytes(20).toString("hex")
);

const numberizeValues = (obj: object) =>
  Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [
      key,
      isNaN(Number(val)) ? val : Number(val),
    ])
  );

// params are settings which were changed from initial values
export const useParams = routeLoader$(async (requestEvent) => {
  // console.log("useParams loader...", {
  //   urlSearchParams: requestEvent.url.searchParams,
  // });
  const searchParamsObj = Object.fromEntries(
    requestEvent.url.searchParams.entries()
  );

  const unflattenedParams = unflattenObject(numberizeValues(searchParamsObj));
  const completedUserParams = {
    ...INITIAL_USER_SETTINGS,
    ...unflattenedParams,
  } as iUserSettings;

  if (validate(completedUserParams, schemas.userSettings).isValid) {
    return completedUserParams;
  }
  return INITIAL_USER_SETTINGS;
});

export default component$(() => {
  const paramsSettings = useParams();
  useStyles$(styles);

  return (
    <div class="flex h-full w-full flex-col items-center overflow-hidden">
      <h1 class="absolute left-0 top-0 z-[1] text-sm text-slate-600/80 md:text-lg lg:text-2xl">
        <Link href="/" class="text-slate-600/80 hover:text-slate-500/80">Memory Card Game</Link>
      </h1>
      {/* <SubmitScoreModal /> */}
      <Game settings={paramsSettings.value} />
    </div>
  );
});
