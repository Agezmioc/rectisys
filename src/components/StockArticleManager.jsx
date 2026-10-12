import { useEffect, useMemo, useState } from "react";
import { useData } from "../context/Context";
import { isValidNumberInput } from "../utils/numberInput";
import "./StockArticleManager.css";
import StockCategorySelector from "./StockCategorySelector";

const StockArticleManager = ({
    initialArticle = null,
    onCancel,
    onSaved
}) => {

    const {
        createStockArticle,
        updateStockArticle,

        stockLists,
        getStockLists,

        stockCategories,
        getStockCategories,

        stockClasses,
        getStockClasses,

        getProviderAccountId,

        dataAccounts,
        dataVatTypes,
        getDataVatTypes
    } = useData();


    /*
     * ESTADO
     */
    const [showCategorySelector, setShowCategorySelector] = useState(false);

    const emptyArticle = {
        code: "",
        measure: "",
        desc: "",

        is_concept: false,

        stock: 0,
        min: 0,
        max: 0,

        account_id: "",
        category_id: "",
        class_id: "",
        vat_type_id: 1,

        is_disabled: false
    };


    const [article, setArticle] = useState(() => {

        if (!initialArticle) {
            return emptyArticle;
        }

        return {
            ...emptyArticle,
            ...initialArticle,

            is_concept:
                initialArticle.is_concept === true ||
                initialArticle.is_concept === 1 ||
                initialArticle.is_concept === "1",

            is_disabled:
                initialArticle.is_disabled === true ||
                initialArticle.is_disabled === 1 ||
                initialArticle.is_disabled === "1"
        };
    });


    const [prices, setPrices] = useState(() => {

        if (!initialArticle?.prices) {

            return initialArticle?.is_concept
                ? []
                : [{
                    list_id: "0",
                    cost: 0,
                    margin: 0,
                    price: 0
                }];
        }

        const articlePrices =
            initialArticle.prices.map(price => ({
                ...price,
                list_id: String(price.list_id),
                cost: price.cost ?? 0,
                margin: price.margin ?? 0,
                price: price.price ?? 0
            }));

        if (initialArticle.is_concept) {

            return articlePrices.filter(
                price =>
                    Number(price.list_id) !== 0
            );
        }

        const articlePrice = articlePrices.find(
            price =>
                Number(price.list_id) === 0
        );

        return articlePrice
            ? [articlePrice]
            : [{
                list_id: "0",
                cost: 0,
                margin: 0,
                price: 0
            }];
    });


    /*
     * CARGAR DATOS
     */

    useEffect(() => {
        if (!stockLists?.length) {
            getStockLists();
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

    useEffect(() => {

        const updateAutomaticFields = async () => {

            const parameterId = article.is_concept ? 1 : 2;

            const accountId =
                await getProviderAccountId(parameterId);

            const classDescription =
                article.is_concept
                    ? "conceptos"
                    : "general";

            const classId =
                stockClasses?.find(
                    stockClass =>
                        stockClass.desc?.trim().toLowerCase() ===
                        classDescription
                )?.id ?? "";

            setArticle(prev => ({
                ...prev,
                account_id: accountId ?? "",
                class_id: classId
            }));
        };


        if (!stockClasses?.length) {
            return;
        }

        updateAutomaticFields();

    }, [
        article.is_concept,
        stockClasses,
        getProviderAccountId
    ]);


    /*
     * CAMPOS NUMÉRICOS
     */

    const decimalFields = [
        "stock",
        "min",
        "max"
    ];


    /*
     * CAMBIO DE ARTÍCULO
     */

    const handleArticleChange = (e) => {

        const {
            name,
            value,
            type,
            checked
        } = e.target;

        if (type === "checkbox") {

            setArticle(prev => ({
                ...prev,
                [name]: checked
            }));

            if (name === "is_concept") {

                if (checked) {

                    // Concepto: no puede tener lista de Artículos
                    setPrices(prev =>
                        prev.filter(
                            price =>
                                Number(price.list_id) !== 0
                        )
                    );

                } else {

                    // Artículo: solamente lista de Artículos
                    setPrices(prev => {

                        const articlePrice = prev.find(
                            price =>
                                Number(price.list_id) === 0
                        );

                        return articlePrice
                            ? [articlePrice]
                            : [{
                                list_id: "0",
                                cost: 0,
                                margin: 0,
                                price: 0
                            }];
                    });
                }
            }

            return;
        }

        if (decimalFields.includes(name)) {

            if (
                !isValidNumberInput(
                    value,
                    { decimals: 2 }
                )
            ) {
                return;
            }
        }

        setArticle(prev => ({
            ...prev,
            [name]: value
        }));
    };


    /*
     * CAMBIO DE PRECIO
     */

    const handlePriceChange = (
        listId,
        field,
        value
    ) => {

        if (
            !isValidNumberInput(
                value,
                { decimals: 2 }
            )
        ) {
            return;
        }

        setPrices(prev =>
            prev.map(price => {

                if (
                    String(price.list_id) !==
                    String(listId)
                ) {
                    return price;
                }

                const updatedPrice = {
                    ...price,
                    [field]: value
                };

                const cost =
                    Number(updatedPrice.cost) || 0;

                const margin =
                    Number(updatedPrice.margin) || 0;

                updatedPrice.price =
                    cost + (cost * margin / 100);

                return updatedPrice;
            })
        );
    };


    /*
     * AGREGAR LISTA
     */

    const handleAddPrice = (listId) => {

        if (!listId) {
            return;
        }


        const exists = prices.some(
            price =>
                String(price.list_id) ===
                String(listId)
        );


        if (exists) {
            return;
        }


        setPrices(prev => [
            ...prev,
            {
                list_id: String(listId),
                cost: 0,
                margin: 0,
                price: 0
            }
        ]);
    };


    /*
     * ELIMINAR LISTA
     */

    const handleRemovePrice = (listId) => {

        setPrices(prev =>
            prev.filter(
                price =>
                    String(price.list_id) !==
                    String(listId)
            )
        );
    };


    /*
     * LISTAS DISPONIBLES
     */

    const availableLists = useMemo(() => {

        return (stockLists || []).filter(list => {

            if (list.is_disabled) {
                return false;
            }

            // Artículo: únicamente lista de Artículos (id = 0)
            if (!article.is_concept) {
                return (
                    Number(list.id) === 0 &&
                    !prices.some(
                        price =>
                            String(price.list_id) ===
                            String(list.id)
                    )
                );
            }

            // Concepto: todas las listas excepto Artículos
            return (
                Number(list.id) !== 0 &&
                !prices.some(
                    price =>
                        String(price.list_id) ===
                        String(list.id)
                )
            );

        });

    }, [stockLists, prices, article.is_concept]);


    /*
     * GUARDAR
     */

    const handleSubmit = async (e) => {

        e.preventDefault();

        const now = new Date().toISOString();

        const articleData = {

            code:
                article.code?.trim() || null,

            measure:
                article.measure?.trim() || null,

            desc:
                article.desc?.trim() || null,

            is_concept:
                article.is_concept,

            stock:
                Number(article.stock) || 0,

            min:
                Number(article.min) || 0,

            max:
                Number(article.max) || 0,

            account_id:
                article.account_id
                    ? Number(article.account_id)
                    : null,

            category_id:
                article.category_id
                    ? Number(article.category_id)
                    : null,

            class_id:
                article.class_id
                    ? Number(article.class_id)
                    : null,

            // Siempre 1
            vat_type_id: 1,

            is_disabled:
                article.is_disabled,

            updated_at: now
        };


        const pricesToSave = prices.map(price => ({

            list_id:
                Number(price.list_id),

            cost:
                Number(price.cost) || 0,

            margin:
                Number(price.margin) || 0,

            price:
                Number(price.price) || 0

        }));


        const saved = initialArticle

            ? await updateStockArticle(
                initialArticle.id,
                articleData,
                pricesToSave
            )

            : await createStockArticle(
                articleData,
                pricesToSave
            );


        if (!saved) {
            return;
        }


        console.log(
            "SAVED ARTICLE:",
            saved
        );


        onSaved?.(saved);
    };


    /*
     * RENDER
     */

    if (showCategorySelector) {

        return (
            <StockCategorySelector

                onConfirm={(category) => {

                    setArticle(prev => ({
                        ...prev,
                        category_id: category.id
                    }));

                    setShowCategorySelector(false);
                }}

                onCancel={() =>
                    setShowCategorySelector(false)
                }

            />
        );
    }

    return (

        <div className="stock-article-manager">


            {/* HEADER */}

            <header className="stock-article-manager-header">

                <div className="stock-article-manager-topbar">

                    <h2>

                        {initialArticle
                            ? `Editar Artículo #${initialArticle.id}`
                            : "Nuevo Artículo"
                        }

                    </h2>


                    <div className="stock-article-manager-actions">

                        <button
                            type="submit"
                            form="article-form"
                        >
                            {initialArticle
                                ? "Actualizar"
                                : "Guardar"
                            }
                        </button>


                        <button
                            type="button"
                            onClick={onCancel}
                        >
                            Cancelar
                        </button>

                    </div>

                </div>

            </header>


            {/* BODY */}

            <div className="stock-article-manager-body">

                <form
                    id="article-form"
                    onSubmit={handleSubmit}
                >


                    {/* INFORMACIÓN GENERAL */}

                    <section className="stock-article-card-grid">


                        <div className="stock-article-card">

                            <h3>
                                Información general
                            </h3>


                            <div className="stock-article-card-content">


                                <div>

                                    <label>
                                        Código
                                    </label>

                                    <input
                                        name="code"
                                        value={
                                            article.code
                                        }
                                        onChange={
                                            handleArticleChange
                                        }
                                    />

                                </div>


                                <div>

                                    <label>
                                        Descripción
                                    </label>

                                    <input
                                        name="desc"
                                        value={
                                            article.desc
                                        }
                                        onChange={
                                            handleArticleChange
                                        }
                                    />

                                </div>


                                <div>

                                    <label>
                                        Medida
                                    </label>

                                    <input
                                        name="measure"
                                        value={
                                            article.measure
                                        }
                                        onChange={
                                            handleArticleChange
                                        }
                                    />

                                </div>


                                <div className="stock-article-checkbox">

                                    <label>

                                        Concepto

                                        <input
                                            type="checkbox"
                                            name="is_concept"
                                            checked={
                                                article.is_concept
                                            }
                                            onChange={
                                                handleArticleChange
                                            }
                                        />

                                    </label>

                                </div>


                                <div className="stock-article-checkbox">

                                    <label>

                                        Deshabilitado

                                        <input
                                            type="checkbox"
                                            name="is_disabled"
                                            checked={
                                                article.is_disabled
                                            }
                                            onChange={
                                                handleArticleChange
                                            }
                                        />

                                    </label>

                                </div>

                            </div>

                        </div>


                        {/* STOCK */}

                        <div className="stock-article-card">

                            <h3>
                                Stock
                            </h3>


                            <div className="stock-article-card-content">


                                <div>

                                    <label>
                                        Stock
                                    </label>

                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        name="stock"
                                        value={
                                            article.stock
                                        }
                                        onChange={
                                            handleArticleChange
                                        }
                                    />

                                </div>


                                <div>

                                    <label>
                                        Mínimo
                                    </label>

                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        name="min"
                                        value={
                                            article.min
                                        }
                                        onChange={
                                            handleArticleChange
                                        }
                                    />

                                </div>


                                <div>

                                    <label>
                                        Máximo
                                    </label>

                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        name="max"
                                        value={
                                            article.max
                                        }
                                        onChange={
                                            handleArticleChange
                                        }
                                    />

                                </div>

                            </div>

                        </div>


                        {/* CLASIFICACIÓN */}

                        <div className="stock-article-card">

                            <h3>
                                Clasificación
                            </h3>


                            <div className="stock-article-card-content">


                                <div>

                                    <label>
                                        Cuenta
                                    </label>

                                    <input
                                        value={
                                            dataAccounts?.find(
                                                account =>
                                                    Number(account.id) ===
                                                    Number(article.account_id)
                                            )?.name || ""
                                        }
                                        readOnly
                                    />

                                </div>


                                <div>

                                    <label>
                                        Categoría
                                    </label>

                                    <div className="stock-article-category-selector">

                                        <input
                                            value={
                                                stockCategories?.find(
                                                    category =>
                                                        Number(category.id) ===
                                                        Number(article.category_id)
                                                )?.desc || ""
                                            }
                                            placeholder="Sin categoría"
                                            readOnly
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowCategorySelector(true)}
                                        >
                                            Seleccionar
                                        </button>

                                    </div>

                                </div>


                                <div>

                                    <label>
                                        Clase
                                    </label>

                                    <input
                                        value={
                                            stockClasses?.find(
                                                stockClass =>
                                                    Number(stockClass.id) ===
                                                    Number(article.class_id)
                                            )?.desc || ""
                                        }
                                        readOnly
                                    />

                                </div>


                                <div>

                                    <label>
                                        Tipo de IVA
                                    </label>

                                    <input
                                        value={
                                            dataVatTypes?.find(
                                                vat => Number(vat.id) === 1
                                            )?.desc || ""
                                        }
                                        readOnly
                                    />

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* PRECIOS */}

                    <section className="stock-article-card">

                        <div className="stock-article-prices-header">

                            <h3>
                                Precios
                            </h3>


                            {article.is_concept && (

                                <div className="stock-article-add-price">

                                    <select
                                        id="new-price-list"
                                        defaultValue=""
                                    >

                                        <option value="">
                                            Seleccionar lista...
                                        </option>

                                        {availableLists.map(
                                            list => (

                                                <option
                                                    key={list.id}
                                                    value={list.id}
                                                >
                                                    {list.desc}
                                                </option>

                                            )
                                        )}

                                    </select>


                                    <button
                                        type="button"
                                        onClick={() => {

                                            const select =
                                                document.getElementById(
                                                    "new-price-list"
                                                );

                                            handleAddPrice(
                                                select.value
                                            );

                                            select.value = "";

                                        }}
                                    >
                                        + Agregar lista
                                    </button>

                                </div>

                            )}

                        </div>


                        {prices.length === 0 ? (

                            <p>
                                No hay listas de precios.
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
                                                Margen (%)
                                            </th>

                                            <th>
                                                Precio
                                            </th>

                                            <th>
                                                Acción
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {[...prices]
                                            .sort(
                                                (a, b) =>
                                                    Number(
                                                        a.list_id
                                                    ) -
                                                    Number(
                                                        b.list_id
                                                    )
                                            )
                                            .map(price => (

                                                <tr
                                                    key={
                                                        price.list_id
                                                    }
                                                >

                                                    <td>

                                                        {
                                                            stockLists?.find(
                                                                list =>
                                                                    String(
                                                                        list.id
                                                                    ) ===
                                                                    String(
                                                                        price.list_id
                                                                    )
                                                            )?.desc
                                                            ||
                                                            `Lista ${price.list_id}`
                                                        }

                                                    </td>


                                                    <td>

                                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={
                                                                price.cost
                                                            }
                                                            onChange={
                                                                e =>
                                                                    handlePriceChange(
                                                                        price.list_id,
                                                                        "cost",
                                                                        e.target.value
                                                                    )
                                                            }
                                                        />


                                                    </td>


                                                    <td>

                                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={
                                                                price.margin
                                                            }
                                                            onChange={
                                                                e =>
                                                                    handlePriceChange(
                                                                        price.list_id,
                                                                        "margin",
                                                                        e.target.value
                                                                    )
                                                            }
                                                        />

                                                    </td>


                                                    <td>

                                                        <input
                                                            type="text"
                                                            value={Number(price.price || 0).toFixed(2)}
                                                            readOnly
                                                        />

                                                    </td>


                                                    <td>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemovePrice(
                                                                    price.list_id
                                                                )
                                                            }
                                                        >
                                                            Eliminar
                                                        </button>

                                                    </td>

                                                </tr>

                                            ))
                                        }

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </section>

                </form>

            </div>

        </div>
    );
};

export default StockArticleManager;
