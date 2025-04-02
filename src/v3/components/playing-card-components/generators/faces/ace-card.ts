import type { iPlayingCardSvgProps } from "~/v3/types/types";
import baseNumberCard from "../base-number-card";

export default ({ symbol }: iPlayingCardSvgProps) => {
  return baseNumberCard({
    number: "ace",
    symbol,
    centerContent:
      symbol === "spades"
        ? `<use
            xlink: href=#symbol-spades-ace
            width="164.8"
            height="253.5"
            x="-82.4"
            y="-126.8"
          />`
        : `<use
            xlink: href=#symbol-${symbol}
            height="70"
            width="70"
            x="-35"
            y="-35"
          />`,
  });
};

// export default ({ symbol }: iPlayingCardSvgProps) => {
//   const symbolHref = `#symbol-${symbol}`;
//   const numberId = `#ace-number`;
//   const color = symbol === ("hearts" || "diamonds") ? "red" : "black";
//
//   return `<svg
//         xmlns="http://www.w3.org/2000/svg"
//         xmlns: xlink="http://www.w3.org/1999/xlink"
//         class="playing-card ${color}"
//         preserveAspectRatio="xMinYMin meet"
//         viewBox="-120 -168 240 336"
//       >
//         <use xlink: href="#card-border" />
//
//         ${
//           symbol === "spades"
//             ? `<use xlink: href="#symbol-ace-spades" width="164.8" height="253.5" x="-82.4" y="-126.8" />`
//             : `<use xlink: href=${symbolHref} height="70" width="70" x="-35" y="-35" />`
//         }
//
//         <use
//           xlink: href=${numberId}
//           height="32"
//           width="32"
//           x="-114.4"
//           y="-156"
//         />
//         <use
//           xlink: href=${symbolHref}
//           height="26.769"
//           width="26.769"
//           x="-111.784"
//           y="-119"
//         />
//         <g transform="rotate(180)">
//           <use
//             xlink: href=${numberId}
//             height="32"
//             width="32"
//             x="-114.4"
//             y="-156"
//           />
//           <use
//             xlink: href=${symbolHref}
//             height="26.769"
//             width="26.769"
//             x="-111.784"
//             y="-119"
//           />
//         </g>
//       </svg>
//   `;
// };
