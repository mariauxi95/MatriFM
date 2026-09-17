import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { t, type MessageKey } from "../i18n";
import type { Lang } from "../types";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const stored = sessionStorage.getItem("fm-lang");
    return stored === "en" ? "en" : "es";
  });

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang: (next) => {
        sessionStorage.setItem("fm-lang", next);
        setLang(next);
        document.documentElement.lang = next;
      },
      t: (key, vars) => t(lang, key, vars),
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
