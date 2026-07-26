import { useEffect, useMemo, useState } from "react";
import { useData } from "../context/Context";
import "./ArticleSelector.css";

const ArticleSelector = ({
    isConcept,
    onConfirm,
    onCancel,
    listId,
}) => {
    const {
        getStockArticles,
        dataVatTypes,
        getDataVatTypes
    } = useData();

    const [selectedIds, setSelectedIds] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [searchField, setSearchField] = useState("desc");
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);

    const vatMap = useMemo(() => {
        return new Map(dataVatTypes.map(v => [v.id, v]));
    }, [dataVatTypes]);

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

    const getArticleVat = (article) => {
        return vatMap.get(article.vat_type_id)?.value ?? 0;
    };

    const handleSearch = async () => {
        setLoading(true);

        const foundArticles = await getStockArticles({
            isConcept,
            searchField,
            searchQuery: searchText
        });

        setArticles(foundArticles);

        setLoading(false);
    };

    const toggleArticle = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(aid => aid !== id)
                : [...prev, id]
        );
    };

    const toggleAll = () => {
        const visibleIds = articles.map(a => a.id);

        const allSelected = visibleIds.every(id =>
            selectedIds.includes(id)
        );

        if (allSelected) {
            setSelectedIds(prev =>
                prev.filter(id => !visibleIds.includes(id))
            );
        } else {
            setSelectedIds(prev => [
                ...new Set([...prev, ...visibleIds])
            ]);
        }
    };

    const handleConfirm = () => {
        const selectedArticles = articles.filter(article =>
            selectedIds.includes(article.id)
        );

        onConfirm(selectedArticles);
    };

    useEffect(() => {
        getDataVatTypes();
    }, []);

    return (
        <div className="article-selector">

            {/* HEADER */}
            <div className="article-selector-header">
                <h3>
                    Seleccionar {isConcept ? "conceptos" : "artículos"}
                </h3>
            </div>

            {/* TOOLBAR */}
            <div className="article-selector-toolbar">

                <input
                    className="article-selector-input"
                    type="text"
                    placeholder="Buscar..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSearch();
                        }
                    }}
                />

                <select
                    className="article-selector-select"
                    value={searchField}
                    onChange={e => setSearchField(e.target.value)}
                >
                    <option value="desc">Descripción</option>
                    <option value="code">Código</option>
                    <option value="id">ID</option>
                </select>

                <button
                    type="button"
                    className="article-selector-btn primary"
                    onClick={handleSearch}
                >
                    🔍 Buscar
                </button>

                <button
                    type="button"
                    className="article-selector-btn primary"
                    onClick={handleConfirm}
                    disabled={selectedIds.length === 0}
                >
                    ✅ Agregar ({selectedIds.length})
                </button>

                <button
                    type="button"
                    className="article-selector-btn danger"
                    onClick={onCancel}
                >
                    ❌ Cancelar
                </button>

            </div>

            {/* TABLE */}
            <div className="article-selector-table-container">

                <table className="article-selector-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th>Precio</th>
                            <th>IVA</th>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={
                                        articles.length > 0 &&
                                        articles.every(article =>
                                            selectedIds.includes(article.id)
                                        )
                                    }
                                    onChange={toggleAll}
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6}>Buscando...</td>
                            </tr>
                        ) : articles.length === 0 ? (
                            <tr>
                                <td colSpan={6}>No se encontraron resultados.</td>
                            </tr>
                        ) : (
                            articles.map(article => (
                                <tr key={article.id}>
                                    <td>{article.id}</td>
                                    <td>{article.code}</td>
                                    <td>{article.desc}</td>
                                    <td>{formatMoney(getArticlePrice(article))}</td>
                                    <td>{getArticleVat(article)}%</td>

                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(article.id)}
                                            onChange={() => toggleArticle(article.id)}
                                        />
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

export default ArticleSelector;