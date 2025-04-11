import type { PropFunction, Signal } from "@builder.io/qwik";
import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import GAME from "~/v3/constants/game";
import {
  calculateOnlyColor,
  calculateOnlyPixels,
  mirrorPixels,
} from "~/v3/utils/avatarUtils";
import { getHexHashString } from "~/v3/utils/hashUtils";

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
  rows?: number;
  cols?: number;
  text?: Signal<string>;
  hash?: Signal<string>;
  forceLighter?: boolean | "nochange";
  coloredSquaresStrokeWidth?: number;
  eachBlockSizePx?: number;
  classes?: string;
  colorOptions?: {
    backgroundColor?: string;
    saturation: { min: number; max: number };
    lightness: { min: number; max: number };
  };
  colorFrom?: Signal<string>;
  color?: string;
  halfPixels?: string;
  /** for saving the data */
  outputTo$?: PropFunction<
    ({
      cols,
      rows,
      halfPixels,
      color,
      hash,
    }: {
      cols: number;
      rows: number;
      halfPixels: string;
      color: string;
      hash?: string;
    }) => void
  >;
}

export default component$(
  ({
    rows = 16,
    cols = 16,
    classes = "",
    eachBlockSizePx = 1,
    colorOptions = GAME.DEFAULT_COLOR_OPTIONS,
    // forceLighter = "nochange",
    /** */
    text,
    hash,
    colorFrom,

    /** */
    color,
    halfPixels,

    /** */
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
    colorOptions = {
      backgroundColor:
        colorOptions.backgroundColor ??
        GAME.DEFAULT_COLOR_OPTIONS.backgroundColor,
      saturation: {
        ...GAME.DEFAULT_COLOR_OPTIONS.saturation,
        ...colorOptions.saturation,
      },
      lightness: {
        ...GAME.DEFAULT_COLOR_OPTIONS.lightness,
        ...colorOptions.lightness,
      },
    };

    useTask$(async ({ track }) => {
      track(() => [
        color,
        halfPixels,
        // can this track the signal instread of the signal value?
        hash?.value,
        text?.value,
        colorFrom?.value,
      ]);

      let generatedPixels, generatedColor;
      let textToUseForPixels = text?.value ?? "";

      // generate or get color
      if (color) {
        generatedColor = color;
      } else {
        let colorSlice = "";
        if (colorFrom) {
          // gen color from colorFrom e.g. initials
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

      let hashed = hash?.value;
      if (halfPixels) {
        // legacy - when passing in binary string to render pixels
        generatedPixels = mirrorPixels(cols, rows, halfPixels);
      } else {
        if (!hashed) {
          hashed = await getHexHashString(textToUseForPixels);
        }
        generatedPixels = await calculateOnlyPixels(hashed, cols, rows);
      }

      // if (hash?.value) {
      //   generatedPixels = await calculateOnlyPixels(hash.value, cols, rows);
      // } else if (halfPixels) {
      //   // generate or get pixels
      //   generatedPixels = mirrorPixels(cols, rows, halfPixels);
      // } else {
      //   // hash the textToUseForPixels
      //   const hashed = await getHexHashString(textToUseForPixels);
      //   generatedPixels = await calculateOnlyPixels(hashed, cols, rows);
      // }

      // console.log({ generatedPixels, generatedColor });
      const totalColored = generatedPixels
        .split("")
        .reduce((accum, cur) => (accum += Number(cur)), 0);
      const avg = totalColored / generatedPixels.length;
      const isMoreColored = avg >= 0.5;

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
          hash: hashed,
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
            width="64px" // overwritten with css
            height="64px"
            style={`stroke-width: 0px; background-color: ${
              data.value.isMoreColored
                ? data.value.color
                : (colorOptions.backgroundColor as string)
            }; `}
            class={`aspect-square ${classes}`}
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
                      data.value.isMoreColored
                        ? (colorOptions.backgroundColor as string)
                        : data.value.color
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
