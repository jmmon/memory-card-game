import type { iPlayingCardSvgProps } from "~/v3/types/types";

export default ({ color, symbol }: iPlayingCardSvgProps) => {
  const symbolHref = `#symbol-${symbol}`;
  const numberHref = `#0-${color}`;
  return `<svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      class="playing-card"
      preserveAspectRatio="xMinYMin meet"
      viewBox="-120 -168 240 336"
    >
      <use xlink:href="#card-border"/>

      <use
        xlink:href=${numberHref}
        height="32"
        width="32"
        x="-114.4"
        y="-156"
      />
      <use
        xlink:href=${symbolHref}
        height="26.769"
        width="26.769"
        x="-111.784"
        y="-119"
      />
      <use
        xlink:href=${symbolHref}
        height="70"
        width="70"
        x="-87.501"
        y="-135.588"
      />
      <use
        xlink:href=${symbolHref}
        height="70"
        width="70"
        x="17.501"
        y="-135.588"
      />
      <use
        xlink:href=${symbolHref}
        height="70"
        width="70"
        x="-87.501"
        y="-68.529"
      />
      <use
        xlink:href=${symbolHref}
        height="70"
        width="70"
        x="17.501"
        y="-68.529"
      />
      <use
        xlink:href=${symbolHref}
        height="70"
        width="70"
        x="-35"
        y="-102.058"
      />
      <g transform="rotate(180)">
        <use
          xlink:href=${numberHref}
          height="32"
          width="32"
          x="-114.4"
          y="-156"
        />
        <use
          xlink:href=${symbolHref}
          height="26.769"
          width="26.769"
          x="-111.784"
          y="-119"
        />
        <use
          xlink:href=${symbolHref}
          height="70"
          width="70"
          x="-87.501"
          y="-135.588"
        />
        <use
          xlink:href=${symbolHref}
          height="70"
          width="70"
          x="17.501"
          y="-135.588"
        />
        <use
          xlink:href=${symbolHref}
          height="70"
          width="70"
          x="-87.501"
          y="-68.529"
        />
        <use
          xlink:href=${symbolHref}
          height="70"
          width="70"
          x="17.501"
          y="-68.529"
        />
        <use
          xlink:href=${symbolHref}
          height="70"
          width="70"
          x="-35"
          y="-102.058"
        />
      </g>
    </svg>
  `;
};
