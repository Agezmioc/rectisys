import { useState } from "react";
import { useData } from "../context/Context";
import "./StockCategorySelector.css";
import { normalizeSearch } from "../utils/normalizeSearch";

const StockCategorySelector = ({
    onConfirm,
    onCancel
}) => {

    const { stockCategories } = useData();

    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchField, setSearchField] = useState("desc");


    const filteredCategories = (stockCategories || []).filter(category => {

        const query = normalizeSearch(searchQuery);

        if (searchField === "desc") {
            return normalizeSearch(category.desc).includes(query);
        }

        if (searchField === "id") {
            return normalizeSearch(category.id).includes(query);
        }

        if (searchField === "category") {
            return normalizeSearch(category.category).includes(query);
        }

        if (searchField === "subcategory") {
            return normalizeSearch(category.subcategory).includes(query);
        }

        if (searchField === "section") {
            return normalizeSearch(category.section).includes(query);
        }

        return true;
    });



    return (
        <div className="stock-category-selector">

            <div className="stock-category-selector-header">
                <h3>Seleccionar categoría</h3>
            </div>


            <div className="stock-category-selector-toolbar">

                <input
                    className="stock-category-selector-input"
                    type="text"
                    placeholder="Buscar categoría..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                />


                <select
                    className="stock-category-selector-select"
                    value={searchField}
                    onChange={e => setSearchField(e.target.value)}
                >
                    <option value="desc">
                        Descripción
                    </option>

                    <option value="id">
                        ID
                    </option>

                    <option value="category">
                        Categoría
                    </option>

                    <option value="subcategory">
                        Subcategoría
                    </option>

                    <option value="section">
                        Sección
                    </option>
                </select>


                <button
                    type="button"
                    className="stock-category-selector-btn primary"
                    onClick={() => setSearchQuery(searchInput)}
                >
                    Buscar
                </button>

            </div>


            <div className="stock-category-selector-table-container">

                <table className="stock-category-selector-table">

                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Descripción</th>
                            <th>Categoría</th>
                            <th>Subcategoría</th>
                            <th>Sección</th>
                            <th></th>
                        </tr>
                    </thead>


                    <tbody>

                        {filteredCategories.map(category => (

                            <tr key={category.id}>

                                <td>
                                    {category.id}
                                </td>

                                <td>
                                    {category.desc}
                                </td>

                                <td>
                                    {category.category}
                                </td>

                                <td>
                                    {category.subcategory}
                                </td>

                                <td>
                                    {category.section}
                                </td>

                                <td>
                                    <button
                                        type="button"
                                        className="stock-category-selector-btn"
                                        onClick={() => onConfirm(category)}
                                    >
                                        Seleccionar
                                    </button>
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>


            <div className="stock-category-selector-footer">

                <button
                    type="button"
                    className="stock-category-selector-btn danger"
                    onClick={onCancel}
                >
                    Cancelar
                </button>

            </div>

        </div>
    );
};

export default StockCategorySelector;
