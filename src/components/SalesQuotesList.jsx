import { useData } from "../context/Context";
import { useEffect, useMemo, useState } from "react";
import SalesQuoteDetail from "./SalesQuoteDetail";
import SalesQuoteManager from "./SalesQuoteManager";
import "./SalesQuotesList.css";
import ArticleFileUploader from "./ArticleFileUploader";
import ConceptFileUploader from "./ConceptFileUploader";

const SalesQuotesList = () => {
    const {
        salesQuotes,
        getSalesQuotes,
        loading,
        getQuoteAccountName,
        getStockLists,
        dataTaxPositions,
        getDataTaxPositions
    } = useData();

    const [searchInput, setSearchInput] = useState("");
    const [searchField, setSearchField] = useState("account_name");
    const [selectedQuoteId, setSelectedQuoteId] = useState(null);
    const selectedQuote = useMemo(() => {
        return salesQuotes.find(q => q.id === selectedQuoteId) ?? null;
    }, [salesQuotes, selectedQuoteId]);
    const [appliedQuery, setAppliedQuery] = useState("");
    const query = appliedQuery.trim().toLowerCase();
    const [isCreating, setIsCreating] = useState(false)
    const [isEditing, setIsEditing] = useState(false);
    const [showArticleUploader, setShowArticleUploader] = useState(false);
    const [showConceptUploader, setShowConceptUploader] = useState(false);

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    useEffect(() => {
        getSalesQuotes();
        getStockLists();
        getDataTaxPositions();
    }, []);

    const getFieldValue = (q, field) => {
        switch (field) {
            case "account_name":
                return getQuoteAccountName(q);

            case "motor":
                return q.stock_motors?.desc || "";

            case "tax_position":
                return dataTaxPositions.find(
                    tp => tp.id === Number(q.data_tax_position_id)
                )?.desc || "";

            default:
                return q[field];
        }
    };

    const filteredQuotes = salesQuotes
        .filter(q => {
            if (!query) return true;

            const value = getFieldValue(q, searchField);

            if (value === null || value === undefined) {
                return false;
            }

            return String(value)
                .toLowerCase()
                .includes(query);
        })
        .sort((a, b) => b.id - a.id)
        .slice(0, 100);

    const columnLabels = {
        account_name: "Cliente",
        account_id: "Cliente ID",
        tax_position: "Situación fiscal",
        tax_num: "CUIT",
        number: "Número",
        date: "Fecha",
        is_model: "Modelo",
        motor: "Motor",
        reference: "Referencia",
        purchace_order_num: "Orden Compra",
        total: "Total"
    };

    if (loading) return <p>Loading...</p>;

    if (showArticleUploader) {
        return (
            <>
                <button
                    onClick={() => setShowArticleUploader(false)}
                >
                    ← Volver
                </button>

                <ArticleFileUploader />
            </>
        );
    }

    if (showConceptUploader) {
        return (
            <>
                <button
                    onClick={() => setShowConceptUploader(false)}
                >
                    ← Volver
                </button>

                <ConceptFileUploader />
            </>
        );
    }

    
    if (isCreating) {
        return (
            <>
                <SalesQuoteManager
                    quote={null}
                    onCancel={() => setIsCreating(false)}
                    onSaved={(saved) => {
                        setIsEditing(false);
                        setIsCreating(false);
                        getSalesQuotes();
                        setSelectedQuoteId(saved.id);
                    }}
                />
            </>
        );
    }

    if (isEditing && selectedQuote) {
        return (
            <>
                <button onClick={() => setIsEditing(false)}>
                    ← Volver
                </button>

                <SalesQuoteManager
                    initialQuote={selectedQuote}
                    onCancel={() => setIsEditing(false)}
                    onSaved={(saved) => {
                        setIsEditing(false);
                        setIsCreating(false);
                        getSalesQuotes();
                        setSelectedQuoteId(saved.id);
                    }}
                />
            </>
        );
    }

    if (selectedQuote) {
        return (
            <SalesQuoteDetail
                quote={selectedQuote}
                onBack={() => setSelectedQuoteId(null)}
                onNew={() => {
                    setIsCreating(true);
                    setSelectedQuoteId(null);
                }}
                onEdit={() => {
                    setSelectedQuoteId(selectedQuote.id);
                    setIsEditing(true);
                }}
            />
        );
    }

    return (
        <div className="sales-quotes-list">
            <div className="sales-quotes-actions">
                <button
                    onClick={() => {
                        setSelectedQuoteId(null);
                        setIsEditing(false);
                        setIsCreating(true);
                    }}
                >
                    + Nuevo presupuesto
                </button>

                <button
                    onClick={() => {
                        setShowArticleUploader(true);
                    }}
                >
                    📦 Importar Artículos
                </button>

                <button
                    onClick={() => {
                        setShowConceptUploader(true);
                    }}
                >
                    📦 Importar Conceptos
                </button>
            </div>

            <div className="sales-quotes-filters">
                <input
                    className="sales-quotes-input"
                    type="text"
                    placeholder="Buscar..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                />

                <select
                    value={searchField}
                    onChange={e => setSearchField(e.target.value)}
                >
                    {Object.keys(columnLabels).map(col => (
                        <option key={col} value={col}>
                            {columnLabels[col]}
                        </option>
                    ))}
                </select>

                <button onClick={() => setAppliedQuery(searchInput)}>
                    Buscar
                </button>
            </div>

            {filteredQuotes.length === 0 ? (
                <p>No hay resultados</p>
            ) : (
                <div className="sales-quotes-table-container">
                    <table className="sales-quotes-table">
                        <thead>
                            <tr>
                                {Object.keys(columnLabels).map(col => (
                                    <th key={col} value={col}>
                                        {columnLabels[col]}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {filteredQuotes.map(q => {
                                const taxPosition = dataTaxPositions.find(
                                    tp => tp.id === Number(q.data_tax_position_id)
                                );

                                return (
                                    <tr key={q.id}>
                                        <td>{getQuoteAccountName(q)}</td>

                                        <td>{q.account_id}</td>

                                        <td>{taxPosition?.desc || "-"}</td>

                                        <td>{q.tax_num || "-"}</td>

                                        <td>{q.number}</td>

                                        <td>{q.date}</td>

                                        <td>{q.is_model === "1" ? "Sí" : "No"}</td>

                                        <td>{q.stock_motors?.desc || "-"}</td>

                                        <td>{q.reference}</td>

                                        <td>{q.purchace_order_num}</td>

                                        <td>{formatMoney(q.total)}</td>

                                        <td>
                                            <button onClick={() => setSelectedQuoteId(q.id)}>
                                                Ver detalles
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SalesQuotesList;