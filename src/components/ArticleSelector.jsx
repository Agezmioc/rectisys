import { useEffect, useMemo, useState } from "react";
import { useData } from "../context/Context";

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
            priceIndex.get(key)
            ?? priceIndex.get(`${Number(articleId)}-0`)
            ?? 0
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

    const hasSearched = searchQuery.trim().length > 0;

    const filteredArticles = hasSearched
        ? baseArticles
            .filter(article => {
                const query = searchQuery.toLowerCase();

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
            .sort((a, b) => a.id - b.id)
        : [];

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
        <div style={{ border: "1px solid #ccc", padding: "1rem" }}>
            <h2>
                Seleccionar {isConcept ? "conceptos" : "artículos"}
            </h2>

            <div style={{ marginBottom: "1rem" }}>
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                />

                <select
                    value={searchField}
                    onChange={e => setSearchField(e.target.value)}
                    style={{ marginLeft: "0.5rem" }}
                >
                    <option value="desc">Descripción</option>
                    <option value="code">Código</option>
                    <option value="id">ID</option>
                </select>

                <button
                    type="button"
                    onClick={() => {
                        console.log("🧪 SEARCH CLICK DEBUG");

                        console.log("VAT DEBUG SAMPLE:", {
                            articleVatType: filteredArticles[0]?.vat_type_id,
                            vatMapKeys: [...vatMap.keys()].slice(0, 10),
                            vatMapKeyTypes: typeof [...vatMap.keys()][0]
                        });

                        setSearchQuery(searchInput);
                    }}
                >
                    🔍 Buscar
</button>
            </div>

            <table width="100%">
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

                            <td>{getArticlePrice(article.id, article.is_concept)}</td>
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

            <div style={{ marginTop: "1rem" }}>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={selectedIds.length === 0}
                >
                    ✅ Agregar seleccionados ({selectedIds.length})
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    style={{ marginLeft: "0.5rem" }}
                >
                    ❌ Cancelar
                </button>
            </div>
        </div>
    );
};

export default ArticleSelector;
