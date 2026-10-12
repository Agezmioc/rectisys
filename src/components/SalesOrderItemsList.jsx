import "./SalesOrderItemsList.css";

const SalesOrderItemsList = ({ items, loading }) => {

    if (loading) {
        return <p>Cargando conceptos...</p>;
    }

    if (!items.length) {
        return <p>No hay conceptos</p>;
    }

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    return (

        <div className="sales-order-items-table-container">

            <table className="sales-order-items-table">

                <thead>

                    <tr>
                        <th>#</th>
                        <th>ID</th>
                        <th>Código</th>
                        <th>Descripción</th>
                        <th>Tipo</th>
                        <th>Sección</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>IVA</th>
                        <th>Total</th>
                        <th>Comentario</th>
                    </tr>

                </thead>


                <tbody>

                    {items.map((item, index) => (

                        <tr key={item.id}>

                            <td>
                                {String(index + 1).padStart(3, "0")}
                            </td>

                            <td>
                                {item.stock_art_id}
                            </td>

                            <td>
                                {item.stock_articles?.code || "-"}
                            </td>

                            <td>
                                {item.stock_articles?.desc || "-"}
                            </td>

                            <td>
                                {item.is_concept ? "Concepto" : "Artículo"}
                            </td>

                            <td>
                                {item.sales_sections?.name || "-"}
                            </td>

                            <td>
                                {item.quantity}
                            </td>

                            <td>
                                {formatMoney(item.price)}
                            </td>

                            <td>
                                {item.vat_value}
                            </td>

                            <td>
                                {formatMoney(item.total)}
                            </td>

                            <td>
                                {item.comment || "-"}
                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
};

export default SalesOrderItemsList;