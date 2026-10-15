import { createSlice } from "@reduxjs/toolkit";

// Same localStorage keys as Utils/userStore.js, so both stay compatible.
export const LIST_KEYS = { liked: "list:liked", watchlist: "list:watchlist" };

const read = (name) => {
  try {
    const v = JSON.parse(localStorage.getItem(LIST_KEYS[name]));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const same = (a, b) => a.id === b.id && a.mediaType === b.mediaType;

const listsSlice = createSlice({
  name: "lists",
  initialState: { liked: read("liked"), watchlist: read("watchlist") },
  reducers: {
    // dispatch(toggleItem({ list: "liked", item: toListItem(movie, "movie") }))
    toggleItem(state, { payload: { list, item } }) {
      const exists = state[list].some((i) => same(i, item));
      state[list] = exists
        ? state[list].filter((i) => !same(i, item))
        : [item, ...state[list]];
    },
    removeItem(state, { payload: { list, item } }) {
      state[list] = state[list].filter((i) => !same(i, item));
    },
    // Pulls in changes made through userStore.js or another browser tab
    syncLists(state, { payload }) {
      state.liked = payload.liked;
      state.watchlist = payload.watchlist;
    },
    clearLists(state) {
      state.liked = [];
      state.watchlist = [];
    },
  },
});

export const { toggleItem, removeItem, syncLists, clearLists } = listsSlice.actions;

export const selectLiked = (s) => s.lists.liked;
export const selectWatchlist = (s) => s.lists.watchlist;
export const selectIsInList = (list, id, mediaType = "movie") => (s) =>
  s.lists[list].some((i) => i.id === id && i.mediaType === mediaType);

export default listsSlice.reducer;