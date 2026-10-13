import { useData } from "../context/Context";
import { useState } from "react";
import ArticleSelector from "./ArticleSelector";
import "./EditSalesOrderItemsList.css";
import { isValidNumberInput } from "../utils/numberInput";

const EditSalesOrderItemsList = ({
    items,
    setItems,
    listId,
    isConsumerFinal,
    salesSections = []
}) => {

    const {
        dataVatTypes
    } = useData();


    const [showArticleSelector, setShowArticleSelector] = useState(false);
    const [selectedIsConcept, setSelectedIsConcept] = useState(false);


    const vatMap = new Map(
        dataVatTypes.map(v => [v.id, v])
    );


    const calculateItemTotal = (item) => {

        const quantity =
            Number(item.quantity) || 0;

        const price =
            Number(item.price) || 0;

        const vat =
            Number(item.vat_value) || 0;


        const base =
            quantity * price;


        return isConsumerFinal
            ? base * (1 + vat / 100)
            : base;
    };


    const formatMoney = (value) =>
        Number(value || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });


    const getArticlePrice = (article) => {

        return (
            article.prices?.find(
                p => p.list_id === Number(listId)
            )?.price ??
            article.prices?.find(
                p => p.list_id === 0
            )?.price ??
            0
        );
    };

    const numericFields = [
        "quantity",
        "completed",
        "cancelled"
    ];


    /*
     * Cambiar valores de un item
     */
    const handleChange = (rowId, field, value) => {

        if (numericFields.includes(field)) {
            if (!isValidNumberInput(value, { decimals: 2 })) {
                return;
            }
        }

        setItems(prev =>
            prev.map(item => {
                if ((item.id ?? item.temp_id) !== rowId) {
                    return item;
                }

                let updatedItem = {
                    ...item,
                    [field]: value
                };

                /*
                * CANTIDAD
                */
                if (field === "quantity") {

                    const requestedQuantity =
                        Number(value) || 1;

                    const maxQuantity =
                        item.imported_quantity !== undefined
                            ? Number(item.imported_quantity)
                            : Infinity;

                    const quantity =
                        Math.min(
                            maxQuantity,
                            Math.max(1, requestedQuantity)
                        );

                    const completed = Math.min(
                        Number(item.completed) || 0,
                        quantity
                    );

                    const cancelled = Math.min(
                        Number(item.cancelled) || 0,
                        quantity - completed
                    );

                    updatedItem = {
                        ...updatedItem,
                        quantity,
                        completed,
                        cancelled
                    };
                }

                /*
                * COMPLETADO
                */
                else if (field === "completed") {
                    const quantity =
                        Number(item.quantity) || 0;

                    const cancelled =
                        Number(item.cancelled) || 0;

                    const completed = Math.min(
                        Math.max(0, Number(value) || 0),
                        Math.max(0, quantity - cancelled)
                    );

                    updatedItem = {
                        ...updatedItem,
                        completed
                    };
                }

                /*
                * CANCELADO
                */
                else if (field === "cancelled") {
                    const quantity =
                        Number(item.quantity) || 0;

                    const completed =
                        Number(item.completed) || 0;

                    const cancelled = Math.min(
                        Math.max(0, Number(value) || 0),
                        Math.max(0, quantity - completed)
                    );

                    updatedItem = {
                        ...updatedItem,
                        cancelled
                    };
                }

                /*
                * Recalcular total
                */
                return {
                    ...updatedItem,
                    total: calculateItemTotal(updatedItem)
                };
            })
        );
    };


    /*
     * Eliminar item
     */

    const handleDelete = (rowId) => {

        setItems(prev =>
            prev.filter(
                item =>
                    (item.id ?? item.temp_id) !== rowId
            )
        );

    };


    /*
     * Selector de artículos / conceptos
     */

    if (showArticleSelector) {

        return (

            <ArticleSelector

                isConcept={
                    Boolean(selectedIsConcept)
                }

                listId={listId}

                onConfirm={(articles) => {

                    const newItems =
                        articles.map(article => {

                            const price =
                                getArticlePrice(article);


                            const vatValue =
                                vatMap.get(
                                    article.vat_type_id
                                )?.value ?? 0;


                            const quantity = 1;


                            const base =
                                quantity * price;


                            return {

                                temp_id:
                                    crypto.randomUUID(),


                                stock_art_id:
                                    article.id,


                                article_code:
                                    article.code,


                                article_desc:
                                    article.desc,


                                is_concept:
                                    Boolean(
                                        selectedIsConcept
                                    ),


                                sales_section_id: "",


                                quantity,


                                cancelled: 0,


                                completed: 0,


                                price,


                                vat_value:
                                    vatValue,


                                total:
                                    isConsumerFinal
                                        ? base *
                                            (1 +
                                                vatValue /
                                                    100)
                                        : base,


                                comment: ""

                            };

                        });


                    setItems(prev => [
                        ...prev,
                        ...newItems
                    ]);


                    setShowArticleSelector(false);

                }}


                onCancel={() =>
                    setShowArticleSelector(false)
                }

            />

        );

    }


    return (

        <div className="edit-items">


            {/* ACTION BAR */}

            <div className="edit-items-actions">

                <button
                    type="button"
                    disabled={!listId}
                    onClick={() => {

                        setSelectedIsConcept(false);
                        setShowArticleSelector(true);

                    }}
                >
                    + Artículo
                </button>


                <button
                    type="button"
                    disabled={!listId}
                    onClick={() => {

                        setSelectedIsConcept(true);
                        setShowArticleSelector(true);

                    }}
                >
                    + Concepto
                </button>


                {!listId && (

                    <span className="edit-items-warning">
                        Selecciona un motor primero
                    </span>

                )}

            </div>


            {/* TABLE */}

            <div className="edit-items-table-container">

                <table className="edit-items-table">

                    <thead>

                        <tr>

                            <th>#</th>

                            <th>Tipo</th>

                            <th>Código</th>

                            <th>Artículo</th>

                            <th>Sección</th>

                            <th>Cant.</th>

                            <th>Precio</th>

                            <th>IVA</th>

                            <th>Total</th>

                            <th>Comentario</th>

                            <th></th>

                        </tr>

                    </thead>


                    <tbody>

                        {items.map((item, index) => {

                            const rowId =
                                item.id ??
                                item.temp_id;


                            return (

                                <tr key={rowId}>

                                    <td>
                                        {String(
                                            index + 1
                                        ).padStart(3, "0")}
                                    </td>


                                    <td>
                                        {item.is_concept
                                            ? "Concepto"
                                            : "Artículo"}
                                    </td>


                                    <td>
                                        {item.article_code ||
                                            item.stock_articles?.code ||
                                            "-"}
                                    </td>


                                    <td>
                                        {item.article_desc ||
                                            item.stock_articles?.desc ||
                                            "Sin descripción"}
                                    </td>

                                    {/* SECCIÓN */}

                                    <td>

                                        <select
                                            className="cell-input"
                                            value={item.sales_section_id ?? ""}
                                            onChange={e =>
                                                handleChange(
                                                    rowId,
                                                    "sales_section_id",
                                                    e.target.value
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                Seleccionar...
                                            </option>

                                            {salesSections.map(section => (
                                                <option
                                                    key={section.id}
                                                    value={section.id}
                                                >
                                                    {section.name}
                                                </option>
                                            ))}
                                        </select>

                                    </td>


                                    {/* CANTIDAD */}

                                    <td>

                                        <input
                                            className="cell-input"
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            max={
                                                item.imported_quantity !== undefined
                                                    ? item.imported_quantity
                                                    : undefined
                                            }
                                            value={item.quantity ?? 1}
                                            onChange={e =>
                                                handleChange(
                                                    rowId,
                                                    "quantity",
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </td>

                                    {/* PRECIO */}

                                    <td>
                                        {formatMoney(
                                            item.price
                                        )}
                                    </td>


                                    {/* IVA */}

                                    <td>
                                        {item.vat_value ?? 0}%
                                    </td>


                                    {/* TOTAL */}

                                    <td className="bold">

                                        {formatMoney(
                                            calculateItemTotal(
                                                item
                                            )
                                        )}

                                    </td>


                                    {/* COMENTARIO */}

                                    <td>

                                        <input
                                            className="cell-input"
                                            value={
                                                item.comment ||
                                                ""
                                            }
                                            onChange={e =>
                                                handleChange(
                                                    rowId,
                                                    "comment",
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </td>


                                    {/* DELETE */}

                                    <td>

                                        <button
                                            className="danger-btn"
                                            type="button"
                                            onClick={() =>
                                                handleDelete(
                                                    rowId
                                                )
                                            }
                                        >
                                            🗑️
                                        </button>

                                    </td>

                                </tr>

                            );

                        })}

                    </tbody>

                </table>

            </div>

        </div>

    );

};


export default EditSalesOrderItemsList;