import { useData } from "../context/Context";
import { useEffect, useMemo, useState } from "react";
import SalesQuoteDetail from "./SalesQuoteDetail";
import SalesQuoteManager from "./SalesQuoteManager";
import "./SalesQuotesList.css";

const SalesQuotesList = () => {
    const {
        salesQuotes,
        getSalesQuotes,
        loading,
        getQuoteDocument,
        getQuoteAccountName,
        getStockLists
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

    useEffect(() => {
        getSalesQuotes();
        getStockLists();
    }, []);

    const getFieldValue = (q, field) => {
        switch (field) {
            case "document":
                return getQuoteDocument(q);

            case "account_name":
                return getQuoteAccountName(q);

            case "motor":
                return q.stock_motors?.desc || "";

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
        document: "Documento",
        number: "Número",
        date: "Fecha",
        is_model: "Modelo",
        motor: "Motor",
        reference: "Referencia",
        purchace_order_num: "Orden Compra",
        total: "Total"
    };

    if (loading) return <p>Loading...</p>;

    
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
                            {filteredQuotes.map(q => (
                                <tr key={q.id}>
                                    <td>{getQuoteAccountName(q)}</td>

                                    <td>{q.account_id}</td>

                                    <td>{getQuoteDocument(q)}</td>

                                    <td>{q.number}</td>

                                    <td>{q.date}</td>

                                    <td>{q.is_model === "1" ? "Sí" : "No"}</td>

                                    <td>{q.stock_motors?.desc || "-"}</td>

                                    <td>{q.reference}</td>

                                    <td>{q.purchace_order_num}</td>

                                    <td>{q.total}</td>

                                    <td>
                                        <button onClick={() => setSelectedQuoteId(q.id)}>
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

export default SalesQuotesList;