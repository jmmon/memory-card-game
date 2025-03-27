export default ({
  number,
  symbol,
  centerContent,
}: {
  number: "ace" | number | "j" | "q" | "k";
  symbol: "spades" | "clubs" | "diamonds" | "hearts";
  centerContent: string;
}) => `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    class="playing-card ${symbol === "hearts" || symbol === "diamonds" ? "red" : "black"}"
    preserveAspectRatio="xMinYMin meet"
    viewBox="-120 -168 240 336"
  >
    <use xlink:href=#card-border />

    <use xlink:href=#${number}-number width="32" height="32" x="-114.4" y="-156" />
    <use
      xlink:href=#symbol-${symbol}
      width="26.8"
      height="26.8"
      x="-111.8"
      y="-119"
    />

    ${centerContent}

    <g transform="rotate(180)">
      <use
        xlink:href=#${number}-number
        width="32"
        height="32"
        x="-114.4"
        y="-156"
      />
      <use
        xlink:href=#symbol-${symbol}
        width="26.8"
        height="26.8"
        x="-111.8"
        y="-119"
      />
    </g>
  </svg>`;
