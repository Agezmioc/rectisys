import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {

    const {
        user,
        loading
    } = useAuth();

    if (loading) {
        return <p>Cargando...</p>;
    }

    if (!user) {
        return <Navigate to="/ingresar" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
