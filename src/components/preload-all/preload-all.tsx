import {
  component$,
  //useVisibleTask$
} from "@builder.io/qwik";
import { manifest } from "@qwik-client-manifest";

type iRel = "modulepreload" | "prefetch" | "preload";
type PreloadAllProps = {
  rel?: iRel;
  fetchPriority?: "high" | "low" | "auto";
};

export const PreloadAll = component$<PreloadAllProps>(
  ({ rel = "modulepreload", fetchPriority = "low" }) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const bundles = Object.keys(manifest.bundles ?? {}).map(
      (bundle) => `/build/${bundle}`,
    );

    // // eslint-disable-next-line qwik/no-use-visible-task
    // useVisibleTask$(
    //   () => {
    //     // If scheduler is available mark the task as background
    //     const schedule = (cb: () => any) => {
    //       if (!(globalThis as any).scheduler?.yield) cb();
    //       else
    //         (globalThis as any).scheduler.postTask(cb, {
    //           priority: "background",
    //         });
    //     };
    //
    //     // Move all the <link modulepreload  /> in head
    //     const preload = () => {
    //       const template = document.getElementById(
    //         "offline-preload",
    //       ) as HTMLTemplateElement;
    //
    //       const fragment = template.content.cloneNode(true) as DocumentFragment;
    //       while (fragment.firstChild) {
    //         // append child removes the cloned element from its parent
    //         document.head.appendChild(fragment.firstChild);
    //       }
    //     };
    //
    //     schedule(preload);
    //     // if (navigator?.connection) {
    //     //   // If chrome/edge, check slow connection
    //     //   if (navigator.connection?.effectiveType === 'slow-2g') schedule(preload);
    //     // } else {
    //     //   // If safari/firefox fallback to mediaquery
    //     //   if (matchMedia("(max-width: 600px)").matches) schedule(preload);
    //     // }
    //   },
    //   {
    //     strategy: "document-idle",
    //   },
    // );
    return (
      <template id="offline-preload">
        {bundles.map((bundle, i) => (
          <link key={i} rel={rel} href={bundle} fetchPriority={fetchPriority} />
        ))}
      </template>
    );
  },
);
