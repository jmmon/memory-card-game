import { component$, Slot, useStyles$ } from "@builder.io/qwik";
import {
  routeLoader$,
  server$,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";

import styles from "./styles.css?inline";
import HEAD_CONSTANTS from "~/v3/constants/head";
import CardSymbols from "~/v3/components/playing-card-components/symbols/card-symbols";
import FaceCardSymbols from "~/v3/components/playing-card-components/symbols/face-card-symbols";
// import IconDefs from "~/v3/components/svg-icons/icon-defs";

export const useLoaderIsScoresEnabled = routeLoader$(function ({ env }) {
  console.log(
    "loader: isEnabled:",
    env.get("WRANGLER_FEATURE_FLAG_SCORES_ENABLED"),
  );
  return env.get("WRANGLER_FEATURE_FLAG_SCORES_ENABLED") === "true";
});
export const serverIsScoresEnabled = server$(function () {
  return this.env.get("WRANGLER_FEATURE_FLAG_SCORES_ENABLED") === "true";
});

export const onGet: RequestHandler = async (requestEvent) => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.builder.io/docs/caching/
  requestEvent.cacheControl({
    // mark it as public resources?
    public: true,
    // Always serve a cached response by default, up to a week stale
    // staleWhileRevalidate: 60 * 60 * 24 * 7,
    // Max once every 5 seconds, revalidate on the server to get a fresh version of this page
    maxAge: 5,
  });
};

export default component$(() => {
  useStyles$(styles);
  // if context is here, can properly sync settings from game back to the homescreen
  // (or use localstorage for game settings lol so it saves across sessions as preferences...)

  return (
    <main class="full-height main-scroll">
      <Slot />
      {/* SVG card symbols pre-rendered but hidden; so cards can build from these */}
      <CardSymbols />
      <FaceCardSymbols />
      {/*
      <IconDefs />
*/}
    </main>
  );
});

export const head: DocumentHead = {
  title: `${HEAD_CONSTANTS.SITE_NAME} - ${HEAD_CONSTANTS.SITE_HOST}`,
  meta: [
    {
      name: "description",
      content: "Match pairs of cards by color to win!",
    },
  ],
};
