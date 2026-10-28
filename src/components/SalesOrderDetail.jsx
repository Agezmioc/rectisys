import { useEffect, useState } from "react";
import { useData } from "../context/Context";
import SalesOrderItemsList from "./SalesOrderItemsList";
import "./SalesOrderDetail.css";
import { buildSalesOrderPdf } from "./pdf/buildSalesOrderPdf";

const SalesOrderDetail = ({ order, onBack, onEdit, onNew }) => {

    const {
        deleteSalesOrder,
        getSalesOrderItems,
        getDataAccounts,
        getStockMotors,
        dataDocuments,
        dataConditionsTypes,
        dataTaxPositions
    } = useData();

    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [showDetails, setShowDetails] = useState(true);
    const [showPrices, setShowPrices] = useState(true);
    const [account, setAccount] = useState(null);
    const [motor, setMotor] = useState(null);
    const [loadingData, setLoadingData] = useState(true);

    const handleDelete = async () => {

        const confirmed = window.confirm(
            `¿Eliminar orden de trabajo #${order.id}?`
        );

        if (!confirmed) return;

        const deleted = await deleteSalesOrder(order.id);

        if (deleted) onBack?.();
    };

    useEffect(() => {
        let cancelled = false;

        const loadRelatedData = async () => {
            setLoadingData(true);

            try {
                const [accounts, motors] = await Promise.all([
                    order?.account_id
                        ? getDataAccounts({
                            searchField: "id",
                            searchQuery: String(order.account_id)
                        })
                        : Promise.resolve([]),

                    order?.motor_id
                        ? getStockMotors({
                            searchField: "id",
                            searchQuery: String(order.motor_id)
                        })
                        : Promise.resolve([])
                ]);

                if (!cancelled) {
                    setAccount(accounts[0] ?? null);
                    setMotor(motors[0] ?? null);
                }
            } catch (error) {
                console.error(
                    "Error cargando los datos relacionados de la OT:",
                    error
                );

                if (!cancelled) {
                    setAccount(null);
                    setMotor(null);
                }
            } finally {
                if (!cancelled) {
                    setLoadingData(false);
                }
            }
        };

        loadRelatedData();

        return () => {
            cancelled = true;
        };
    }, [
        order?.account_id,
        order?.motor_id,
        getDataAccounts,
        getStockMotors
    ]);

    useEffect(() => {
        let cancelled = false;

        const loadItems = async () => {
            if (!order?.id) {
                setItems([]);
                return;
            }

            setLoadingItems(true);

            try {
                const data = await getSalesOrderItems(order.id);

                if (!cancelled) {
                    setItems(data || []);
                }
            } catch (error) {
                console.error("Error cargando los ítems de la OT:", error);

                if (!cancelled) {
                    setItems([]);
                }
            } finally {
                if (!cancelled) {
                    setLoadingItems(false);
                }
            }
        };

        loadItems();

        return () => {
            cancelled = true;
        };
    }, [order?.id, getSalesOrderItems]);

    const document = dataDocuments.find(
        d => d.id === Number(order.data_document_id)
    );

    const condition = dataConditionsTypes.find(
        c => c.id === Number(order.data_condition_type_id)
    );

    const taxPosition = dataTaxPositions.find(
        t => t.id === Number(order.data_tax_position_id)
    );

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    if (loadingData) {
        return (
            <div className="sales-order-detail">
                <p>Cargando datos de la orden de trabajo...</p>
            </div>
        );
    }

    return (

        <div className="sales-order-detail">

            {/* HEADER */}

            <header className="sales-order-detail-header">

                <div className="sales-order-detail-topbar">

                    <button onClick={onBack}>
                        ← Volver
                    </button>

                    <div className="sales-order-detail-actions">

                        <label className="sales-order-show-prices">
                            <input
                                type="checkbox"
                                checked={showPrices}
                                onChange={e => setShowPrices(e.target.checked)}
                            />
                            Mostrar precios en PDF
                        </label>

                        <button
                            onClick={() =>
                                buildSalesOrderPdf({
                                    order,
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


                <h2 className="sales-order-detail-title">
                    Orden de trabajo #{order.id}
                </h2>


                {showDetails && (

                    <div className="sales-order-detail-body">

                        <div className="sales-order-detail-grid">

                            {/* DOCUMENTO */}

                            <div className="sales-order-card">

                                <div className="sales-order-fields-grid">

                                    <div className="sales-order-field">
                                        <b>Documento:</b>{" "}
                                        {document?.desc || "-"}
                                    </div>

                                    <div className="sales-order-field">
                                        <b>Comprobante:</b>{" "}
                                        {`${order.letter || ""}-${String(
                                            order.point || 0
                                        ).padStart(4, "0")}-${String(
                                            order.number || 0
                                        ).padStart(8, "0")}`}
                                    </div>

                                    <div className="sales-order-field">
                                        <b>Fecha:</b>{" "}
                                        {order.date
                                            ? new Date(
                                                order.date
                                            ).toLocaleDateString("es-AR")
                                            : "-"
                                        }
                                    </div>

                                    <div className="sales-order-field">
                                        <b>Versión:</b>{" "}
                                        {order.version ?? "-"}
                                    </div>

                                    <div className="sales-order-field">
                                        <b>Estado:</b>{" "}
                                        {order.is_closed
                                            ? "Cerrada"
                                            : "Abierta"
                                        }
                                    </div>

                                </div>

                            </div>


                            {/* CLIENTE */}

                            <div className="sales-order-card">
                                <div className="sales-order-fields-grid">

                                    <div className="sales-order-field">
                                        <b>Cliente:</b>{" "}
                                        {(order.name || "-") + " [" + (account?.id || "-") + "]"}
                                    </div>

                                    <div className="sales-order-field">
                                        <b>Condición fiscal:</b>{" "}
                                        {taxPosition?.desc || "-"}
                                    </div>

                                    <div className="sales-order-field">
                                        <b>C.U.I.T.:</b>{" "}
                                        {account?.tax_num || "-"}
                                    </div>

                                    <div className="sales-order-field">
                                        <b>Email:</b>{" "}
                                        {order.email || "-"}
                                    </div>

                                    <div className="sales-order-field">
                                        <b>Teléfono:</b>{" "}
                                        {order.phone_num || "-"}
                                    </div>

                                    <div className="sales-order-field">
                                        <b>Dirección:</b>{" "}
                                        {order.address || "-"}
                                    </div>

                                    <div className="sales-order-field">
                                        <b>Localidad:</b>{" "}
                                        {order.district || "-"}
                                    </div>

                                </div>
                            </div>


                            {/* COMERCIAL */}

                            <div className="sales-order-card">

                                <div className="sales-order-fields-grid">

                                    <div className="sales-order-field">
                                        <b>Condición:</b>{" "}
                                        {(condition?.desc || "-") + " [" + (order.data_condition_type_id || "-") + "]" }
                                    </div>

                                    <div className="sales-order-field">
                                        <b>Motor:</b>{" "}
                                        {motor?.desc || "-"}
                                    </div>

                                    <div className="sales-order-field">
                                        <b>Referencia:</b>{" "}
                                        {order.reference || "-"}
                                    </div>

                                    <div className="sales-order-field">
                                        <b>Orden compra:</b>{" "}
                                        {order.purchace_order_num || "-"}
                                    </div>

                                    <div className="sales-order-field">
                                        <b>Estado:</b>{" "}
                                        {order.is_closed ? "Cerrado" : "En proceso"}
                                    </div>

                                    <div className="sales-order-field">
                                        <b>Fecha de Cierre:</b>{" "}
                                        {order.closing_date
                                            ? new Date(
                                                order.closing_date
                                            ).toLocaleDateString("es-AR")
                                            : "-"
                                        }
                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* TOTAL */}

                        <div className="sales-order-card">

                            <div className="sales-order-amounts-grid">

                                <div className="sales-order-field">

                                    <b>Observaciones:</b>

                                    <p>
                                        {order.observations || "-"}
                                    </p>

                                </div>

                                <div className="sales-order-field">
                                    <b>Total:</b>{" "}
                                    {formatMoney(order.total)}
                                </div>

                            </div>

                        </div>

                    </div>

                )}


                <div className="sales-order-detail-toggle">

                    <button
                        onClick={() =>
                            setShowDetails(prev => !prev)
                        }
                    >
                        {showDetails ? "▲" : "▼"}
                    </button>

                </div>

            </header>


            {/* ITEMS */}

            <section className="sales-order-items-section">

                <div className="sales-order-items-header">

                    <h3>Artículos</h3>

                </div>


                <div className="sales-order-items-container">

                    {loadingItems ? (

                        <p>Cargando artículos...</p>

                    ) : items.length === 0 ? (

                        <p>No hay artículos</p>

                    ) : (

                        <SalesOrderItemsList
                            items={items}
                            loading={loadingItems}
                        />

                    )}

                </div>

            </section>
        </div>
    );
};

export default SalesOrderDetail;
