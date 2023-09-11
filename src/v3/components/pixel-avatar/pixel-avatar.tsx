import { Signal, component$, useSignal, useTask$ } from "@builder.io/qwik";
import { isServer } from "@builder.io/qwik/build";
import crypto from "crypto";

const DEFAULT_COLOR_OPTIONS = {
  saturation: {
    min: 20,
    max: 80,
  },
  lightness: { min: 20, max: 80 },
};

export const stringToHash = (string: string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  hash = hash < 0 ? hash * -1 : hash;

  return hash;
};

export const stringToColor = (
  string: string,
  saturation = { min: 20, max: 100 },
  lightness = { min: 40, max: 100 }
) => {
  // max unique colors: 360 * (saturation.max - saturation.min) * (lightness.max - lightness.min)
  // 360 * 80 * 60 = 1_728_000

  const hash = stringToHash(string);
  const hashString = hash.toString();

  const satPercent = (Number(hashString.slice(-3)) + 1) / 1000;
  const lightPercent = (Number(hashString.slice(-5, -2)) + 1) / 1000;

  const hue = hash % 360;
  const sat = (
    saturation.min +
    Number(satPercent) * (saturation.max - saturation.min)
  ).toFixed(0);
  const light = (
    lightness.min +
    Number(lightPercent) * (lightness.max - lightness.min)
  ).toFixed(0);

  return `hsl(${hue}, ${sat}%, ${light}%)`;
};

export function bufferToHexString(buffer: ArrayBuffer) {
  let byteArray = new Uint8Array(buffer);

  let hexCodes = [...byteArray].map((value) => {
    return value.toString(16).padStart(2, "0");
  });

  return hexCodes.join("");
}

export function getHash(message: string) {
  if (isServer) {
    const hash = crypto.createHash("sha256");
    hash.update(message);

    // console.log("isServer");
    return hash.digest();
  }
  // console.log("isClient");
  let encoder = new TextEncoder();
  let data = encoder.encode(message);
  return window.crypto.subtle.digest("SHA-1", data);
}

export async function getHexHashString(userInput: string) {
  let hash = bufferToHexString(await getHash(userInput));

  return hash;
}

export function getColor(hash: string) {
  return `#${hash.slice(-3)}`;
}

export function hexCharToBase(hex: string, base: number) {
  const OLD_BASE = 16;
  return parseInt(hex, OLD_BASE)
    .toString(base)
    .padStart(OLD_BASE / base, "0");
}

// take hex string and target string length
// calculates how to achieve the target length by reducing the base of the hex string until we have enough digits
function calculateBaseChange(hex: string, targetMinimumStringLength: number) {
  const initialBase = 16;
  let toDivideBaseBy = Math.ceil(targetMinimumStringLength / hex.length);
  let newBase = initialBase;
  let newAvailableLength = hex.length;

  while (toDivideBaseBy > 1) {
    if (newBase === 2) {
      throw new Error("too long");
    }
    newBase /= 2;
    toDivideBaseBy /= 2;
    newAvailableLength *= 2;
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
  base: number = 2
) {
  // convert 40char hash to 4 * 7 (mirrored for 7 * 7) matrix, 28bits
  let pixels = "";

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const halfway = Math.ceil(cols / 2);
      let J = j >= halfway ? cols - 1 - j : j;
      let charFromHash = hash.charAt(i * halfway + J);
      if (base === 2) {
        pixels += charFromHash;
      } else {
        let shouldFill = parseInt(charFromHash, base) % 2;
        pixels += shouldFill ? "0" : "1";
      }
    }
  }

  return pixels;
}

