import Navbar from "../Components/Navbar";
import Banner from "../Components/Banner";
import Row from "../Components/Row";
import Footer from "../Components/Footer";
import requests from "../Library/Tmdb";

const ROWS = [
  { title: "Trending Now", url: requests.trending },
  { title: "Netflix Originals", url: requests.netflixOriginals },
  { title: "Top Rated", url: requests.topRated },
  { title: "Action Movies", url: requests.actionMovies },
  { title: "Comedy Movies", url: requests.comedyMovies },
  { title: "Horror Movies", url: requests.horrorMovies },
  { title: "Romance Movies", url: requests.romanceMovies },
  { title: "Documentaries", url: requests.documentaries },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <Banner />

      {/* Normal flow: no negative margin, so rows never cover the banner */}
      <div className="relative z-10 space-y-2 pb-10 pt-6 sm:space-y-4 sm:pt-10 md:pt-12">
        {ROWS.map((row) => (
          <Row key={row.title} title={row.title} fetchUrl={row.url} />
        ))}
      </div>

      <Footer />
    </div>
  );
}