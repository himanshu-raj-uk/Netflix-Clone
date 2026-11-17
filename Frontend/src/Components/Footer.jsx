import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const isLoggedIn = Boolean(localStorage.getItem("userToken"));

  const handleGetStarted = (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) return;

    sessionStorage.setItem("loginEmail", trimmedEmail);

    navigate("/login", {
      state: {
        email: trimmedEmail,
      },
    });
  };

  return (
    <footer className="relative mt-8 w-full border-t border-white/[0.06] bg-[#080B14] px-4 py-8 text-slate-400 sm:mt-12 sm:px-8 sm:py-10 lg:px-14">
      <div className="relative mx-auto flex w-full max-w-[1100px] flex-col items-center text-center">
        {!isLoggedIn && (
          <div className="flex w-full max-w-[760px] flex-col items-center text-center">
            <p className="mb-4 text-base font-semibold leading-7 text-white sm:text-xl">
              {t.footer.ready}
            </p>

            <form
              onSubmit={handleGetStarted}
              className="flex w-full flex-col items-stretch gap-3 sm:flex-row"
            >
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label={t.footer.emailPlaceholder}
                placeholder={t.footer.emailPlaceholder}
                className="box-border h-12 min-h-12 w-full min-w-0 flex-1 rounded-md border border-slate-600 bg-[#111827] px-4 py-0 text-base text-white outline-none transition-colors placeholder:text-slate-400 hover:border-white/25 focus:border-[#22D3EE]"
              />

              <button
                type="submit"
                className="group box-border inline-flex h-12 min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-[#8B5CF6] px-5 py-0 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#7C3AED] active:scale-95 sm:w-[170px]"
              >
                <span>{t.footer.getStarted}</span>
                <ChevronRight
                  strokeWidth={2}
                  className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </button>
            </form>
          </div>
        )}

        <p className="mt-8 text-xs text-slate-400 sm:text-sm">
          {t.footer.questions}{" "}
          <a
            href="tel:0008009191743"
            className="font-medium text-[#22D3EE] underline underline-offset-4 hover:text-white"
          >
            000-800-919-1743
          </a>
        </p>

        <ul className="mt-5 grid w-full grid-cols-2 justify-items-center gap-x-6 gap-y-2.5 text-center text-xs sm:grid-cols-3 md:grid-cols-4">
          {linkKeys.map((key) => (
            <li key={key} className="min-w-0">
              <a
                href="#"
                className="inline-block break-words text-slate-400 underline-offset-2 transition-colors duration-150 hover:text-white hover:underline"
              >
                {t.footer.links[key]}
              </a>
            </li>
          ))}
        </ul>

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
