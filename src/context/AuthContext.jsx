import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase/client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = async (userId) => {

        const {
            data,
            error
        } = await supabase
            .from("profiles")
            .select(`
                id,
                first_name,
                last_name,
                role_id,
                roles (
                    id,
                    name
                )
            `)
            .eq("id", userId)
            .single();

        if (error) {
            console.error(
                "Error al cargar perfil:",
                error
            );

            setProfile(null);
            setRole(null);

            return;
        }

        setProfile(data);
        setRole(data.roles);
    };

    useEffect(() => {

        const getSession = async () => {

            const {
                data: { session }
            } = await supabase.auth.getSession();

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                await loadProfile(session.user.id);
            }

            setLoading(false);
        };

        getSession();

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange(
            (event, session) => {

                setSession(session);
                setUser(session?.user ?? null);

                if (event === "SIGNED_IN" && session?.user) {

                    setTimeout(() => {
                        loadProfile(session.user.id);
                    }, 0);

                }

                if (event === "SIGNED_OUT") {
                    setProfile(null);
                    setRole(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };

    }, []);

    const logout = async () => {

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error(
                "Error al cerrar sesión:",
                error
            );

            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                profile,
                role,
                loading,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};