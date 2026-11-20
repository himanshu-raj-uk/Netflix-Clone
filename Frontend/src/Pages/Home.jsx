import Navbar from "../Components/Navbar";
import Banner from "../Components/Banner";
import Row from "../Components/Row";
import Footer from "../Components/Footer";
import requests from "../Library/Tmdb";

const ROWS = [
  { title: "Trending Now", titleKey: "trendingNow", url: requests.trending, isFirstRow: true },
  { title: "Featured Originals", titleKey: "netflixOriginals", url: requests.netflixOriginals },
  { title: "Top Rated Cinema", titleKey: "topRated", url: requests.topRated },
  { title: "Action & Adventure", titleKey: "actionMovies", url: requests.actionMovies },
  { title: "Comedy Hits", titleKey: "comedyMovies", url: requests.comedyMovies },
  { title: "Thrills & Horror", titleKey: "horrorMovies", url: requests.horrorMovies },
  { title: "Romance & Drama", titleKey: "romanceMovies", url: requests.romanceMovies },
  { title: "Documentaries", titleKey: "documentaries", url: requests.documentaries },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#080B14] text-white overflow-hidden">
      {/* Subtle ambient lighting spots across the page */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-[20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#8B5CF6]/[0.04] blur-[140px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-[60%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[#22D3EE]/[0.03] blur-[150px]"
      />

      <Navbar />

      <Banner />

      {/* Rows Container */}
      <div className="relative z-10 space-y-1 pb-1 pt-1 sm:space-y-4 sm:pb-4 sm:pt-3 md:space-y-6 md:pb-6 md:pt-4">
        {ROWS.map((row) => (
          <Row
            key={row.title}
            title={row.title}
            titleKey={row.titleKey}
            fetchUrl={row.url}
            isFirstRow={row.isFirstRow}
          />
        ))}
      </div>

      <Footer />
    </div>
  );
}
