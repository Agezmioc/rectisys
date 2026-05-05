import { useEffect, useState } from "react";
import { useData } from "../context/Context";
import SalesQuoteItemsList from "./SalesQuoteItemsList";

const SalesQuoteDetail = ({ quote, onBack, onEdit, onNew }) => {
    const { deleteSalesQuote, getSalesQuoteItems } = useData();

    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);

    const handleDelete = () => {
        deleteSalesQuote?.(quote.id);
        onBack?.();
    };
    
    useEffect(() => {
        const loadItems = async () => {
            setLoadingItems(true);
            const data = await getSalesQuoteItems(quote.id);
            setItems(data);
            setLoadingItems(false);
        };
        
        loadItems();
    }, [quote.id]);

    return (
        <div>
            <button onClick={onBack}>← Volver</button>

            <h2>Presupuesto #{quote.id}</h2>

            <p><b>ID:</b> {quote.id}</p>

            <p>
                <b>Comprobante:</b>{" "}
                {`${quote.letter || ""}-${String(quote.point || 0).padStart(4, "0")}-${String(quote.number || 0).padStart(8, "0")}`}
            </p>

            <p><b>Fecha:</b> {quote.date}</p>

            <p><b>Cliente (ID):</b> {quote.account_id}</p>
            <p><b>Documento (ID):</b> {quote.data_document_id}</p>
            <p><b>Condición (ID):</b> {quote.data_condition_type_id}</p>
            <p><b>Condición Fiscal (ID):</b> {quote.data_tax_position_id}</p>
            <p><b>Motor (ID):</b> {quote.motor_id}</p>

            <p><b>Dirección:</b> {quote.address}</p>
            <p><b>Teléfono:</b> {quote.phone_num}</p>
            <p><b>Referencia:</b> {quote.reference}</p>
            <p><b>Orden de compra:</b> {quote.purchace_order_num}</p>
            <p><b>Lista:</b> {quote.list}</p>

            <hr />

            <h3>Importes</h3>

            <p><b>Subtotal Conceptos:</b> {quote.concept_subtotal}</p>
            <p><b>Descuento Conceptos:</b> {quote.concept_discount}</p>

            <p><b>Subtotal Artículos:</b> {quote.article_subtotal}</p>
            <p><b>Descuento Artículos:</b> {quote.article_discount}</p>

            <p><b>Descuento General:</b> {quote.general_discount}</p>
            <p><b>Recargo General:</b> {quote.general_recharge}</p>

            <p><b>Subtotal General:</b> {quote.general_subtotal}</p>
            <p><b>IVA:</b> {quote.general_vat}</p>
            <p><b>Total:</b> {quote.total}</p>

            <hr />

            <p><b>Observaciones:</b> {quote.observations}</p>

            <p><b>Es modelo:</b> {quote.is_model === "1" ? "Sí" : "No"}</p>

            <p><b>Creado:</b> {quote.created_at}</p>
            <p><b>Actualizado:</b> {quote.updated_at}</p>

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

            <div style={{ marginTop: "1rem" }}>
                <button onClick={onNew}>Nuevo</button>
                <button onClick={onEdit}>Editar</button>
                <button onClick={handleDelete} hidden>
                    Eliminar
                </button>
            </div>
        </div>
    );
};

export default SalesQuoteDetail;