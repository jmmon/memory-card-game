import type { PropFunction, Signal } from "@builder.io/qwik";
import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import { getRandomBytes } from "~/v3/services/seed";
// import { isServer } from "@builder.io/qwik/build";
// import { getRandomBytes } from "~/v3/services/seed";
// import crypto from "crypto";
import { stringToColor } from "~/v3/utils/avatarUtils";

const DEFAULT_COLOR_OPTIONS = {
  saturation: {
    min: 20,
    max: 80,
  },
  lightness: { min: 20, max: 80 },
};

export function bufferToHexString(buffer: ArrayBuffer) {
  const byteArray = new Uint8Array(buffer);

  const hexCodes = [...byteArray].map((value) => {
    return value.toString(16).padStart(2, "0");
  });

  return hexCodes.join("");
}

// export function getHash(message: string) {
//   // if (isServer) {
//   //   return getRandomBytes();
//   //   // return crypto.createHash("sha256").update(message).digest();
//   // }
//   return window.crypto.subtle.digest(
//     "SHA-256",
//     new TextEncoder().encode(message),
//   );
// }

export async function getHexHashString(userInput: string) {
  userInput;
  return getRandomBytes();
  // const hash = bufferToHexString(await getHash(userInput));
  // return hash;
}

export function hexCharToBase(hex: string, base: number) {
  const OLD_BASE = 16;
  return parseInt(hex, OLD_BASE)
    .toString(base)
    .padStart(OLD_BASE / base, "0");
}

//
/**
 * calculates base needed to achieve the target string length
 * by reducing the base of the hex string until we have enough digits
 *
 * @param hex - input string to generate the base
 * @param targetMinimumStringLength - the half of pixels required
 * @return the new base
 */
function calculateBaseChange(hex: string, targetMinimumStringLength: number) {
  const initialBase = 16; // the base of hex numbers
  let toDivideBaseBy = Math.ceil(targetMinimumStringLength / hex.length);
  let newBase = initialBase;

  while (toDivideBaseBy > 1) {
    if (newBase === 2) {
      throw new Error(
        `too long: { targetMinimumStringLength: ${targetMinimumStringLength}, hex: ${hex}, toDivideBaseBy: ${toDivideBaseBy} }`,
      );
    }
    newBase /= 2;
    toDivideBaseBy /= 2;
  }

  return newBase;
}

// function calcBaseChange(hex: string, targetMinimumStringLength: number) {
//   const sqrtTarget = Math.sqrt(targetMinimumStringLength);
//   const sqrtCurrent = Math.sqrt(hex.length);
//
//   console.log({
//     targetMinimumStringLength,
//     sqrtTarget,
//     hexLength: hex.length,
//     sqrtCurrent,
//   });
// }

export function hexHash2BaseOfLength(hex: string, len: number) {
  const newBase = calculateBaseChange(hex, len);
  // calcBaseChange(hex, len);

  return {
    rebasedHash: hex
      .split("")
      .map((hexChar) => hexCharToBase(hexChar, newBase))
      .join(""),
    base: newBase,
  };
}

export function getPixels(
  hash: string,
  cols: number,
  rows: number,
  base: number = 2,
) {
  // convert 40char hash to 4 * 7 (mirrored for 7 * 7) matrix, 28bits
  let pixels = "";

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const halfway = Math.ceil(cols / 2);
      const J = j >= halfway ? cols - 1 - j : j;
      const charFromHash = hash.charAt(i * halfway + J);
      if (base === 2) {
        pixels += charFromHash;
      } else {
        const shouldFill = parseInt(charFromHash, base) % 2;
        pixels += shouldFill ? "0" : "1";
      }
    }
  }

  return pixels;
}

function mirrorPixels(cols: number, rows: number, halfPixels: string) {
  let pixels = "";

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const halfway = Math.ceil(cols / 2);
      const J = j >= halfway ? cols - 1 - j : j;
      const charFromHash = halfPixels.charAt(i * halfway + J);
      pixels += charFromHash;
    }
  }

  return pixels;
}

export async function calculatePixelData(
  text: string,
  cols: number,
  rows: number,
  saturation: { min: number; max: number },
  lightness: { min: number; max: number },
) {
  const hash = await getHexHashString(text);

  const allButLast3 = hash.slice(0, -3);
  const requiredLength = rows * Math.ceil(cols / 2);
  const { rebasedHash, base } = hexHash2BaseOfLength(
    allButLast3,
    requiredLength,
  );

  const pixels = getPixels(rebasedHash, cols, rows, base);

  const color = stringToColor(hash.slice(-3), saturation, lightness);

  const data = `${pixels}:${color}`;
  // console.log({ data });
  return data;
}

async function calculateOnlyPixels(text: string, cols: number, rows: number) {
  const hash = await getHexHashString(text);
  const requiredLength = rows * Math.ceil(cols / 2);
  const { rebasedHash, base } = hexHash2BaseOfLength(hash, requiredLength);

  return getPixels(rebasedHash, cols, rows, base);
}

export async function calculateOnlyColor(
  text: string,
  saturation: { min: number; max: number } = DEFAULT_COLOR_OPTIONS.saturation,
  lightness: { min: number; max: number } = DEFAULT_COLOR_OPTIONS.lightness,
) {
  const hash = await getHexHashString(text);
  console.log("calculating color only for text:", text, hash);
  return stringToColor(hash, saturation, lightness);
}

