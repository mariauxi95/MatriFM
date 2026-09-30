import { useEffect, useId } from "react";

const SCRIPT = "https://assets.pinterest.com/js/pinit.js";

function loadPinScript() {
  return new Promise<void>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src*="pinit.js"]');
    const PinUtils = (window as unknown as { PinUtils?: { build: () => void } }).PinUtils;
    if (existing && PinUtils) {
      PinUtils.build();
      resolve();
      return;
    }
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      (window as unknown as { PinUtils?: { build: () => void } }).PinUtils?.build();
      resolve();
    };
    document.body.appendChild(script);
  });
}

export function PinterestBoard({ url, title }: { url: string; title: string }) {
  const id = useId();
  const isSearch = url.includes("/search/");

  useEffect(() => {
    if (isSearch) return;
    const timer = window.setTimeout(() => {
      void loadPinScript();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [url, id, isSearch]);

  return (
    <section className="pin-board card">
      <div className="card-body">
        <p className="eyebrow">Pinterest</p>
        <h2>{title}</h2>
        {isSearch ? (
          <a className="btn" href={url} target="_blank" rel="noreferrer">
            {title}
          </a>
        ) : (
          <div className="pin-embed" key={`${id}-${url}`}>
            <a
              data-pin-do="embedBoard"
              data-pin-board-width="900"
              data-pin-scale-height="340"
              data-pin-scale-width="100"
              href={url}
            >
              {title}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
