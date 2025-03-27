import baseNumberCard from "../base-number-card";

export default () =>
  baseNumberCard({
    number: "j",
    symbol: "hearts",
    centerContent: `
      <use xlink:href="#card-square" fill="none" stroke="#44F" />

      <use
        xlink:href="#symbol-hearts"
        width="55.7"
        height="55.7"
        x="30.9"
        y="-132.2"
      />

      <use
        xlink:href="#jack-hearts-b"
        width="164.8"
        height="260.8"
        x="-82.4"
        y="-130.4"
      />
      <use
        xlink:href="#jack-hearts-c"
        width="164.8"
        height="260.8"
        x="-82.4"
        y="-130.4"
      />
      <use
        xlink:href="#jack-hearts-d"
        width="164.8"
        height="260.8"
        x="-82.4"
        y="-130.4"
      />
      <use
        xlink:href="#jack-hearts-e"
        width="164.8"
        height="260.8"
        x="-82.4"
        y="-130.4"
      />
      <use
        xlink:href="#jack-hearts-f"
        width="164.8"
        height="260.8"
        x="-82.4"
        y="-130.4"
      />
      <use
        xlink:href="#jack-hearts-g"
        width="164.8"
        height="260.8"
        x="-82.4"
        y="-130.4"
      />

      <g transform="rotate(180)">
         <use
           xlink:href="#symbol-hearts"
           width="55.7"
           height="55.7"
           x="30.9"
           y="-132.2"
         />

        <use
          xlink:href="#jack-hearts-b"
          width="164.8"
          height="260.8"
          x="-82.4"
          y="-130.4"
        />
        <use
          xlink:href="#jack-hearts-c"
          width="164.8"
          height="260.8"
          x="-82.4"
          y="-130.4"
        />
        <use
          xlink:href="#jack-hearts-d"
          width="164.8"
          height="260.8"
          x="-82.4"
          y="-130.4"
        />
        <use
          xlink:href="#jack-hearts-e"
          width="164.8"
          height="260.8"
          x="-82.4"
          y="-130.4"
        />
        <use
          xlink:href="#jack-hearts-f"
          width="164.8"
          height="260.8"
          x="-82.4"
          y="-130.4"
        />
        <use
          xlink:href="#jack-hearts-g"
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
//       xmlns: xlink="http://www.w3.org/1999/xlink"
//       class="playing-card red"
//       preserveAspectRatio="xMinYMin meet"
//       viewBox="-120 -168 240 336"
//     >
//       <use xlink: href="#card-border"/>
//
//       <use xlink: href="#jack-hearts-b" width="164.8" height="260.8" x="-82.4" y="-130.4" />
//       <use
//         xlink: href="#jack-hearts-b"
//         width="164.8"
//         height="260.8"
//         x="-82.4"
//         y="-130.4"
//         transform="rotate(180)"
//       />
//       <use xlink: href="#jack-hearts-c" width="164.8" height="260.8" x="-82.4" y="-130.4" />
//       <use
//         xlink: href="#jack-hearts-c"
//         width="164.8"
//         height="260.8"
//         x="-82.4"
//         y="-130.4"
//         transform="rotate(180)"
//       />
//       <use xlink: href="#jack-hearts-d" width="164.8" height="260.8" x="-82.4" y="-130.4" />
//       <use
//         xlink: href="#jack-hearts-d"
//         width="164.8"
//         height="260.8"
//         x="-82.4"
//         y="-130.4"
//         transform="rotate(180)"
//       />
//       <use xlink: href="#jack-hearts-e" width="164.8" height="260.8" x="-82.4" y="-130.4" />
//       <use
//         xlink: href="#jack-hearts-e"
//         width="164.8"
//         height="260.8"
//         x="-82.4"
//         y="-130.4"
//         transform="rotate(180)"
//       />
//       <use xlink: href="#jack-hearts-f" width="164.8" height="260.8" x="-82.4" y="-130.4" />
//       <use
//         xlink: href="#jack-hearts-f"
//         width="164.8"
//         height="260.8"
//         x="-82.4"
//         y="-130.4"
//         transform="rotate(180)"
//       />
//       <use xlink: href="#jack-hearts-g" width="164.8" height="260.8" x="-82.4" y="-130.4" />
//       <use
//         xlink: href="#jack-hearts-g"
//         width="164.8"
//         height="260.8"
//         x="-82.4"
//         y="-130.4"
//         transform="rotate(180)"
//       />
//       <use xlink: href="#j-number" width="32" height="32" x="-114.4" y="-156" />
//       <use xlink: href="#symbol-hearts" width="26.8" height="26.8" x="-111.8" y="-119" />
//       <use xlink: href="#symbol-hearts" width="55.7" height="55.7" x="34" y="-132.2" />
//       <g transform="rotate(180)">
//         <use xlink: href="#j-number" width="32" height="32" x="-114.4" y="-156" />
//         <use xlink: href="#symbol-hearts" width="26.8" height="26.8" x="-111.8" y="-119" />
//         <use xlink: href="#symbol-hearts" width="55.7" height="55.7" x="34" y="-132.2" />
//       </g>
//
//       <use xlink: href="#card-square" fill="none" stroke="#44F" />
//     </svg>`;
