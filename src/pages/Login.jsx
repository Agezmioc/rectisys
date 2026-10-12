import { useState } from "react";
import { Link } from "react-router";
import { supabase } from "../supabase/client";
import "./Login.css";

const Login = () => {

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    /*
     * CAMBIO DEL FORMULARIO
     */

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };


    /*
     * LOGIN
     */

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");


        const email = form.email.trim();


        if (!email || !form.password) {

            setError(
                "Email y contraseña son obligatorios."
            );

            return;
        }


        setLoading(true);


        try {

            const {
                data,
                error: loginError
            } = await supabase.auth.signInWithPassword({
                email,
                password: form.password
            });


            if (loginError) {
                throw loginError;
            }


            console.log(
                "LOGIN:",
                data
            );

        } catch (error) {

            console.error(
                "Error al iniciar sesión:",
                error
            );

            setError(
                error.message ||
                "No se pudo iniciar sesión."
            );

        } finally {

            setLoading(false);
        }
    };


    /*
     * RENDER
     */

    return (

        <main className="login">

            <section className="login-card">

                <h1>
                    Iniciar sesión
                </h1>


                <form
                    onSubmit={handleSubmit}
                >

                    <div>

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                        />

                    </div>


                    <div>

                        <label>
                            Contraseña
                        </label>

                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                        />

                    </div>


                    {error && (

                        <p className="login-error">
                            {error}
                        </p>

                    )}


                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Iniciando sesión..."
                            : "Iniciar sesión"
                        }
                    </button>

                    <Link to="/recuperar-contrasena">
                        ¿Olvidaste tu contraseña?
                    </Link>

                </form>

            </section>

        </main>
    );
};

export default Login;