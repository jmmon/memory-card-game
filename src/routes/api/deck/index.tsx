import type { RequestHandler } from "@builder.io/qwik-city";

import { fetchAndFormatDeck } from "~/components/v3/utils/v3CardUtils";

export const onGet: RequestHandler = async (requestEvent) => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.builder.io/docs/caching/
  requestEvent.cacheControl({
    // Always serve a cached response by default, up to a week stale
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    // Max once every 5 seconds, revalidate on the server to get a fresh version of this page
    maxAge: 5,
  });

  try {
    console.log('\napi/deck ~~');
    const formattedDeck = await fetchAndFormatDeck();

    requestEvent.json(200, formattedDeck);
  } catch (err) {
    requestEvent.json(500, []);
  }
};
