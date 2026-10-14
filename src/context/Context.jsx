import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { useAuth } from "./AuthContext";

export const Context = createContext()

export const useData = () => {
    const context = useContext(Context)
    if (!context) throw new Error("useData must be used within a ContextProvider");

    return context
}

export const ContextProvider = ({children}) => {
    const { user, loading: authLoading } = useAuth();
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
    const [salesOrders, setSalesOrders] = useState([]);
    const [salesSections, setSalesSections] = useState([]);
    const [stockCategories, setStockCategories] = useState([]);
    const [stockClasses, setStockClasses] = useState([]);


    const getArgentinaNow = () => {
        return new Intl.DateTimeFormat("sv-SE", {
            timeZone: "America/Argentina/Buenos_Aires",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23"
        }).format(new Date()).replace(" ", "T");
    };
    const now = getArgentinaNow();


    const createSalesQuote = async (quoteData, items = []) => {
        console.log("createSalesQuote Start");
        console.log("tax_num:", quoteData.tax_num);
        console.log(quoteData);
        console.log(items);

        setLoading(true);

        const userId = await getAuthenticatedUserId();

        if (!userId) {
            setLoading(false);
            return null;
        }

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
            user_id: userId
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
                completed: 0,
                price: item.price === "" ? 0 : Number(item.price),
                vat_value: item.vat_value === "" ? 0 : Number(item.vat_value),
                total: item.total === "" ? 0 : Number(item.total),
                comment: item.comment ?? "",
                sales_quote_id: quote.id,

                created_at: now,
                updated_at: now
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
                name,
                email,
                district,

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
        searchQuery = "",
        articleIds = []
    }) => {
        let query = supabase
            .from("stock_articles")
            .select(`
                *,
                data_accounts ( id, name ),
                stock_categories ( id, desc ),
                stock_classes ( id, desc ),
                data_vat_types ( id, desc )
            `)
            .order("id");

        // Si se proporcionan IDs, buscamos solamente esos artículos
        if (articleIds.length > 0) {
            query = query.in("id", articleIds);
        } else {
            // Comportamiento original de ArticleSelector
            if (isConcept !== undefined && isConcept !== null) {
                query = query.eq("is_concept", isConcept);
            }

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
        }

        const { data: articles, error } = await query;

        if (error) {
            console.error(error);
            return [];
        }

        if (articles.length === 0)
            return [];

        
        const articleIdsToSearch = articles.map(a => a.id);

        const prices = [];
        const batchSize = 200;
        const pageSize = 1000;

        // Consultamos los precios en lotes para evitar URLs demasiado largas.
        for (let i = 0; i < articleIdsToSearch.length; i += batchSize) {
            const idsBatch = articleIdsToSearch.slice(i, i + batchSize);

            // Paginamos por si un lote devuelve más de 1000 precios.
            for (let offset = 0; ; offset += pageSize) {
                const {
                    data: pagePrices,
                    error: pricesError
                } = await supabase
                    .from("stock_prices")
                    .select("*")
                    .in("article_id", idsBatch)
                    .range(offset, offset + pageSize - 1);

                if (pricesError) {
                    console.error("Error al obtener precios de artículos:", pricesError);
                    return articles;
                }

                prices.push(...pagePrices);

                if (pagePrices.length < pageSize) {
                    break;
                }
            }
        }

        const pricesMap = new Map();

        for (const p of prices) {
            if (!pricesMap.has(p.article_id)) {
                pricesMap.set(p.article_id, []);
            }

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
                code,
                name,
                email,
                address,
                district,
                localy,
                phone_num,
                tax_position_id,
                discount,
                tax_num,
                balance,
                is_client,
                is_provider,
                is_disabled,
                created_at,
                updated_at,
                tax_num_2
            `)
            .order("id");

        if (error) {
            console.error("Error loading accounts:", error);
            return [];
        }

        setDataAccounts(data || []);

        return data || [];
    };

    const createDataAccount = async (accountData) => {

        const now = getArgentinaNow();

        const {
            data,
            error
        } = await supabase
            .from("data_accounts")
            .insert({
                ...accountData,
                created_at: now,
                updated_at: now
            })
            .select()
            .single();

        if (error) {
            console.error("Error al crear cuenta:", error);
            return null;
        }

        return data;
    };

    const updateDataAccount = async (
        accountId,
        accountData
    ) => {

        const now = getArgentinaNow();

        const {
            data,
            error
        } = await supabase
            .from("data_accounts")
            .update({
                ...accountData,
                updated_at: now
            })
            .eq("id", accountId)
            .select()
            .single();

        if (error) {
            console.error("Error al actualizar cuenta:", error);
            return null;
        }

        return data;
    };

    const deleteDataAccount = async (accountId) => {

        const { error } = await supabase
            .from("data_accounts")
            .delete()
            .eq("id", accountId);

        if (error) {

            if (error.code === "23503") {

                console.error(
                    "No se puede eliminar la cuenta porque está siendo utilizada por otro registro:",
                    error
                );

                return false;
            }

            console.error(
                "Error al eliminar cuenta:",
                error
            );

            return false;
        }

        return true;
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

        const userId = await getAuthenticatedUserId();

        if (!userId) {
            setLoading(false);
            return null;
        }

        const { data: quote, error: quoteError } = await supabase
            .from("sales_quotes")
            .update({
                ...quoteData,
                user_id: userId
            })
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
                sales_quote_id: id,

                created_at:
                    item.created_at || now,

                updated_at:
                    now
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

    const getSalesOrders = async () => {
        const { data, error } = await supabase
            .from("sales_orders")
            .select(`
                *,
                data_accounts (
                    name
                ),
                data_documents (
                    desc
                ),
                stock_motors (
                    desc
                )
            `)
            .order("id", { ascending: false });

        if (error) {
            console.error("Error fetching sales orders:", error);
            return;
        }

        setSalesOrders(data || []);
    };

    const getSalesOrderItems = async (salesOrderId) => {

        const {
            data,
            error
        } = await supabase
            .from("sales_orders_items")
            .select(`
                *,
                stock_articles (
                    code,
                    desc
                ),
                sales_sections (
                    name,
                    order
                )
            `)
            .eq("sales_order_id", salesOrderId)
            .order("id", { ascending: true });


        if (error) {

            console.error(
                "Error fetching sales order items:",
                error
            );

            return [];
        }


        const items = data || [];


        /*
        * Obtener los IDs de los items que provienen
        * de presupuestos.
        */

        const originItemIds = items
            .filter(
                item =>
                    item.origin_item_id != null
            )
            .map(
                item =>
                    Number(item.origin_item_id)
            );


        /*
        * Si ningún item tiene origen,
        * no hay nada que reconstruir.
        */

        if (originItemIds.length === 0) {
            return items;
        }


        /*
        * Obtener los items originales del presupuesto.
        */

        const {
            data: quoteItems,
            error: quoteItemsError
        } = await supabase
            .from("sales_quotes_items")
            .select(`
                id,
                sales_quote_id,
                quantity,
                completed
            `)
            .in("id", originItemIds);


        if (quoteItemsError) {

            console.error(
                "Error fetching origin quote items:",
                quoteItemsError
            );

            return items;
        }


        /*
        * Indexar los items del presupuesto
        * por su ID.
        */

        const quoteItemsMap = new Map(
            (quoteItems || []).map(
                item => [
                    Number(item.id),
                    item
                ]
            )
        );


        /*
        * Reconstruir la información necesaria
        * para edición.
        */

        return items.map(item => {

            if (item.origin_item_id == null) {
                return item;
            }


            const quoteItem =
                quoteItemsMap.get(
                    Number(item.origin_item_id)
                );


            if (!quoteItem) {
                return item;
            }


            const currentOrderQuantity =
                Number(item.quantity) || 0;

            const quoteQuantity =
                Number(quoteItem.quantity) || 0;

            const quoteCompleted =
                Number(quoteItem.completed) || 0;


            /*
            * completed incluye la cantidad de esta OT.
            *
            * Por lo tanto, para saber cuánto puede
            * tener esta OT, debemos devolverle su
            * propia cantidad al cálculo.
            */

            const importedQuantity =
                Math.max(
                    0,
                    quoteQuantity -
                    quoteCompleted +
                    currentOrderQuantity
                );


            return {

                ...item,

                imported_quantity:
                    importedQuantity,

                origin_quote_id:
                    quoteItem.sales_quote_id

            };

        });

    };

    const getSalesSections = async () => {

        const { data, error } = await supabase
            .from("sales_sections")
            .select("*")
            .order("order", { ascending: true });

        if (error) {
            console.error(
                "Error fetching sales sections:",
                error
            );

            return;
        }

        setSalesSections(data || []);
    };

    const createSalesOrder = async (
        orderData,
        items = [],
        originQuoteId = null
    ) => {

        console.log("createSalesOrder Start");

        setLoading(true);

        try {

            const userId = await getAuthenticatedUserId();

            if (!userId) {
                return null;
            }

            /*
            * Obtener numeración del documento
            */

            const { data: sequenceData, error: sequenceError } =
                await supabase.rpc(
                    "next_document_number",
                    {
                        p_document_id:
                            orderData.data_document_id
                    }
                );

            if (sequenceError) {

                console.error(
                    "Error generating document number:",
                    sequenceError
                );

                return null;
            }

            if (!sequenceData?.length) {

                console.error(
                    "Document has no associated sequence."
                );

                return null;
            }

            const {
                letter,
                point,
                number
            } = sequenceData[0];

            console.log("DATA TO INSERT:", {
                ...orderData,
                letter,
                point,
                number
            });


            /*
            * Crear cabecera
            */

            const {
                data: order,
                error: orderError
            } = await supabase
                .from("sales_orders")
                .insert([{
                    ...orderData,
                    letter,
                    point,
                    number,
                    user_id: userId
                }])
                .select()
                .single();

            if (orderError) {

                console.error(
                    "Error creating sales order:",
                    orderError
                );

                return null;
            }


            /*
            * Crear items
            */

            if (items.length > 0) {

                const formattedItems =
                    items.map(item => ({

                        sales_order_id:
                            order.id,

                        stock_art_id:
                            item.stock_art_id === "" ||
                            item.stock_art_id == null
                                ? null
                                : Number(item.stock_art_id),

                        origin_id:
                            item.origin_id != null
                                ? Number(item.origin_id)
                                : null,

                        origin_document_number:
                            item.origin_document_number || null,

                        origin_document_id:
                            item.origin_document_id != null
                                ? Number(item.origin_document_id)
                                : null,

                        origin_item_id:
                            item.origin_item_id != null
                                ? Number(item.origin_item_id)
                                : null,

                        sales_section_id:
                            item.sales_section_id
                                ? Number(
                                    item.sales_section_id
                                )
                                : null,

                        is_concept:
                            Boolean(item.is_concept),

                        quantity:
                            Number(item.quantity) || 0,

                        completed:
                            Number(item.completed) || 0,

                        cancelled:
                            Number(item.cancelled) || 0,

                        price:
                            Number(item.price) || 0,

                        vat_value:
                            Number(item.vat_value) || 0,

                        total:
                            Number(item.total) || 0,

                        comment:
                            item.comment ?? "",

                        created_at: now,
                        updated_at: now

                    }));


                const {
                    error: itemsError
                } = await supabase
                    .from("sales_orders_items")
                    .insert(formattedItems);

                if (itemsError) {

                    console.error(
                        "Error creating sales order items:",
                        itemsError
                    );

                    /*
                    * Si falló la creación de items,
                    * eliminamos la cabecera para no
                    * dejar una orden incompleta.
                    */

                    await supabase
                        .from("sales_orders")
                        .delete()
                        .eq("id", order.id);

                    return null;
                }
            }


            /*
            * Actualizar completed del presupuesto
            *
            * Solamente los items que provienen
            * de un presupuesto.
            */

            const importedItems =
                items.filter(
                    item =>
                        item.origin_item_id != null
                );


            for (const item of importedItems) {

                const quoteItemId =
                    Number(item.origin_item_id);

                const quantity =
                    Number(item.quantity) || 0;


                /*
                * Obtener valor actual de completed
                */

                const {
                    data: quoteItem,
                    error: quoteItemError
                } = await supabase
                    .from("sales_quotes_items")
                    .select("id, quantity, completed")
                    .eq("id", quoteItemId)
                    .single();


                if (quoteItemError) {

                    console.error(
                        "Error fetching source quote item:",
                        quoteItemError
                    );

                    return null;
                }


                const currentCompleted =
                    Number(quoteItem.completed) || 0;


                const newCompleted =
                    currentCompleted + quantity;


                /*
                * Evitar superar la cantidad
                * original del presupuesto.
                */

                const maxQuantity =
                    Number(quoteItem.quantity) || 0;

                const pendingQuantity =
                    maxQuantity - currentCompleted;

                if (quantity > pendingQuantity) {

                    console.error(
                        `La cantidad solicitada (${quantity}) supera la cantidad pendiente (${pendingQuantity}) del item ${quoteItemId}.`
                    );

                    return null;
                }

                const finalCompleted =
                    newCompleted;


                const {
                    error: updateQuoteItemError
                } = await supabase
                    .from("sales_quotes_items")
                    .update({
                        completed:
                            finalCompleted
                    })
                    .eq(
                        "id",
                        quoteItemId
                    );


                if (updateQuoteItemError) {

                    console.error(
                        "Error updating quote item completed:",
                        updateQuoteItemError
                    );

                    return null;
                }
            }

            if (originQuoteId != null) {

                const {
                    data: quoteItems,
                    error: quoteItemsError
                } = await supabase
                    .from("sales_quotes_items")
                    .select("quantity, completed")
                    .eq(
                        "sales_quote_id",
                        Number(originQuoteId)
                    );


                if (quoteItemsError) {

                    console.error(
                        "Error fetching quote items for state update:",
                        quoteItemsError
                    );

                    return null;
                }


                const allCompleted =
                    quoteItems.every(
                        item =>
                            Number(item.completed) >=
                            Number(item.quantity)
                    );


                const salesStateId =
                    allCompleted
                        ? 5
                        : 4;


                const {
                    error: updateQuoteStateError
                } = await supabase
                    .from("sales_quotes")
                    .update({
                        sales_state_id:
                            salesStateId
                    })
                    .eq(
                        "id",
                        Number(originQuoteId)
                    );


                if (updateQuoteStateError) {

                    console.error(
                        "Error updating sales quote state:",
                        updateQuoteStateError
                    );

                    return null;
                }
            }


            await getSalesOrders();


            console.log("createSalesOrder End");

            return order;

        } finally {

            setLoading(false);

        }
    };

    const updateSalesOrder = async (
        id,
        orderData,
        items = [],
        originQuoteId = null
    ) => {

        console.log("updateSalesOrder Start");
        console.log(orderData);
        console.log(items);

        setLoading(true);

        try {

            const userId = await getAuthenticatedUserId();

            if (!userId) {
                return null;
            }


            const {
                data: currentOrder,
                error: currentOrderError
            } = await supabase
                .from("sales_orders")
                .select("is_closed, closing_date")
                .eq("id", id)
                .single();

            if (currentOrderError) {
                console.error(
                    "Error fetching current sales order:",
                    currentOrderError
                );
                return null;
            }


            /*
            * 1. Obtener los items actuales de la orden
            */

            const {
                data: oldItems,
                error: oldItemsError
            } = await supabase
                .from("sales_orders_items")
                .select(`
                    id,
                    quantity,
                    origin_item_id
                `)
                .eq(
                    "sales_order_id",
                    id
                );


            if (oldItemsError) {

                console.error(
                    "Error fetching old sales order items:",
                    oldItemsError
                );

                return null;
            }


            /*
            * 2. Revertir impacto anterior
            * sobre el presupuesto
            */

            const oldImportedItems =
                (oldItems || []).filter(
                    item =>
                        item.origin_item_id != null
                );


            for (const item of oldImportedItems) {

                const quoteItemId =
                    Number(
                        item.origin_item_id
                    );

                const oldQuantity =
                    Number(item.quantity) || 0;


                const {
                    data: quoteItem,
                    error: quoteItemError
                } = await supabase
                    .from("sales_quotes_items")
                    .select(
                        "id, completed"
                    )
                    .eq(
                        "id",
                        quoteItemId
                    )
                    .single();


                if (quoteItemError) {

                    console.error(
                        "Error fetching quote item:",
                        quoteItemError
                    );

                    return null;
                }


                const currentCompleted =
                    Number(
                        quoteItem.completed
                    ) || 0;


                const newCompleted =
                    Math.max(
                        0,
                        currentCompleted -
                        oldQuantity
                    );


                const {
                    error: updateError
                } = await supabase
                    .from("sales_quotes_items")
                    .update({
                        completed:
                            newCompleted
                    })
                    .eq(
                        "id",
                        quoteItemId
                    );


                if (updateError) {

                    console.error(
                        "Error reverting quote item:",
                        updateError
                    );

                    return null;
                }
            }


            /*
            * 3. Actualizar cabecera
            */

            const wasClosed =
                currentOrder.is_closed === true ||
                currentOrder.is_closed === "true" ||
                currentOrder.is_closed === 1 ||
                currentOrder.is_closed === "1";

            const willBeClosed =
                orderData.is_closed === true ||
                orderData.is_closed === "true" ||
                orderData.is_closed === 1 ||
                orderData.is_closed === "1";

            const updateData = {
                ...orderData,
                user_id: userId,

                closing_date: willBeClosed
                    ? (
                        wasClosed
                            ? currentOrder.closing_date
                            : new Date().toISOString()
                    )
                    : null
            };

            const {
                data: order,
                error: orderError
            } = await supabase
                .from("sales_orders")
                .update(updateData)
                .eq("id", id)
                .select()
                .single();

            if (orderError) {
                console.error(
                    "Error updating sales order:",
                    orderError
                );
                return null;
            }



            /*
            * 4. Eliminar items anteriores
            */

            const {
                error: deleteItemsError
            } = await supabase
                .from("sales_orders_items")
                .delete()
                .eq(
                    "sales_order_id",
                    id
                );


            if (deleteItemsError) {

                console.error(
                    "Error deleting old sales order items:",
                    deleteItemsError
                );

                return null;
            }


            /*
            * 5. Insertar nuevos items
            */

            if (items.length > 0) {

                const formattedItems =
                    items.map(item => ({

                        sales_order_id:
                            id,

                        stock_art_id:
                            item.stock_art_id === "" ||
                            item.stock_art_id == null
                                ? null
                                : Number(item.stock_art_id),

                        origin_item_id:
                            item.origin_item_id
                                ? Number(
                                    item.origin_item_id
                                )
                                : null,

                        sales_section_id:
                            item.sales_section_id
                                ? Number(
                                    item.sales_section_id
                                )
                                : null,

                        is_concept:
                            Boolean(item.is_concept),

                        quantity:
                            Number(item.quantity) || 0,

                        completed:
                            Number(item.completed) || 0,

                        cancelled:
                            Number(item.cancelled) || 0,

                        price:
                            Number(item.price) || 0,

                        vat_value:
                            Number(item.vat_value) || 0,

                        total:
                            Number(item.total) || 0,

                        comment:
                            item.comment ?? "",

                        created_at:
                            item.created_at || now,

                        updated_at:
                            now

                    }));


                const {
                    error: insertItemsError
                } = await supabase
                    .from("sales_orders_items")
                    .insert(formattedItems);


                if (insertItemsError) {

                    console.error(
                        "Error inserting updated sales order items:",
                        insertItemsError
                    );

                    return null;
                }
            }


            /*
            * 6. Aplicar nuevamente el impacto
            * de los nuevos items sobre el presupuesto
            */

            const newImportedItems =
                items.filter(
                    item =>
                        item.origin_item_id != null
                );


            for (const item of newImportedItems) {

                const quoteItemId =
                    Number(
                        item.origin_item_id
                    );

                const quantity =
                    Number(item.quantity) || 0;


                const {
                    data: quoteItem,
                    error: quoteItemError
                } = await supabase
                    .from("sales_quotes_items")
                    .select(
                        "id, quantity, completed"
                    )
                    .eq(
                        "id",
                        quoteItemId
                    )
                    .single();


                if (quoteItemError) {

                    console.error(
                        "Error fetching quote item:",
                        quoteItemError
                    );

                    return null;
                }


                const currentCompleted =
                    Number(
                        quoteItem.completed
                    ) || 0;

                const maxQuantity =
                    Number(
                        quoteItem.quantity
                    ) || 0;

                const pendingQuantity =
                    maxQuantity - currentCompleted;

                if (quantity > pendingQuantity) {

                    console.error(
                        `La cantidad solicitada (${quantity}) supera la cantidad pendiente (${pendingQuantity}) del item ${quoteItemId}.`
                    );

                    return null;
                }

                const finalCompleted =
                    currentCompleted + quantity;


                const {
                    error: updateQuoteError
                } = await supabase
                    .from("sales_quotes_items")
                    .update({
                        completed:
                            finalCompleted
                    })
                    .eq(
                        "id",
                        quoteItemId
                    );


                if (updateQuoteError) {

                    console.error(
                        "Error updating quote item:",
                        updateQuoteError
                    );

                    return null;
                }
            }

            /*
            * Actualizar estado del presupuesto de origen
            */

            if (originQuoteId != null) {

                const {
                    data: quoteItems,
                    error: quoteItemsError
                } = await supabase
                    .from("sales_quotes_items")
                    .select("quantity, completed")
                    .eq(
                        "sales_quote_id",
                        Number(originQuoteId)
                    );


                if (quoteItemsError) {

                    console.error(
                        "Error fetching quote items for state update:",
                        quoteItemsError
                    );

                    return null;
                }


                const allCompleted =
                    quoteItems.every(
                        item =>
                            Number(item.completed) >=
                            Number(item.quantity)
                    );


                const salesStateId =
                    allCompleted
                        ? 5
                        : 4;


                const {
                    error: updateQuoteStateError
                } = await supabase
                    .from("sales_quotes")
                    .update({
                        sales_state_id:
                            salesStateId
                    })
                    .eq(
                        "id",
                        Number(originQuoteId)
                    );


                if (updateQuoteStateError) {

                    console.error(
                        "Error updating sales quote state:",
                        updateQuoteStateError
                    );

                    return null;
                }
            }


            /*
            * 7. Refrescar órdenes
            */

            await getSalesOrders();


            console.log("updateSalesOrder End");

            return order;

        } finally {

            setLoading(false);

        }
    };

    const deleteSalesOrder = async (orderId) => {

        console.log("deleteSalesOrder Start");

        setLoading(true);

        const { error: itemsError } = await supabase
            .from("sales_orders_items")
            .delete()
            .eq("sales_order_id", orderId);

        if (itemsError) {

            console.error(
                "Error deleting sales order items:",
                itemsError
            );

            setLoading(false);

            return false;
        }

        const { error: orderError } = await supabase
            .from("sales_orders")
            .delete()
            .eq("id", orderId);

        if (orderError) {

            console.error(
                "Error deleting sales order:",
                orderError
            );

            setLoading(false);

            return false;
        }

        await getSalesOrders();

        setLoading(false);

        console.log("deleteSalesOrder End");

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

        // Conservar únicamente la última aparición de cada código.
        const uniqueRecordsMap = new Map();

        for (const record of records) {
            uniqueRecordsMap.set(record.code, record);
        }

        const uniqueRecords = [...uniqueRecordsMap.values()];

        console.log("Registros originales:", records.length);
        console.log("Registros únicos:", uniqueRecords.length);
        console.log(
            "Duplicados descartados:",
            records.length - uniqueRecords.length
        );

        const CHUNK_SIZE = 1000;

        for (let i = 0; i < uniqueRecords.length; i += CHUNK_SIZE) {
            const chunk = uniqueRecords.slice(i, i + CHUNK_SIZE);

            const { error } = await supabase
                .from("temp_articles")
                .insert(chunk);

            if (error) {
                console.error(error);
                return false;
            }
        }

        return true;
    };

    const processTempArticles = async (onProgress = () => {}) => {

        const batchSize = 1000;

        let categoryOffset = 0;
        let tempOffset = 0;

        let inserted = 0;
        let updated = 0;
        let total = 0;

        const categoryMap = new Map();

        const { count, error: countError } = await supabase
            .from("temp_articles")
            .select("*", { count: "exact", head: true });

        if (countError) {
            console.error(countError);
            return null;
        }

        const totalRecords = count;

        let processed = 0;

        while (true) {

            const { data, error } = await supabase
                .from("stock_categories")
                .select("*")
                .range(
                    categoryOffset,
                    categoryOffset + batchSize - 1
                );

            if (error) {
                console.error(error);
                return null;
            }

            if (!data.length)
                break;

            data.forEach(category => {
                categoryMap.set(
                    category.desc?.trim(),
                    category
                );
            });

            categoryOffset += batchSize;
        }

        const providerAccountId =
            await getProviderAccountId(2);

        if (!providerAccountId)
            return null;

        while (true) {

            const {
                data: tempArticles,
                error: tempError
            } = await supabase
                .from("temp_articles")
                .select("*")
                .range(
                    tempOffset,
                    tempOffset + batchSize - 1
                );

            if (tempError) {
                console.error(tempError);
                return null;
            }

            if (!tempArticles.length)
                break;

            total += tempArticles.length;

            const codes =
                tempArticles.map(article => article.code);

            const existingArticles =
                await loadExistingArticlesByCodes(
                    codes,
                    providerAccountId,
                    { isConcept: false }
                );

            if (!existingArticles)
                return null;

            const articleMap = new Map();

            existingArticles.forEach(article => {
                articleMap.set(article.code, article);
            });

            const articleIds =
                existingArticles.map(article => article.id);

            const existingPrices =
                await loadExistingPricesByArticleIds(
                    articleIds,
                    { listId: 0 }
                );

            if (!existingPrices)
                return null;

            const priceMap = new Map();

            existingPrices.forEach(price => {
                priceMap.set(price.article_id, price);
            });

            const categoriesToInsert = [];

            const articlesToInsert = [];
            const articlesToUpdate = [];

            const pricesToInsert = [];
            const pricesToUpdate = [];
            const pendingPrices = [];

            const pendingCategories = new Set();

            for (const temp of tempArticles) {
                const categoryCode = temp.code.substring(0, 4).trim();

                if (
                    !categoryMap.has(categoryCode) &&
                    !pendingCategories.has(categoryCode)
                ) {
                    pendingCategories.add(categoryCode);

                    categoriesToInsert.push({
                        desc: categoryCode,
                        created_at: now
                    });
                }
            }

            if (categoriesToInsert.length > 0) {

                const { data: newCategories, error } = await supabase
                    .from("stock_categories")
                    .insert(categoriesToInsert)
                    .select();

                if (error) {
                    console.error(error);
                    return null;
                }

                newCategories.forEach(category => {
                    categoryMap.set(category.desc.trim(), category);
                });
            }

            for (const temp of tempArticles) {
                const categoryCode = temp.code.substring(0, 4).trim();

                const category =
                    categoryMap.get(categoryCode);

                const existingArticle =
                    articleMap.get(temp.code);

                if (!existingArticle) {

                    articlesToInsert.push({
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

                        created_at: now,
                        updated_at: now
                    });

                    pendingPrices.push({
                        code: temp.code,
                        cost: temp.price
                    });

                    inserted++;
                    continue;
                }

                const articleChanged =
                    existingArticle.measure !== temp.measure ||
                    existingArticle.desc !== temp.desc ||
                    existingArticle.category_id !== category.id ||
                    existingArticle.account_id !== providerAccountId;

                if (articleChanged) {

                    articlesToUpdate.push({
                        id: existingArticle.id,
                        measure: temp.measure,
                        desc: temp.desc,
                        account_id: providerAccountId,
                        category_id: category.id,
                        updated_at: now
                    });

                    updated++;

                    existingArticle.measure = temp.measure;
                    existingArticle.desc = temp.desc;
                    existingArticle.category_id = category.id;
                    existingArticle.account_id = providerAccountId;
                }

                const existingPrice =
                    priceMap.get(existingArticle.id);

                if (existingPrice) {

                    const newPrice = temp.price * 1.5;

                    const priceChanged =
                        existingPrice.cost !== temp.price ||
                        existingPrice.margin !== 50 ||
                        Number(existingPrice.price) !== newPrice;

                    if (priceChanged) {

                        pricesToUpdate.push({
                            id: existingPrice.id,
                            cost: temp.price,
                            margin: 50,
                            price: newPrice,
                            updated_at: now
                        });

                    }

                } else {
                    pricesToInsert.push({
                        article_id: existingArticle.id,
                        list_id: 0,
                        cost: temp.price,
                        margin: 50,
                        price: temp.price * 1.5,
                        created_at: now,
                        updated_at: now
                    })
                }
            }

            if (articlesToInsert.length > 0) {
                const { data: newArticles, error } =
                    await supabase
                        .from("stock_articles")
                        .insert(articlesToInsert)
                        .select();

                if (error) {
                    console.error(error);
                    return null;
                }

                const newArticleMap = new Map();

                newArticles.forEach(article => {
                    newArticleMap.set(article.code, article.id);
                });

                for (const item of pendingPrices) {
                    const articleId = newArticleMap.get(item.code);

                    if (!articleId) {
                        console.error("No se encontró el artículo", item.code);
                        continue;
                    }

                    pricesToInsert.push({
                        article_id: articleId,
                        list_id: 0,
                        cost: item.cost,
                        margin: 50,
                        price: item.cost * 1.5,
                        created_at: now,
                        updated_at: now
                    });

                }
            }

            if (articlesToUpdate.length > 0) {

                const { error } = await supabase
                    .from("stock_articles")
                    .upsert(articlesToUpdate, {
                        onConflict: "id"
                    });

                if (error) {
                    console.error(error);
                    return null;
                }

            }

            if (pricesToUpdate.length > 0) {

                const { error } = await supabase
                    .from("stock_prices")
                    .upsert(pricesToUpdate, {
                        onConflict: "id"
                    });

                if (error) {
                    console.error(error);
                    return null;
                }

            }

            if (pricesToInsert.length > 0) {

                const { error } = await supabase
                    .from("stock_prices")
                    .insert(pricesToInsert);

                if (error) {
                    console.error(error);
                    return null;
                }

            }

            processed += tempArticles.length;

            onProgress({
                processed,
                total: totalRecords,
                percent: Math.round(processed * 100 / totalRecords)
            });

            tempOffset += batchSize;
        }

        return {
            total,
            inserted,
            updated
        };
    };

    const processTempConcepts = async () => {

        const batchSize = 1000;

        let tempOffset = 0;

        let inserted = 0;
        let updated = 0;
        let total = 0;

        const providerAccountId =
            await getProviderAccountId(1);

        if (!providerAccountId)
            return null;

        while (true) {

            const {
                data: tempArticles,
                error: tempError
            } = await supabase
                .from("temp_articles")
                .select("*")
                .range(
                    tempOffset,
                    tempOffset + batchSize - 1
                );

            if (tempError) {
                console.error(tempError);
                return null;
            }

            if (!tempArticles.length)
                break;

            total += tempArticles.length;

            const codes =
                tempArticles.map(article => article.code);

            const existingArticles =
                await loadExistingArticlesByCodes(
                    codes,
                    providerAccountId,
                    { isConcept: true }
                );

            if (!existingArticles)
                return null;

            const articleMap = new Map();

            existingArticles.forEach(article => {
                articleMap.set(article.code, article);
            });

            const articleIds =
                existingArticles.map(article => article.id);

            const existingPrices =
                await loadExistingPricesByArticleIds(
                    articleIds
                );

            if (!existingPrices)
                return null;

            const priceMap = new Map();

            existingPrices.forEach(price => {

                priceMap.set(
                    `${price.article_id}-${price.list_id}`,
                    price
                );

            });

            const articlesToInsert = [];
            const articlesToUpdate = [];

            const pricesToInsert = [];
            const pricesToUpdate = [];

            const pendingPrices = [];

            for (const temp of tempArticles) {

                if (
                    !temp.code ||
                    !temp.desc ||
                    !temp.list_prices
                ) {
                    continue;
                }

                const existingArticle =
                    articleMap.get(temp.code);

                if (!existingArticle) {

                    articlesToInsert.push({
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

                        created_at: now,
                        updated_at: now
                    });

                    pendingPrices.push({
                        code: temp.code,
                        listPrices: temp.list_prices
                    });

                    inserted++;

                    continue;
                }

                const articleChanged =
                    existingArticle.desc !== temp.desc ||
                    existingArticle.account_id !== providerAccountId;

                if (articleChanged) {

                    articlesToUpdate.push({
                        id: existingArticle.id,
                        desc: temp.desc,
                        account_id: providerAccountId,
                        updated_at: now
                    });

                    existingArticle.desc = temp.desc;
                    existingArticle.account_id = providerAccountId;

                    updated++;
                }

                const articleId =
                    existingArticle.id;

                for (
                    const [listId, rawPrice]
                    of Object.entries(temp.list_prices)
                ) {

                    const numericListId =
                        Number(listId);

                    const numericPrice =
                        Number(rawPrice);

                    const priceKey =
                        `${articleId}-${numericListId}`;

                    const existingPrice =
                        priceMap.get(priceKey);

                    if (existingPrice) {

                        const priceChanged =
                            Number(existingPrice.cost) !== numericPrice ||
                            Number(existingPrice.price) !== numericPrice ||
                            Number(existingPrice.margin) !== 0;

                        if (priceChanged) {

                            pricesToUpdate.push({
                                id: existingPrice.id,
                                cost: numericPrice,
                                margin: 0,
                                price: numericPrice,
                                updated_at: now
                            });
                        }

                        continue;
                    }

                    pricesToInsert.push({
                        article_id: articleId,
                        list_id: numericListId,

                        cost: numericPrice,
                        margin: 0,
                        price: numericPrice,

                        created_at: now,
                        updated_at: now
                    });

                    priceMap.set(priceKey, {
                        article_id: articleId,
                        list_id: numericListId,
                        cost: numericPrice,
                        margin: 0,
                        price: numericPrice
                    });
                }
            }

            if (articlesToInsert.length > 0) {

                const {
                    data: newArticles,
                    error
                } = await supabase
                    .from("stock_articles")
                    .insert(articlesToInsert)
                    .select();

                if (error) {
                    console.error(error);
                    return null;
                }

                const newArticleMap = new Map();

                newArticles.forEach(article => {

                    newArticleMap.set(
                        article.code,
                        article.id
                    );

                });

                for (const item of pendingPrices) {

                    const articleId =
                        newArticleMap.get(item.code);

                    if (!articleId) {

                        console.error(
                            "No se encontró el artículo",
                            item.code
                        );

                        continue;
                    }

                    for (
                        const [listId, rawPrice]
                        of Object.entries(item.listPrices)
                    ) {

                        const numericListId =
                            Number(listId);

                        const numericPrice =
                            Number(rawPrice);

                        pricesToInsert.push({
                            article_id: articleId,
                            list_id: numericListId,

                            cost: numericPrice,
                            margin: 0,
                            price: numericPrice,

                            created_at: now,
                            updated_at: now
                        });
                    }
                }
            }

            if (articlesToUpdate.length > 0) {

                const { error } =
                    await supabase
                        .from("stock_articles")
                        .upsert(
                            articlesToUpdate,
                            {
                                onConflict: "id"
                            }
                        );

                if (error) {
                    console.error(error);
                    return null;
                }
            }

            if (pricesToUpdate.length > 0) {

                const { error } =
                    await supabase
                        .from("stock_prices")
                        .upsert(
                            pricesToUpdate,
                            {
                                onConflict: "id"
                            }
                        );

                if (error) {
                    console.error(error);
                    return null;
                }
            }

            if (pricesToInsert.length > 0) {

                const { error } =
                    await supabase
                        .from("stock_prices")
                        .insert(pricesToInsert);

                if (error) {
                    console.error(error);
                    return null;
                }
            }

            tempOffset += batchSize;
        }

        return {
            total,
            inserted,
            updated
        };
    };


    const getImportableSalesQuotes = async (accountId) => {

        if (!accountId) return [];

        const { data: states, error: statesError } = await supabase
            .from("sales_states")
            .select("id, name")
            .in("name", ["Ingresado", "En_proceso"]);

        if (statesError) {
            console.error(statesError);
            return [];
        }

        const stateIds = states.map(state => state.id);

        if (stateIds.length === 0) {
            return [];
        }

        const { data, error } = await supabase
            .from("sales_quotes")
            .select(`
                *,
                sales_states(
                    id,
                    name
                )
            `)
            .eq("account_id", accountId)
            .eq("is_model", "0")
            .in("sales_state_id", stateIds)
            .order("date", { ascending: false });

        if (error) {
            console.error(error);
            return [];
        }

        const quotes = data || [];

        if (quotes.length === 0) {
            return [];
        }

        const quoteIds = quotes.map(quote => quote.id);

        const pendingItems = await getPendingQuoteItems(quoteIds);

        const pendingItemsMap = new Map();

        for (const item of pendingItems) {

            const quoteId = item.sales_quote_id;

            if (!pendingItemsMap.has(quoteId)) {
                pendingItemsMap.set(quoteId, []);
            }

            pendingItemsMap.get(quoteId).push(item);
        }

        return quotes
            .map(quote => ({
                ...quote,
                pending_items: pendingItemsMap.get(quote.id) || []
            }))
            .filter(quote =>
                quote.pending_items.length > 0
            );
    };

    const getPendingQuoteItems = async (quoteIds) => {

        if (!quoteIds?.length) {
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
            .in("sales_quote_id", quoteIds)
            .order("id", { ascending: true });

        if (error) {
            console.error("Error fetching pending quote items:", error);
            return [];
        }

        return (data || []).filter(item => {

            const quantity =
                Number(item.quantity) || 0;

            const completed =
                Number(item.completed) || 0;

            return quantity > completed;

        });
    };

    const createStockArticle = async (articleData, prices = []) => {
        const now = new Date().toISOString();

        const {
            data: article,
            error: articleError
        } = await supabase
            .from("stock_articles")
            .insert({
                ...articleData,
                created_at: now,
                updated_at: now
            })
            .select()
            .single();

        if (articleError) {
            console.error(
                "Error al crear artículo:",
                articleError
            );
            return null;
        }

        if (prices.length > 0) {

            const pricesToInsert = prices.map(price => ({
                article_id: article.id,
                list_id: Number(price.list_id),
                cost: Number(price.cost) || 0,
                margin: Number(price.margin) || 0,
                price: Number(price.price) || 0,
                created_at: now,
                updated_at: now
            }));

            const { error: pricesError } = await supabase
                .from("stock_prices")
                .insert(pricesToInsert);

            if (pricesError) {
                console.error(
                    "Error al crear precios:",
                    pricesError
                );

                // Si falla el guardado de precios,
                // eliminamos el artículo recién creado.
                await supabase
                    .from("stock_articles")
                    .delete()
                    .eq("id", article.id);

                return null;
            }
        }

        return {
            ...article,
            prices
        };
    };

    const updateStockArticle = async (
        articleId,
        articleData,
        prices = []
    ) => {
        const now = new Date().toISOString();

        const {
            data: article,
            error: articleError
        } = await supabase
            .from("stock_articles")
            .update({
                ...articleData,
                updated_at: now
            })
            .eq("id", articleId)
            .select()
            .single();

        if (articleError) {
            console.error(
                "Error al actualizar artículo:",
                articleError
            );
            return null;
        }

        /*
        * Eliminamos los precios actuales
        * y los volvemos a insertar.
        *
        * Esto simplifica mucho la sincronización:
        * - precios agregados
        * - precios modificados
        * - precios eliminados
        */

        const { error: deletePricesError } = await supabase
            .from("stock_prices")
            .delete()
            .eq("article_id", articleId);

        if (deletePricesError) {
            console.error(
                "Error al eliminar precios anteriores:",
                deletePricesError
            );
            return null;
        }

        if (prices.length > 0) {

            const pricesToInsert = prices.map(price => ({
                article_id: articleId,
                list_id: Number(price.list_id),
                cost: Number(price.cost) || 0,
                margin: Number(price.margin) || 0,
                price: Number(price.price) || 0,
                created_at: price.created_at || now,
                updated_at: now
            }));

            const { error: pricesError } = await supabase
                .from("stock_prices")
                .insert(pricesToInsert);

            if (pricesError) {
                console.error(
                    "Error al actualizar precios:",
                    pricesError
                );
                return null;
            }
        }

        return {
            ...article,
            prices
        };
    };

    const deleteStockArticle = async (articleId) => {

        const { data: quoteItems, error: quoteItemsError } =
            await supabase
                .from("sales_quotes_items")
                .select("sales_quote_id")
                .eq("stock_art_id", articleId)
                .limit(1);

        if (quoteItemsError) {

            console.error(
                "Error al verificar presupuestos del artículo:",
                quoteItemsError
            );

            return false;
        }

        if (quoteItems?.length) {

            console.error(
                "No se puede eliminar el artículo porque está siendo utilizado en un presupuesto."
            );

            return false;
        }


        const { data: orderItems, error: orderItemsError } =
            await supabase
                .from("sales_orders_items")
                .select("sales_order_id")
                .eq("stock_art_id", articleId)
                .limit(1);

        if (orderItemsError) {

            console.error(
                "Error al verificar órdenes del artículo:",
                orderItemsError
            );

            return false;
        }

        if (orderItems?.length) {

            console.error(
                "No se puede eliminar el artículo porque está siendo utilizado en una orden."
            );

            return false;
        }


        const { error: pricesError } = await supabase
            .from("stock_prices")
            .delete()
            .eq("article_id", articleId);

        if (pricesError) {

            console.error(
                "Error al eliminar precios del artículo:",
                pricesError
            );

            return false;
        }


        const { error: articleError } = await supabase
            .from("stock_articles")
            .delete()
            .eq("id", articleId);

        if (articleError) {

            console.error(
                "Error al eliminar artículo:",
                articleError
            );

            return false;
        }


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

    const getProviderAccountId = async (parameterId) => {

        const { data, error } = await supabase
            .from("data_parameters")
            .select("provider_account_id")
            .eq("id", parameterId)
            .single();

        if (error) {
            console.error(error);
            return null;
        }

        return data.provider_account_id;
    };


    const loadExistingArticlesByCodes = async (
        codes,
        providerAccountId,
        options = {}
    ) => {

        const {
            isConcept = false
        } = options;

        const lookupBatchSize = 200;
        const existingArticles = [];

        for (let i = 0; i < codes.length; i += lookupBatchSize) {

            const batchCodes =
                codes.slice(i, i + lookupBatchSize);

            let query = supabase
                .from("stock_articles")
                .select("id, code, measure, desc, category_id")
                .eq("account_id", providerAccountId)
                .in("code", batchCodes);

            if (isConcept) {
                query = query.eq("is_concept", true);
            } else {
                query = query.eq("is_concept", false);
            }

            const {
                data,
                error
            } = await query;

            if (error) {
                console.error(error);
                return null;
            }

            existingArticles.push(...data);
        }

        return existingArticles;
    };


    const loadExistingPricesByArticleIds = async (
        articleIds,
        options = {}
    ) => {

        const {
            listId = null
        } = options;

        const lookupBatchSize = 200;
        const existingPrices = [];

        for (let i = 0; i < articleIds.length; i += lookupBatchSize) {

            const batchIds =
                articleIds.slice(i, i + lookupBatchSize);

            let query = supabase
                .from("stock_prices")
                .select("id, article_id, list_id, cost, margin, price")
                .in("article_id", batchIds);

            if (listId !== null) {
                query = query.eq("list_id", listId);
            }

            const {
                data,
                error
            } = await query;

            if (error) {
                console.error(error);
                return null;
            }

            existingPrices.push(...data);
        }

        return existingPrices;
    };

    const getStockCategories = async () => {

        const pageSize = 1000;
        let lastId = 0;
        let allCategories = [];

        while (true) {

            const { data, error } = await supabase
                .from("stock_categories")
                .select("*")
                .gt("id", lastId)
                .order("id")
                .limit(pageSize);

            if (error) {
                console.error(
                    "Error al obtener categorías:",
                    error
                );
                return [];
            }

            if (!data || data.length === 0) {
                break;
            }

            allCategories = [
                ...allCategories,
                ...data
            ];

            lastId = data[data.length - 1].id;

            if (data.length < pageSize) {
                break;
            }
        }

        console.log(
            "Categorías cargadas:",
            allCategories.length
        );

        setStockCategories(allCategories);

        return allCategories;
    };

    const getStockClasses = async () => {
        const { data, error } = await supabase
            .from("stock_classes")
            .select("*")
            .order("id");

        if (error) {
            console.error("Error al obtener clases:", error);
            return [];
        }

        setStockClasses(data || []);
        return data || [];
    };

    const getAuthenticatedUserId = async () => {
        const {
            data: { user },
            error
        } = await supabase.auth.getUser();

        if (error || !user) {
            console.error(
                "No se pudo obtener el usuario autenticado:",
                error
            );

            return null;
        }

        return user.id;
    };

    const userId = user?.id;

    useEffect(() => {
        if (authLoading || !userId) return;

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
    }, [authLoading, userId]);

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
                createDataAccount,
                updateDataAccount,
                deleteDataAccount,
                getDataDocuments,
                getDataConditionsTypes,
                getDataTaxPositions,
                getStockMotors,
                getStockLists,
                getDataSequences,
                deleteSalesQuote,
                updateSalesQuote,
                salesOrders,
                getSalesOrders,
                getSalesOrderItems,
                salesSections,
                getSalesSections,
                getImportableSalesQuotes,
                getPendingQuoteItems,
                createSalesOrder,
                updateSalesOrder,
                deleteSalesOrder,
                clearTempArticles,
                uploadTempArticles,
                processTempArticles,
                processTempConcepts,
                createStockArticle,
                updateStockArticle,
                deleteStockArticle,
                getQuoteDocument,
                getQuoteAccountName,
                getQuoteAccountTaxNum,
                getQuoteCondition,
                getQuoteTaxPosition,
                getQuoteFullNumber,
                getProviderAccountId,
                stockCategories,
                getStockCategories,
                stockClasses,
                getStockClasses,
                loading
            }}
        >
        {children}
    </Context.Provider>
}