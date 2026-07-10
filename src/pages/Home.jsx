import Layout from "../components/Layout";
import SearchBar from "../components/SearchBar";
import QuickActions from "../components/QuickActions";
import DailyRecommendation from "../components/DailyRecommendation";
import Categories from "../components/Categories";

import "../styles/Home.css";

function Home() {
  return (
    <Layout title="Romnyi Food">

      <div className="home-page">

        <SearchBar />

        <QuickActions />

        <DailyRecommendation />

        <Categories />

      </div>

    </Layout>
  );
}

export default Home;