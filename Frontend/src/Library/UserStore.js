const read = (key, fallback) => {
    try {
        const v = JSON.parse(localStorage.getItem(key));
        return v ?? fallback;
    } catch {
        return fallback;
    }
};

/* ---------- user ---------- */
export function getUser() {
    if (!localStorage.getItem("userToken")) return null;
    const raw = read("user", {}) || {};
    const u = raw?.data?.user || raw?.user || raw;
    return {
        ...u,
        name: u.name || u.fullName || "",
        email: u.email || "",
        profileImage:
            (typeof u.profileImage === "string" ? u.profileImage : u.profileImage?.url) ||
            u.avatar ||
            u.image ||
            "",
    };
}

export function saveUser(patch) {
    const current = getUser() || {};
    const next = { ...current, ...patch };
    localStorage.setItem("user", JSON.stringify(next));
    window.dispatchEvent(new Event("auth-changed"));
    return next;
}

export function logout() {
    ["userToken", "refreshToken", "user", "userInfo", "userData", "profile"].forEach(
        (k) => localStorage.removeItem(k)
    );
    window.dispatchEvent(new Event("auth-changed"));
}

/* ---------- liked + watchlist ---------- */
const KEYS = { liked: "list:liked", watchlist: "list:watchlist" };

export const getList = (name) => read(KEYS[name], []);

export const isInList = (name, id, mediaType = "movie") =>
    getList(name).some((i) => i.id === id && i.mediaType === mediaType);

export function toggleList(name, item) {
    const list = getList(name);
    const exists = list.some((i) => i.id === item.id && i.mediaType === item.mediaType);
    const next = exists
        ? list.filter((i) => !(i.id === item.id && i.mediaType === item.mediaType))
        : [item, ...list];
    localStorage.setItem(KEYS[name], JSON.stringify(next));
    window.dispatchEvent(new Event("lists-changed"));
    return !exists; // true = added
}

export const toListItem = (m, mediaType = m.media_type || "movie") => ({
    id: m.id,
    mediaType,
    title: m.title || m.name || "",
    poster: m.poster_path || "",
    year: (m.release_date || m.first_air_date || "").slice(0, 4),
});