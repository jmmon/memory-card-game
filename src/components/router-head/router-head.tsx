import { component$ } from "@builder.io/qwik";
import { useDocumentHead, useLocation } from "@builder.io/qwik-city";
import { IMAGE_TYPE, deckOfCardsIds } from "../v3/utils/v3CardUtils";

// preload the images for the deck of cards
const imageBaseUrl = (id: string) =>
  `https://deckofcardsapi.com/static/img/${id}.${IMAGE_TYPE}`;

const cardImageUrls = deckOfCardsIds.map((id) => imageBaseUrl(id));

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
      {cardImageUrls.map((url) => (
        <link key={url} rel="preload" as="image" href={url} />
      ))}
    </>
  );
});
