import { useData } from "../context/Context";
import { useEffect, useMemo, useState } from "react";

const SalesQuotesList = () => {
    const { salesQuotes, getSalesQuotes, loading } = useData();

    const [searchInput, setSearchInput] = useState("");
    const [sortField, setSortField] = useState("id");
    const [sortDirection, setSortDirection] = useState("asc");
    const [searchField, setSearchField] = useState("id");

    useEffect(() => {
        getSalesQuotes();
    }, []);

    const filteredQuotes = useMemo(() => {
        const query = searchInput.trim().toLowerCase();

        const filtered = salesQuotes.filter(q => {
            if (!query) return true;

            // 🔹 búsqueda global (lo que ya tenías)
            if (searchField === "global") {
                return (
                    String(q.id).includes(query) ||
                    String(q.account_id).includes(query) ||
                    String(q.data_document_id).includes(query) ||
                    String(q.data_condition_type_id).includes(query) ||
                    String(q.data_tax_position_id).includes(query) ||
                    String(q.motor_id).includes(query) ||

                    String(q.number).includes(query) ||
                    q.full_number?.toLowerCase().includes(query) ||

                    q.account_name?.toLowerCase().includes(query) ||
                    q.document?.toLowerCase().includes(query) ||
                    q.condition?.toLowerCase().includes(query) ||
                    q.tax_position?.toLowerCase().includes(query) ||
                    q.motor?.toLowerCase().includes(query) ||

                    q.address?.toLowerCase().includes(query) ||
                    q.phone_num?.toLowerCase().includes(query) ||
                    q.reference?.toLowerCase().includes(query) ||
                    q.purchace_order_num?.toLowerCase().includes(query) ||
                    q.list?.toLowerCase().includes(query) ||
                    q.observations?.toLowerCase().includes(query) ||

                    String(q.total).includes(query) ||
                    String(q.date).toLowerCase().includes(query)
                );
            }

            // 🔹 búsqueda por campo específico
            const value = q[searchField];

            if (value === null || value === undefined) return false;

            if (typeof value === "object") {
                if (Array.isArray(value)) {
                    return false;
                }
                if (value.name) return value.name.toLowerCase().includes(query);
                if (value.desc) return value.desc.toLowerCase().includes(query);
                return JSON.stringify(value).toLowerCase().includes(query);
            }

            if (typeof value === "boolean") {
                return (value ? "true" : "false").includes(query);
            }

            return String(value).toLowerCase().includes(query);
        });

        return [...filtered].sort((a, b) => {
            let comparison = 0;

            const getVal = (obj, field) => obj[field] ?? "";

            if (sortField === "date" || sortField === "created_at" || sortField === "updated_at") {
                comparison = new Date(a[sortField]) - new Date(b[sortField]);
            } else if (typeof getVal(a, sortField) === "number") {
                comparison = (a[sortField] ?? 0) - (b[sortField] ?? 0);
            } else {
                comparison = String(getVal(a, sortField)).localeCompare(String(getVal(b, sortField)));
            }

            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [salesQuotes, searchInput, sortField, sortDirection, searchField]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const columnLabels = {
        id: "ID",
        account_id: "Cliente (ID)",
        data_document_id: "Documento (ID)",
        data_condition_type_id: "Condición (ID)",
        data_tax_position_id: "Condición Fiscal (ID)",
        motor_id: "Motor (ID)",
        number: "Número",
        letter: "Letra",
        point: "Punto",
        address: "Dirección",
        phone_num: "Teléfono",
        reference: "Referencia",
        purchace_order_num: "Orden de Compra",
        list: "Lista",
        observations: "Observaciones",

        concept_subtotal: "Subtotal Conceptos",
        concept_discount: "Desc. Conceptos",
        article_subtotal: "Subtotal Artículos",
        article_discount: "Desc. Artículos",
        general_discount: "Descuento General",
        general_recharge: "Recargo General",
        general_subtotal: "Subtotal General",
        general_vat: "IVA",
        g_vat_subtotal: "Base IVA",
        reduced_vat: "IVA Reducido",
        r_vat_subtotal: "Base IVA Reducido",
        total: "Total",

        is_model: "Es modelo",

        date: "Fecha",
        created_at: "Creado",
        updated_at: "Actualizado",
    };

    if (loading) return <p>Loading...</p>;

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

                {Object.keys(salesQuotes[0] || {}).map(col => (
                    <option key={col} value={col}>
                        {columnLabels[col] || col}
                    </option>
                ))}
            </select>

            {filteredQuotes.length === 0 ? (
                <p>No hay resultados</p>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%" }}>
                        <thead>
                            <tr>
                                {Object.keys(filteredQuotes[0]).map(col => (
                                    <th
                                        key={col}
                                        onClick={() => handleSort(col)}
                                        style={{ cursor: "pointer", border: "1px solid #ccc", padding: "4px" }}
                                    >
                                        {columnLabels[col] || col}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {filteredQuotes.map(q => (
                                <tr key={q.id}>
                                    {Object.keys(q).map(col => {
                                        const value = q[col];

                                        let displayValue = "";

                                        if (value === null || value === undefined) {
                                            displayValue = "";
                                        } else if (typeof value === "object") {
                                            // Caso objetos (relaciones)
                                            if (Array.isArray(value)) {
                                                displayValue = `[${value.length} items]`;
                                            } else if (value.name) {
                                                displayValue = value.name;
                                            } else if (value.desc) {
                                                displayValue = value.desc;
                                            } else if (value.id) {
                                                displayValue = `ID: ${value.id}`;
                                            } else {
                                                displayValue = JSON.stringify(value);
                                            }
                                        } else if (typeof value === "boolean") {
                                            displayValue = value ? "true" : "false";
                                        } else {
                                            displayValue = value;
                                        }

                                        return (
                                            <td key={col} style={{ border: "1px solid #ccc", padding: "4px" }}>
                                                {displayValue}
                                            </td>
                                        );
                                    })}
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