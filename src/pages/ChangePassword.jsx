import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../supabase/client";
import "./ChangePassword.css";

const ChangePassword = () => {

    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (!password || !confirmPassword) {
            setError("Todos los campos son obligatorios.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);

        try {

            const {
                error: updateError
            } = await supabase.auth.updateUser({
                password
            });

            if (updateError) {
                throw updateError;
            }

            setSuccess(
                "Contraseña actualizada correctamente."
            );

            setTimeout(() => {
                navigate("/");
            }, 1500);

        } catch (error) {

            console.error(
                "Error al cambiar la contraseña:",
                error
            );

            setError(
                error.message ||
                "No se pudo cambiar la contraseña."
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <main className="change-password">

            <section className="change-password-card">

                <h1>Cambiar contraseña</h1>

                <form onSubmit={handleSubmit}>

                    <div>

                        <label htmlFor="password">
                            Nueva contraseña
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                        />

                    </div>

                    <div>

                        <label htmlFor="confirm-password">
                            Confirmar contraseña
                        </label>

                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                        />

                    </div>

                    {error && (
                        <p className="change-password-error">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p className="change-password-success">
                            {success}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Guardando..."
                            : "Cambiar contraseña"
                        }
                    </button>

                </form>

            </section>

        </main>
    );
};

export default ChangePassword;
