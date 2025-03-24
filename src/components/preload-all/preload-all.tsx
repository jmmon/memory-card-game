import { component$ } from "@builder.io/qwik";
import { manifest } from "@qwik-client-manifest";

type iRel = "modulepreload" | "prefetch" | "preload";
type PreloadAllProps = {
  rel?: iRel;
};

export const PreloadAll = component$<PreloadAllProps>(
  ({ rel = "modulepreload" }) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const bundles = Object.keys(manifest.bundles ?? {}).map(
      (bundle) => `/build/${bundle}`,
    );
    return (
      <template id="offline-preload">
        {bundles.map((bundle, i) => (
          <link key={i} rel={rel} href={bundle} fetchPriority="low" />
        ))}
      </template>
    );
  },
);
