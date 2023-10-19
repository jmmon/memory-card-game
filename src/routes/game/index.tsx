import { component$, useStyles$ } from "@builder.io/qwik";
import styles from "./styles.css?inline";
import { routeLoader$ } from "@builder.io/qwik-city";
import crypto from "node:crypto";
import Game from "~/v3/components/atomic/pages/game/game";
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
    <div class="flex flex-col w-full h-full items-center">
      <h1 class="absolute top-0 left-0 text-sm md:text-lg lg:text-2xl text-slate-600/80 z-[-1]">
        Memory Card Game
      </h1>
      {/* <SubmitScoreModal /> */}
      <Game settings={paramsSettings.value} />
    </div>
  );
});
