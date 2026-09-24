import { assetUrl } from "../lib/assets";

/** Cover map with plane flying a compact heart route. */
export function CoverFlightMap() {
  return (
    <div className="cover-map" aria-hidden>
      <img className="cover-map-img" src={assetUrl("/images/mapa-cover.png?v=2")} alt="" />
      <svg
        className="cover-flight"
        viewBox="0 0 1024 768"
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
      >
        <defs>
          {/*
            Left approach → up the right lobe → sharp cleft → down the left lobe →
            smooth lowered eastbound exit. Sprite nose points ~NE; rotate so +X
            is forward for animateMotion rotate=auto.
          */}
          <path
            id="cover-flight-path"
            d="M 278 488
               C 305 430 345 365 400 315
               C 445 280 475 258 500 245
               C 535 235 565 210 575 180
               C 583 158 575 138 548 135
               C 530 133 516 145 505 162
               C 494 145 480 133 462 135
               C 435 138 425 158 432 182
               C 442 210 465 235 500 245
               C 545 255 630 258 740 248
               C 850 235 940 200 1020 155"
          />
        </defs>

        <use
          href="#cover-flight-path"
          fill="none"
          stroke="#d4a45c"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4.5 6.5"
          opacity="0.95"
        />

        <g className="cover-flight-plane">
          {/* Asset nose ~NE (~−45°); SVG+rotate=auto needs nose along +X */}
          <g transform="rotate(45)">
            <image
              href={assetUrl("/images/avion-cover.png?v=2")}
              width="32"
              height="30"
              x="-16"
              y="-15"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
          <animateMotion
            className="cover-flight-motion"
            dur="16s"
            repeatCount="indefinite"
            rotate="auto"
          >
            <mpath href="#cover-flight-path" />
          </animateMotion>
        </g>
      </svg>
    </div>
  );
}
