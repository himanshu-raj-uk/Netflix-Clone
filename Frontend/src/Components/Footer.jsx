import { useLanguage } from "../Context/LanguageContext";
import { translations } from "../Data/Translations";
import { ChevronRight } from "lucide-react";

const linkKeys = [
  "faq",
  "help",
  "account",
  "media",
  "investor",
  "jobs",
  "watch",
  "terms",
  "privacy",
  "cookies",
  "corporate",
  "contact",
  "speed",
  "legal",
  "onlyNetflix",
];

export default function Footer() {
  const { language, changeLanguage } = useLanguage();
  const t = translations[language] || translations.en;

  return (
    <footer className="relative mt-8 w-full border-t border-white/[0.06] bg-[#080B14] px-4 py-8 text-slate-400 sm:mt-12 sm:px-8 sm:py-10 lg:px-14">
      <div className="relative mx-auto flex w-full max-w-[1100px] flex-col items-center text-center">
        {/* Email newsletter box with medium, responsive height */}
        <div className="flex w-full max-w-[760px] flex-col items-center text-center">
          <p className="mb-4 text-base font-semibold text-white sm:text-xl">
            {t.footer.ready}
          </p>

          <div className="flex w-full flex-col items-stretch gap-2.5 sm:flex-row">
            <input
              type="email"
              aria-label={t.footer.emailPlaceholder}
              placeholder={t.footer.emailPlaceholder}
              className="h-16 sm:h-12 w-full min-w-0 flex-1 rounded-md border border-white/15 bg-[#111827] px-4 text-left text-sm text-white outline-none transition-colors placeholder:text-slate-500 hover:border-white/25 focus:border-[#8B5CF6]"
            />

            <button
              type="button"
              className="inline-flex h-16 sm:h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#8B5CF6] px-5 sm:px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#7C3AED] active:scale-95"
            >
              <span>{t.footer.getStarted}</span>
              <ChevronRight
                strokeWidth={2}
                className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </button>
          </div>
        </div>

        {/* Questions helpline */}
        <p className="mt-8 text-xs sm:text-sm text-slate-400">
          {t.footer.questions}{" "}
          <a
            href="tel:0008009191743"
            className="font-medium text-[#22D3EE] underline underline-offset-4 hover:text-white"
          >
            000-800-919-1743
          </a>
        </p>

        {/* Links Grid */}
        <ul className="mt-5 grid w-full grid-cols-2 justify-items-center gap-x-6 gap-y-2.5 text-center text-xs sm:grid-cols-3 md:grid-cols-4">
          {linkKeys.map((key) => (
            <li key={key} className="min-w-0">
              <a
                href="#"
                className="inline-block break-words text-slate-400 transition-colors duration-150 hover:text-white hover:underline underline-offset-2"
              >
                {t.footer.links[key]}
              </a>
            </li>
          ))}
        </ul>

        {/* Language selector */}
        <div className="mt-6 flex justify-center">
          <div className="relative flex h-9 w-32 items-center justify-between rounded-md border border-white/15 bg-[#111827] px-3 text-slate-200 transition-colors hover:border-white/30">
            <span className="text-xs font-medium">
              {language === "hi" ? t.language.hindi : t.language.english}
            </span>
            <span
              aria-hidden="true"
              className="h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-slate-400"
            />
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              aria-label={t.language.label}
              style={{ colorScheme: "dark" }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 [&>option]:bg-[#111827] [&>option]:text-white"
            >
              <option value="en">{t.language.english}</option>
              <option value="hi">{t.language.hindi}</option>
            </select>
          </div>
        </div>

        {/* Region & Legal */}
        <p className="mt-5 text-[11px] font-medium text-slate-500">
          {t.footer.country}
        </p>

        <p className="mt-2 max-w-[600px] text-center text-[10px] leading-relaxed text-slate-500">
          {t.footer.description}
        </p>
      </div>
    </footer>
  );
}
