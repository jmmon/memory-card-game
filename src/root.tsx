import { component$ } from "@builder.io/qwik";
import {
  QwikCityProvider,
  RouterOutlet,
  ServiceWorkerRegister,
} from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";

import "./global.css";
import { ModulePreload } from "./components/module-preload/module-preload";
// import { PreloadAll } from "./components/preload-all/preload-all";

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
        {/*
        <PreloadAll fetchPriority="low" />
*/}
        <ServiceWorkerRegister />
      </head>
      <body lang="en" class=" overflow-y-hidden">
        <RouterOutlet />
        <ModulePreload />
      </body>
    </QwikCityProvider>
  );
});
// without ModulePreload
//28, 242kb, 636kb
//=> 29, 243kb, 636kb
// with ModulePreload
//61, 275kb, 675kb with ModulePreload
//=> hover play: 62, 275kb, 676kb (fetches q-data.json)
//
//with preloadAll only: (rel: modulepreload)
//28, 255kb, 719kb
//=> 29, 256kb, 720kb
//both:
//61, 288kb, 759kb
//=> 62, 288kb, 760kb
//
//oops, PreloadAll was below ServerWorkerRegister... moving above...
//PreloadAll only:
//same
//both:
//same
//
//fetchPriority: high
//PreloadAll only:
//28, 255, 720
//=> 29, 256, 721
//both:
//62, 293kb, 783kb
//=> 63, 294kb, 784kb
//
//so preloadAll doesn't do anything.... in this current setup.
//
//
//
//try with rel="preload"
//preloadAll only:
//Ok it did something!
//195 requests, 550kb, 1.4mb
//=> 196 requests, 551kb, 1.4mb ======== this loaded the most up front!
//both:
//61, 288kb, 756kb (no change ?)
//
//
//try with rel="prefetch"
//same as with NO PreloadAll pretty much
//28, 255kb, 717kb
//=> + json
// both:
// about the same 61 288 756
//
//
//
//
//
//
//
//confused...
