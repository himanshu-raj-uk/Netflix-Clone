import { useEffect, useState } from "react";
import requests from "../Library/Tmdb";

// Fetches a list of movies / shows from TMDB.
//
//   const { movies, loading, error } = useMovies(requests.trending);
//   const { movies } = useMovies("trending");   // a key of `requests` also works
export default function useMovies(source) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const url =
      typeof source === "string" && source.startsWith("http")
        ? source
        : typeof requests[source] === "string"
        ? requests[source]
        : "";

    if (!url) {
      setMovies([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load titles.");
        return res.json();
      })
      .then((data) => setMovies(data.results || []))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message || "Could not load titles.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [source]);

  return { movies, data: movies, loading, error };
}