const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE = "https://api.themoviedb.org/3";

const requests = {
  trending: `${BASE}/trending/all/week?api_key=${API_KEY}`,

  netflixOriginals: `${BASE}/discover/tv?api_key=${API_KEY}&with_networks=213`,

  topRated: `${BASE}/movie/top_rated?api_key=${API_KEY}`,

  actionMovies: `${BASE}/discover/movie?api_key=${API_KEY}&with_genres=28`,

  comedyMovies: `${BASE}/discover/movie?api_key=${API_KEY}&with_genres=35`,

  horrorMovies: `${BASE}/discover/movie?api_key=${API_KEY}&with_genres=27`,

  romanceMovies: `${BASE}/discover/movie?api_key=${API_KEY}&with_genres=10749`,

  documentaries: `${BASE}/discover/movie?api_key=${API_KEY}&with_genres=99`,

  trailers: (movieId, mediaType = "movie") =>
    `${BASE}/${mediaType}/${movieId}/videos?api_key=${API_KEY}&language=en-US`,

  // Used by the Navbar search (movies, series and people)
  search: (query) =>
    `${BASE}/search/multi?api_key=${API_KEY}&include_adult=false&query=${encodeURIComponent(
      query
    )}`,
};

// Poster / profile image URL. Sizes: w92, w185, w342, w500, original
export const img = (path, size = "w342") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : "";

// Multi search with abort support
export async function searchMulti(query, signal) {
  const res = await fetch(requests.search(query), { signal });
  if (!res.ok) throw new Error("TMDB search failed");
  const data = await res.json();
  return data.results || [];
}

export default requests;