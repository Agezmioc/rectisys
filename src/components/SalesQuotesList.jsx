import { useData } from "../context/Context";
import { useEffect, useState } from "react";
import SalesQuoteDetail from "./SalesQuoteDetail";

const SalesQuotesList = () => {
    const {
        salesQuotes,
        getSalesQuotes,
        loading,
        getQuoteDocument,
        getQuoteAccountName,
        getQuoteAccountTaxNum,
        getQuoteCondition,
        getQuoteTaxPosition,
        getQuoteFullNumber
    } = useData();

    const [searchInput, setSearchInput] = useState("");
    const [searchField, setSearchField] = useState("id");
    const [selectedQuoteId, setSelectedQuoteId] = useState(null);
    const selectedQuote = salesQuotes.find(q => q.id === selectedQuoteId) ?? null;
    const [appliedQuery, setAppliedQuery] = useState("");
    const query = appliedQuery.trim().toLowerCase();

    useEffect(() => {
        getSalesQuotes();
    }, []);

    const getFieldValue = (q, field) => {
        switch (field) {
            case "data_documents":
                return getQuoteDocument(q);

            case "full_number":
                return getQuoteFullNumber(q);

            case "account_name":
                return getQuoteAccountName(q);

            case "condition":
                return getQuoteCondition(q);

            case "tax_position":
                return getQuoteTaxPosition(q);

            case "tax_num":
                return getQuoteAccountTaxNum(q);

            default:
                return q[field];
        }
    };

    const filteredQuotes = salesQuotes.filter(q => {
        if (!query) return true;

        const value = getFieldValue(q, searchField);

        if (value === null || value === undefined) return false;

        return String(value).toLowerCase().includes(query);
    });

    const columnLabels = {
        data_documents: "Documento",
        full_number: "Comprobante",
        date: "Fecha",
        is_model: "Modelo",

        account_name: "Cliente",
        account_id: "Cliente ID",
        address: "Dirección",
        phone_num: "Teléfono",

        data_condition_type_id: "Condición ID",
        condition: "Condición",

        tax_position: "Condición Fiscal",
        tax_num: "CUIT",

        motor_id: "Motor ID",

        reference: "Referencia",
        purchace_order_num: "Orden Compra",
        observations: "Observaciones",

        total: "Total"
    };

    if (loading) return <p>Loading...</p>;

    if (selectedQuote) {
        return (
            <div>
                <h2>Detalle del presupuesto #{selectedQuote.id}</h2>

                <SalesQuoteDetail
                    quote={selectedQuote}
                    onBack={() => setSelectedQuoteId(null)}
                />
            </div>
        );
    }

    return (
        <div>
            <input
                type="text"
                placeholder="Buscar en todos los campos..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                style={{ width: "100%", marginBottom: "1rem" }}
            />
            <select
                value={searchField}
                onChange={e => setSearchField(e.target.value)}
                style={{ marginBottom: "1rem" }}
            >

                {Object.keys(columnLabels).map(col => (
                    <option key={col} value={col}>
                        {columnLabels[col]}
                    </option>
                ))}
            </select>
            <button
                onClick={() => setAppliedQuery(searchInput)}
                style={{ marginBottom: "1rem" }}
            >
                🔍 Buscar
            </button>

            {filteredQuotes.length === 0 ? (
                <p>No hay resultados</p>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%" }}>
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
                                    <td>{getQuoteDocument(q)}</td>
                                    <td>{getQuoteFullNumber(q)}</td>
                                    <td>{q.date}</td>
                                    <td>{q.is_model === "1" ? "Sí" : "No"}</td>
                                    <td>{getQuoteAccountName(q)}</td>
                                    <td>{q.account_id}</td>
                                    <td>{q.address}</td>
                                    <td>{q.phone_num}</td>
                                    <td>{q.data_condition_type_id}</td>
                                    <td>{getQuoteCondition(q)}</td>
                                    <td>{getQuoteTaxPosition(q)}</td>
                                    <td>{getQuoteAccountTaxNum(q)}</td>
                                    <td>{q.motor_id}</td>
                                    <td>{q.reference}</td>
                                    <td>{q.purchace_order_num}</td>
                                    <td>{q.observations}</td>
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