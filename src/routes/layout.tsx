import {
  component$,
  Slot,
  useStyles$,
  // useVisibleTask$
} from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";

import styles from "./styles.css?inline";
import HEAD_CONSTANTS from "~/v3/constants/head";

export const onGet: RequestHandler = async (requestEvent) => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.builder.io/docs/caching/
  requestEvent.cacheControl({
    // mark it as public resources?
    public: true,
    // Always serve a cached response by default, up to a week stale
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    // Max once every 5 seconds, revalidate on the server to get a fresh version of this page
    maxAge: 5,
  });
};

export const useServerTimeLoader = routeLoader$(() => {
  return {
    date: new Date().toISOString(),
  };
});

export default component$(() => {
  useStyles$(styles);

  // // eslint-disable-next-line qwik/no-use-visible-task
  // useVisibleTask$(() => {
  //   // If scheduler is available mark the task as background
  //   const schedule = (cb: () => any) => {
  //     if (!(globalThis as any).scheduler?.yield) cb();
  //     else (globalThis as any).scheduler.postTask(cb, { priority: 'background' });
  //   }
  //
  //   // Move all the <link modulepreload  /> in head
  //   const preload = () => {
  //     const template = document.getElementById("offline-preload") as HTMLTemplateElement;
  //
  //     const fragment = template.content.cloneNode(true) as DocumentFragment;
  //     while (fragment.firstChild) {
  //       // append child removes the cloned element from its parent
  //       document.head.appendChild(fragment.firstChild);
  //     }
  //   };
  //
  //   schedule(preload);
  //   // if (navigator?.connection) {
  //   //   // If chrome/edge, check slow connection
  //   //   if (navigator.connection?.effectiveType === 'slow-2g') schedule(preload);
  //   // } else {
  //   //   // If safari/firefox fallback to mediaquery
  //   //   if (matchMedia("(max-width: 600px)").matches) schedule(preload);
  //   // }
  // }, {
  //   strategy: 'document-idle'
  // });
  return (
    <main class="full">
      <Slot />
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

