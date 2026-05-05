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
            .select(`
                id,
                account_id,
                data_document_id,
                data_condition_type_id,
                data_tax_position_id,
                motor_id,

                address,
                phone_num,
                reference,
                purchace_order_num,
                list,
                observations,

                date,
                letter,
                point,
                number,
                is_model,

                concept_subtotal,
                concept_discount,
                article_subtotal,
                article_discount,
                general_discount,
                general_recharge,
                general_subtotal,
                general_vat,
                total,

                created_at,
                updated_at,

                data_documents (
                    desc
                ),

                data_accounts (
                    name,
                    tax_num
                ),

                data_conditions_types (
                    desc
                ),

                data_tax_positions (
                    desc
                )
            `);

        if (error) {
            console.error("Error fetching sales quotes:", error);
            setLoading(false);
            return;
        }

        setSalesQuotes(data);

        setLoading(false);
        console.log("getSalesQuotes End");
    };

    const getSalesQuoteItems = async (quoteId) => {
        const { data, error } = await supabase
            .from("sales_quotes_items")
            .select(`
                *,
                stock_articles (
                    code,
                    desc
                )
            `)
            .eq("sales_quote_id", quoteId);

        if (error) {
            console.error(error);
            return [];
        }

        return data;
    };

    const getQuoteDocument = quote =>
    quote.data_documents?.desc || "-";

    const getQuoteAccountName = quote =>
        quote.data_accounts?.name || "-";

    const getQuoteAccountTaxNum = quote =>
        quote.data_accounts?.tax_num || "-";

    const getQuoteCondition = quote =>
        quote.data_conditions_types?.desc || "-";

    const getQuoteTaxPosition = quote =>
        quote.data_tax_positions?.desc || "-";

    const getQuoteFullNumber = quote =>
        `${quote.letter || ""}-${String(quote.point || 0).padStart(4, "0")}-${String(quote.number || 0).padStart(8, "0")}`;

    return <Context.Provider
            value={{
                salesQuotes,
                getSalesQuotes,
                getSalesQuoteItems,
                getQuoteDocument,
                getQuoteAccountName,
                getQuoteAccountTaxNum,
                getQuoteCondition,
                getQuoteTaxPosition,
                getQuoteFullNumber,
                loading
            }}
        >
        {children}
    </Context.Provider>
}