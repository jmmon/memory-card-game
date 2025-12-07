import { component$ } from "@builder.io/qwik";
import {
  QwikCityProvider,
  RouterOutlet,
  ServiceWorkerRegister,
} from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";

import "./global.css";

export default component$(() => {
  /**
   * The root of a QwikCity site always start with the <QwikCityProvider> component,
   * immediately followed by the document's <head> and <body>.
   *
   * Don't remove the `<head>` and `<body>` elements.
   */

  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <RouterHead />

        <script
          dangerouslySetInnerHTML={`
            (function() {
              function setTheme(theme) {
                document.documentElement.setAttribute('theme', theme);
                localStorage.setItem('theme', theme);
              }

              // load theme
              const theme = localStorage.getItem('theme');
              if (theme) {
                setTheme(theme);
              } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setTheme('dark');
              } else {
                setTheme('light');
              }

            })();
          `}
        ></script>

        <ServiceWorkerRegister />
      </head>
      <body lang="en" class=" overflow-y-hidden">
        <RouterOutlet />
      </body>
    </QwikCityProvider>
  );
});

