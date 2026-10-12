import { useEffect, useState } from "react";
import { useData } from "../context/Context";
import "./ImportSalesQuotes.css";

const ImportSalesQuotes = ({
    accountId,
    onConfirm,
    onCancel
}) => {

    const {
        getImportableSalesQuotes
    } = useData();


    const [quotes, setQuotes] = useState([]);

    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(false);


    /*
     * Cargar presupuestos importables
     */

    const loadQuotes = async () => {

        if (!accountId) {
            setQuotes([]);
            return;
        }

        setLoading(true);

        const data =
            await getImportableSalesQuotes(accountId);

        setQuotes(data || []);

        setLoading(false);
    };


    /*
     * Carga inicial
     */

    useEffect(() => {

        let cancelled = false;

        const loadInitialQuotes = async () => {

            if (!accountId) {
                return;
            }

            setLoading(true);

            const data =
                await getImportableSalesQuotes(accountId);

            if (cancelled) return;

            setQuotes(data || []);

            setLoading(false);
        };

        loadInitialQuotes();

        return () => {
            cancelled = true;
        };

    }, [accountId, getImportableSalesQuotes]);


    /*
     * Búsqueda por número de presupuesto
     */

    const handleSearch = async () => {

        if (!searchText.trim()) {
            loadQuotes();
            return;
        }

        setLoading(true);

        const data =
            await getImportableSalesQuotes(accountId);

        const filtered =
            (data || []).filter(quote =>
                String(quote.number ?? "")
                    .includes(searchText.trim())
            );

        setQuotes(filtered);

        setLoading(false);
    };


    /*
     * Seleccionar presupuesto
     *
     * Solo puede seleccionarse uno.
     *
     * El componente padre se encarga de reemplazar
     * la importación anterior si ya existía una.
     */

    const handleSelectQuote = (quote) => {

        onConfirm([quote]);

    };


    /*
     * Formatear fecha
     */

    const formatDate = (value) => {

        if (!value) return "";

        return new Date(value)
            .toLocaleDateString("es-AR");

    };


    /*
     * Formatear dinero
     */

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });


    return (

        <div className="import-sales-quotes">

            {/* HEADER */}

            <div className="import-sales-quotes-header">

                <h3>
                    Importar de Presupuesto
                </h3>

            </div>


            {/* TOOLBAR */}

            <div className="import-sales-quotes-toolbar">

                <label>
                    Buscar:
                </label>

                <input
                    className="import-sales-quotes-input"
                    type="text"
                    placeholder="Nro. de presupuesto..."
                    value={searchText}
                    onChange={e =>
                        setSearchText(e.target.value)
                    }
                    onKeyDown={e => {

                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSearch();
                        }

                    }}
                />

                <button
                    type="button"
                    className="import-sales-quotes-btn primary"
                    onClick={handleSearch}
                >
                    🔍 Buscar
                </button>


                <button
                    type="button"
                    className="import-sales-quotes-btn danger"
                    onClick={onCancel}
                >
                    ↩ Volver
                </button>

            </div>


            {/* CRITERIO */}

            <div className="import-sales-quotes-search-info">

                Criterio de búsqueda:
                <strong>
                    {" "}Nro. de Presupuesto
                </strong>

            </div>


            {/* TABLE */}

            <div className="import-sales-quotes-table-container">

                <table className="import-sales-quotes-table">

                    <thead>

                        <tr>

                            <th>
                                Nro. Presupuesto
                            </th>

                            <th>
                                Fecha
                            </th>

                            <th>
                                Cant. Ítems Pendientes
                            </th>

                            <th>
                                Monto
                            </th>

                            <th>
                                Estado
                            </th>

                            <th>
                                Acción
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {loading ? (

                            <tr>

                                <td colSpan={6}>
                                    Buscando...
                                </td>

                            </tr>

                        ) : quotes.length === 0 ? (

                            <tr>

                                <td colSpan={6}>
                                    No se encontraron presupuestos importables.
                                </td>

                            </tr>

                        ) : (

                            quotes.map(quote => (

                                <tr key={quote.id}>

                                    <td>
                                        {quote.letter
                                            ? `${quote.letter}-`
                                            : ""}
                                        {quote.point !== null &&
                                        quote.point !== undefined
                                            ? `${String(
                                                quote.point
                                            ).padStart(4, "0")}-`
                                            : ""}
                                        {quote.number ?? ""}
                                    </td>


                                    <td>
                                        {formatDate(quote.date)}
                                    </td>


                                    <td>
                                        {quote.pending_items?.length ?? 0}
                                    </td>


                                    <td>
                                        {formatMoney(quote.total)}
                                    </td>


                                    <td>
                                        {quote.sales_states?.name || "-"}
                                    </td>


                                    <td>

                                        <button
                                            type="button"
                                            className="import-sales-quotes-btn primary"
                                            onClick={() =>
                                                handleSelectQuote(quote)
                                            }
                                        >
                                            Seleccionar
                                        </button>

                                    </td>

                                </tr>

                            ))

                        )}

                    </tbody>

                </table>

            </div>

        </div>

    );
};


export default ImportSalesQuotes;
