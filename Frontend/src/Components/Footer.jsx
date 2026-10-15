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

// shared fluid sizes so every block scales together
const BASE_TEXT = "text-[clamp(0.875rem,0.3vw+0.78rem,1.0625rem)]";
const CONTROL_H = "h-[clamp(3.25rem,2.2vw+2.3rem,4.375rem)]";

/*
 * All margins / paddings are INLINE styles on purpose.
 * Your screenshot shows Tailwind's margin/padding classes (mt-*, px-*, mx-auto)
 * are being overridden, most likely by a global reset in index.css such as
 *   * { margin: 0; padding: 0; }
 * Inline styles always win, so the spacing below can't be cancelled.
 */
const S = {
  footer: {
    paddingInline: "clamp(1rem, 4vw, 4rem)",
    paddingTop: "clamp(3rem, 5vw, 6rem)",
    paddingBottom: "max(clamp(2.5rem, 4vw, 4.5rem), env(safe-area-inset-bottom))",
  },
  container: { marginInline: "auto" },
  readyText: { marginBottom: "clamp(1rem, 1.5vw, 1.5rem)" },
  emailInput: {
    paddingInline: "clamp(1.25rem, 2vw, 1.75rem)",
    paddingBlock: "clamp(0.75rem, 1vw, 1rem)",
  },
  startBtn: { paddingInline: "clamp(1.25rem, 2vw, 1.75rem)" },
  questions: { marginTop: "clamp(2.5rem, 5.5vw, 6rem)" },
  links: { marginTop: "clamp(1.75rem, 3vw, 3.25rem)" },
  language: { marginTop: "clamp(2.25rem, 4vw, 4rem)" },
  langBtn: { paddingInline: "clamp(0.75rem, 1vw, 1rem)" },
  country: { marginTop: "clamp(1.5rem, 2.6vw, 2.75rem)" },
  recaptcha: { marginTop: "clamp(1.5rem, 2.4vw, 2.5rem)" },
  disclaimer: { marginTop: "clamp(0.75rem, 1.2vw, 1.25rem)" },
};

export default function Footer() {
  const { language, changeLanguage } = useLanguage();
  const t = translations[language] || translations.en;

  return (
    <footer className="w-full bg-black text-white/70" style={S.footer}>
      {/* Everything in the footer is centered */}
      <div
        style={S.container}
        className="flex w-full max-w-[1200px] flex-col items-center text-center"
      >
        {/* Ready to watch */}
        <div className="flex w-full max-w-[980px] flex-col items-center text-center">
          <p
            style={S.readyText}
            className="text-[clamp(1rem,0.5vw+0.9rem,1.25rem)] font-medium leading-snug text-white"
          >
            {t.footer.ready}
          </p>

          <div className="flex w-full flex-col items-stretch gap-[10px] sm:flex-row">
            <input
              type="email"
              aria-label={t.footer.emailPlaceholder}
              placeholder={t.footer.emailPlaceholder}
              style={S.emailInput}
              className={`${CONTROL_H} w-full min-w-0 flex-1 rounded-[4px] border border-[rgba(128,128,128,0.7)] bg-[#161616]/70 text-left text-[clamp(1rem,0.4vw+0.9rem,1.25rem)] text-white outline-none transition-colors duration-200 placeholder:text-white/70 hover:border-white focus:border-white`}
            />

            <button
              type="button"
              style={S.startBtn}
              className={`${CONTROL_H} group inline-flex w-full shrink-0 items-center justify-center gap-3 whitespace-nowrap rounded-[4px] bg-gradient-to-r from-[#b20bd6] to-[#ff143d] text-[clamp(1.125rem,1vw+0.95rem,1.625rem)] font-medium leading-none text-white transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.98] sm:w-auto sm:min-w-[clamp(10rem,12vw,12.8rem)]`}
            >
              <span className="text-white">{t.footer.getStarted}</span>

              <ChevronRight
                strokeWidth={2.5}
                className="h-5 w-5 shrink-0 text-white transition-transform duration-300 group-hover:translate-x-1 sm:h-6 sm:w-6"
              />
            </button>
          </div>
        </div>

        {/* Questions */}
        <p style={S.questions} className={`${BASE_TEXT} leading-[1.5]`}>
          {t.footer.questions}{" "}
          <a
            href="tel:0008009191743"
            className="whitespace-nowrap underline underline-offset-2 transition-colors duration-200 hover:text-blue-500 focus-visible:text-blue-500 focus-visible:outline-none"
          >
            000-800-919-1743
          </a>
        </p>

        {/* Links: centered grid, each link centered in its column */}
        <ul
          style={S.links}
          className={`grid w-full grid-cols-2 justify-items-center gap-x-6 gap-y-[clamp(1rem,1.6vw,1.75rem)] text-center ${BASE_TEXT} leading-[1.4] sm:grid-cols-3 md:grid-cols-4`}
        >
          {linkKeys.map((key) => (
            <li key={key} className="min-w-0">
              <a
                href="#"
                className="inline-block break-words underline underline-offset-2 transition-colors duration-200 hover:text-blue-500 focus-visible:text-blue-500 focus-visible:outline-none"
              >
                {t.footer.links[key]}
              </a>
            </li>
          ))}
        </ul>

        {/* Language button: text perfectly centered, arrow on the right, no icon.
            3 columns (empty | text | arrow) keep the text in the true middle.
            The real <select> sits invisibly on top so the whole button works. */}
        <div style={S.language} className="flex justify-center">
          <div
            style={S.langBtn}
            className="relative grid h-[clamp(2.5rem,1vw+2.2rem,3rem)] w-[clamp(9rem,8vw+5.5rem,11rem)] grid-cols-[1fr_auto_1fr] items-center rounded-[4px] border border-white/50 bg-black text-white transition-colors duration-200 focus-within:border-white hover:border-white"
          >
            <span aria-hidden="true" />

            <span className="whitespace-nowrap text-center text-[clamp(0.95rem,0.3vw+0.85rem,1.0625rem)] font-medium leading-normal">
              {language === "hi" ? t.language.hindi : t.language.english}
            </span>

            <span
              aria-hidden="true"
              className="h-0 w-0 justify-self-end border-x-[4px] border-t-[5px] border-x-transparent border-t-white"
            />

            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              aria-label={t.language.label}
              style={{ colorScheme: "dark" }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 [&>option]:bg-black [&>option]:text-white"
            >
              <option value="en">{t.language.english}</option>
              <option value="hi">{t.language.hindi}</option>
            </select>
          </div>
        </div>

        {/* Country */}
        <p style={S.country} className={BASE_TEXT}>
          {t.footer.country}
        </p>

        {/* reCAPTCHA */}
        <p
          style={S.recaptcha}
          className="max-w-[650px] text-center text-[clamp(0.75rem,0.2vw+0.7rem,0.875rem)] leading-[1.5] text-[#737373]"
        >
          {t.footer.recaptcha}
        </p>

        {/* Clone disclaimer */}
        <p
          style={S.disclaimer}
          className="max-w-[650px] text-center text-[clamp(0.675rem,0.15vw+0.64rem,0.78rem)] leading-[1.5] text-[#6b6b6b]"
        >
          {t.footer.description}
        </p>
      </div>
    </footer>
  );
}