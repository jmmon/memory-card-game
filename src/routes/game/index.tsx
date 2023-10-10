import { component$, useComputed$, useStyles$ } from "@builder.io/qwik";
import styles from "./styles.css?inline";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import crypto from "node:crypto";
import Game, {
  INITIAL_GAME_SETTINGS,
} from "~/v3/components/atomic/pages/game/game";
// import SubmitScoreModal from "~/v3/components/submit-score-modal/submit-score-modal";

export const useDefaultHash = routeLoader$(() => {
  return crypto.randomBytes(20).toString("hex");
});

const getKeysIfObject = (obj: object, prefix?: string) => {
  const entries = Object.entries(obj);
  let keys: String[] = [];

  for (const [key, value] of entries) {
    if (typeof value === "string") {
      keys.push(key);
    } else if (typeof value === "object") {
      keys = keys.concat(getKeysIfObject(value, `${prefix ? prefix + '_' : ''}${key}_`));
    }
  }
  return keys
};

const keysSettings = getKeysIfObject(INITIAL_GAME_SETTINGS);

export default component$(() => {
  const loc = useLocation();
  console.log({ searchParams: loc.url.searchParams });
  useStyles$(styles);
  const settings = useComputed$(() => {
    const newSettings = INITIAL_GAME_SETTINGS;
    for (const [key, value] of loc.url.searchParams) {
      console.log({ key, value });
      // overwrite value if it's a good key
      // TODO: validate value is within bounds
      // - do it proper with a validator and obj
      if (key in keysSettings) {
        newSettings[key] = value;
      }
    }
    // Object.fromEntries(loc.url.searchParams.entries())
    // return theSettings
    return newSettings;
  });
  return (
    <div class="flex flex-col w-full h-full items-center">
      <h1 class="absolute top-0 left-0 text-sm md:text-lg lg:text-2xl text-slate-600/80 z-[-1]">
        Memory Card Game
      </h1>
      {/* <SubmitScoreModal /> */}
      <Game settings={settings.value} />
    </div>
  );
});
