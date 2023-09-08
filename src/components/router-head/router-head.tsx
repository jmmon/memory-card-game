import { component$ } from "@builder.io/qwik";
import { useDocumentHead, useLocation } from "@builder.io/qwik-city";
// import { formattedDeck } from "~/v3/utils/cards";

/**
 * The RouterHead component is placed inside of the document `<head>` element.
 */
export const RouterHead = component$(() => {
  const head = useDocumentHead();
  const loc = useLocation();

  return (
    <>
      <title>{head.title}</title>

      <link rel="canonical" href={loc.url.href} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

      {head.meta.map((m) => (
        <meta key={m.key} {...m} />
      ))}

      {head.links.map((l) => (
        <link key={l.key} {...l} />
      ))}

      {head.styles.map((s) => (
        <style key={s.key} {...s.props} dangerouslySetInnerHTML={s.style} />
      ))}

      {/* {formattedDeck.map((card) => { */}
      {/*   // skip ace of spades, because we use the Image component for that */}
      {/*   if (card.text === "AS") { */}
      {/*     return; */}
      {/*   } */}
      {/*   const url = card.localSVG; */}
      {/*   return <link key={url} rel="preload" as="image" href={url} />; */}
      {/* })} */}
    </>
  );
});
