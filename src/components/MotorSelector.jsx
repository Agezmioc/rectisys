import { useState } from "react";
import { useData } from "../context/Context";
import "./MotorSelector.css";

const MotorSelector = ({ onConfirm, onCancel }) => {
    const { getStockMotors } = useData();

    const [searchInput, setSearchInput] = useState("");
    const [searchField, setSearchField] = useState("desc");
    const [motors, setMotors] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        const query = searchInput.trim();

        if (!query) {
            setMotors([]);
            return;
        }

        setLoading(true);

        try {
            const results = await getStockMotors({
                searchField,
                searchQuery: query
            });

            setMotors(results);
        } catch (error) {
            console.error("Error buscando motores:", error);
            setMotors([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="motor-selector">
            <div className="motor-selector-header">
                <h3>Seleccionar motor</h3>
            </div>

            <div className="motor-selector-toolbar">
                <input
                    className="motor-selector-input"
                    type="text"
                    placeholder="Buscar motor..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSearch();
                        }
                    }}
                />

                <select
                    className="motor-selector-select"
                    value={searchField}
                    onChange={e => setSearchField(e.target.value)}
                >
                    <option value="desc">Descripción</option>
                    <option value="id">ID</option>
                </select>

                <button
                    type="button"
                    className="motor-selector-btn primary"
                    onClick={handleSearch}
                    disabled={loading}
                >
                    {loading ? "Buscando..." : "Buscar"}
                </button>
            </div>

            <div className="motor-selector-table-container">
                <table className="motor-selector-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Descripción</th>
                            <th>Lista</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4}>Buscando motores...</td>
                            </tr>
                        ) : motors.length === 0 ? (
                            <tr>
                                <td colSpan={4}>
                                    No se encontraron resultados.
                                </td>
                            </tr>
                        ) : (
                            motors.map(motor => (
                                <tr key={motor.id}>
                                    <td>{motor.id}</td>
                                    <td>{motor.desc}</td>
                                    <td>{motor.list_id}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className="motor-selector-btn"
                                            onClick={() => onConfirm(motor)}
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

            <div className="motor-selector-footer">
                <button
                    type="button"
                    className="motor-selector-btn danger"
                    onClick={onCancel}
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};

export default MotorSelector;