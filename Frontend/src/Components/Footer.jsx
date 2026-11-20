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
    <footer className="relative mt-2 sm:mt-10 md:mt-12 w-full border-t border-white/[0.08] bg-[#080B14] px-4 py-6 sm:px-8 sm:py-12 md:px-12 lg:px-16 text-slate-400">
      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col items-start text-left">
        {!isLoggedIn && (
          <div className="mx-auto mb-5 sm:mb-10 flex w-full max-w-[800px] flex-col items-center text-center">
            <p className="mb-2.5 sm:mb-4 text-sm font-semibold leading-relaxed text-white sm:text-xl md:text-2xl">
              {t.footer.ready}
            </p>

            <form
              onSubmit={handleGetStarted}
              className="flex w-full flex-col items-stretch gap-2 sm:gap-3 sm:flex-row"
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
                className="box-border h-11 min-h-11 sm:h-14 sm:min-h-14 w-full min-w-0 flex-1 rounded-md border border-slate-600 bg-[#111827] px-4 text-xs sm:text-base text-white outline-none transition-colors placeholder:text-slate-400 hover:border-white/30 focus:border-[#22D3EE]"
              />

              <button
                type="submit"
                className="group box-border inline-flex h-11 min-h-11 sm:h-14 sm:min-h-14 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-[#8B5CF6] px-5 sm:px-6 text-xs sm:text-base font-semibold text-white transition-colors duration-200 hover:bg-[#7C3AED] active:scale-95 sm:w-auto sm:min-w-[180px]"
              >
                <span>{t.footer.getStarted}</span>
                <ChevronRight
                  strokeWidth={2}
                  className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                />
              </button>
            </form>
          </div>
        )}

        <p className="text-xs sm:text-base font-medium text-slate-400">
          {t.footer.questions}{" "}
          <a
            href="tel:0008009191743"
            className="font-medium text-[#22D3EE] underline underline-offset-4 hover:text-white transition-colors"
          >
            000-800-919-1743
          </a>
        </p>

        <ul className="my-3.5 sm:my-7 grid w-full grid-cols-2 gap-x-4 sm:gap-x-8 md:gap-x-10 gap-y-2 sm:gap-y-3.5 text-left text-xs sm:text-sm md:grid-cols-4">
          {linkKeys.map((key) => (
            <li key={key} className="min-w-0">
              <a
                href="#"
                className="inline-block break-words text-slate-400 underline-offset-4 transition-colors duration-200 hover:text-white hover:underline"
              >
                {t.footer.links[key]}
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-3 sm:mt-4 flex justify-start">
          <div className="relative flex h-8 sm:h-10 w-32 sm:w-36 items-center justify-between rounded-md border border-white/20 bg-[#111827] px-3 sm:px-3.5 text-slate-200 transition-colors hover:border-white/40">
            <span className="text-xs sm:text-sm font-medium">
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

        <p className="mt-3.5 sm:mt-6 text-xs sm:text-sm font-medium text-slate-500">
          {t.footer.country}
        </p>

        <p className="mt-1.5 sm:mt-2.5 max-w-[900px] text-[11px] leading-relaxed text-slate-500 sm:text-[13px]">
          {t.footer.description}
        </p>
      </div>
    </footer>
  );
}
