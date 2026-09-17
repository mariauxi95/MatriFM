/** Cover map (V2) with plane flying the heart route. */
export function CoverFlightMap() {
  return (
    <div className="cover-map" aria-hidden>
      <img className="cover-map-img" src="/images/mapa-v2.png?v=1" alt="" />
      <svg
        className="cover-flight"
        viewBox="0 0 1024 768"
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
      >
        <defs>
          {/* Traced to match the dashed route + Atlantic heart on mapa-v2 */}
          <path
            id="cover-flight-path"
            d="M 284 476
               C 295 430 325 380 370 330
               C 410 285 455 245 490 210
               C 460 185 410 155 385 115
               C 365 85 370 50 410 40
               C 445 32 475 48 490 75
               C 505 48 545 30 585 42
               C 625 55 640 95 625 135
               C 610 175 565 205 520 220
               C 500 228 485 228 475 222
               C 520 230 600 225 680 210
               C 760 195 840 165 920 120
               C 950 100 975 85 995 70"
          />
        </defs>

        <g className="cover-flight-plane">
          <image
            href="/images/avion-cover.png?v=2"
            width="56"
            height="52"
            x="-28"
            y="-26"
            preserveAspectRatio="xMidYMid meet"
          />
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
