import { useEffect, useState, useMemo } from "react";
import { useData } from "../context/Context";
import EditSalesQuoteItemsList from "./EditSalesQuoteItemsList";
import AccountSelector from "./AccountSelector";
import MotorSelector from "./MotorSelector";

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
        getStockArticles,
        getSalesQuoteItems,
        stockLists,
        getStockPrices,
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

            general_vat: quote.general_vat
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
        getStockArticles();
        getStockPrices();
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
                    data_tax_position_id: account.tax_position_id || ""
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
        <form onSubmit={handleSubmit}>
            <h2>
                {initialQuote
                    ? `Editar Presupuesto #${initialQuote.id}`
                    : "Nuevo Presupuesto"}
            </h2>

            <h3>Datos principales</h3>

            <p>
                <b>Documento:</b>{" "}
                {dataDocuments.find(
                    d => d.id === documentId
                )?.desc || "Presupuesto"}
            </p>
            <div>
                <label>Cliente</label>

                <button
                    type="button"
                    onClick={() => setShowAccountSelector(true)}
                >
                    Seleccionar cliente
                </button>

                {quote.account_id && (
                    <span>
                        {
                            dataAccounts.find(
                                acc => acc.id === Number(quote.account_id)
                            )?.name
                        }
                    </span>
                )}
            </div>

            <div>
                <label>Motor</label>

                <button
                    type="button"
                    onClick={() => setShowMotorSelector(true)}
                >
                    Seleccionar motor
                </button>

                {quote.motor_id && (
                    <span>
                        {
                            stockMotors.find(
                                motor => motor.id === Number(quote.motor_id)
                            )?.desc
                        }
                    </span>
                )}
            </div>
            <div>
                <label>Lista: {listObj?.desc || "Sin lista"}</label>
            </div>
            {renderSelect("data_condition_type_id", "Condición", quote.data_condition_type_id, dataConditionsTypes, "desc")}
            

            <h3>Datos comerciales</h3>

            <div>
                <label>Dirección</label>

                <input
                    value={quote.address || ""}
                    readOnly
                />
            </div>

            <div>
                <label>Teléfono</label>

                <input
                    value={quote.phone_num || ""}
                    readOnly
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
                <label>Referencia</label>
                <input name="reference" value={quote.reference} onChange={handleQuoteChange} />
            </div>

            <div>
                <label>Orden de compra</label>
                <input name="purchace_order_num" value={quote.purchace_order_num} onChange={handleQuoteChange} />
            </div>

            <div>
                <label>Observaciones</label>
                <textarea
                    name="observations"
                    value={quote.observations}
                    onChange={handleQuoteChange}
                />
            </div>

            <h3>Numeración</h3>

            <div>
                <label>Letra</label>
                <input name="letter" value={quote.letter} onChange={handleQuoteChange} />
            </div>

            <div>
                <label>Punto</label>
                <input name="point" value={quote.point} onChange={handleQuoteChange} />
            </div>

            <div>
                <label>Número</label>
                <input name="number" value={quote.number} onChange={handleQuoteChange} />
            </div>

            <div>
                <label>Fecha</label>
                <input
                    type="date"
                    value={quote.date || ""}
                    disabled
                />
            </div>

            <div>
                <label>
                    <input
                        type="checkbox"
                        name="is_model"
                        checked={quote.is_model}
                        onChange={handleQuoteChange}
                    />
                    Es modelo
                </label>
            </div>

            <h3>Importes</h3>

            <div>
                <label>Descuento Conceptos (%)</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="concept_discount"
                    value={quote.concept_discount}
                    onChange={handleQuoteChange}
                />
            </div>

            <div>
                Subtotal Conceptos: {conceptSubtotal.toFixed(2)}
            </div>

            <div>
                <label>Descuento Artículos (%)</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="article_discount"
                    value={quote.article_discount}
                    onChange={handleQuoteChange}
                />
            </div>

            <div>
                Subtotal Artículos: {articleSubtotal.toFixed(2)}
            </div>

            <div>
                <label>Descuento General (%)</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="general_discount"
                    value={quote.general_discount}
                    onChange={handleQuoteChange}
                />
            </div>

            <div>
                <label>Recargo General (%)</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="general_recharge"
                    value={quote.general_recharge}
                    onChange={handleQuoteChange}
                />
            </div>

            <div>
                Subtotal General: {generalSubtotal.toFixed(2)}
            </div>

            {!isConsumerFinal && (
                <div>
                    IVA: {vatAmount.toFixed(2)}
                </div>
            )}

            <div>
                <b>Total: {total.toFixed(2)}</b>
            </div>

            <h3>Items</h3>

            <EditSalesQuoteItemsList
                items={items}
                setItems={setItems}
                listId={listId}
                isConsumerFinal={isConsumerFinal}
            />

            <hr />

            <button type="submit">
                {initialQuote ? "Actualizar" : "Guardar"}
            </button>

            <button type="button" onClick={onCancel}>
                Cancelar
            </button>
        </form>
    );
};

export default SalesQuoteManager;