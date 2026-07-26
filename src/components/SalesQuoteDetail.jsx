import { useEffect, useState } from "react";
import { useData } from "../context/Context";
import SalesQuoteItemsList from "./SalesQuoteItemsList";
import "./SalesQuoteDetail.css";
import { buildSalesQuotePdf } from "./pdf/buildSalesQuotePdf";

const SalesQuoteDetail = ({ quote, onBack, onEdit, onNew }) => {
    const {
        deleteSalesQuote,
        getSalesQuoteItems,
        dataAccounts,
        dataDocuments,
        dataConditionsTypes,
        dataTaxPositions,
        stockMotors
    } = useData();

    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [showDetails, setShowDetails] = useState(true);
    const [showPrices, setShowPrices] = useState(true);

    const handleDelete = async () => {
        const confirmed = window.confirm(
            `¿Eliminar presupuesto #${quote.id}?`
        );

        if (!confirmed) return;

        const deleted = await deleteSalesQuote(quote.id);

        if (deleted) onBack?.();
    };

    useEffect(() => {
        if (!quote?.id) return;

        const loadItems = async () => {
            setLoadingItems(true);
            const data = await getSalesQuoteItems(quote.id);
            setItems(data || []);
            setLoadingItems(false);
        };

        loadItems();
    }, [quote?.id]);

    const document = dataDocuments.find(d => d.id === Number(quote.data_document_id));
    const condition = dataConditionsTypes.find(c => c.id === Number(quote.data_condition_type_id));
    const taxPosition = dataTaxPositions.find(t => t.id === Number(quote.data_tax_position_id));
    const account = dataAccounts?.find(
        a => String(a.id) === String(quote.account_id)
    );
    const motor = stockMotors?.find(
        m => String(m.id) === String(quote.motor_id)
    );

    console.log("quote.account_id:", quote.account_id);
    console.log("accounts:", dataAccounts);
    console.log("motor_id:", quote.motor_id);
    console.log("stockMotors:", stockMotors);

    const isDataReady =
        dataAccounts?.length &&
        dataDocuments?.length &&
        dataConditionsTypes?.length &&
        dataTaxPositions?.length &&
        stockMotors?.length;

    if (!isDataReady) {
        return (
            <div className="sales-quote-detail">
                <p>Cargando datos del presupuesto...</p>
            </div>
        );
    }

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    console.log("QUOTE DETAIL:", quote);

    return (
        <div className="sales-quote-detail">

            {/* HEADER */}
            <header className="sales-quote-detail-header">

                <div className="sales-quote-detail-topbar">

                    <button onClick={onBack}>
                        ← Volver
                    </button>

                    <div className="sales-quote-detail-actions">
                        <label className="sales-quote-show-prices">
                            <input
                                type="checkbox"
                                checked={showPrices}
                                onChange={e => setShowPrices(e.target.checked)}
                            />
                            Mostrar precios en PDF
                        </label>
                        <button
                            onClick={() =>
                                buildSalesQuotePdf({
                                    quote,
                                    items,
                                    account,
                                    motor,
                                    condition,
                                    taxPosition,
                                    showPrices
                                })
                            }
                        >
                            Descargar PDF
                        </button>

                        <button onClick={onNew}>
                            Nuevo
                        </button>

                        <button onClick={onEdit}>
                            Editar
                        </button>

                        <button onClick={handleDelete}>
                            Eliminar
                        </button>

                    </div>
                </div>

                <h2 className="sales-quote-detail-title">
                    Presupuesto #{quote.id}
                </h2>
                {showDetails && (
                    <div className="sales-quote-detail-body">
                        <div className="sales-quote-detail-grid">

                            {/* DOCUMENTO */}
                            <div className="sales-quote-card">

                                <div className="sales-quote-fields-grid">
                                    <div className="sales-quote-field">
                                        <b>Documento:</b> {document?.desc || "-"}
                                    </div>

                                    <div className="sales-quote-field">
                                        <b>Comprobante:</b>{" "}
                                        {`${quote.letter || ""}-${String(quote.point || 0).padStart(4, "0")}-${String(quote.number || 0).padStart(8, "0")}`}
                                    </div>

                                    <div className="sales-quote-field">
                                        <b>Fecha:</b> Fecha: {
                                            quote.date
                                                ? new Date(quote.date).toLocaleDateString("es-AR")
                                                : ""
                                        }
                                    </div>

                                    <div className="sales-quote-field">
                                        <b>Modelo:</b>{" "}
                                        {quote.is_model === "1" ? "Sí" : "No"}
                                    </div>
                                </div>
                            </div>

                            {/* CLIENTE */}
                            <div className="sales-quote-card">
                                <div className="sales-quote-fields-grid">
                                    <div className="sales-quote-field">
                                        <b>Cliente:</b> {account?.name || "-"}
                                    </div>

                                    <div className="sales-quote-field">
                                        <b>CUIT:</b> {quote.tax_num || "-"}
                                    </div>

                                    <div className="sales-quote-field">
                                        <b>Condición fiscal:</b> {taxPosition?.desc}
                                    </div>

                                    <div className="sales-quote-field">
                                        <b>Dirección:</b> {quote?.address || "-"}
                                    </div>

                                    <div className="sales-quote-field">
                                        <b>Teléfono:</b> {quote?.phone_num || "-"}
                                    </div>
                                </div>
                            </div>

                            {/* COMERCIAL */}
                            <div className="sales-quote-card">
                                <div className="sales-quote-fields-grid">
                                    <div className="sales-quote-field">
                                        <b>Condición:</b> {condition?.desc}
                                    </div>


                                    <div className="sales-quote-field">
                                        <b>Motor:</b> {motor?.desc}
                                    </div>

                                    <div className="sales-quote-field">
                                        <b>Referencia:</b> {quote.reference}
                                    </div>

                                    <div className="sales-quote-field">
                                        <b>Orden compra:</b> {quote.purchace_order_num}
                                    </div>
                                </div>
                            </div>


                        </div>

                        {/* TOTAL */}
                        <div className="sales-quote-card">
                            <div className="sales-quote-amounts-grid">

                                <div className="sales-quote-field">
                                    <b>Subtotal:</b> {formatMoney(quote.general_subtotal)}
                                </div>

                                <div className="sales-quote-field">
                                    <b>IVA:</b> {formatMoney(quote.general_vat)}
                                </div>

                                <div className="sales-quote-field">
                                    <b>Total:</b> {formatMoney(quote.total)}
                                </div>
                                <div className="sales-quote-field">
                                    <b>Observaciones: </b>
                                    <p>{quote.observations || "-"}</p>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
                <div className="sales-quote-detail-toggle">
                    <button onClick={() => setShowDetails(prev => !prev)}>
                        {showDetails ? "▲" : "▼"}
                    </button>
                </div>
            </header>

            {/* ITEMS */}
            <section className="sales-quote-items-section">

                <div className="sales-quote-items-header">
                    <h3>Items</h3>
                </div>

                <div className="sales-quote-items-container">

                    {loadingItems ? (
                        <p>Cargando items...</p>
                    ) : items.length === 0 ? (
                        <p>No hay items</p>
                    ) : (
                        <SalesQuoteItemsList
                            items={items}
                            loading={loadingItems}
                        />
                    )}

                </div>

            </section>
        </div>
    );
};

export default SalesQuoteDetail;