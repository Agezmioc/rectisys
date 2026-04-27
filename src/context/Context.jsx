import { createContext, useContext, useState } from "react";
import { supabase } from "../supabase/client";

export const Context = createContext()

export const useData = () => {
    const context = useContext(Context)
    if (!context) throw new Error("useData must be used within a ContextProvider");
    
    return context
}

export const ContextProvider = ({children}) => {
    const [salesQuotes, setSalesQuotes] = useState([]);
    const [loading, setLoading] = useState(false);

    const getSalesQuotes = async () => {
        console.log("getSalesQuotes Start");
        setLoading(true);

        const { data, error } = await supabase
            .from("sales_quotes")
            .select("*");

        if (error) {
            console.error("Error fetching sales quotes:", error);
            setLoading(false);
            return;
        }

        setSalesQuotes(data);

        setLoading(false);
        console.log("getSalesQuotes End");
    };

    return <Context.Provider value={{salesQuotes, getSalesQuotes, loading}}>
        {children}
    </Context.Provider>
}