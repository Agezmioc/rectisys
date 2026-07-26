import { createContext, useContext, useEffect, useState } from "react";
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
    const [dataAccounts, setDataAccounts] = useState([]);
    const [dataDocuments, setDataDocuments] = useState([]);
    const [dataConditionsTypes, setDataConditionsTypes] = useState([]);
    const [dataTaxPositions, setDataTaxPositions] = useState([]);
    const [stockMotors, setStockMotors] = useState([]);
    const [stockLists, setStockLists] = useState([]);
    const [dataVatTypes, setDataVatTypes] = useState([]);
    const [dataSequences, setDataSequences] = useState([]);


    const createSalesQuote = async (quoteData, items = []) => {
        console.log("createSalesQuote Start");
        console.log("tax_num:", quoteData.tax_num);
        console.log(quoteData);
        console.log(items);

        setLoading(true);

        const { data: sequenceData, error: sequenceError } = await supabase.rpc(
            "next_document_number",
            {
                p_document_id: quoteData.data_document_id
            }
        );

        if (sequenceError) {
            console.error("Error generating document number:", sequenceError);
            setLoading(false);
            return null;
        }

        if (!sequenceData?.length) {
            console.error("Document has no associated sequence.");
            setLoading(false);
            return null;
        }

        const { letter, point, number } = sequenceData[0];

        quoteData = {
            ...quoteData,
            letter,
            point,
            number,
        };

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
                tax_num,

                data_documents (
                    desc
                ),

                data_accounts (
                    name
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

    const getStockArticles = async ({
        isConcept,
        searchField = "desc",
        searchQuery = ""
    }) => {
        let query = supabase
            .from("stock_articles")
            .select("*")
            .eq("is_concept", isConcept)
            .order("id");

        if (searchQuery) {
            switch (searchField) {
                case "id":
                    query = query.eq("id", Number(searchQuery));
                    break;

                case "code":
                    query = query.ilike("code", `%${searchQuery}%`);
                    break;

                default:
                    query = query.ilike("desc", `%${searchQuery}%`);
            }
        }

        const { data: articles, error } = await query;

        if (error) {
            console.error(error);
            return [];
        }

        if (articles.length === 0)
            return [];

        const articleIds = articles.map(a => a.id);

        const { data: prices, error: pricesError } = await supabase
            .from("stock_prices")
            .select("*")
            .in("article_id", articleIds);

        if (pricesError) {
            console.error(pricesError);
            return articles;
        }

        const pricesMap = new Map();

        for (const p of prices) {
            if (!pricesMap.has(p.article_id))
                pricesMap.set(p.article_id, []);

            pricesMap.get(p.article_id).push(p);
        }

        return articles.map(article => ({
            ...article,
            prices: pricesMap.get(article.id) ?? []
        }));
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
            .select("*");

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

    // const getStockPrices = async (articleIds = []) => {
    //     if (!articleIds.length) return [];

    //     const { data, error } = await supabase
    //         .from("stock_prices")
    //         .select("*")
    //         .in("article_id", articleIds);

    //     if (error) {
    //         console.error("Error fetching stock prices:", error);
    //         return [];
    //     }

    //     return data;
    // };

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

    const getDataSequences = async () => {
        const { data, error } = await supabase
            .from("data_sequences")
            .select("*")
            .order("id");

        if (error) {
            console.error(error);
            return [];
        }

        setDataSequences(data);
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

    const clearTempArticles = async () => {
        const { error } = await supabase
            .from("temp_articles")
            .delete()
            .neq("id", 0);

        if (error) {
            console.error(error);
            return false;
        }

        return true;
    };

    const uploadTempArticles = async (records) => {
        const ok = await clearTempArticles();

        if (!ok) return false;

        const { error } = await supabase
            .from("temp_articles")
            .insert(records);

        if (error) {
            console.error(error);
            return false;
        }

        return true;
    };

    const processTempArticles = async () => {

        const { data: tempArticles, error: tempError } =
            await supabase
                .from("temp_articles")
                .select("*");

        if (tempError) {
            console.error(tempError);
            return null;
        }

        const { data: stockCategories, error: categoriesError } =
            await supabase
                .from("stock_categories")
                .select("*");

        if (categoriesError) {
            console.error(categoriesError);
            return null;
        }

        const categoryMap = new Map(
            stockCategories.map(c => [
                c.desc?.trim(),
                c
            ])
        );

        const { data: parameters, error: parametersError } =
            await supabase
                .from("data_parameters")
                .select("provider_account_id")
                .eq("id", 2)
                .single();

        if (parametersError) {
            console.error(parametersError);
            return null;
        }

        const providerAccountId = parameters.provider_account_id;

        let inserted = 0;
        let updated = 0;

        for (const temp of tempArticles) {
            const categoryCode = temp.code.substring(0, 4).trim();

            let category =
                categoryMap.get(categoryCode);

            if (!category) {

                const { data: newCategory, error: categoryError } =
                    await supabase
                        .from("stock_categories")
                        .insert([{
                            desc: categoryCode,
                            created_at: new Date().toISOString()
                        }])
                        .select()
                        .single();

                if (categoryError) {
                    console.error(categoryError);
                    continue;
                }

                category = newCategory;

                categoryMap.set(
                    categoryCode,
                    newCategory
                );
            }

            const { data: existingArticle, error: articleSearchError } =
                await supabase
                    .from("stock_articles")
                    .select("*")
                    .eq("code", temp.code)
                    .eq("account_id", providerAccountId)
                    .maybeSingle();

            if (articleSearchError) {
                console.error(articleSearchError);
                continue;
            }

            if (!existingArticle) {

                const { data: newArticle, error: articleError } =
                    await supabase
                        .from("stock_articles")
                        .insert([{
                            code: temp.code,
                            measure: temp.measure,
                            desc: temp.desc,

                            is_concept: false,

                            stock: 0,
                            min: 0,
                            max: 0,

                            account_id: providerAccountId,
                            category_id: category.id,

                            class_id: 1,

                            vat_type_id: 1,

                            is_disabled: false,

                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }])
                        .select()
                        .single();

                if (articleError) {
                    console.error(articleError);
                    continue;
                }

                await supabase
                    .from("stock_prices")
                    .insert([{
                        article_id: newArticle.id,
                        list_id: 0,

                        cost: temp.price,
                        margin: 50,
                        price: temp.price*1.5,

                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }]);

                inserted++;

                continue;
            }

            await supabase
                .from("stock_articles")
                .update({
                    measure: temp.measure,
                    desc: temp.desc,
                    account_id: providerAccountId,
                    category_id: category.id,
                    updated_at: new Date().toISOString()
                })
                .eq("id", existingArticle.id);

            const { data: existingPrice, error: priceError } =
                await supabase
                    .from("stock_prices")
                    .select("*")
                    .eq("article_id", existingArticle.id)
                    .eq("list_id", 0)
                    .maybeSingle();

            if (priceError) {
                console.error(priceError);
                continue;
            }

            if (existingPrice) {

                await supabase
                    .from("stock_prices")
                    .update({
                        cost: temp.price,
                        margin: 50,
                        price: temp.price * 1.5,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", existingPrice.id);

            } else {

                await supabase
                    .from("stock_prices")
                    .insert([{
                        article_id: existingArticle.id,
                        list_id: 0,

                        cost: temp.price,
                        margin: 50,
                        price: temp.price * 1.5,

                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }]);

            }

            updated++;
        }

        return {
            total: tempArticles.length,
            inserted,
            updated
        };
    };

    const processTempConcepts = async () => {

        const { data: tempArticles, error } =
            await supabase
                .from("temp_articles")
                .select("*");

        if (error) {
            console.error(error);
            return null;
        }

        const { data: parameters, error: parametersError } =
            await supabase
                .from("data_parameters")
                .select("provider_account_id")
                .eq("id", 1)
                .single();

        if (parametersError) {
            console.error(parametersError);
            return null;
        }

        const providerAccountId = parameters.provider_account_id;

        let inserted = 0;
        let updated = 0;

        for (const temp of tempArticles) {

            if (
                !temp.code ||
                !temp.desc ||
                !temp.list_prices
            ) {
                continue;
            }

            const {
                data: existingArticle,
                error: articleSearchError
            } = await supabase
                .from("stock_articles")
                .select("*")
                .eq("is_concept", true)
                .eq("code", temp.code)
                .eq("account_id", providerAccountId)
                .maybeSingle();

            if (articleSearchError) {
                console.error(articleSearchError);
                continue;
            }

            let articleId;

            if (!existingArticle) {

                const { data: newArticle, error: articleError } =
                    await supabase
                        .from("stock_articles")
                        .insert([{
                            code: temp.code,
                            measure: null,
                            desc: temp.desc,

                            is_concept: true,

                            stock: 0,
                            min: 0,
                            max: 0,

                            account_id: providerAccountId,
                            category_id: 1,
                            class_id: 2,

                            vat_type_id: 1,

                            is_disabled: false,

                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }])
                        .select()
                        .single();

                if (articleError) {
                    console.error(articleError);
                    continue;
                }

                articleId = newArticle.id;

                inserted++;

            } else {

                articleId = existingArticle.id;

                await supabase
                    .from("stock_articles")
                    .update({
                        desc: temp.desc,
                        account_id: providerAccountId,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", articleId);

                updated++;
            }

            const { data: articlePrices, error: pricesError } =
                await supabase
                    .from("stock_prices")
                    .select("id, article_id, list_id")
                    .eq("article_id", articleId);

            if (pricesError) {
                console.error(pricesError);
                continue;
            }

            for (const [listId, price] of Object.entries(temp.list_prices)) {

                const existingPrice = articlePrices.find(
                    p => Number(p.list_id) === Number(listId)
                );

                if (existingPrice) {

                    await supabase
                        .from("stock_prices")
                        .update({
                            cost: price,
                            price,
                            updated_at: new Date().toISOString()
                        })
                        .eq("id", existingPrice.id);

                } else {

                    await supabase
                        .from("stock_prices")
                        .insert([{
                            article_id: articleId,

                            list_id: Number(listId),

                            cost: price,
                            margin: 0,
                            price,

                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }]);
                }
            }
        }

        return {
            total: tempArticles.length,
            inserted,
            updated
        };
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

    useEffect(() => {
        const init = async () => {
            await Promise.all([
                getDataAccounts(),
                getDataDocuments(),
                getDataConditionsTypes(),
                getDataTaxPositions(),
                getStockMotors(),
                getStockLists()
            ]);
        };

        init();
    }, []);

    return <Context.Provider
            value={{
                createSalesQuote,
                salesQuotes,
                getSalesQuotes,
                getSalesQuoteItems,
                getStockArticles,
                dataAccounts,
                dataDocuments,
                dataConditionsTypes,
                dataTaxPositions,
                stockMotors,
                stockLists,
                dataVatTypes,
                dataSequences,
                getDataVatTypes,
                getDataAccounts,
                getDataDocuments,
                getDataConditionsTypes,
                getDataTaxPositions,
                getStockMotors,
                getStockLists,
                // getStockPrices,
                getDataSequences,
                deleteSalesQuote,
                updateSalesQuote,
                clearTempArticles,
                uploadTempArticles,
                processTempArticles,
                processTempConcepts,
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