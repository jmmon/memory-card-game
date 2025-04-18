import { component$ } from '@builder.io/qwik';
import { manifest } from '@qwik-client-manifest';

export const PreloadAll = component$(({ rel = "modulepreload" }: { rel?: "modulepreload" | "prefetch" | "preload" }) => {
  const bundles = Object.keys(manifest.bundles ?? {}).map((bundle) => `/build/${bundle}`);
  return (
    <template id="offline-preload">
      {bundles.map((bundle, i) => (
        <link
          key={i}
          rel={rel}
          href={bundle}
          fetchPriority="low"
        />
      ))}
    </template>
  );
})
