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
    const [stockArticles, setStockArticles] = useState([]);
    const [dataAccounts, setDataAccounts] = useState([]);
    const [dataDocuments, setDataDocuments] = useState([]);
    const [dataConditionsTypes, setDataConditionsTypes] = useState([]);
    const [dataTaxPositions, setDataTaxPositions] = useState([]);
    const [stockMotors, setStockMotors] = useState([]);
    const [stockLists, setStockLists] = useState([]);
    const [stockPrices, setStockPrices] = useState([]);
    const [dataVatTypes, setDataVatTypes] = useState([]);


    const createSalesQuote = async (quoteData, items = []) => {
        console.log("createSalesQuote Start");
        console.log(quoteData);
        console.log(items);

        setLoading(true);

        const { data: quote, error: quoteError } = await supabase
            .from("sales_quotes")
            .insert([quoteData])
            .select()
            .single();

        if (quoteError) {
            console.error("Error creating sales quote:", quoteError);
            setLoading(false);
            return null;
        }

        if (items.length > 0) {
            // eslint-disable-next-line no-unused-vars
            const formattedItems = items.map(item => ({
                stock_art_id: item.stock_art_id === "" ? null : Number(item.stock_art_id),
                is_concept: item.is_concept,
                quantity: item.quantity === "" ? 0 : Number(item.quantity),
                price: item.price === "" ? 0 : Number(item.price),
                vat_value: item.vat_value === "" ? 0 : Number(item.vat_value),
                total: item.total === "" ? 0 : Number(item.total),
                comment: item.comment ?? "",
                sales_quote_id: quote.id
            }));

            const { error: itemsError } = await supabase
                .from("sales_quotes_items")
                .insert(formattedItems);

            if (itemsError) {
                console.error("Error creating sales quote items:", itemsError);
                setLoading(false);
                return null;
            }
        }

        await getSalesQuotes();

        setLoading(false);

        console.log("createSalesQuote End");

        return quote;
    };

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
                ),

                stock_motors (
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
        if (quoteId === undefined || quoteId === null) {
            return []; 
        }
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

    const getStockArticles = async () => {
        const { data, error } = await supabase
            .from("stock_articles")
            .select("*");

        if (error) {
            console.error("Error fetching stock articles:", error);
            return;
        }

        setStockArticles(data);
    };

    const getDataAccounts = async () => {
        const { data, error } = await supabase
            .from("data_accounts")
            .select(`
                id,
                name,
                tax_num,
                address,
                phone_num,
                tax_position_id
            `);

        if (error) {
            console.error("Error loading accounts:", error);
            return;
        }

        setDataAccounts(data || []);
    };

    const getDataDocuments = async () => {
        const { data, error } = await supabase
            .from("data_documents")
            .select("id, desc");

        if (error) {
            console.error("Error loading documents:", error);
            return;
        }

        setDataDocuments(data || []);
    };

    const getDataConditionsTypes = async () => {
        const { data, error } = await supabase
            .from("data_conditions_types")
            .select("id, desc");

        if (error) {
            console.error("Error loading conditions types:", error);
            return;
        }

        setDataConditionsTypes(data || []);
    };

    const getDataTaxPositions = async () => {
        const { data, error } = await supabase
            .from("data_tax_positions")
            .select("id, desc, vat_included");

        if (error) {
            console.error("Error loading tax positions:", error);
            return;
        }

        setDataTaxPositions(data || []);
    };

    const getStockMotors = async () => {
        const { data, error } = await supabase
            .from("stock_motors")
            .select("id, desc, list_id");

        if (error) {
            console.error("Error loading motors:", error);
            return;
        }

        setStockMotors(data || []);
    };

    const getStockLists = async () => {
        const { data, error } = await supabase
            .from("stock_lists")
            .select("*")
            .order("id", { ascending: true });

        if (error) {
            console.error("Error loading stock lists:", error);
            return [];
        }

        setStockLists(data || []);

        return data;
    };

    const getStockPrices = async () => {
        const limit = 1000;
        let from = 0;
        let all = [];

        while (true) {
            const { data, error } = await supabase
                .from("stock_prices")
                .select("*")
                .order("id", { ascending: true })
                .range(from, from + limit - 1);

            if (error) {
                console.error(error);
                break;
            }

            if (!data?.length) break;

            all.push(...data);

            if (data.length < limit) break;

            from += limit;
        }

        console.log("📦 RAW SUPABASE STOCK PRICES:", all.length);
        console.log("📦 LIST IDS FROM SUPABASE:", [
            ...new Set(all.map(p => p.list_id))
        ]);
        
        setStockPrices(all);
        return all;
    };

    const getDataVatTypes = async () => {
        const { data, error } = await supabase
            .from("data_vat_types")
            .select("*")
            .order("id");

        if (error) {
            console.error(error);
            return [];
        }

        setDataVatTypes(data);
        return data;
    };

    const updateSalesQuote = async (id, quoteData, items = []) => {
        console.log("updateSalesQuote Start");
        console.log(quoteData);
        console.log(items);

        setLoading(true);

        const { data: quote, error: quoteError } = await supabase
            .from("sales_quotes")
            .update(quoteData)
            .eq("id", id)
            .select()
            .single();

        if (quoteError) {
            console.error("Error updating sales quote:", quoteError);
            setLoading(false);
            return null;
        }

        const { error: deleteItemsError } = await supabase
            .from("sales_quotes_items")
            .delete()
            .eq("sales_quote_id", id);

        if (deleteItemsError) {
            console.error("Error deleting old items:", deleteItemsError);
            setLoading(false);
            return null;
        }

        if (items.length > 0) {
            const filteredItem = (item) => ({
                stock_art_id: item.stock_art_id,
                is_concept: item.is_concept,
                quantity: item.quantity,
                price: item.price,
                vat_value: item.vat_value,
                total: item.total,
                comment: item.comment,
            });

            const formattedItems = items.map(item => ({
                ...filteredItem(item),
                sales_quote_id: id
            }));

            const { error: itemsError } = await supabase
                .from("sales_quotes_items")
                .insert(formattedItems);

            if (itemsError) {
                console.error("Error inserting updated items:", itemsError);
                setLoading(false);
                return null;
            }
        }

        await getSalesQuotes();

        setLoading(false);

        console.log("updateSalesQuote End");

        return quote;
    };

    const deleteSalesQuote = async (quoteId) => {
        console.log("deleteSalesQuote Start");

        setLoading(true);

        const { error: itemsError } = await supabase
            .from("sales_quotes_items")
            .delete()
            .eq("sales_quote_id", quoteId);

        if (itemsError) {
            console.error("Error deleting sales quote items:", itemsError);
            setLoading(false);
            return false;
        }

        const { error: quoteError } = await supabase
            .from("sales_quotes")
            .delete()
            .eq("id", quoteId);

        if (quoteError) {
            console.error("Error deleting sales quote:", quoteError);
            setLoading(false);
            return false;
        }

        await getSalesQuotes();

        setLoading(false);

        console.log("deleteSalesQuote End");

        return true;
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
                createSalesQuote,
                salesQuotes,
                getSalesQuotes,
                getSalesQuoteItems,
                stockArticles,
                getStockArticles,
                dataAccounts,
                dataDocuments,
                dataConditionsTypes,
                dataTaxPositions,
                stockMotors,
                stockLists,
                stockPrices,
                dataVatTypes,
                getDataVatTypes,
                getDataAccounts,
                getDataDocuments,
                getDataConditionsTypes,
                getDataTaxPositions,
                getStockMotors,
                getStockLists,
                getStockPrices,
                deleteSalesQuote,
                updateSalesQuote,
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