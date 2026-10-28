import { useEffect, useState, useMemo } from "react";
import { useData } from "../context/Context";
import { useAuth } from "../context/AuthContext";
import EditSalesOrderItemsList from "./EditSalesOrderItemsList";
import AccountSelector from "./AccountSelector";
import MotorSelector from "./MotorSelector";
import "./SalesOrderManager.css";
import ImportSalesQuote from "./ImportSalesQuote"
import { isValidNumberInput } from "../utils/numberInput";

const SalesOrderManager = ({
    initialOrder = null,
    onCancel,
    onSaved
}) => {

    const {
        createSalesOrder,
        updateSalesOrder,
        getDataAccounts,
        dataConditionsTypes,
        dataTaxPositions,
        dataDocuments,
        stockLists,
        salesSections,
        getDataDocuments,
        getDataConditionsTypes,
        getDataTaxPositions,
        getStockMotors,
        getSalesOrderItems,
        getSalesSections
    } = useData();


    const [showAccountSelector, setShowAccountSelector] = useState(false);
    const [showMotorSelector, setShowMotorSelector] = useState(false);
    const [showDetails, setShowDetails] = useState(true);
    const [showSalesQuoteImporter, setShowSalesQuoteImporter] = useState(false);

    const DOCUMENT_TYPE = "orden de trabajo";

    const documentId = useMemo(() => {

        return dataDocuments.find(
            d => d.desc?.toLowerCase() === DOCUMENT_TYPE
        )?.id ?? null;

    }, [dataDocuments]);

    const { role } = useAuth();

    const isManagement =
        role?.name?.trim().toLowerCase() === "gerencia";

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const emptyOrder = {

        account_id: "",
        data_document_id: documentId,

        data_condition_type_id: "",
        data_tax_position_id: "",
        motor_id: "",

        name: "",
        email: "",
        phone_num: "",

        address: "",
        district: "",

        reference: "",
        purchace_order_num: "",
        list_id: "",

        observations: "",

        date: new Date().toISOString().slice(0, 10),

        letter: "",
        point: "",
        number: "",
        version: 1,

        origin_document_id: null,
        origin_document_number: "",
        origin_id: null,

        concept_subtotal: 0,
        concept_discount: 0,

        article_subtotal: 0,
        article_discount: 0,

        general_discount: 0,
        general_recharge: 0,

        general_subtotal: 0,
        general_vat: 0,

        total: 0,

        is_closed: false

    };


    const [order, setOrder] = useState(() => {

        if (!initialOrder) return emptyOrder;

        return {
            ...emptyOrder,
            ...initialOrder,

            date: initialOrder.date
                ? String(initialOrder.date).slice(0, 10)
                : emptyOrder.date,

            is_closed:
                initialOrder.is_closed === true ||
                initialOrder.is_closed === "true" ||
                initialOrder.is_closed === 1 ||
                initialOrder.is_closed === "1"
        };

    });

    const isImportedFromQuote = Boolean(order.origin_id);

    const [items, setItems] = useState([]);


    const [motorSelection, setMotorSelection] = useState({
        motorId: null,
        motor: null
    });

    const motorId = Number(order.motor_id);

    const selectedMotor =
        motorSelection.motorId === motorId
            ? motorSelection.motor
            : null;

    useEffect(() => {
        if (!order.motor_id) return;

        const currentMotorId = Number(order.motor_id);
        let cancelled = false;

        const loadMotor = async () => {
            try {
                const motors = await getStockMotors({
                    searchField: "id",
                    searchQuery: String(currentMotorId)
                });

                if (!cancelled) {
                    setMotorSelection({
                        motorId: currentMotorId,
                        motor: motors[0] ?? null
                    });
                }
            } catch (error) {
                console.error("Error cargando el motor de la orden:", error);

                if (!cancelled) {
                    setMotorSelection({
                        motorId: currentMotorId,
                        motor: null
                    });
                }
            }
        };

        loadMotor();

        return () => {
            cancelled = true;
        };
    }, [order.motor_id, getStockMotors]);

    const [accountSelection, setAccountSelection] = useState({
        accountId: null,
        account: null
    });

    const selectedAccount =
        accountSelection.accountId === Number(order.account_id)
            ? accountSelection.account
            : null;

    useEffect(() => {
        if (!order.account_id) return;

        const currentAccountId = Number(order.account_id);
        let cancelled = false;

        const loadAccount = async () => {
            try {
                const accounts = await getDataAccounts({
                    searchField: "id",
                    searchQuery: String(currentAccountId)
                });

                if (!cancelled) {
                    setAccountSelection({
                        accountId: currentAccountId,
                        account: accounts[0] ?? null
                    });
                }
            } catch (error) {
                console.error(
                    "Error cargando el cliente de la orden:",
                    error
                );

                if (!cancelled) {
                    setAccountSelection({
                        accountId: currentAccountId,
                        account: null
                    });
                }
            }
        };

        loadAccount();

        return () => {
            cancelled = true;
        };
    }, [order.account_id, getDataAccounts]);

    /*
     * La orden tiene list_id propio.
     *
     * Si la lista se determina automáticamente a partir
     * del motor, podemos mantener este comportamiento.
     */
    const listId =
        order.list_id ||
        selectedMotor?.list_id ||
        "";


    const listObj = stockLists.find(
        l => l.id === Number(listId)
    );


    const isConsumerFinalAccount =
        Number(order.account_id) === 1;

    const integerFields = [
        "data_condition_type_id",
        "data_tax_position_id",
        "motor_id",
        "list_id",
        "point",
        "number",
        "version"
    ];

    const decimalFields = [
        "concept_discount",
        "article_discount",
        "general_discount",
        "general_recharge"
    ];


    const handleOrderChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === "checkbox") {
            setOrder(prev => ({
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

        setOrder(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImportSalesQuotes = async (quotes) => {
        if (!quotes || quotes.length === 0) return;

        /*
        * Como solo puede seleccionarse un presupuesto,
        * tomamos el primero.
        */

        const quote = quotes[0];

        try {
            if (!quotes?.length) {
                setShowSalesQuoteImporter(false);
                return;
            }

            if (isConsumerFinalAccount) {
                setShowSalesQuoteImporter(false);
                return;
            }

            if (quote.account_id) {
                const accounts = await getDataAccounts({
                    searchField: "id",
                    searchQuery: String(quote.account_id)
                });

                setAccountSelection({
                    accountId: Number(quote.account_id),
                    account: accounts[0] ?? null
                });
            }

            if (quote.motor_id) {
                const motors = await getStockMotors({
                    searchField: "id",
                    searchQuery: String(quote.motor_id)
                });

                setMotorSelection({
                    motorId: Number(quote.motor_id),
                    motor: motors[0] ?? null
                });
            }

            /*
            * Copiar datos generales del presupuesto
            * a la orden.
            */

            setOrder(prev => ({

                ...prev,

                account_id:
                    quote.account_id ??
                    prev.account_id,

                data_condition_type_id:
                    quote.data_condition_type_id ??
                    prev.data_condition_type_id,

                data_tax_position_id:
                    quote.data_tax_position_id ??
                    prev.data_tax_position_id,

                motor_id:
                    quote.motor_id ??
                    prev.motor_id,

                name:
                    quote.name ?? prev.name,

                email:
                    quote.email ?? prev.email,

                address:
                    quote.address ??
                    prev.address,

                district:
                    quote.district ?? prev.district,

                phone_num:
                    quote.phone_num ??
                    prev.phone_num,

                reference:
                    quote.reference ??
                    prev.reference,

                purchace_order_num:
                    quote.purchace_order_num ??
                    prev.purchace_order_num,

                observations:
                    quote.observations ??
                    prev.observations,

                concept_discount:
                    Number(quote.concept_discount) || 0,

                article_discount:
                    Number(quote.article_discount) || 0,

                general_discount:
                    Number(quote.general_discount) || 0,

                general_recharge:
                    Number(quote.general_recharge) || 0,

                origin_document_id:
                    quote.data_document_id ?? null,

                origin_document_number:
                    `${quote.letter || ""}-${String(
                        quote.point || 0
                    ).padStart(4, "0")}-${String(
                        quote.number || 0
                    ).padStart(8, "0")}`,



                    origin_id:
                    quote.id

                }));

            /*
            * Convertir los items pendientes del presupuesto
            * en items de la orden.
            */

            const importedItems =
                (quote.pending_items || []).map(item => {

                    const quantity =
                        Number(item.quantity) || 0;

                    const completed =
                        Number(item.completed) || 0;

                    const pendingQuantity =
                        quantity - completed;


                    const price =
                        Number(item.price) || 0;

                    const vatValue =
                        Number(item.vat_value) || 0;


                    const base =
                        pendingQuantity * price;


                    const total =
                        isConsumerFinal
                            ? base * (1 + vatValue / 100)
                            : base;


                    return {

                        temp_id:
                            crypto.randomUUID(),

                        stock_art_id:
                            item.stock_art_id,

                        origin_id:
                            quote.id,

                        origin_document_number:
                            `${quote.letter || ""}-${String(
                                quote.point || 0
                            ).padStart(4, "0")}-${String(
                                quote.number || 0
                            ).padStart(8, "0")}`,

                        origin_document_id:
                            quote.data_document_id ?? null,


                        origin_item_id:
                            item.id,

                        article_code:
                            item.stock_articles?.code ||
                            item.article_code ||
                            "",

                        article_desc:
                            item.stock_articles?.desc ||
                            item.article_desc ||
                            "",

                        is_concept:
                            Boolean(item.is_concept),

                        sales_section_id:
                            "",

                        /*
                        * Cantidad inicial importada.
                        */

                        quantity:
                            pendingQuantity,

                        /*
                        * Límite máximo que podrá tener
                        * este item.
                        */

                        imported_quantity:
                            pendingQuantity,

                        cancelled:
                            0,

                        completed:
                            0,

                        price,

                        vat_value:
                            vatValue,

                        total,

                        comment:
                            item.comment || ""

                    };

                });


            /*
            * Reemplazar los items actuales.
            *
            * Esto hace que importar otro presupuesto
            * reemplace completamente al anterior.
            */

            setItems(importedItems);

            setShowSalesQuoteImporter(false);
        } catch (error) {
            console.error("Error importando el presupuesto:", error);
        }

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        const now = new Date().toISOString();

        const articlesWithoutSection = items.filter(
            item => !item.sales_section_id
        );


        if (articlesWithoutSection.length > 0) {

            alert(
                "No se puede guardar la orden porque hay artículos sin sección seleccionada."
            );

            return;
        }

        if (!order.account_id) {
            alert("Debe seleccionar un cliente.");
            return;
        }

        if (!order.motor_id) {
            alert("Debe seleccionar un motor.");
            return;
        }

        if (!order.data_condition_type_id) {
            alert("Debe seleccionar una condición.");
            return;
        }

        if (!order.data_tax_position_id) {
            alert("Debe seleccionar una condición fiscal.");
            return;
        }


        const orderData = {

            account_id:
                order.account_id
                    ? Number(order.account_id)
                    : null,

            data_document_id:
                documentId,

            data_condition_type_id:
                order.data_condition_type_id
                    ? Number(order.data_condition_type_id)
                    : null,

            data_tax_position_id:
                order.data_tax_position_id
                    ? Number(order.data_tax_position_id)
                    : null,

            motor_id:
                order.motor_id
                    ? Number(order.motor_id)
                    : null,

            list_id:
                listId
                    ? Number(listId)
                    : null,

            name: order.name,
            phone_num: order.phone_num,
            email: order.email,
            address: order.address,
            district: order.district,

            reference: order.reference,
            purchace_order_num: order.purchace_order_num,

            origin_documents: order.origin_document_number,

            observations: order.observations,

            date: order.date,

            letter: order.letter,
            point: order.point,
            number: order.number,
            version: initialOrder
                ? (Number(order.version) || 0) + 1
                : 1,


            concept_subtotal:
                conceptSubtotal,

            concept_discount:
                order.concept_discount,

            article_subtotal:
                articleSubtotal,

            article_discount:
                order.article_discount,

            general_discount:
                order.general_discount,

            general_recharge:
                order.general_recharge,

            general_subtotal:
                generalSubtotal,

            general_vat:
                vatAmount,

            total:
                total,

            is_closed:
                order.is_closed,

            created_at: initialOrder?.created_at || now,
            updated_at: now

        };


        const saved = initialOrder

            ? await updateSalesOrder(
                initialOrder.id,
                orderData,
                items,
                order.origin_id
            )

            : await createSalesOrder(
                orderData,
                items,
                order.origin_id
            );


        if (!saved) return;


        console.log("SAVED ORDER:", saved);

        onSaved?.(saved);

    };


    const renderSelect = (
        name,
        label,
        value,
        options,
        labelKey = "desc"
    ) => (

        <div style={{ marginBottom: "0.75rem" }}>

            <label
                style={{
                    display: "block",
                    fontWeight: "bold"
                }}
            >
                {label}
            </label>


            <select
                name={name}
                value={
                    value !== undefined &&
                    value !== null
                        ? String(value)
                        : ""
                }
                onChange={handleOrderChange}
            >

                <option value="" disabled hidden>
                    Seleccionar...
                </option>


                {options.map(opt => (

                    <option
                        key={opt.id}
                        value={String(opt.id)}
                    >
                        {opt[labelKey]}
                    </option>

                ))}

            </select>

        </div>

    );


    /*
     * Carga de datos generales
     */

    useEffect(() => {
        getDataDocuments();
        getDataConditionsTypes();
        getDataTaxPositions();
        getSalesSections?.();
    }, []);


    /*
     * Carga de items cuando estamos editando
     */

    useEffect(() => {

        const loadItems = async () => {

            if (!order?.id) return;


            const data =
                await getSalesOrderItems(order.id);


            const loadedItems =
                data || [];


            setItems(loadedItems);


            /*
            * Reconstruir el origen del presupuesto
            * cuando la orden fue cargada desde DB.
            */

            const importedItem =
                loadedItems.find(
                    item =>
                        item.origin_quote_id != null
                );


            if (importedItem) {

                setOrder(prev => ({

                    ...prev,

                    origin_id:
                        Number(
                            importedItem.origin_quote_id
                        )

                }));

            }

        };


        loadItems();

    }, [order?.id]);

    /*
    * Cálculo de importes
    *
    * Las órdenes pueden contener conceptos y artículos.
    */

    const {
            conceptSubtotal,
            articleSubtotal,
            generalSubtotal,
            vatAmount,
            total,
            isConsumerFinal
        } = useMemo(() => {

            const taxPosition =
                dataTaxPositions.find(
                    t =>
                        t.id ===
                        Number(order.data_tax_position_id)
                );


            const isConsumerFinal =
                !!taxPosition?.vat_included;


            const vatRate = 21;


            const calculateItemTotal = (item) => {

                const quantity =
                    Number(item.quantity) || 0;

                const price =
                    Number(item.price) || 0;

                const vat =
                    Number(
                        item.vat_value ??
                        item.vat ??
                        0
                    );


                const base =
                    quantity * price;


                return isConsumerFinal
                    ? base * (1 + vat / 100)
                    : base;

            };


            /*
            * CONCEPTOS
            */

            const conceptTotal = items
                .filter(item => item.is_concept)
                .reduce(
                    (sum, item) =>
                        sum + calculateItemTotal(item),
                    0
                );


            /*
            * ARTÍCULOS
            */

            const articleTotal = items
                .filter(item => !item.is_concept)
                .reduce(
                    (sum, item) =>
                        sum + calculateItemTotal(item),
                    0
                );


            /*
            * DESCUENTOS
            */

            const conceptDiscountPct =
                Number(order.concept_discount) || 0;

            const articleDiscountPct =
                Number(order.article_discount) || 0;

            const generalDiscountPct =
                Number(order.general_discount) || 0;

            const generalRechargePct =
                Number(order.general_recharge) || 0;


            /*
            * SUBTOTALES POR TIPO
            */

            const conceptSubtotal =
                conceptTotal *
                (1 - conceptDiscountPct / 100);


            const articleSubtotal =
                articleTotal *
                (1 - articleDiscountPct / 100);


            /*
            * SUBTOTAL GENERAL
            */

            const baseSubtotal =
                conceptSubtotal +
                articleSubtotal;


            const generalSubtotal =
                baseSubtotal *
                (1 - generalDiscountPct / 100) *
                (1 + generalRechargePct / 100);


            /*
            * IVA
            */

            const vatAmount =
                isConsumerFinal
                    ? 0
                    : generalSubtotal * (vatRate / 100);


            /*
            * TOTAL
            */

            const total =
                isConsumerFinal
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
            order.concept_discount,
            order.article_discount,
            order.general_discount,
            order.general_recharge,
            order.data_tax_position_id,
            dataTaxPositions
        ]);


    /*
     * Selector de cliente
     */

    if (showAccountSelector) {

        return (

            <AccountSelector

                onConfirm={(account) => {
                    const isConsumerFinal = Number(account.id) === 1;

                    setAccountSelection({
                        accountId: Number(account.id),
                        account
                    });

                    setOrder(prev => ({
                        ...prev,
                        account_id: account.id,
                        name: isConsumerFinal ? "" : account.name || "",
                        email: isConsumerFinal ? "" : account.email || "",
                        district: isConsumerFinal ? "" : account.district || "",
                        address: account.address || "",
                        phone_num: account.phone_num || "",
                        data_tax_position_id: account.tax_position_id || ""
                    }));

                    setShowAccountSelector(false);
                }}

                onCancel={() => setShowMotorSelector(false)}
            />

        );

    }


    /*
     * Selector de motor
     */

    if (showMotorSelector) {
        return (
            <MotorSelector
                onConfirm={(motor) => {
                    setMotorSelection({
                        motorId: Number(motor.id),
                        motor
                    });

                    setOrder(prev => ({
                        ...prev,
                        motor_id: motor.id,
                        list_id: motor.list_id || ""
                    }));

                    setShowMotorSelector(false);
                }}
                onCancel={() => setShowMotorSelector(false)}
            />
        );
    }

    if (showSalesQuoteImporter) {
        return (
            <ImportSalesQuote
                accountId={order.account_id}
                onConfirm={handleImportSalesQuotes}
                onCancel={() => {
                    setShowSalesQuoteImporter(false);
                }}
            />
        );
    }

    return (

        <div className="sales-order-manager">


            {/* HEADER */}

            <header className="sales-order-manager-header">

                <div className="sales-order-manager-topbar">

                    <h2>

                        {initialOrder

                            ? `Editar Orden de Trabajo #${initialOrder.id}`

                            : "Nueva Orden de Trabajo"

                        }

                    </h2>


                    <div className="sales-order-manager-actions">

                        <button
                            type="button"
                            onClick={() => setShowSalesQuoteImporter(true)}
                            disabled={
                                !order.account_id ||
                                isConsumerFinalAccount
                            }
                        >
                            Importar de Presupuesto
                        </button>

                        <button
                            type="submit"
                            form="order-form"
                        >
                            {initialOrder
                                ? "Actualizar"
                                : "Guardar"
                            }
                        </button>


                        <button
                            type="button"
                            onClick={onCancel}
                        >
                            Cancelar
                        </button>

                    </div>

                </div>

            </header>


            {/* BODY */}

            <div className="sales-order-manager-body">

                <form
                    id="order-form"
                    onSubmit={handleSubmit}
                >


                    {/* PRINCIPALES */}

                    {showDetails && (

                        <section className="sales-order-card-grid">


                            {/* DOCUMENTO / CLIENTE */}

                            <div className="sales-order-card">

                                <div className="sales-order-card-content">

                                    <label>

                                        {dataDocuments.find(
                                            d =>
                                                d.id ===
                                                Number(order.data_document_id)
                                        )?.desc ||
                                            "Orden de trabajo"}

                                        {initialOrder && (
                                            <>
                                                {" "}
                                                {`${order.letter || ""}-${String(
                                                    order.point || 0
                                                ).padStart(4, "0")}-${String(
                                                    order.number || 0
                                                ).padStart(8, "0")}`}
                                            </>
                                        )}

                                    </label>


                                    <div>

                                        <label>

                                            Fecha:{" "}

                                            {order.date
                                                ? new Date(
                                                    order.date
                                                ).toLocaleDateString(
                                                    "es-AR"
                                                )
                                                : ""
                                            }

                                        </label>

                                    </div>


                                    <div>

                                        <label>
                                            <b>Cliente:</b> {selectedAccount?.name || ""}
                                        </label>


                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (isImportedFromQuote) return;
                                                setShowAccountSelector(true);
                                            }}
                                            disabled={isImportedFromQuote}
                                        >
                                            Seleccionar cliente
                                        </button>

                                    </div>


                                    <div>

                                        <label>
                                            Motor: {selectedMotor?.desc || ""}
                                        </label>


                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (isImportedFromQuote) return;
                                                setShowMotorSelector(true);
                                            }}
                                            disabled={isImportedFromQuote}
                                        >
                                            Seleccionar motor
                                        </button>

                                    </div>


                                    <div>

                                        <label>
                                            Lista:{" "}
                                            {listObj?.desc ||
                                                "Sin lista"}
                                        </label>

                                    </div>

                                    <div>

                                        <label>
                                            Origen:{" "}

                                            {order.origin_id
                                                ? `Presupuesto ${order.origin_document_number}`
                                                : "Sin origen"
                                            }

                                        </label>

                                    </div>


                                    <div>

                                        <label className="sales-order-checkbox">
                                            Estado:{" "}
                                            {order.is_closed ? "Cerrada" : "Abierta"}

                                            {isManagement && initialOrder && (
                                                <>
                                                    {" "}
                                                    <input
                                                        type="checkbox"
                                                        name="is_closed"
                                                        checked={order.is_closed}
                                                        onChange={handleOrderChange}
                                                    />
                                                </>
                                            )}
                                        </label>

                                    </div>

                                </div>

                            </div>


                            {/* COMERCIAL */}

                            <div className="sales-order-card">

                                <div className="sales-order-card-content">

                                    <div>
                                        <label>Nombre</label>
                                        <input
                                            name="name"
                                            value={order.name || ""}
                                            onChange={handleOrderChange}
                                            readOnly={!isConsumerFinalAccount}
                                        />
                                    </div>

                                    <div>
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={order.email || ""}
                                            onChange={handleOrderChange}
                                            readOnly={!isConsumerFinalAccount}
                                        />
                                    </div>

                                    <div>

                                        <label>
                                            Teléfono
                                        </label>

                                        <input
                                            name="phone_num"
                                            value={
                                                order.phone_num || ""
                                            }
                                            onChange={
                                                handleOrderChange
                                            }
                                            readOnly={
                                                !isConsumerFinalAccount
                                            }
                                        />

                                    </div>

                                    <div>

                                        <label>
                                            Condición fiscal
                                        </label>

                                        <input
                                            value={
                                                dataTaxPositions.find(
                                                    t =>
                                                        t.id ===
                                                        Number(
                                                            order.data_tax_position_id
                                                        )
                                                )?.desc || ""
                                            }
                                            readOnly
                                        />

                                    </div>


                                    <div>

                                        <label>
                                            Dirección
                                        </label>

                                        <input
                                            name="address"
                                            value={
                                                order.address || ""
                                            }
                                            onChange={
                                                handleOrderChange
                                            }
                                            readOnly={
                                                !isConsumerFinalAccount
                                            }
                                        />

                                    </div>

                                    <div>
                                        <label>Localidad</label>
                                        <input
                                            name="district"
                                            value={order.district || ""}
                                            onChange={handleOrderChange}
                                            readOnly={!isConsumerFinalAccount}
                                        />
                                    </div>


                                    {renderSelect(
                                        "data_condition_type_id",
                                        "Condición",
                                        order.data_condition_type_id,
                                        dataConditionsTypes,
                                        "desc"
                                    )}

                                </div>

                            </div>


                            {/* REFERENCIAS */}

                            <div className="sales-order-card">

                                <div className="sales-order-card-content">

                                    <div>

                                        <label>
                                            Referencia
                                        </label>

                                        <input
                                            name="reference"
                                            value={
                                                order.reference || ""
                                            }
                                            onChange={
                                                handleOrderChange
                                            }
                                        />

                                    </div>


                                    <div>

                                        <label>
                                            Orden de compra
                                        </label>

                                        <input
                                            name="purchace_order_num"
                                            value={
                                                order.purchace_order_num || ""
                                            }
                                            onChange={
                                                handleOrderChange
                                            }
                                        />

                                    </div>


                                    <div className="sales-order-card-full">

                                        <label>
                                            Observaciones
                                        </label>

                                        <textarea
                                            name="observations"
                                            value={
                                                order.observations || ""
                                            }
                                            onChange={
                                                handleOrderChange
                                            }
                                        />

                                    </div>

                                </div>

                            </div>

                        </section>

                    )}


                    {/* IMPORTES */}

                    <section>

                        <div className="sales-order-card">

                            <div className="sales-order-amounts-grid">

                                {showDetails ? (

                                    <>

                                        <div className="sales-order-amount">

                                            <label>
                                                Descuento Artículos (%)
                                            </label>

                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                name="article_discount"
                                                value={
                                                    order.article_discount
                                                }
                                                onChange={
                                                    handleOrderChange
                                                }
                                            />

                                        </div>


                                        <div className="sales-order-amount">

                                            <label>
                                                Subtotal Artículos
                                            </label>

                                            <span>
                                                {formatMoney(articleSubtotal)}
                                            </span>

                                        </div>

                                        <div className="sales-order-amount">

                                            <label>
                                                Descuento Conceptos (%)
                                            </label>

                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                name="concept_discount"
                                                value={
                                                    order.concept_discount
                                                }
                                                onChange={
                                                    handleOrderChange
                                                }
                                            />

                                        </div>


                                        <div className="sales-order-amount">

                                            <label>
                                                Subtotal Conceptos
                                            </label>

                                            <span>
                                                {formatMoney(conceptSubtotal)}
                                            </span>

                                        </div>


                                        <div className="sales-order-amount">

                                            <label>
                                                Descuento General (%)
                                            </label>

                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                name="general_discount"
                                                value={
                                                    order.general_discount
                                                }
                                                onChange={
                                                    handleOrderChange
                                                }
                                            />

                                        </div>


                                        <div className="sales-order-amount">

                                            <label>
                                                Recargo General (%)
                                            </label>

                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                name="general_recharge"
                                                value={
                                                    order.general_recharge
                                                }
                                                onChange={
                                                    handleOrderChange
                                                }
                                            />

                                        </div>


                                        <div className="sales-order-amount">

                                            <label>
                                                Subtotal General
                                            </label>

                                            <span>
                                                {formatMoney(generalSubtotal)}
                                            </span>

                                        </div>


                                        <div className="sales-order-amount">

                                            <label>
                                                IVA
                                            </label>

                                            <span>
                                                {formatMoney(vatAmount)}
                                            </span>

                                        </div>


                                        <div className="sales-order-amount">

                                            <label>
                                                <b>Total</b>
                                            </label>

                                            <span>
                                                <b>
                                                    {formatMoney(total)}
                                                </b>
                                            </span>

                                        </div>

                                    </>

                                ) : (

                                    <>

                                        <div>

                                            <label>

                                                <b>
                                                    {initialOrder
                                                        ? `Orden ${order.letter || ""}-${String(
                                                            order.point || 0
                                                        ).padStart(4, "0")}-${String(
                                                            order.number || 0
                                                        ).padStart(8, "0")}`
                                                        : "Nueva Orden de Trabajo"
                                                    }
                                                </b>

                                            </label>

                                        </div>


                                        <div>

                                            <label>

                                                <b>Fecha:</b>{" "}

                                                {order.date
                                                    ? new Date(
                                                        order.date
                                                    ).toLocaleDateString(
                                                        "es-AR"
                                                    )
                                                    : ""
                                                }

                                            </label>

                                        </div>


                                        <div>

                                            <label>
                                                <b>Cliente:</b> {selectedAccount?.name || ""}
                                            </label>

                                        </div>


                                        <div className="sales-order-amount">

                                            <label>

                                                <b>
                                                    Total:{" "}
                                                    {formatMoney(total)}
                                                </b>

                                            </label>

                                        </div>

                                    </>

                                )}

                            </div>

                        </div>

                    </section>


                    {/* TOGGLE */}

                    <div className="sales-order-manager-toggle">

                        <button
                            type="button"
                            onClick={() =>
                                setShowDetails(prev => !prev)
                            }
                        >
                            {showDetails
                                ? "▲"
                                : "▼"
                            }
                        </button>

                    </div>


                    {/* ITEMS */}

                    <section className="sales-order-card">

                        <EditSalesOrderItemsList
                            items={items}
                            setItems={setItems}
                            listId={Number(listId) || null}
                            isConsumerFinal={isConsumerFinal}
                            salesSections={salesSections}
                        />

                    </section>

                </form>

            </div>

        </div>

    );
};


export default SalesOrderManager;
