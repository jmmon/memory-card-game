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
import { manifest } from "@qwik-client-manifest";
import Root from "./root";

import { default as builtManifest } from "./v3/data/q-manifest.json";

type Bundle = {
  url: string;
  size: number;
  imports: string[];
  dynamicImports?: string[];
};

// type ManifestBundle = {
//   url: string;
//   imports: ManifestBundle[];
// };

const bundles = Object.entries(builtManifest.bundles).map(
  ([qKeyJs, propertiesObj]) => {
    const size = propertiesObj.size;
    const imports = "imports" in propertiesObj ? propertiesObj.imports : [];
    const dynamicImports =
      "dynamicImports" in propertiesObj
        ? propertiesObj.dynamicImports
        : undefined;

    return {
      url: qKeyJs,
      size,
      imports,
      dynamicImports,
    };
  },
);

function getDifference(largerArr: string[], smallerArr: string[]) {
  return largerArr.reduce((differenceArr, cur) => {
    smallerArr.includes(cur) === false && differenceArr.push(cur);
    return differenceArr;
  }, [] as string[]);
}

function getPrettyDifference(diff: string[]) {
  return diff.length === 1
    ? diff[0]
    : `total: ${diff.length},\n` + diff.join(",\n");
}

function getPrettyArr(arr: string[]) {
  return (arr.length > 1 ? `total: ${arr.length},\n`: '') +  arr.join(",\n");
}

function getQrlInfo(bundles: Bundle[]) {
  const isImportedFromElsewhere = new Set<string>();
  const isDynamicImported = new Set<string>();
  const qSet = new Set<string>();
  const sizes: number[] = [];
  for (let i = 0; i < bundles.length; i++) {
    const bundle = bundles[i];
    const { imports, url, size } = bundle;
    sizes.push(size);
    qSet.add(url);

    for (let j = 0; j < imports.length; j++) {
      imports[j] && isImportedFromElsewhere.add(imports[j]);
    }

    if ("dynamicImports" in bundle && bundle.dynamicImports !== undefined) {
      for (let j = 0; j < imports.length; j++) {
        bundle.dynamicImports[j] && isDynamicImported.add(bundle.dynamicImports[j]);
      }
    }
  }

  const qArr = Array.from(qSet);
  const isImportedArr = Array.from(isImportedFromElsewhere);
  const isDynamicImportedArr = Array.from(isDynamicImported);
  const totalImportedArr = Array.from(
    new Set([...isImportedArr, ...isDynamicImportedArr]),
  );

  const importedDiff = getDifference(qArr, isImportedArr);
  const dynamicImportedDiff = getDifference(qArr, isDynamicImportedArr);
  const totalImportedDiff = getDifference(qArr, totalImportedArr);
  const totalSize = sizes.reduce((accum, curVal) => accum + curVal, 0);

  console.log("totalSizeInKb:", totalSize);
  console.log("\nqSet", getPrettyArr(qArr));
  console.log("\nisImportedFromElsewhere", getPrettyArr(isImportedArr));
  console.log("\nisDynamicImportedFromElsewhere", getPrettyArr(isDynamicImportedArr));
  console.log("\ntotalImported", getPrettyArr(totalImportedArr));

  console.log("\nimportedDifference", getPrettyDifference(importedDiff));
  console.log("\ndynamicImportedDifference", getPrettyDifference(dynamicImportedDiff));
  console.log("\ntotalImportedDifference", getPrettyDifference(totalImportedDiff));

  return {
    qArr,
    isImportedArr,
    isDynamicImportedArr,
    totalImportedArr,

    importedDiff,
    dynamicImportedDiff,
    totalImportedDiff,
  };
}

// function flattener(bundles: Bundle[]) {
//   const manifest: ManifestBundle[] = [];
//
//   return [];
// }

/* const {
  qArr,
  isImportedArr,
  isDynamicImportedArr,
  totalImportedArr,
  importedDiff,
  dynamicImportedDiff,
  totalImportedDiff,
} =  */
getQrlInfo(bundles);
/* const tree = flattener(bundles); */

// const tree = bundles.reduce((accum, curr) => {
//   const [result, listOfSeen] = accum;
//   if (listOfSeen.includes(curr.url)) {
//   }
//
//   return [result, listOfSeen];
//
// }, [[], []]);

export default function (opts: RenderToStreamOptions) {
  return renderToStream(<Root />, {
    manifest,
    // prefetchStrategy: {
    //   implementation: {
    //     prefetchEvent: "always",
    //   },
    //   symbolsToPrefetch: (_) => bundles,
    // },
    ...opts,
    // Use container attributes to set attributes on the html tag.
    containerAttributes: {
      lang: "en-us",
      ...opts.containerAttributes,
    },
  });
}