export async function calculatePixelData(
  text: string,
  cols: number,
  rows: number,
  saturation: { min: number; max: number },
  lightness: { min: number; max: number }
) {
  const hash = await getHexHashString(text);

  const allButLast3 = hash.slice(0, -3);
  const requiredLength = rows * Math.ceil(cols / 2);
  const { rebasedHash, base } = hexHash2BaseOfLength(
    allButLast3,
    requiredLength
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
  lightness: { min: number; max: number } = DEFAULT_COLOR_OPTIONS.lightness
) {
  const hash = await getHexHashString(text);
  console.log("calculating color only for text:", text, hash);
  return stringToColor(hash, saturation, lightness);
}

interface PixelProps {
  pixel: string;
  index: number;
  avatarData: any;
  eachBlockSizePx: number;
  cols: number;
  coloredSquaresStrokeWidth: number;
}

export const Pixel = component$(
  ({
    pixel,
    index,
    avatarData: data,
    eachBlockSizePx,
    cols,
    coloredSquaresStrokeWidth,
  }: PixelProps) => {
    const isThisPixelBlank = (pixel === "0") !== data.value.shouldBeInversed;

    // if (isBlank) return null;
    const isThisPixelColored = pixel === "1";
    // if (isMoreColored (base is colored) && isColored) return null;
    // if (isMoreColored (base is colored) && !isColored) return white
    // if (!isMoreColored (base is white) && isColored) return color;
    // if (!isMoreColored (base is white) && !isColored (is white))return null
    if (data.value.isMoreColored === isThisPixelColored) return <></>;
    const color =
      data.value.isMoreColored && !isThisPixelColored
        ? "#fff"
        : data.value.color;
    const x = eachBlockSizePx * (index % cols);
    const y = eachBlockSizePx * Math.floor(index / cols);
    return (
      <rect
        key={index}
        stroke-width={coloredSquaresStrokeWidth}
        stroke={color}
        width={eachBlockSizePx}
        height={eachBlockSizePx}
        x={x}
        y={y}
        fill={color}
      />
    );
  }
);

interface PixelAvatarProps {
  width?: number;
  height?: number;
  rows?: number;
  cols?: number;
  text: Signal<string>;
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
}

export default component$(
  ({
    rows = 9,
    cols = 9,
    width = 100,
    height = 100,
    text,
    forceLighter = "nochange",
    coloredSquaresStrokeWidth = 0,
    eachBlockSizePx = 20,
    classes = "",
    colorOptions = DEFAULT_COLOR_OPTIONS,
    colorFrom,
    color,
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
      track(() => [text.value, colorFrom?.value, color]);

      let pixels, generatedColor;
      if (!color) {
        if (colorFrom) {
          // if given a separate color string, need to hash it and calc the color
          const res = await Promise.all([
            calculateOnlyColor(
              colorFrom.value,
              colorOptions.saturation,
              colorOptions.lightness
            ),
            calculateOnlyPixels(text.value, cols, rows),
          ]);
          generatedColor = res[0];
          // then calc the pixels from the regular text (hashed)
          pixels = res[1];
          console.log("calculating separately...");
        } else {
          // else, need to calculate both from the one text, slicing off the last 3 chars for the color
          const res = await calculatePixelData(
            text.value,
            cols,
            rows,
            colorOptions.saturation,
            colorOptions.lightness
          );

          const splitRes = res.split(":");
          pixels = splitRes[0];
          generatedColor = splitRes[1];
          console.log("calculating combined...");
        }
      } else {
        generatedColor = color;
        pixels = await calculateOnlyPixels(text.value, cols, rows);
      }

      console.log({ pixels, generatedColor });
      const totalColored = pixels
        .split("")
        .reduce((accum, cur) => (accum += Number(cur)), 0);
      const avg = totalColored / pixels.length;
      const isMoreColored = avg > 0.5;

      meta.value = {
        totalColored: totalColored,
        totalPixels: pixels.length,
        avg,
      };

      // if lighter === 'nochange' this is always false
      // const shouldBeInversed = forceLighter === data.value.isMoreColored;
      data.value = {
        pixels,
        color: generatedColor,
        isMoreColored,
        shouldBeInversed: false,
      };

      // if isMoreColored !== forceLighter  we can use color for base and white for blocks
      // if isMoreColored == forceLighter  we can use white for base and color for blocks
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
            style={` stroke-width: 0px; background-color: ${
              data.value.isMoreColored ? data.value.color : "#fff"
            }; `}
            class={classes}
            data-colored={meta.value.totalColored}
            data-total={meta.value.totalPixels}
            data-avg={meta.value.avg}
          >
            {data.value?.pixels.split("").map((pixel, index) => (
              <Pixel
                key={`${index}:${pixel}`}
                pixel={pixel}
                index={index}
                avatarData={data}
                eachBlockSizePx={eachBlockSizePx}
                cols={cols}
                coloredSquaresStrokeWidth={coloredSquaresStrokeWidth}
              />
            ))}
          </svg>
        )}
      </>
    );
  }
);


/* 
*4278fc5a49c1f6e03179bb0968c78f71f0dbd17b6b7db75ab0096ff47999e4ca
*7e0927d1c235c2f0766d393a9f7965b126e47756
* */
