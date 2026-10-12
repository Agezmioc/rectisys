import { useEffect, useState } from "react";
import { useData } from "../context/Context";
import StockArticleDetail from "./StockArticleDetail";
import StockArticleManager from "./StockArticleManager";
import "./StockArticlesList.css";
import { normalizeSearch } from "../utils/normalizeSearch";

const formatMoney = (value) => {
    if (value == null || value === "") return "-";

    return Number(value).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const StockArticlesList = () => {

    const {
        getStockArticles,
        loading
    } = useData();

    const [articles, setArticles] = useState([]);

    const [searchInput, setSearchInput] = useState("");
    const [searchField, setSearchField] = useState("code");

    const [isConcept, setIsConcept] = useState(false);

    const [selectedArticleId, setSelectedArticleId] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);

    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);


    /*
     * CARGA INICIAL
     */

    useEffect(() => {

        getStockArticles({
            isConcept: false
        }).then(data => {
            setArticles(data);
        });

    }, []);


    /*
     * BÚSQUEDA
     */

    const handleSearch = async () => {
        const data = await getStockArticles({
            isConcept,
            searchQuery: ""
        });

        const query = normalizeSearch(searchInput);

        const filteredData = data.filter(article => {
            const value = searchField === "code"
                ? article.code
                : article.desc;

            return normalizeSearch(value).includes(query);
        });

        setArticles(filteredData);
    };

    /*
     * ORDEN Y LÍMITE
     */

    const displayedArticles = [...articles]
        .sort((a, b) =>
            String(a.code || "").localeCompare(
                String(b.code || ""),
                "es"
            )
        )
        .slice(0, 100);


    /*
     * CAMPOS DE BÚSQUEDA
     */

    const searchFields = {
        code: "Código",
        desc: "Descripción"
    };




    if (loading) {
        return <p>Cargando artículos...</p>;
    }


    if (isCreating) {
        return (
            <StockArticleManager
                initialArticle={null}
                onCancel={() => setIsCreating(false)}
                onSaved={async (saved) => {
                    setIsCreating(false);
                    setIsEditing(false);

                    const savedIsConcept =
                        saved.is_concept === true ||
                        saved.is_concept === 1 ||
                        saved.is_concept === "1";

                    setIsConcept(savedIsConcept);

                    const data = await getStockArticles({
                        isConcept: savedIsConcept
                    });

                    setArticles(data);
                    setSelectedArticle(saved);
                    setSelectedArticleId(saved.id);
                }}
            />
        );
    }

    if (isEditing && selectedArticle) {
        return (
            <>
                <button
                    onClick={() => setIsEditing(false)}
                    >
                    ← Volver
                </button>
                    <StockArticleManager
                        initialArticle={selectedArticle}
                        onCancel={() => setIsEditing(false)}
                        onSaved={async (saved) => {
                            setIsEditing(false);
                            setIsCreating(false);

                            const savedIsConcept =
                                saved.is_concept === true ||
                                saved.is_concept === 1 ||
                                saved.is_concept === "1";

                            setIsConcept(savedIsConcept);

                            const data = await getStockArticles({
                                isConcept: savedIsConcept
                            });

                            setArticles(data);
                            setSelectedArticle(saved);
                            setSelectedArticleId(saved.id);
                        }}
                />
            </>
        );
    }

    if (selectedArticleId) {
        return (
            <StockArticleDetail
                article={selectedArticle}
                onBack={() => {
                    setSelectedArticleId(null);
                    setSelectedArticle(null);
                }}
                onNew={() => {
                    setSelectedArticleId(null);
                    setIsCreating(true);
                }}
                onEdit={() => {
                    setIsEditing(true);
                }}
            />
        );
    }


    return (
        <div className="stock-articles-list">

            {/* ACCIONES */}

            <div className="stock-articles-actions">

                <button
                    onClick={() => {
                        setSelectedArticleId(null);
                        setIsEditing(false);
                        setIsCreating(true);
                    }}
                >
                    + Nuevo artículo
                </button>

            </div>


            {/* FILTROS */}

            <div className="stock-articles-filters">

                <input
                    className="stock-articles-input"
                    type="text"
                    placeholder="Buscar..."
                    value={searchInput}
                    onChange={e =>
                        setSearchInput(e.target.value)
                    }
                />


                <select
                    value={searchField}
                    onChange={e =>
                        setSearchField(e.target.value)
                    }
                >
                    {Object.keys(searchFields).map(field => (
                        <option
                            key={field}
                            value={field}
                        >
                            {searchFields[field]}
                        </option>
                    ))}
                </select>


                <label className="stock-articles-concept-filter">

                    <input
                        type="checkbox"
                        checked={isConcept}
                        onChange={e =>
                            setIsConcept(e.target.checked)
                        }
                    />

                    Conceptos

                </label>


                <button
                    onClick={handleSearch}
                >
                    Buscar
                </button>

            </div>


            {/* RESULTADOS */}

            {displayedArticles.length === 0 ? (

                <p>No hay resultados</p>

            ) : (

                <div className="stock-articles-table-container">

                    <table className="stock-articles-table">

                        <thead>

                            <tr>

                                <th>
                                    Código
                                </th>

                                <th>
                                    Descripción
                                </th>

                                <th>
                                    Concepto
                                </th>

                                <th>
                                    Precio
                                </th>

                                <th>
                                    Acciones
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {displayedArticles.map(article => (

                                <tr key={article.id}>

                                    <td>
                                        {article.code || "-"}
                                    </td>

                                    <td>
                                        {article.desc || "-"}
                                    </td>

                                    <td>
                                        {article.is_concept
                                            ? "Sí"
                                            : "No"
                                        }
                                    </td>

                                    <td>
                                        {article.is_concept
                                            ? "-"
                                            : formatMoney(
                                                article.prices?.find(
                                                    (price) => Number(price.list_id) === 0
                                                )?.price
                                            )}
                                    </td>

                                    <td>

                                        <button
                                            onClick={() => {
                                                setSelectedArticle(article);
                                                setSelectedArticleId(article.id);
                                            }}
                                        >
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

export default StockArticlesList;
