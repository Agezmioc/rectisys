import { useData } from "../context/Context";
import { useEffect, useMemo, useState } from "react";
import "./SalesOrdersList.css";
import SalesOrderDetail from "./SalesOrderDetail";
import SalesOrderManager from "./SalesOrderManager";
import { normalizeSearch } from "../utils/normalizeSearch";

const SalesOrdersList = () => {

    const {
        salesOrders,
        getSalesOrders,
        loading
    } = useData();

    const [searchInput, setSearchInput] = useState("");
    const [searchField, setSearchField] = useState("account_name");
    const [appliedQuery, setAppliedQuery] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const selectedOrder = useMemo(() => {
        return salesOrders.find(q => q.id === selectedOrderId) ?? null;
    }, [salesOrders, selectedOrderId]);

    const query = normalizeSearch(appliedQuery);

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    useEffect(() => {
        getSalesOrders();
    }, []);

    const getFieldValue = (order, field) => {

        switch (field) {

            case "account_name":
                return order.data_accounts?.name || "";

            case "document":
                return order.data_documents?.desc || "";

            case "motor":
                return order.stock_motors?.desc || "";

            case "is_closed":
                return order.is_closed ? "Sí" : "No";

            default:
                return order[field];
        }
    };

    const filteredOrders = useMemo(() => {

        return (salesOrders || [])
            .filter(order => {

                if (!query)
                    return true;

                const value = getFieldValue(
                    order,
                    searchField
                );

                if (
                    value === null ||
                    value === undefined
                ) {
                    return false;
                }

                return normalizeSearch(value).includes(query);
            })
            .sort((a, b) => b.id - a.id)
            .slice(0, 100);

    }, [
        salesOrders,
        query,
        searchField
    ]);

    const columnLabels = {

        account_name: "Cliente",

        account_id: "Cliente ID",

        document: "Documento",

        number: "Número",

        date: "Fecha",

        motor: "Motor",

        reference: "Referencia",

        purchace_order_num: "Orden Compra",

        total: "Total",

        is_closed: "Cerrada"
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (isCreating) {
        return (
            <>
                <SalesOrderManager
                    quote={null}
                    onCancel={() => setIsCreating(false)}
                    onSaved={(saved) => {
                        setIsEditing(false);
                        setIsCreating(false);
                        getSalesOrders();
                        setSelectedOrderId(saved.id);
                    }}
                />
            </>
        );
    }

    if (isEditing && selectedOrder) {
        return (
            <>
                <button onClick={() => setIsEditing(false)}>
                    ← Volver
                </button>

                <SalesOrderManager
                    initialOrder={selectedOrder}
                    onCancel={() => setIsEditing(false)}
                    onSaved={(saved) => {
                        setIsEditing(false);
                        setIsCreating(false);
                        getSalesOrders();
                        setSelectedOrderId(saved.id);
                    }}
                />
            </>
        );
    }

    if (selectedOrder) {
        return (
            <SalesOrderDetail
                order={selectedOrder}
                onBack={() => setSelectedOrderId(null)}
                onNew={() => {
                    setIsCreating(true);
                    setSelectedOrderId(null);
                }}
                onEdit={() => {
                    setSelectedOrderId(selectedOrder.id);
                    setIsEditing(true);
                }}
            />
        );
    }

    return (
        <div className="sales-orders-list">

            <div className="sales-orders-actions">

                <button onClick={() => setIsCreating(true)}>
                    + Nueva orden de trabajo
                </button>

            </div>

            <div className="sales-orders-filters">

                <input
                    className="sales-orders-input"
                    type="text"
                    placeholder="Buscar..."
                    value={searchInput}
                    onChange={e =>
                        setSearchInput(e.target.value)
                    }
                />

                <select
                    value={searchField}
                    onChange={e =>
                        setSearchField(e.target.value)
                    }
                >
                    {Object.keys(columnLabels).map(col => (

                        <option
                            key={col}
                            value={col}
                        >
                            {columnLabels[col]}
                        </option>

                    ))}
                </select>

                <button
                    onClick={() =>
                        setAppliedQuery(searchInput)
                    }
                >
                    Buscar
                </button>

            </div>

            {filteredOrders.length === 0 ? (

                <p>No hay resultados</p>

            ) : (

                <div className="sales-orders-table-container">

                    <table className="sales-orders-table">

                        <thead>

                            <tr>

                                {Object.keys(columnLabels).map(col => (

                                    <th key={col}>
                                        {columnLabels[col]}
                                    </th>

                                ))}

                            </tr>

                        </thead>

                        <tbody>

                            {filteredOrders.map(order => (

                                <tr key={order.id}>

                                    <td>
                                        {order.data_accounts?.name || "-"}
                                    </td>

                                    <td>
                                        {order.account_id}
                                    </td>

                                    <td>
                                        {order.data_documents?.desc || "-"}
                                    </td>

                                    <td>
                                        {order.number ?? "-"}
                                    </td>

                                    <td>
                                        {order.date
                                            ? new Date(order.date)
                                                .toLocaleDateString("es-AR")
                                            : "-"
                                        }
                                    </td>

                                    <td>
                                        {order.stock_motors?.desc || "-"}
                                    </td>

                                    <td>
                                        {order.reference || "-"}
                                    </td>

                                    <td>
                                        {order.purchace_order_num || "-"}
                                    </td>

                                    <td>
                                        {formatMoney(order.total)}
                                    </td>

                                    <td>
                                        {order.is_closed
                                            ? "Sí"
                                            : "No"
                                        }
                                    </td>

                                    <td>
                                        <button onClick={() => setSelectedOrderId(order.id)}>
                                            Ver detalles
                                        </button>
                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            )}

        </div>
    );
};

export default SalesOrdersList;