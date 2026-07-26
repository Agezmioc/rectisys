import { useEffect, useState, useMemo } from "react";
import { useData } from "../context/Context";
import EditSalesQuoteItemsList from "./EditSalesQuoteItemsList";
import AccountSelector from "./AccountSelector";
import MotorSelector from "./MotorSelector";
import "./SalesQuoteManager.css";

const SalesQuoteManager = ({
    initialQuote = null,
    onCancel,
    onSaved
}) => {
    const {
        createSalesQuote,
        updateSalesQuote,
        dataAccounts,
        dataConditionsTypes,
        dataTaxPositions,
        stockMotors,
        dataDocuments,
        getDataAccounts,
        getDataDocuments,
        getDataConditionsTypes,
        getDataTaxPositions,
        getStockMotors,
        getSalesQuoteItems,
        stockLists,
    } = useData();
    
    const [showAccountSelector, setShowAccountSelector] = useState(false);
    const [showMotorSelector, setShowMotorSelector] = useState(false);
    const DOCUMENT_TYPE = "presupuesto";

    const documentId = useMemo(() => {
        return dataDocuments.find(
            d => d.desc?.toLowerCase() === DOCUMENT_TYPE
        )?.id ?? null;
    }, [dataDocuments]);


    const emptyQuote = {
        account_id: "",
        data_condition_type_id: "",
        data_tax_position_id: "",
        motor_id: "",

        address: "",
        phone_num: "",

        tax_num: "",

        reference: "",
        purchace_order_num: "",
        list: "",
        observations: "",

        date: new Date().toISOString().slice(0, 10),

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

            date: initialQuote.date
                ? String(initialQuote.date).slice(0, 10)
                : emptyQuote.date,

            is_model:
                initialQuote.is_model === 1 ||
                initialQuote.is_model === "1"
        };
    });

    const [items, setItems] = useState([]);

    const motorId = Number(quote.motor_id);

    const selectedMotor = stockMotors.find(
        m => m.id === motorId
    );

    const listObj = stockLists.find(
        l => l.id === selectedMotor?.list_id
    );

    const listId = selectedMotor?.list_id ?? null;

    const isConsumerFinalAccount = Number(quote.account_id) === 1;

    const handleQuoteChange = (e) => {
        const { name, value, type, checked } = e.target;

        setQuote(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const quoteData = {
            account_id: quote.account_id ? Number(quote.account_id) : null,
            data_document_id: documentId,
            data_condition_type_id: quote.data_condition_type_id ? Number(quote.data_condition_type_id) : null,
            data_tax_position_id: quote.data_tax_position_id ? Number(quote.data_tax_position_id) : null,
            motor_id: quote.motor_id ? Number(quote.motor_id) : null,

            address: quote.address,
            phone_num: quote.phone_num,
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

            tax_num: quote.tax_num
        };

        const saved = initialQuote
            ? await updateSalesQuote(initialQuote.id, quoteData, items)
            : await createSalesQuote(quoteData, items);

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
        getDataAccounts();
        getDataDocuments();
        getDataConditionsTypes();
        getDataTaxPositions();
        getStockMotors();
    }, []);

    useEffect(() => {
        const loadItems = async () => {
            if (!quote?.id) return;
            const data = await getSalesQuoteItems(quote.id);
            setItems(data || []);
        };

        loadItems();
    }, [quote?.id]);

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
                setQuote(prev => ({
                    ...prev,
                    account_id: account.id,

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
                        {initialQuote
                            ? `Editar Presupuesto #${initialQuote.id}`
                            : "Nuevo Presupuesto"}
                    </h2>

                    <div className="sales-quote-manager-actions">
                        <button type="submit" form="quote-form">
                            {initialQuote ? "Actualizar" : "Guardar"}
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
                    <section className="sales-quote-card-grid">
                        <div className="sales-quote-card">
                            <div className="sales-quote-card-content">
                                <label>
                                    {document?.desc || "Presupuesto"}

                                    {initialQuote && (
                                        <>
                                            {" "}
                                            {`${quote.letter}-${String(quote.point).padStart(4, "0")}-${String(quote.number).padStart(8, "0")}`}
                                        </>
                                    )}
                                </label>

                                <div>
                                    <label>
                                        Fecha: {
                                            quote.date
                                                ? new Date(quote.date).toLocaleDateString("es-AR")
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
                                    <label>Motor: {
                                        quote.motor_id && (
                                            stockMotors.find(
                                                m => m.id === Number(quote.motor_id)
                                            )?.desc
                                    )}</label>
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

                    {/* IMPORTES */}
                    <section>
                        <div className="sales-quote-card">
                            <div className="sales-quote-amounts-grid">

                                <div className="sales-quote-amount">
                                    <label>Descuento Conceptos (%)</label>
                                    <input
                                        type="number"
                                        name="concept_discount"
                                        value={quote.concept_discount}
                                        onChange={handleQuoteChange}
                                    />
                                </div>

                                <div className="sales-quote-amount">
                                    <label>Subtotal Conceptos</label>
                                    <span>{conceptSubtotal.toFixed(2)}</span>
                                </div>

                                <div className="sales-quote-amount">
                                    <label>Descuento Artículos (%)</label>
                                    <input
                                        type="number"
                                        name="article_discount"
                                        value={quote.article_discount}
                                        onChange={handleQuoteChange}
                                    />
                                </div>

                                <div className="sales-quote-amount">
                                    <label>Subtotal Artículos</label>
                                    <span>{articleSubtotal.toFixed(2)}</span>
                                </div>

                                <div className="sales-quote-amount">
                                    <label>Descuento General (%)</label>
                                    <input
                                        type="number"
                                        name="general_discount"
                                        value={quote.general_discount}
                                        onChange={handleQuoteChange}
                                    />
                                </div>

                                <div className="sales-quote-amount">
                                    <label>Recargo General (%)</label>
                                    <input
                                        type="number"
                                        name="general_recharge"
                                        value={quote.general_recharge}
                                        onChange={handleQuoteChange}
                                    />
                                </div>

                                <div className="sales-quote-amount">
                                    <label>Subtotal General</label>
                                    <span>{generalSubtotal.toFixed(2)}</span>
                                </div>

                                {!isConsumerFinal && (
                                    <div className="sales-quote-amount">
                                        <label>IVA</label>
                                        <span>{vatAmount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="sales-quote-amount">
                                    <label><b>Total</b></label>
                                    <span><b>{total.toFixed(2)}</b></span>
                                </div>

                            </div>
                        </div>
                    </section>

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