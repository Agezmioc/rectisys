import "./Home.css";
import { Link, Outlet } from "react-router";

import { useAuth } from "../context/AuthContext";

const Home = () => {

    const {
        user,
        session,
        profile,
        role,
        loading,
        logout
    } = useAuth();

    console.log("AUTH:", {
        user,
        session,
        profile,
        role,
        loading
    });

    return (
        <main className="home">

            <header className="home-header">

                <Link
                    to="/"
                    className="home-logo"
                >
                    RECTISYS
                </Link>

                <nav className="home-navigation">

                    <Link to="/presupuestos">
                        Presupuestos
                    </Link>

                    <Link to="/ordenes-trabajo">
                        Órdenes de trabajo
                    </Link>

                    <Link to="/articulos">
                        Artículos
                    </Link>

                    <Link to="/cuentas">
                        Cuentas
                    </Link>

                </nav>

                <div className="home-auth">

                    <button onClick={logout}>
                        Cerrar sesión
                    </button>

                </div>

            </header>

            <section className="home-content">
                <Outlet />
            </section>

        </main>
    );
};

export default Home;