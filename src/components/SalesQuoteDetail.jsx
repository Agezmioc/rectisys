import { useEffect, useState } from "react";
import { useData } from "../context/Context";
import SalesQuoteItemsList from "./SalesQuoteItemsList";

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

    const account = dataAccounts.find(a => a.id === Number(quote.account_id));
    const document = dataDocuments.find(d => d.id === Number(quote.data_document_id));
    const condition = dataConditionsTypes.find(c => c.id === Number(quote.data_condition_type_id));
    const taxPosition = dataTaxPositions.find(t => t.id === Number(quote.data_tax_position_id));
    const motor = stockMotors.find(m => m.id === Number(quote.motor_id));

    return (
        <div>
            <button onClick={onBack}>← Volver</button>
            
            <div style={{ margin: "1rem" }}>
                <button onClick={onNew}>Nuevo</button>
                <button onClick={onEdit}>Editar</button>
                <button onClick={handleDelete}>Eliminar</button>
            </div>

            <h2>Presupuesto #{quote.id}</h2>

            <p><b>Documento:</b> {document?.desc}</p>

            <p>
                <b>Comprobante:</b>{" "}
                {`${quote.letter || ""}-${String(quote.point || 0).padStart(4, "0")}-${String(quote.number || 0).padStart(8, "0")}`}
            </p>

            <p><b>Fecha:</b> {quote.date}</p>

            <p><b>Es modelo:</b> {quote.is_model === "1" ? "Sí" : "No"}</p>

            <hr />

            <p><b>Cliente:</b> {account?.name}</p>
            <p><b>CUIT:</b> {account?.tax_num}</p>

            <p><b>Dirección:</b> {quote.address}</p>
            <p><b>Teléfono:</b> {quote.phone_num}</p>

            <p><b>Condición:</b> {condition?.desc}</p>
            <p><b>Condición fiscal:</b> {taxPosition?.desc}</p>

            <p><b>Motor:</b> {motor?.desc}</p>

            <p><b>Referencia:</b> {quote.reference}</p>
            <p><b>Orden de compra:</b> {quote.purchace_order_num}</p>

            <hr />

            <h3>Total</h3>
            <p><b>Total:</b> {quote.total}</p>

            <hr />

            <p><b>Observaciones:</b> {quote.observations}</p>

            <hr />

            <h3>Items</h3>

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

            <hr />
        </div>
    );
};

export default SalesQuoteDetail;