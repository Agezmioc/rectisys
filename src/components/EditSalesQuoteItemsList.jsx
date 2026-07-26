import { useData } from "../context/Context";
import { useState } from "react";
import ArticleSelector from "./ArticleSelector";
import "./EditSalesQuoteItemsList.css";

const EditSalesQuoteItemsList = ({
    items,
    setItems,
    listId,
    isConsumerFinal
}) => {
    const {
        dataVatTypes,
    } = useData();

    const [showArticleSelector, setShowArticleSelector] = useState(false);
    const [selectedIsConcept, setSelectedIsConcept] = useState(false);

    const vatMap = new Map(dataVatTypes.map(v => [v.id, v]));

    const calculateItemTotal = (item) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const vat = Number(item.vat_value) || 0;

        const base = quantity * price;

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
            article.prices.find(p => p.list_id === Number(listId))?.price ??
            article.prices.find(p => p.list_id === 0)?.price ??
            0
        );
    };


    const handleChange = (rowId, field, value) => {
        setItems(prev =>
            prev.map(item => {
                if ((item.id ?? item.temp_id) !== rowId) return item;

                const safeValue =
                    field === "quantity"
                        ? Math.max(1, Number(value) || 1)
                        : value;

                const updatedItem = {
                    ...item,
                    [field]: safeValue
                };

                return {
                    ...updatedItem,
                    total: calculateItemTotal(updatedItem)
                };
            })
        );
    };

    const handleDelete = (rowId) => {
        setItems(prev =>
            prev.filter(item => (item.id ?? item.temp_id) !== rowId)
        );
    };

    if (showArticleSelector) {
        return (
            <ArticleSelector
                isConcept={Boolean(selectedIsConcept)}
                listId={listId}
                onConfirm={(articles) => {
                    const newItems = articles.map(article => {
                        const price = getArticlePrice(article);
                        const vatValue = vatMap.get(article.vat_type_id)?.value ?? 0;
                        const quantity = 1;

                        const base = quantity * price;

                        return {
                            temp_id: crypto.randomUUID(),

                            stock_art_id: article.id,
                            article_code: article.code,
                            article_desc: article.desc,

                            is_concept: Boolean(selectedIsConcept),

                            quantity,
                            price,
                            vat_value: vatValue,

                            total: isConsumerFinal
                                ? base * (1 + vatValue / 100)
                                : base,

                            comment: ""
                        };
                    });

                    setItems(prev => [...prev, ...newItems]);
                    setShowArticleSelector(false);
                }}
                onCancel={() => setShowArticleSelector(false)}
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
                            <th>Código</th>
                            <th>Artículo</th>
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
                            return (
                                <tr key={item.id ?? item.temp_id}>
                                    <td>{String(index + 1).padStart(3, "0")}</td>

                                    <td>{item.article_code || item.stock_articles?.code || "-"}</td>

                                    <td>
                                        {item.article_desc || item.stock_articles?.desc || "Sin descripción"}
                                    </td>
                                    
                                    <td>
                                        <input
                                            className="cell-input"
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={e =>
                                                handleChange(
                                                    item.id ?? item.temp_id,
                                                    "quantity",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>

                                    <td>{formatMoney(item.price)}</td>
                                    <td>{item.vat_value}</td>

                                    <td className="bold">
                                        {calculateItemTotal(item).toFixed(2)}
                                    </td>

                                    <td>
                                        <input
                                            className="cell-input"
                                            value={item.comment}
                                            onChange={e =>
                                                handleChange(
                                                    item.id ?? item.temp_id,
                                                    "comment",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>

                                    <td>
                                        <button
                                            className="danger-btn"
                                            type="button"
                                            onClick={() =>
                                                handleDelete(item.id ?? item.temp_id)
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

export default EditSalesQuoteItemsList;