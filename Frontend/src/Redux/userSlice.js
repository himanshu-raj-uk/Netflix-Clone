import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  profile: null,
  watchlist: [],
  favorites: [],
  recentlyWatched: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,

  reducers: {
    setUser: (state, action) => {
      state.profile = action.payload;
    },

    clearUser: (state) => {
      state.profile = null;
      state.watchlist = [];
      state.favorites = [];
      state.recentlyWatched = [];
    },

    addToWatchlist: (state, action) => {
      state.watchlist.push(action.payload);
    },

    removeFromWatchlist: (state, action) => {
      state.watchlist = state.watchlist.filter(
        (movie) => movie.id !== action.payload
      );
    },

    addToFavorites: (state, action) => {
      state.favorites.push(action.payload);
    },

    removeFromFavorites: (state, action) => {
      state.favorites = state.favorites.filter(
        (movie) => movie.id !== action.payload
      );
    },

    addRecentlyWatched: (state, action) => {
      state.recentlyWatched.unshift(action.payload);

      if (state.recentlyWatched.length > 20) {
        state.recentlyWatched.pop();
      }
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setUser,
  clearUser,
  addToWatchlist,
  removeFromWatchlist,
  addToFavorites,
  removeFromFavorites,
  addRecentlyWatched,
  setLoading,
  setError,
} = userSlice.actions;

export default userSlice.reducer;