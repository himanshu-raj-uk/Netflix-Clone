import { createSlice } from "@reduxjs/toolkit";

const movieSlice = createSlice({
  name: "movie",

  initialState: {
    movies: [],
    trending: [],
    netflixOriginals: [],
    topRated: [],
    actionMovies: [],
    comedyMovies: [],
    horrorMovies: [],
    romanceMovies: [],
    documentaries: [],
    selectedMovie: null,
    loading: false,
    error: null,
  },

  reducers: {
    setMovies: (state, action) => {
      state.movies = action.payload;
    },

    setTrending: (state, action) => {
      state.trending = action.payload;
    },

    setNetflixOriginals: (state, action) => {
      state.netflixOriginals = action.payload;
    },

    setTopRated: (state, action) => {
      state.topRated = action.payload;
    },

    setActionMovies: (state, action) => {
      state.actionMovies = action.payload;
    },

    setComedyMovies: (state, action) => {
      state.comedyMovies = action.payload;
    },

    setHorrorMovies: (state, action) => {
      state.horrorMovies = action.payload;
    },

    setRomanceMovies: (state, action) => {
      state.romanceMovies = action.payload;
    },

    setDocumentaries: (state, action) => {
      state.documentaries = action.payload;
    },

    setSelectedMovie: (state, action) => {
      state.selectedMovie = action.payload;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },

    clearMovies: (state) => {
      state.movies = [];
      state.selectedMovie = null;
      state.error = null;
    },
  },
});

export const {
  setMovies,
  setTrending,
  setNetflixOriginals,
  setTopRated,
  setActionMovies,
  setComedyMovies,
  setHorrorMovies,
  setRomanceMovies,
  setDocumentaries,
  setSelectedMovie,
  setLoading,
  setError,
  clearMovies,
} = movieSlice.actions;

export default movieSlice.reducer;