import { useEffect, useState, useMemo, useRef } from "react";
import { useData } from "../context/Context";
import EditSalesQuoteItemsList from "./EditSalesQuoteItemsList";
import AccountSelector from "./AccountSelector";
import MotorSelector from "./MotorSelector";
import "./SalesQuoteManager.css";
import { isValidNumberInput } from "../utils/numberInput";

const getLocalDate = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const SalesQuoteManager = ({
    initialQuote = null,
    isDuplicate = false,
    onCancel,
    onSaved
}) => {
    const {
        createSalesQuote,
        updateSalesQuote,
        dataAccounts,
        dataConditionsTypes,
        dataTaxPositions,
        dataDocuments,
        getDataDocuments,
        getDataConditionsTypes,
        getDataTaxPositions,
        getStockMotors,
        getSalesQuoteItems,
        getStockArticles,
        stockLists,
    } = useData();

    const [showAccountSelector, setShowAccountSelector] = useState(false);
    const [showMotorSelector, setShowMotorSelector] = useState(false);
    const [showDetails, setShowDetails] = useState(true);
    const DOCUMENT_TYPE = "presupuesto";
    const [selectedMotor, setSelectedMotor] = useState(null);

    const documentId = useMemo(() => {
        return dataDocuments.find(
            d => d.desc?.toLowerCase() === DOCUMENT_TYPE
        )?.id ?? null;
    }, [dataDocuments]);

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const emptyQuote = {
        account_id: "",
        data_condition_type_id: "",
        data_tax_position_id: "",
        motor_id: "",

        name: "",
        email: "",
        phone_num: "",

        address: "",
        district: "",

        tax_num: "",

        reference: "",
        purchace_order_num: "",
        list: "",
        observations: "",

        date: getLocalDate(),

        letter: "",
        point: "",
        number: "",

        is_model: false,

        concept_subtotal: 0,
        concept_discount: 0,
        article_subtotal: 0,
        article_discount: 0,
        general_discount: 0,
        general_recharge: 0,
        general_subtotal: 0,
        general_vat: 0,
        total: 0
    };

    const [quote, setQuote] = useState(() => {
        if (!initialQuote) return emptyQuote;

        return {
            ...emptyQuote,
            ...initialQuote,

            // La copia comienza con la fecha actual.
            date: isDuplicate
                ? getLocalDate()
                : initialQuote.date
                    ? String(initialQuote.date).slice(0, 10)
                    : getLocalDate(),

            is_model:
                initialQuote.is_model === 1 ||
                initialQuote.is_model === "1"
        };
    });

    const [items, setItems] = useState([]);

    const previousMotorId = useRef(
        initialQuote?.motor_id
            ? Number(initialQuote.motor_id)
            : null
    );

    const duplicatePricesUpdated = useRef(false);

    useEffect(() => {
        let cancelled = false;

        const loadMotor = async () => {
            if (!quote.motor_id) {
                setSelectedMotor(null);
                return;
            }

            try {
                const motors = await getStockMotors({
                    searchField: "id",
                    searchQuery: String(quote.motor_id)
                });

                if (!cancelled) {
                    setSelectedMotor(motors[0] ?? null);
                }
            } catch (error) {
                console.error("Error cargando el motor seleccionado:", error);

                if (!cancelled) {
                    setSelectedMotor(null);
                }
            }
        };

        loadMotor();

        return () => {
            cancelled = true;
        };
    }, [quote.motor_id, getStockMotors]);

    const listObj = stockLists.find(
        l => l.id === selectedMotor?.list_id
    );

    const listId = selectedMotor?.list_id ?? null;

    const isConsumerFinalAccount = Number(quote.account_id) === 1;

    const integerFields = [
        "data_condition_type_id",
        "data_tax_position_id",
        "motor_id",
        "point",
        "number"
    ];

    const decimalFields = [
        "concept_discount",
        "article_discount",
        "general_discount",
        "general_recharge"
    ];

    const handleQuoteChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === "checkbox") {
            setQuote(prev => ({
                ...prev,
                [name]: checked
            }));
            return;
        }

        if (integerFields.includes(name)) {
            if (!isValidNumberInput(value, { decimals: 0 })) {
                return;
            }
        }

        if (decimalFields.includes(name)) {
            if (!isValidNumberInput(value, { decimals: 2 })) {
                return;
            }
        }

        setQuote(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        const now = new Date().toISOString();

        const quoteData = {
            account_id: quote.account_id ? Number(quote.account_id) : null,
            data_document_id: documentId,
            data_condition_type_id: quote.data_condition_type_id ? Number(quote.data_condition_type_id) : null,
            data_tax_position_id: quote.data_tax_position_id ? Number(quote.data_tax_position_id) : null,
            motor_id: quote.motor_id ? Number(quote.motor_id) : null,

            name: quote.name,
            email: quote.email,
            phone_num: quote.phone_num,
            address: quote.address,
            district: quote.district,

            reference: quote.reference,
            purchace_order_num: quote.purchace_order_num,
            list: listObj?.desc || "Sin lista",
            observations: quote.observations,

            date: quote.date,

            letter: quote.letter,
            point: quote.point,
            number: quote.number,

            is_model: quote.is_model ? 1 : 0,

            concept_subtotal: conceptSubtotal,
            article_subtotal: articleSubtotal,
            general_subtotal: generalSubtotal,
            total: total,

            concept_discount: quote.concept_discount,
            article_discount: quote.article_discount,
            general_discount: quote.general_discount,
            general_recharge: quote.general_recharge,

            general_vat: vatAmount,

            tax_num: quote.tax_num,

            created_at:
                initialQuote && !isDuplicate
                    ? initialQuote.created_at || now
                    : now,
            updated_at: now,

            sales_state_id: 3
        };

        const itemsToSave = items.map(item => {
            const quantity = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            const vat = Number(item.vat_value ?? item.vat ?? 0);

            const base = quantity * price;

            const itemTotal = isConsumerFinal
                ? base * (1 + vat / 100)
                : base;

            return {
                ...item,
                total: itemTotal
            };
        });

        const saved = initialQuote && !isDuplicate
            ? await updateSalesQuote(
                initialQuote.id,
                quoteData,
                itemsToSave
            )
            : await createSalesQuote(
                quoteData,
                itemsToSave
            );

        if (!saved) return;

        console.log("SAVED:", saved);
        onSaved?.(saved);
    };

    const renderSelect = (name, label, value, options, labelKey = "desc") => (
        <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ display: "block", fontWeight: "bold" }}>
                {label}
            </label>

            <select
                name={name}
                value={value !== undefined && value !== null ? String(value) : ""}
                onChange={handleQuoteChange}
            >
                <option value="" disabled hidden>
                    Seleccionar...
                </option>

                {options.map(opt => (
                    <option key={opt.id} value={String(opt.id)}>
                        {opt[labelKey]}
                    </option>
                ))}
            </select>
        </div>
    );

    useEffect(() => {
        getDataDocuments();
        getDataConditionsTypes();
        getDataTaxPositions();
    }, []);

    useEffect(() => {
        const loadItems = async () => {
            if (!quote?.id) return;
            const data = await getSalesQuoteItems(quote.id);
            setItems(data || []);
        };

        loadItems();
    }, [quote?.id]);

    const priceUpdateRequest = useRef(0);

    useEffect(() => {
        const requestRef = priceUpdateRequest;

        return () => {
            requestRef.current++;
        };
    }, []);

    useEffect(() => {
        const updateItemPrices = async () => {
            const currentMotor = quote.motor_id
                ? Number(quote.motor_id)
                : null;

            if (!currentMotor) {
                previousMotorId.current = null;
                return;
            }

            if (!listId || !items.length) {
                return;
            }

            const motorChanged =
                previousMotorId.current !== currentMotor;

            const shouldUpdateDuplicate =
                isDuplicate && !duplicatePricesUpdated.current;

            // En una edición normal, solo actualizamos si cambió el motor.
            // Al duplicar, actualizamos también los precios iniciales.
            if (!motorChanged && !shouldUpdateDuplicate) {
                return;
            }

            const articleIds = [
                ...new Set(
                    items
                        .map(item => item.stock_art_id)
                        .filter(
                            id =>
                                id !== null &&
                                id !== undefined &&
                                id !== ""
                        )
                        .map(Number)
                )
            ];

            // Evitamos repetir el intento si no hay artículos asociados.
            if (!articleIds.length) {
                previousMotorId.current = currentMotor;

                if (isDuplicate) {
                    duplicatePricesUpdated.current = true;
                }

                return;
            }

            // Registramos el cambio antes de iniciar la consulta.
            previousMotorId.current = currentMotor;

            if (isDuplicate) {
                duplicatePricesUpdated.current = true;
            }

            const requestId = ++priceUpdateRequest.current;

            try {
                const articles = await getStockArticles({ articleIds });

                if (requestId !== priceUpdateRequest.current) {
                    return;
                }

                const articlesMap = new Map(
                    articles.map(article => [
                        Number(article.id),
                        article
                    ])
                );

                const taxPosition = dataTaxPositions.find(
                    t => t.id === Number(quote.data_tax_position_id)
                );

                const consumerFinal = !!taxPosition?.vat_included;

                setItems(prev =>
                    prev.map(item => {
                        const article = articlesMap.get(
                            Number(item.stock_art_id)
                        );

                        if (!article) return item;

                        const prices = article.prices || [];

                        const price =
                            prices.find(
                                p => Number(p.list_id) === Number(listId)
                            )?.price ??
                            prices.find(
                                p => Number(p.list_id) === 0
                            )?.price ??
                            0;

                        const newPrice = Number(price);
                        const quantity = Number(item.quantity) || 0;
                        const vat = Number(item.vat_value ?? item.vat ?? 0);
                        const base = quantity * newPrice;
                        const newTotal = consumerFinal
                            ? base * (1 + vat / 100)
                            : base;

                        return {
                            ...item,
                            price: newPrice,
                            total: newTotal
                        };
                    })
                );
            } catch (error) {
                console.error(
                    "Error al actualizar los precios de los ítems:",
                    error
                );

                // Permitimos reintentar la actualización de la copia.
                if (isDuplicate) {
                    duplicatePricesUpdated.current = false;
                }
            }
        };

        updateItemPrices();
    }, [
        isDuplicate,
        quote.motor_id,
        quote.data_tax_position_id,
        listId,
        items,
        getStockArticles,
        dataTaxPositions
    ]);

    const {
        conceptSubtotal,
        articleSubtotal,
        generalSubtotal,
        vatAmount,
        total,
        isConsumerFinal
    } = useMemo(() => {
        const taxPosition = dataTaxPositions.find(
            t => t.id === Number(quote.data_tax_position_id)
        );

        const isConsumerFinal = !!taxPosition?.vat_included;

        const vatRate = 21;

        const calculateItemTotal = (item) => {
            const quantity = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            const vat = Number(item.vat_value ?? item.vat ?? 0);

            const base = quantity * price;

            return isConsumerFinal
                ? base * (1 + vat / 100)
                : base;
        };

        const conceptTotal = items
            .filter(i => i.is_concept)
            .reduce((s, i) => s + calculateItemTotal(i), 0);

        const articleTotal = items
            .filter(i => !i.is_concept)
            .reduce((s, i) => s + calculateItemTotal(i), 0);

        const conceptDiscountPct = Number(quote.concept_discount) || 0;
        const articleDiscountPct = Number(quote.article_discount) || 0;
        const generalDiscountPct = Number(quote.general_discount) || 0;
        const generalRechargePct = Number(quote.general_recharge) || 0;

        const conceptSubtotal =
            conceptTotal * (1 - conceptDiscountPct / 100);

        const articleSubtotal =
            articleTotal * (1 - articleDiscountPct / 100);

        const baseSubtotal =
            conceptSubtotal + articleSubtotal;

        const generalSubtotal =
            baseSubtotal *
            (1 - generalDiscountPct / 100) *
            (1 + generalRechargePct / 100);

        const vatAmount = isConsumerFinal
            ? 0
            : generalSubtotal * (vatRate / 100);

        const total = isConsumerFinal
            ? generalSubtotal
            : generalSubtotal + vatAmount;

        return {
            conceptSubtotal,
            articleSubtotal,
            generalSubtotal,
            vatAmount,
            total,
            isConsumerFinal
        };
    }, [
        items,
        quote.concept_discount,
        quote.article_discount,
        quote.general_discount,
        quote.general_recharge,
        quote.data_tax_position_id,
        dataTaxPositions
    ]);

    if (showAccountSelector) {
    return (
        <AccountSelector
            onConfirm={(account) => {
                const isConsumerFinal = Number(account.id) === 1;

                setQuote(prev => ({
                    ...prev,
                    account_id: account.id,

                    name: isConsumerFinal ? "" : account.name || "",
                    email: isConsumerFinal ? "" : account.email || "",
                    district: isConsumerFinal ? "" : account.district || "",

                    address: account.address || "",
                    phone_num: account.phone_num || "",
                    data_tax_position_id: account.tax_position_id || "",
                    tax_num: account.tax_num || ""
                }));

                setShowAccountSelector(false);
            }}
            onCancel={() => setShowAccountSelector(false)}
        />
    );
    }

    if (showMotorSelector) {
        return (
            <MotorSelector
                onConfirm={(motor) => {
                    setSelectedMotor(motor);

                    setQuote(prev => ({
                        ...prev,
                        motor_id: motor.id
                    }));

                    setShowMotorSelector(false);
                }}
                onCancel={() => setShowMotorSelector(false)}
            />
        );
    }

    return (
        <div className="sales-quote-manager">


            {/* HEADER */}
            <header className="sales-quote-manager-header">

                <div className="sales-quote-manager-topbar">
                    <h2>
                        {initialQuote && !isDuplicate
                            ? `Editar Presupuesto #${initialQuote.id}`
                            : "Nuevo Presupuesto"}
                    </h2>

                    <div className="sales-quote-manager-actions">
                        <button type="submit" form="quote-form">
                            {initialQuote && !isDuplicate ? "Actualizar" : "Guardar"}
                        </button>
                        <button type="button" onClick={onCancel}>
                            Cancelar
                        </button>
                    </div>
                </div>

            </header>

            {/* BODY */}
            <div className="sales-quote-manager-body">
                <form id="quote-form" onSubmit={handleSubmit}>

                    {/* SECCIÓN: PRINCIPALES */}
                    {showDetails && (
                        <section className="sales-quote-card-grid">
                            <div className="sales-quote-card">
                                <div className="sales-quote-card-content">
                                    <label>
                                        {document?.desc || "Presupuesto"}

                                        {initialQuote && !isDuplicate && (
                                            <>
                                                {" "}
                                                {`${quote.letter}-${String(quote.point).padStart(4, "0")}-${String(quote.number).padStart(8, "0")}`}
                                            </>
                                        )}
                                    </label>

                                    <div>
                                        <label>
                                            Fecha:
                                            {
                                                quote.date
                                                    ? new Date(`${String(quote.date).slice(0, 10)}T12:00:00`)
                                                        .toLocaleDateString("es-AR")
                                                    : ""
                                            }
                                        </label>
                                    </div>

                                    <div>
                                        <label>Cliente: {
                                            quote.account_id && (
                                                dataAccounts.find(
                                                    acc => acc.id === Number(quote.account_id)
                                                )?.name
                                        )}</label>

                                        <button type="button" onClick={() => setShowAccountSelector(true)}>
                                            Seleccionar cliente
                                        </button>
                                    </div>

                                    <div className="sales-quote-checkbox">
                                        <label>
                                            Es modelo{" "}
                                            <input
                                                type="checkbox"
                                                name="is_model"
                                                checked={quote.is_model}
                                                onChange={handleQuoteChange}
                                            />
                                        </label>
                                    </div>

                                    <div>
                                        <label>Motor: {selectedMotor?.desc || ""}</label>
                                        <button type="button" onClick={() => setShowMotorSelector(true)}>
                                            Seleccionar motor
                                        </button>
                                    </div>

                                    <div>
                                        <label>Lista: {listObj?.id || "Sin lista"}</label>
                                    </div>
                                </div>
                            </div>

                            {/* COMERCIAL */}
                            <div className="sales-quote-card">
                                <div className="sales-quote-card-content">
                                    <div>
                                        <label>Nombre</label>
                                        <input
                                            name="name"
                                            value={quote.name || ""}
                                            onChange={handleQuoteChange}
                                            readOnly={!isConsumerFinalAccount}
                                        />
                                    </div>

                                    <div>
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={quote.email || ""}
                                            onChange={handleQuoteChange}
                                            readOnly={!isConsumerFinalAccount}
                                        />
                                    </div>

                                    <div>
                                        <label>Condición fiscal</label>
                                        <input
                                            value={
                                                dataTaxPositions.find(
                                                    t => t.id === Number(quote.data_tax_position_id)
                                                )?.desc || ""
                                            }
                                            readOnly
                                        />
                                    </div>

                                    <div>
                                        <label>C.U.I.T.</label>
                                        <input
                                            name="tax_num"
                                            value={quote.tax_num || ""}
                                            onChange={handleQuoteChange}
                                            readOnly={!isConsumerFinalAccount}
                                        />
                                    </div>

                                    <div>
                                        <label>Dirección</label>
                                        <input
                                            name="address"
                                            value={quote.address || ""}
                                            onChange={handleQuoteChange}
                                            readOnly={!isConsumerFinalAccount}
                                        />
                                    </div>

                                    <div>
                                        <label>Barrio</label>
                                        <input
                                            name="district"
                                            value={quote.district || ""}
                                            onChange={handleQuoteChange}
                                            readOnly={!isConsumerFinalAccount}
                                        />
                                    </div>

                                    <div>
                                        <label>Teléfono</label>
                                        <input
                                            name="phone_num"
                                            value={quote.phone_num || ""}
                                            onChange={handleQuoteChange}
                                            readOnly={!isConsumerFinalAccount}
                                        />
                                    </div>


                                    {renderSelect(
                                        "data_condition_type_id",
                                        "Condición",
                                        quote.data_condition_type_id,
                                        dataConditionsTypes,
                                        "desc"
                                    )}
                                </div>
                            </div>

                            {/* REFERENCIAS */}
                            <div className="sales-quote-card">
                                <div className="sales-quote-card-content">
                                    <div>
                                        <label>Referencia</label>
                                        <input name="reference" value={quote.reference} onChange={handleQuoteChange} />
                                    </div>

                                    <div>
                                        <label>Orden de compra</label>
                                        <input name="purchace_order_num" value={quote.purchace_order_num} onChange={handleQuoteChange} />
                                    </div>

                                    <div className="sales-quote-card-full">
                                        <label>Observaciones</label>
                                        <textarea
                                            name="observations"
                                            value={quote.observations}
                                            onChange={handleQuoteChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* IMPORTES */}
                    <section>
                        <div className="sales-quote-card">
                            <div className="sales-quote-amounts-grid">
                                {showDetails && (
                                    <>
                                        <div className="sales-quote-amount">
                                            <label>Descuento Artículos (%)</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                name="article_discount"
                                                min="0"
                                                step="0.01"
                                                value={quote.article_discount}
                                                onChange={handleQuoteChange}
                                            />
                                        </div>

                                        <div className="sales-quote-amount">
                                            <label>Subtotal Artículos</label>
                                            <span>{formatMoney(articleSubtotal)}</span>
                                        </div>

                                        <div className="sales-quote-amount">
                                            <label>Descuento Conceptos (%)</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                name="concept_discount"
                                                min="0"
                                                step="0.01"
                                                value={quote.concept_discount}
                                                onChange={handleQuoteChange}
                                            />
                                        </div>

                                        <div className="sales-quote-amount">
                                            <label>Subtotal Conceptos</label>
                                            <span>{formatMoney(conceptSubtotal)}</span>
                                        </div>

                                        <div className="sales-quote-amount">
                                            <label>Descuento General (%)</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                name="general_discount"
                                                min="0"
                                                step="0.01"
                                                value={quote.general_discount}
                                                onChange={handleQuoteChange}
                                            />
                                        </div>

                                        <div className="sales-quote-amount">
                                            <label>Recargo General (%)</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                name="general_recharge"
                                                min="0"
                                                step="0.01"
                                                value={quote.general_recharge}
                                                onChange={handleQuoteChange}
                                            />
                                        </div>

                                        <div className="sales-quote-amount">
                                            <label>Subtotal General</label>
                                            <span>{formatMoney(generalSubtotal)}</span>
                                        </div>

                                        <div className="sales-quote-amount">
                                            <label>IVA</label>
                                            <span>{formatMoney(vatAmount)}</span>
                                        </div>

                                        <div className="sales-quote-amount">
                                            <label><b>Total</b></label>
                                            <span><b>{formatMoney(total)}</b></span>
                                        </div>
                                    </>
                                )}

                                {!showDetails && (
                                    <>
                                        <div>
                                            <label>
                                                <b>
                                                    {initialQuote && !isDuplicate
                                                        ? `Presupuesto ${quote.letter}-${String(quote.point).padStart(4, "0")}-${String(quote.number).padStart(8, "0")}`
                                                        : "Nuevo Presupuesto"}
                                                </b>
                                            </label>
                                        </div>
                                        <div>
                                            <label>
                                                <b>Fecha:</b>
                                                {
                                                    quote.date
                                                        ? new Date(`${String(quote.date).slice(0, 10)}T12:00:00`)
                                                            .toLocaleDateString("es-AR")
                                                        : ""
                                                }
                                            </label>
                                        </div>
                                        <div>
                                            <label>
                                                    <b>Cliente:</b> {
                                                        quote.account_id && (
                                                            dataAccounts.find(
                                                                acc => acc.id === Number(quote.account_id)
                                                            )?.name
                                                    )}
                                            </label>
                                        </div>

                                        <div className="sales-quote-amount">
                                            <label><b>Total: {formatMoney(total)}</b></label>
                                        </div>
                                    </>
                                )}

                            </div>
                        </div>
                    </section>

                    <div className="sales-quote-manager-toggle">
                        <button
                            type="button"
                            onClick={() => setShowDetails(prev => !prev)}
                        >
                            {showDetails ? "▲" : "▼"}
                        </button>
                    </div>

                    {/* ITEMS */}
                    <section className="sales-quote-card">
                        <EditSalesQuoteItemsList
                            items={items}
                            setItems={setItems}
                            listId={listId}
                            isConsumerFinal={isConsumerFinal}
                        />
                    </section>
                </form>
            </div>
        </div>
    );
};

export default SalesQuoteManager;