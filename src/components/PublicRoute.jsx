import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

const PublicRoute = () => {

    const {
        user,
        loading
    } = useAuth();

    if (loading) {
        return <p>Cargando...</p>;
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PublicRoute;
