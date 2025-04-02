import baseNumberCard from "../base-number-card";

export default () =>
  baseNumberCard({
    number: "j",
    symbol: "spades",
    centerContent: `
      <use xlink:href="#card-square" fill="none" stroke="#44F" />

      <use
        xlink:href="#symbol-spades"
        height="55.68"
        width="55.68"
        x="-91.768"
        y="-132.16"
      />

      <use
        width="164.8"
        height="260.8"
        x="-82.4"
        y="-130.4"
        xlink:href="#jack-spades-a"
      />
      <use
        xlink:href="#jack-spades-b"
        width="164.8"
        height="260.8"
        x="-82.4"
        y="-130.4"
      />
      <use
        xlink:href="#jack-spades-c"
        width="164.8"
        height="260.8"
        x="-82.4"
        y="-130.4"
      />
      <use
        xlink:href="#jack-spades-d"
        width="164.8"
        height="260.8"
        x="-82.4"
        y="-130.4"
      />
      <use
        xlink:href="#jack-spades-e"
        width="164.8"
        height="260.8"
        x="-82.4"
        y="-130.4"
      />
      <use
        xlink:href="#jack-spades-f"
        width="164.8"
        height="260.8"
        x="-82.4"
        y="-130.4"
      />

      <g transform="rotate(180)">
        <use
          xlink:href="#symbol-spades"
          height="55.68"
          width="55.68"
          x="-91.768"
          y="-132.16"
        />

        <use
          width="164.8"
          height="260.8"
          x="-82.4"
          y="-130.4"
          xlink:href="#jack-spades-a"
        />
        <use
          xlink:href="#jack-spades-b"
          width="164.8"
          height="260.8"
          x="-82.4"
          y="-130.4"
        />
        <use
          xlink:href="#jack-spades-c"
          width="164.8"
          height="260.8"
          x="-82.4"
          y="-130.4"
        />
        <use
          xlink:href="#jack-spades-d"
          width="164.8"
          height="260.8"
          x="-82.4"
          y="-130.4"
        />
        <use
          xlink:href="#jack-spades-e"
          width="164.8"
          height="260.8"
          x="-82.4"
          y="-130.4"
        />
        <use
          xlink:href="#jack-spades-f"
          width="164.8"
          height="260.8"
          x="-82.4"
          y="-130.4"
        />
      </g>
    `,
  });

// export default () => `<svg
//       xmlns="http://www.w3.org/2000/svg"
//       xmlns:xlink="http://www.w3.org/1999/xlink"
//       class="playing-card black"
//       preserveAspectRatio="xMinYMin meet"
//       viewBox="-120 -168 240 336"
//     >
//       <use xlink:href="#card-border"/>
//
//   <use
//     width="164.8"
//     height="260.8"
//     x="-82.4"
//     y="-130.4"
//     xlink:href="#jack-spades-1"
//   />
//   <use
//     transform="rotate(180)"
//     width="164.8"
//     height="260.8"
//     x="-82.4"
//     y="-130.4"
//     xlink:href="#jack-spades-1"
//   />
//   <use
//     width="164.8"
//     height="260.8"
//     x="-82.4"
//     y="-130.4"
//     xlink:href="#jack-spades-2"
//   />
//   <use
//     transform="rotate(180)"
//     width="164.8"
//     height="260.8"
//     x="-82.4"
//     y="-130.4"
//     xlink:href="#jack-spades-2"
//   />
//   <use
//     width="164.8"
//     height="260.8"
//     x="-82.4"
//     y="-130.4"
//     xlink:href="#jack-spades-3"
//   />
//   <use
//     transform="rotate(180)"
//     width="164.8"
//     height="260.8"
//     x="-82.4"
//     y="-130.4"
//     xlink:href="#jack-spades-3"
//   />
//   <use
//     width="164.8"
//     height="260.8"
//     x="-82.4"
//     y="-130.4"
//     xlink:href="#jack-spades-4"
//   />
//   <use
//     transform="rotate(180)"
//     width="164.8"
//     height="260.8"
//     x="-82.4"
//     y="-130.4"
//     xlink:href="#jack-spades-4"
//   />
//   <use
//     width="164.8"
//     height="260.8"
//     x="-82.4"
//     y="-130.4"
//     xlink:href="#jack-spades-5"
//   />
//   <use
//     transform="rotate(180)"
//     width="164.8"
//     height="260.8"
//     x="-82.4"
//     y="-130.4"
//     xlink:href="#jack-spades-5"
//   />
//   <use
//     width="164.8"
//     height="260.8"
//     x="-82.4"
//     y="-130.4"
//     xlink:href="#jack-spades-6"
//   />
//   <use
//     transform="rotate(180)"
//     width="164.8"
//     height="260.8"
//     x="-82.4"
//     y="-130.4"
//     xlink:href="#jack-spades-6"
//   />
//   <use xlink:href="#j-number" height="32" width="32" x="-114.4" y="-156"/>
//   <use
//     xlink:href="#symbol-spades"
//     height="26.769"
//     width="26.769"
//     x="-111.784"
//     y="-119"
//   />
//   <use
//     xlink:href="#symbol-spades"
//     height="55.68"
//     width="55.68"
//     x="-91.768"
//     y="-132.16"
//   />
//   <g transform="rotate(180)">
//     <use xlink:href="#j-number" height="32" width="32" x="-114.4" y="-156"/>
//     <use
//       xlink:href="#symbol-spades"
//       height="26.769"
//       width="26.769"
//       x="-111.784"
//       y="-119"
//     />
//
//     <use
//       xlink:href="#symbol-spades"
//       height="55.68"
//       width="55.68"
//       x="-91.768"
//       y="-132.16"
//     />
//   </g>
//
//       <use xlink:href="#card-square" fill="none" stroke="#44F" />
//     </svg>`;
