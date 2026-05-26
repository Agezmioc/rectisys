import { useData } from "../context/Context";
import { useEffect, useState } from "react";
import ArticleSelector from "./ArticleSelector";

const EditSalesQuoteItemsList = ({
    items,
    setItems,
    listId,
    isConsumerFinal
}) => {
    const {
        stockArticles,
        stockPrices,
        dataVatTypes,
        getStockArticles,
    } = useData();

    const [showArticleSelector, setShowArticleSelector] = useState(false);
    const [selectedIsConcept, setSelectedIsConcept] = useState(false);

    const priceMap = new Map(
        stockPrices.map(p => [p.article_id, p])
    );

    const vatMap = new Map(
        dataVatTypes.map(v => [v.id, v])
    );

    const calculateItemTotal = (item, isConsumerFinal) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const vat = Number(item.vat_value) || 0;

        const base = quantity * price;

        return isConsumerFinal
            ? base * (1 + vat / 100)
            : base;
    };

    useEffect(() => {
        getStockArticles();
    }, []);

    const handleChange = (rowId, field, value) => {
        setItems(prev =>
            prev.map(item => {
                if ((item.id ?? item.temp_id) !== rowId) {
                    return item;
                }

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
                    total: calculateItemTotal(updatedItem, isConsumerFinal)
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
                isConcept={selectedIsConcept}
                listId={listId}
                onConfirm={(articles) => {
                    const newItems = articles.map(article => {
                        const price =
                            priceMap.get(article.id)?.price ?? 0;

                        const vatValue =
                            vatMap.get(article.vat_type_id)?.value ?? 0;

                        const quantity = 1;

                        const base = quantity * price;

                        return {
                            temp_id: crypto.randomUUID(),
                            stock_art_id: article.id,
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

                    setItems(prev => [
                        ...prev,
                        ...newItems
                    ]);

                    setShowArticleSelector(false);
                }}
                onCancel={() => {
                    setShowArticleSelector(false);
                }}
            />
        );
    }

    return (
        <div>
            <button
                type="button"
                disabled={!listId}
                onClick={() => {
                    if (!listId) return;

                    setSelectedIsConcept(false);
                    setShowArticleSelector(true);
                }}
            >
                + Agregar artículo
            </button>

            <button
                type="button"
                disabled={!listId}
                onClick={() => {
                    if (!listId) return;

                    setSelectedIsConcept(true);
                    setShowArticleSelector(true);
                }}
                style={{ marginLeft: "0.5rem" }}
            >
                + Agregar concepto
            </button>

            {!listId && (
                <div style={{ marginBottom: "1rem", color: "red" }}>
                    ⚠️ Debes seleccionar un motor antes de agregar artículos
                </div>
            )}

            <table style={{ width: "100%", marginTop: "1rem" }}>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Artículo</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>IVA</th>
                        <th>Total</th>
                        <th>Comentario</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {items.map((item, index) => {
                        const article = stockArticles.find(
                            a => a.id === Number(item.stock_art_id)
                        );

                        return (
                            <tr key={item.id ?? item.temp_id}>
                                <td style={{ fontWeight: "bold" }}>
                                    {String(index + 1).padStart(3, "0")}
                                </td>

                                <td>
                                    {
                                        article
                                            ? `${article.code} - ${article.desc}`
                                            : "Artículo no encontrado"
                                    }
                                </td>

                                <td>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={item.quantity}
                                        onChange={e =>
                                            handleChange(
                                                item.id ?? item.temp_id,
                                                "quantity",
                                                Number(e.target.value)
                                            )
                                        }
                                    />
                                </td>

                                <td>{item.price}</td>

                                <td>{item.vat_value}</td>

                                <td>
                                    {calculateItemTotal(item, isConsumerFinal).toFixed(2)}
                                </td>

                                <td>
                                    <input
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
    );
};

export default EditSalesQuoteItemsList;