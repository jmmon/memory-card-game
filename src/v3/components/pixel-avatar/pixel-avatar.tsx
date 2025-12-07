import type { ClassList, QRL, Signal } from "@builder.io/qwik";
import {
  component$,
  useComputed$,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import GAME from "~/v3/constants/game";
import type { AvatarColorOptions } from "~/v3/types/types";
import {
  calculateOnlyColor,
  calculateOnlyPixels,
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
}: PixelProps) => (
  <rect
    key={index}
    width={eachBlockSizePx}
    height={eachBlockSizePx}
    x={eachBlockSizePx * (index % cols)}
    y={eachBlockSizePx * Math.floor(index / cols)}
    fill={pixelColor}
  />
);

interface PixelAvatarProps {
  rows?: number;
  cols?: number;
  eachBlockSizePx?: number;
  colorOptions?: AvatarColorOptions;
  class?: ClassList;
  identifierText?: Signal<string>;
  colorFrom: Signal<string>;
  incomingHashedIdentifier?: Signal<string>;
  color?: string;
  halfPixels?: string;
  /** for saving the data */
  outputTo$?: QRL<
    ({
      cols,
      rows,
      halfPixels,
      color,
      identifierHash,
    }: {
      cols: number;
      rows: number;
      halfPixels: string;
      color: string;
      identifierHash?: string;
    }) => void
  >;
}

export default component$(
  ({
    rows = 16,
    cols = 16,
    eachBlockSizePx = 1,
    colorOptions = GAME.DEFAULT_COLOR_OPTIONS,
    class: classes = "",
    /**
     * inputs used on end-game modal when generating avatar
     * */
    colorFrom, // initials
    identifierText, // identifier text
    incomingHashedIdentifier, // used for scores table (and db-seed page)

    /**
     * function to send out the results
     * */
    outputTo$,
  }: PixelAvatarProps) => {
    const data = useSignal({
      pixels: "",
      color: "",
      hashedIdentifier: "",
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
      track(colorFrom);
      const generatedColor = await calculateOnlyColor(
        colorFrom.value,
        colorOptions.saturation,
        colorOptions.lightness,
      );
      data.value = {
        ...data.value,
        color: generatedColor,
      };
    });

    useTask$(async ({ track }) => {
      track(() => [
        incomingHashedIdentifier?.value,
        identifierText?.value,
      ]);

      const hashedIdentifier =
        incomingHashedIdentifier?.value ??
        (await getHexHashString(identifierText?.value ?? ""));
      const generatedPixels = calculateOnlyPixels(hashedIdentifier, cols, rows);

      data.value = {
        ...data.value,
        pixels: generatedPixels,
        hashedIdentifier,
      };
    });

    const meta = useComputed$(() => {
      const pixelsLength = data.value.pixels.length;
      const totalColored = data.value.pixels
        .split("")
        .reduce((accum, cur) => (accum += Number(cur)), 0);
      const avg = totalColored / pixelsLength;
      const isMoreColored = avg >= 0.5;

      return {
        totalColored: totalColored,
        totalPixels: pixelsLength,
        avg,
        isMoreColored,
      };
    })

    useTask$(({ track }) => {
      track(() => [ data.value.pixels, data.value.color, data.value.hashedIdentifier ]);
      outputTo$?.({
        cols,
        rows,
        halfPixels: data.value.pixels,
        color: data.value.color,
        identifierHash: data.value.hashedIdentifier,
      });
    });

    return (
      <svg
        viewBox={` 0 0 ${cols * eachBlockSizePx} ${rows * eachBlockSizePx} `}
        width="64px" // overwritten with css
        height="64px"
        style={`stroke-width: 0px; background-color: ${
          meta.value.isMoreColored
            ? data.value.color
            : (colorOptions.backgroundColor as string)
        };`}
        class={`aspect-square ${classes}`}
        data-colored={meta.value.totalColored}
        data-total={meta.value.totalPixels}
        data-avg={meta.value.avg}
        shape-rendering="crispEdges"
      >
        {data.value.pixels
          .split("")
          .map((pixel, index) =>
            meta.value.isMoreColored === (pixel === "1") ? null : (
              <Pixel
                key={`${index}:${pixel}`}
                index={index}
                pixelColor={
                  meta.value.isMoreColored
                    ? (colorOptions.backgroundColor as string)
                    : data.value.color
                }
                eachBlockSizePx={eachBlockSizePx}
                cols={cols}
              />
            ),
          )}
      </svg>
    );
  },
);

