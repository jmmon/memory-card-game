/**
 * WHAT IS THIS FILE?
 *
 * SSR entry point, in all cases the application is rendered outside the browser, this
 * entry point will be the common one.
 *
 * - Server (express, cloudflare...)
 * - npm run start
 * - npm run preview
 * - npm run build
 *
 */
import {
  renderToStream,
  type RenderToStreamOptions,
} from "@builder.io/qwik/server";
import Root from "./root";

export default function(opts: RenderToStreamOptions) {
  return renderToStream(<Root />, {
    preloader: {
      ssrPreloads: 5,
      ssrPreloadProbability: 0.7,
      debug: false,
      maxIdlePreloads: 25,
      preloadProbability: 0.35,
    },
    ...opts,

    // Use container attributes to set attributes on the html tag.
    containerAttributes: {
      lang: "en-us",
      ...opts.containerAttributes,
    },
    serverData: {
      ...opts.serverData
    }
  });
}

