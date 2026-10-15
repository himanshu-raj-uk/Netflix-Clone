import { configureStore } from "@reduxjs/toolkit";

import authReducer, { login as loginAction, logout as logoutAction } from "../Redux/authSlice";
import movieReducer from "../Redux/movieSlice";
import userReducer, { setUser, clearUser } from "../Redux/userSlice";
import listsReducer, { LIST_KEYS, syncLists } from "../Redux/ListsSlice";
import { getUser } from "../Library/UserStore";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    movie: movieReducer,
    user: userReducer,
    lists: listsReducer, // liked + watchlist
  },
});

const syncUserToRedux = () => {
  const account = getUser(); // null when logged out
  const { profile } = store.getState().user;

  if (account) {
    if (JSON.stringify(account) !== JSON.stringify(profile)) {
      store.dispatch(setUser(account));
      store.dispatch(loginAction(account));
    }
  } else if (profile) {
    store.dispatch(clearUser());
    store.dispatch(logoutAction());
  }
};

syncUserToRedux(); // load the logged-in user when the app starts

const readRaw = (key) => localStorage.getItem(key) || "[]";

const parseList = (name) => {
  try {
    const v = JSON.parse(readRaw(LIST_KEYS[name]));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

// Redux -> localStorage
const unsubscribe = store.subscribe(() => {
  const { liked, watchlist } = store.getState().lists;
  let changed = false;

  [
    ["liked", liked],
    ["watchlist", watchlist],
  ].forEach(([name, value]) => {
    const json = JSON.stringify(value);
    if (json !== readRaw(LIST_KEYS[name])) {
      localStorage.setItem(LIST_KEYS[name], json);
      changed = true;
    }
  });

  // Tells Profile + Navbar (which listen for this event) to refresh
  if (changed) window.dispatchEvent(new Event("lists-changed"));
});

// localStorage -> Redux (UserStore.toggleList, or another browser tab)
const pullListsFromStorage = () => {
  const next = { liked: parseList("liked"), watchlist: parseList("watchlist") };
  const cur = store.getState().lists;

  if (
    JSON.stringify(next.liked) !== JSON.stringify(cur.liked) ||
    JSON.stringify(next.watchlist) !== JSON.stringify(cur.watchlist)
  ) {
    store.dispatch(syncLists(next));
  }
};

const onStorage = () => {
  pullListsFromStorage();
  syncUserToRedux();
};

window.addEventListener("lists-changed", pullListsFromStorage);
window.addEventListener("auth-changed", syncUserToRedux); // login, logout, profile edit
window.addEventListener("storage", onStorage); // other browser tabs

// Avoid duplicate listeners when Vite hot-reloads this file in development
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unsubscribe();
    window.removeEventListener("lists-changed", pullListsFromStorage);
    window.removeEventListener("auth-changed", syncUserToRedux);
    window.removeEventListener("storage", onStorage);
  });
}