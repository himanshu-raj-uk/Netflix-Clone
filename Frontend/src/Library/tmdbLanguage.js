
export const TMDB_LOCALE = { en: "en-US", hi: "hi-IN" };

export function withLanguage(url, language) {
    if (!url) return url;
    const locale = TMDB_LOCALE[language] || TMDB_LOCALE.en;

    const cleaned = url
        .replace(/([?&])language=[^&]*(&|$)/, (_m, p1, p2) => (p2 ? p1 : ""))
        .replace(/[?&]$/, "");

    return `${cleaned}${cleaned.includes("?") ? "&" : "?"}language=${locale}`;
}