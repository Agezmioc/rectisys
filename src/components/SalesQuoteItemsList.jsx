const SalesQuoteItemsList = ({ items, loading }) => {
    if (loading) return <p>Cargando items...</p>;

    if (!items.length) return <p>No hay items</p>;

    return (
        <table style={{ width: "100%", marginTop: "1rem" }}>
            <thead>
                <tr>
                    <th>Artículo ID</th>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th>Concepto</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>IVA</th>
                    <th>Total</th>
                    <th>Comentario</th>
                </tr>
            </thead>

            <tbody>
                {items.map(item => (
                    <tr key={item.id}>
                        <td>{item.stock_art_id}</td>
                        <td>{item.stock_articles?.code}</td>
                        <td>{item.stock_articles?.desc}</td>
                        <td>{item.is_concept ? "Sí" : "No"}</td>
                        <td>{item.quantity}</td>
                        <td>{item.price}</td>
                        <td>{item.vat_value}</td>
                        <td>{item.total}</td>
                        <td>{item.comment}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default SalesQuoteItemsList;