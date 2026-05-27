import "./Home.css";
import SalesQuotesList from "../components/SalesQuotesList";

const Home = () => {
  return (
    <main className="home">
      <header className="home-header">
        <h1>Presupuestos</h1>
      </header>

      <SalesQuotesList />
    </main>
  );
};

export default Home;