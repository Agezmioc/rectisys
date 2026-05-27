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
        stockArticles,
        stockPrices,
        dataVatTypes,
        getDataVatTypes
    } = useData();

    const [selectedIds, setSelectedIds] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchField, setSearchField] = useState("desc");

    const priceIndex = useMemo(() => {
        const map = new Map();

        for (const p of stockPrices) {
            const key = `${p.article_id}-${p.list_id}`;
            map.set(key, Number(p.price));
        }

        return map;
    }, [stockPrices]);

    const vatMap = useMemo(() => {
        return new Map(dataVatTypes.map(v => [v.id, v]));
    }, [dataVatTypes]);

    const getArticlePrice = (articleId) => {
        const key = `${Number(articleId)}-${Number(listId)}`;

        return (
            priceIndex.get(key) ??
            priceIndex.get(`${Number(articleId)}-0`) ??
            0
        );
    };

    const getArticleVat = (article) => {
        return vatMap.get(article.vat_type_id)?.value ?? 0;
    };

    const baseArticles = useMemo(() => {
        return stockArticles.filter(article =>
            article.is_concept === isConcept
        );
    }, [stockArticles, isConcept]);

    const filteredArticles = useMemo(() => {
        const query = searchQuery.toLowerCase();

        if (!query) return [];

        return baseArticles
            .filter(article => {
                if (searchField === "desc") {
                    return article.desc?.toLowerCase().includes(query);
                }
                if (searchField === "code") {
                    return article.code?.toLowerCase().includes(query);
                }
                if (searchField === "id") {
                    return String(article.id).includes(query);
                }
                return true;
            })
            .sort((a, b) => a.id - b.id);
    }, [baseArticles, searchQuery, searchField]);

    const toggleArticle = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(aid => aid !== id)
                : [...prev, id]
        );
    };

    const toggleAll = () => {
        const visibleIds = filteredArticles.map(a => a.id);

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
        const selectedArticles = filteredArticles.filter(article =>
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
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
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
                    onClick={() => setSearchQuery(searchInput)}
                >
                    🔍 Buscar
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
                                        filteredArticles.length > 0 &&
                                        filteredArticles.every(article =>
                                            selectedIds.includes(article.id)
                                        )
                                    }
                                    onChange={toggleAll}
                                />
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredArticles.map(article => (
                            <tr key={article.id}>
                                <td>{article.id}</td>
                                <td>{article.code}</td>
                                <td>{article.desc}</td>
                                <td>{getArticlePrice(article.id)}</td>
                                <td>{getArticleVat(article)}%</td>

                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(article.id)}
                                        onChange={() => toggleArticle(article.id)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            </div>

            {/* FOOTER */}
            <div className="article-selector-footer">

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

        </div>
    );
};

export default ArticleSelector;