interface PixelProps {
  index: number;
  eachBlockSizePx: number;
  cols: number;
  pixelColor: string;
}

export const Pixel = ({
  index,
  eachBlockSizePx,
  cols,
  pixelColor,
}: PixelProps) => {
  return (
    <rect
      key={index}
      width={eachBlockSizePx}
      height={eachBlockSizePx}
      x={eachBlockSizePx * (index % cols)}
      y={eachBlockSizePx * Math.floor(index / cols)}
      fill={pixelColor}
    />
  );
};

interface PixelAvatarProps {
  width?: number;
  height?: number;
  rows?: number;
  cols?: number;
  text?: Signal<string>;
  forceLighter?: boolean | "nochange";
  coloredSquaresStrokeWidth?: number;
  eachBlockSizePx?: number;
  classes?: string;
  colorOptions?: {
    saturation: { min: number; max: number };
    lightness: { min: number; max: number };
  };
  colorFrom?: Signal<string>;
  color?: string;
  halfPixels?: string;
  outputTo$?: PropFunction<
    ({
      cols,
      rows,
      halfPixels,
      color,
    }: {
      cols: number;
      rows: number;
      halfPixels: string;
      color: string;
    }) => void
  >;
}

export default component$(
  ({
    rows = 16,
    cols = 16,
    width = 100,
    height = 100,
    text,
    // forceLighter = "nochange",
    eachBlockSizePx = 1,
    classes = "",
    colorOptions = DEFAULT_COLOR_OPTIONS,
    colorFrom,
    color,
    halfPixels: halfPixels,
    outputTo$,
  }: PixelAvatarProps) => {
    const data = useSignal({
      pixels: "",
      color: "",
      isMoreColored: false,
      shouldBeInversed: false,
    });
    const meta = useSignal({
      totalColored: 0,
      totalPixels: 0,
      avg: 0,
    });

    useTask$(async ({ track }) => {
      track(() => [color, halfPixels, text?.value, colorFrom?.value]);

      let generatedPixels, generatedColor;
      let textToUseForPixels = text?.value ?? "";

      if (color) {
        generatedColor = color;
      } else {
        let colorSlice = "";
        if (colorFrom) {
          // gen color from colorFrom
          colorSlice = colorFrom.value;
        } else {
          // gen color from slice of text
          colorSlice = textToUseForPixels.substring(-3);
          textToUseForPixels = textToUseForPixels.substring(0, -3);
        }
        generatedColor = await calculateOnlyColor(
          colorSlice,
          colorOptions.saturation,
          colorOptions.lightness,
        );
      }

      if (halfPixels) {
        generatedPixels = mirrorPixels(cols, rows, halfPixels);
      } else {
        // hash the textToUseForPixels
        generatedPixels = await calculateOnlyPixels(
          textToUseForPixels,
          cols,
          rows,
        );
      }

      // console.log({ generatedPixels, generatedColor });
      const totalColored = generatedPixels
        .split("")
        .reduce((accum, cur) => (accum += Number(cur)), 0);
      const avg = totalColored / generatedPixels.length;
      const isMoreColored = avg > 0.5;

      meta.value = {
        totalColored: totalColored,
        totalPixels: generatedPixels.length,
        avg,
      };

      // if lighter === 'nochange' this is always false
      // const shouldBeInversed = forceLighter === data.value.isMoreColored;
      data.value = {
        pixels: generatedPixels,
        color: generatedColor,
        isMoreColored,
        shouldBeInversed: false,
      };

      // if isMoreColored !== forceLighter  we can use color for base and white for blocks
      // if isMoreColored == forceLighter  we can use white for base and color for blocks
      if (outputTo$ !== undefined) {
        outputTo$({
          cols,
          rows,
          halfPixels: generatedPixels,
          color: generatedColor,
        });
      }
    });

    return (
      <>
        {data.value.pixels && (
          <svg
            viewBox={` 0 0 ${cols * eachBlockSizePx} ${
              rows * eachBlockSizePx
            } `}
            width={width}
            height={height}
            style={`stroke-width: 0px; background-color: ${
              data.value.isMoreColored ? data.value.color : "#fff"
            }; `}
            class={classes}
            data-colored={meta.value.totalColored}
            data-total={meta.value.totalPixels}
            data-avg={meta.value.avg}
            shape-rendering="crispEdges"
          >
            {data.value.pixels
              .split("")
              .map((pixel, index) =>
                data.value.isMoreColored === (pixel === "1") ? null : (
                  <Pixel
                    key={`${index}:${pixel}`}
                    index={index}
                    pixelColor={
                      data.value.isMoreColored ? "#fff" : data.value.color
                    }
                    eachBlockSizePx={eachBlockSizePx}
                    cols={cols}
                  />
                ),
              )}
          </svg>
        )}
      </>
    );
  },
);

/*
 *4278fc5a49c1f6e03179bb0968c78f71f0dbd17b6b7db75ab0096ff47999e4ca
 *7e0927d1c235c2f0766d393a9f7965b126e47756
 * */
