import { useState } from "react";
import { supabase } from "../supabase/client";
import "./Register.css";

const Register = () => {

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirm_password: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
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
     * REGISTRO
     */

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");


        const firstName = form.first_name.trim();
        const lastName = form.last_name.trim();
        const email = form.email.trim();


        /*
         * VALIDACIONES
         */

        if (!firstName || !lastName || !email || !form.password) {

            setError(
                "Todos los campos son obligatorios."
            );

            return;
        }


        if (form.password !== form.confirm_password) {

            setError(
                "Las contraseñas no coinciden."
            );

            return;
        }


        setLoading(true);


        try {

            /*
             * CREAR USUARIO EN AUTH
             */

            const {
                data: authData,
                error: authError
            } = await supabase.auth.signUp({
                email,
                password: form.password
            });


            if (authError) {
                throw authError;
            }


            if (!authData.user) {

                throw new Error(
                    "No se pudo obtener el usuario creado."
                );
            }


            /*
             * BUSCAR ROL USER
             */

            const {
                data: role,
                error: roleError
            } = await supabase
                .from("roles")
                .select("id")
                .eq("name", "User")
                .single();


            if (roleError) {
                throw roleError;
            }


            /*
             * CREAR PROFILE
             */

            const {
                error: profileError
            } = await supabase
                .from("profiles")
                .insert({
                    id: authData.user.id,
                    first_name: firstName,
                    last_name: lastName,
                    role_id: role.id
                });


            if (profileError) {
                throw profileError;
            }


            /*
             * REGISTRO COMPLETADO
             */

            if (authData.session) {

                setSuccess(
                    "Cuenta creada correctamente."
                );

            } else {

                setSuccess(
                    "Cuenta creada correctamente. Revisá tu correo para confirmar la cuenta."
                );
            }


            setForm({
                first_name: "",
                last_name: "",
                email: "",
                password: "",
                confirm_password: ""
            });

        } catch (error) {

            console.error(
                "Error al registrar usuario:",
                error
            );

            setError(
                error.message ||
                "No se pudo crear la cuenta."
            );

        } finally {

            setLoading(false);
        }
    };


    /*
     * RENDER
     */

    return (

        <main className="register">

            <section className="register-card">

                <h1>
                    Crear cuenta
                </h1>


                <form
                    onSubmit={handleSubmit}
                >

                    <div>

                        <label>
                            Nombre
                        </label>

                        <input
                            type="text"
                            name="first_name"
                            value={form.first_name}
                            onChange={handleChange}
                            autoComplete="given-name"
                        />

                    </div>


                    <div>

                        <label>
                            Apellido
                        </label>

                        <input
                            type="text"
                            name="last_name"
                            value={form.last_name}
                            onChange={handleChange}
                            autoComplete="family-name"
                        />

                    </div>


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
                            autoComplete="new-password"
                        />

                    </div>


                    <div>

                        <label>
                            Confirmar contraseña
                        </label>

                        <input
                            type="password"
                            name="confirm_password"
                            value={form.confirm_password}
                            onChange={handleChange}
                            autoComplete="new-password"
                        />

                    </div>


                    {error && (

                        <p className="register-error">
                            {error}
                        </p>

                    )}


                    {success && (

                        <p className="register-success">
                            {success}
                        </p>

                    )}


                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Creando cuenta..."
                            : "Crear cuenta"
                        }
                    </button>

                </form>

            </section>

        </main>
    );
};

export default Register;