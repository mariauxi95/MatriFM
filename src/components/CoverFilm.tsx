import { useEffect, useRef } from "react";
import { assetUrl } from "../lib/assets";

/** Previous heart flight, extended from the left edge to the right edge. */
const THREAD =
  "M -50 760 C 40 700 150 580 250 470 C 330 390 370 345 400 315 C 445 280 475 258 500 245 C 535 235 565 210 575 180 C 583 158 575 138 548 135 C 530 133 516 145 505 162 C 494 145 480 133 462 135 C 435 138 425 158 432 182 C 442 210 465 235 500 245 C 545 255 630 258 740 248 C 850 235 940 200 1020 155 C 1060 130 1100 100 1140 80";

export function CoverFilm({ leaving = false }: { leaving?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      video.pause();
      return;
    }
    const start = () => {
      video.play().catch(() => {});
    };
    if (video.readyState >= 2) start();
    else video.addEventListener("loadeddata", start, { once: true });
    return () => {
      video.removeEventListener("loadeddata", start);
      video.pause();
    };
  }, []);

  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className={`cover-map${leaving ? " is-leaving" : ""}`} aria-hidden>
      <video
        ref={videoRef}
        className="cover-film"
        src={assetUrl("/videos/cover.webm")}
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
      />
      <div className="cover-shade" />
      <svg className="cover-flight" viewBox="0 0 1024 768" preserveAspectRatio="xMidYMid slice" role="presentation">
        <path
          id="cover-thread"
          className="cover-thread-stroke"
          d={THREAD}
          fill="none"
          stroke="#D92D3A"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {reduce ? (
          <g className="cover-flight-plane is-still" transform="translate(1020 155)">
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
          </g>
        ) : (
          <g className="cover-flight-plane">
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
            <animateMotion dur="16s" repeatCount="indefinite" rotate="auto">
              <mpath href="#cover-thread" />
            </animateMotion>
          </g>
        )}
      </svg>
    </div>
  );
}
