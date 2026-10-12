import { useState } from "react";
import { Link } from "react-router";
import { supabase } from "../supabase/client";
import "./RecoverPassword.css";

const RecoverPassword = () => {

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        const cleanEmail = email.trim();

        if (!cleanEmail) {
            setError("Ingresá tu email.");
            return;
        }

        setLoading(true);

        try {

            console.log("REDIRECT:", window.location.origin);

            const {
                error: resetError
            } = await supabase.auth.resetPasswordForEmail(
                cleanEmail,
                {
                    redirectTo:
                        `${window.location.origin}/cambiar-contrasena`
                }
            );

            if (resetError) {
                throw resetError;
            }

            setSuccess(
                "Si existe una cuenta asociada a ese email, recibirás un correo para restablecer tu contraseña."
            );

            setEmail("");

        } catch (error) {

            console.error(
                "Error al solicitar recuperación de contraseña:",
                error
            );

            setError(
                error.message ||
                "No se pudo solicitar la recuperación de contraseña."
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <main className="recover-password">

            <section className="recover-password-card">

                <h1>Recuperar contraseña</h1>

                <p>
                    Ingresá el email asociado a tu cuenta.
                </p>

                <form onSubmit={handleSubmit}>

                    <div>

                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />

                    </div>

                    {error && (
                        <p className="recover-password-error">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p className="recover-password-success">
                            {success}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Enviando..."
                            : "Enviar correo"
                        }
                    </button>

                </form>

                <Link to="/ingresar">
                    Volver a iniciar sesión
                </Link>

            </section>

        </main>
    );
};

export default RecoverPassword;
