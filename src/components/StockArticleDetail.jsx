import { useEffect } from "react";
import { useData } from "../context/Context";
import "./StockArticleDetail.css";

const StockArticleDetail = ({
    article,
    onBack,
    onEdit,
    onNew
}) => {

    const {
        stockLists,
        getStockLists,

        dataAccounts,
        stockCategories,
        stockClasses,
        dataVatTypes,

        getDataAccounts,
        getStockCategories,
        getStockClasses,
        getDataVatTypes,

        deleteStockArticle
    } = useData();




    /*
     * CARGAR LISTAS
     */

    useEffect(() => {

        if (!stockLists?.length) {
            getStockLists();
        }

        if (!dataAccounts?.length) {
            getDataAccounts();
        }

        if (!stockCategories?.length) {
            getStockCategories();
        }

        if (!stockClasses?.length) {
            getStockClasses();
        }

        if (!dataVatTypes?.length) {
            getDataVatTypes();
        }

    }, []);


    /*
     * FORMATEOS
     */

    const formatNumber = (value) =>
        Number(value || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });


    const getListDescription = (listId) => {

        const list = stockLists?.find(
            list => String(list.id) === String(listId)
        );

        return list?.desc || `Lista ${listId}`;
    };


    /*
     * ACCIONES
     */

    const handleDelete = async () => {

        if (!article?.id) {
            return;
        }

        const confirmed = window.confirm(
            `¿Está seguro de eliminar el artículo "${article.desc || article.id}"?`
        );

        if (!confirmed) {
            return;
        }

        const deleted = await deleteStockArticle(
            article.id
        );

        if (!deleted) {

            window.alert(
                "No se puede eliminar el artículo porque está siendo utilizado en un presupuesto o una orden de trabajo."
            );

            return;
        }

        onBack?.();
    };


    if (!article) {
        return (
            <div className="stock-article-detail">
                <p>No se encontró el artículo.</p>

                <button onClick={onBack}>
                    ← Volver
                </button>
            </div>
        );
    }


    return (
        <div className="stock-article-detail">

            {/* HEADER */}

            <header className="stock-article-detail-header">

                <div className="stock-article-detail-topbar">

                    <button onClick={onBack}>
                        ← Volver
                    </button>

                    <div className="stock-article-detail-actions">

                        <button onClick={onNew}>
                            Nuevo
                        </button>

                        <button onClick={onEdit}>
                            Editar
                        </button>

                        <button onClick={handleDelete}>
                            Eliminar
                        </button>

                    </div>

                </div>


                <h2 className="stock-article-detail-title">
                    {article.desc || "Artículo"}
                </h2>

            </header>


            {/* INFORMACIÓN */}

            <section className="stock-article-detail-body">

                <div className="stock-article-detail-grid">

                    {/* INFORMACIÓN GENERAL */}

                    <div className="stock-article-card">

                        <h3>
                            Información general
                        </h3>

                        <div className="stock-article-fields-grid">

                            <div className="stock-article-field">
                                <b>ID:</b>{" "}
                                {article.id}
                            </div>

                            <div className="stock-article-field">
                                <b>Código:</b>{" "}
                                {article.code || "-"}
                            </div>

                            <div className="stock-article-field">
                                <b>Descripción:</b>{" "}
                                {article.desc || "-"}
                            </div>

                            <div className="stock-article-field">
                                <b>Medida:</b>{" "}
                                {article.measure || "-"}
                            </div>

                            <div className="stock-article-field">
                                <b>Concepto:</b>{" "}
                                {article.is_concept
                                    ? "Sí"
                                    : "No"
                                }
                            </div>

                            <div className="stock-article-field">
                                <b>Deshabilitado:</b>{" "}
                                {article.is_disabled
                                    ? "Sí"
                                    : "No"
                                }
                            </div>

                        </div>

                    </div>


                    {/* STOCK */}

                    <div className="stock-article-card">

                        <h3>
                            Stock
                        </h3>

                        <div className="stock-article-fields-grid">

                            <div className="stock-article-field">
                                <b>Stock:</b>{" "}
                                {formatNumber(article.stock)}
                            </div>

                            <div className="stock-article-field">
                                <b>Mínimo:</b>{" "}
                                {formatNumber(article.min)}
                            </div>

                            <div className="stock-article-field">
                                <b>Máximo:</b>{" "}
                                {formatNumber(article.max)}
                            </div>

                        </div>

                    </div>


                    {/* CLASIFICACIÓN */}

                    <div className="stock-article-card">

                        <h3>
                            Clasificación
                        </h3>

                        <div className="stock-article-fields-grid">

                            <div className="stock-article-field">
                                <b>Cuenta:</b>{" "}
                                {dataAccounts?.find(
                                    account =>
                                        Number(account.id) ===
                                        Number(article.account_id)
                                )?.name || "-"}
                            </div>

                            <div className="stock-article-field">
                                <b>Categoría:</b>{" "}
                                {stockCategories?.find(
                                    category =>
                                        Number(category.id) ===
                                        Number(article.category_id)
                                )?.desc || "-"}
                            </div>

                            <div className="stock-article-field">
                                <b>Clase:</b>{" "}
                                {stockClasses?.find(
                                    stockClass =>
                                        Number(stockClass.id) ===
                                        Number(article.class_id)
                                )?.desc || "-"}
                            </div>

                            <div className="stock-article-field">
                                <b>Tipo de IVA:</b>{" "}
                                {dataVatTypes?.find(
                                    vat =>
                                        Number(vat.id) ===
                                        Number(article.vat_type_id)
                                )?.desc || "-"}
                            </div>

                        </div>

                    </div>


                    {/* FECHAS */}

                    <div className="stock-article-card">

                        <h3>
                            Información del sistema
                        </h3>

                        <div className="stock-article-fields-grid">

                            <div className="stock-article-field">
                                <b>Creado:</b>{" "}
                                {article.created_at
                                    ? new Date(
                                        article.created_at
                                    ).toLocaleString("es-AR")
                                    : "-"
                                }
                            </div>

                            <div className="stock-article-field">
                                <b>Actualizado:</b>{" "}
                                {article.updated_at
                                    ? new Date(
                                        article.updated_at
                                    ).toLocaleString("es-AR")
                                    : "-"
                                }
                            </div>

                        </div>

                    </div>

                </div>


                {/* PRECIOS */}

                <div className="stock-article-card stock-article-prices-card">

                    <h3>
                        Precios
                    </h3>

                    {!article.prices ||
                    article.prices.length === 0 ? (

                        <p>
                            No hay precios registrados.
                        </p>

                    ) : (

                        <div className="stock-article-prices-container">

                            <table className="stock-article-prices-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Lista
                                        </th>

                                        <th>
                                            Costo
                                        </th>

                                        <th>
                                            Margen
                                        </th>

                                        <th>
                                            Precio
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {[...article.prices]
                                        .sort(
                                            (a, b) =>
                                                Number(a.list_id) -
                                                Number(b.list_id)
                                        )
                                        .map(price => (

                                            <tr key={`${article.id}-${price.list_id}`}>

                                                <td>
                                                    {getListDescription(
                                                        price.list_id
                                                    )}
                                                </td>

                                                <td>
                                                    {formatNumber(
                                                        price.cost
                                                    )}
                                                </td>

                                                <td>
                                                    {formatNumber(
                                                        price.margin
                                                    )}%
                                                </td>

                                                <td>
                                                    {formatNumber(
                                                        price.price
                                                    )}
                                                </td>

                                            </tr>

                                        ))
                                    }

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </section>

        </div>
    );
};

export default StockArticleDetail;