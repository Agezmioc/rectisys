import { useState } from "react";
import { useData } from "../context/Context";
import "./MotorSelector.css";

const MotorSelector = ({ onConfirm, onCancel }) => {
    const { stockMotors } = useData();

    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchField, setSearchField] = useState("desc");

    const filteredMotors = stockMotors.filter(motor => {
        const query = searchQuery.toLowerCase();

        if (searchField === "desc") {
            return motor.desc?.toLowerCase().includes(query);
        }

        if (searchField === "id") {
            return String(motor.id).includes(query);
        }

        return true;
    });

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
                    onClick={() => setSearchQuery(searchInput)}
                >
                    Buscar
                </button>

            </div>

            <div className="motor-selector-table-container">
                <table className="motor-selector-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Descripción</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredMotors.map(motor => (
                            <tr key={motor.id}>
                                <td>{motor.id}</td>
                                <td>{motor.desc}</td>

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
                        ))}
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