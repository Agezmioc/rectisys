import "./App.css";
import { Routes, Route } from "react-router";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

import Login from "./pages/Login";
import Register from "./pages/Register";
import RecoverPassword from "./pages/RecoverPassword";
import ChangePassword from "./pages/ChangePassword";

import SalesQuotesList from "./components/SalesQuotesList";
import SalesOrdersList from "./components/SalesOrdersList";
import StockArticlesList from "./components/StockArticlesList";
import DataAccountsList from "./components/DataAccountsList";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

import { ContextProvider } from "./context/Context";
import { AuthProvider } from "./context/AuthContext";

function App() {

    return (
        <AuthProvider>

            <ContextProvider>

                <Routes>

                    {/* Rutas públicas para usuarios sin sesión */}

                    <Route element={<PublicRoute />}>

                        <Route
                            path="/ingresar"
                            element={<Login />}
                        />

                        <Route
                            path="/registrarse"
                            element={<Register />}
                        />

                        <Route
                            path="/recuperar-contrasena"
                            element={<RecoverPassword />}
                        />

                    </Route>


                    {/* Cambio de contraseña */}

                    <Route
                        path="/cambiar-contrasena"
                        element={<ChangePassword />}
                    />


                    {/* Rutas privadas */}

                    <Route element={<ProtectedRoute />}>

                        <Route
                            path="/"
                            element={<Home />}
                        >

                            <Route
                                path="presupuestos"
                                element={<SalesQuotesList />}
                            />

                            <Route
                                path="ordenes-trabajo"
                                element={<SalesOrdersList />}
                            />

                            <Route
                                path="articulos"
                                element={<StockArticlesList />}
                            />

                            <Route
                                path="cuentas"
                                element={<DataAccountsList />}
                            />

                        </Route>

                    </Route>


                    {/* 404 */}

                    <Route
                        path="*"
                        element={<NotFound />}
                    />

                </Routes>

            </ContextProvider>

        </AuthProvider>
    );
}

export default App;