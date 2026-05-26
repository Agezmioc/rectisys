import { useState } from "react";
import { useData } from "../context/Context";

const MotorSelector = ({ onConfirm, onCancel }) => {
    const { stockMotors } = useData();

    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchField, setSearchField] = useState("desc");

    const filteredAccounts = stockMotors.filter(motor => {
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
        <div style={{ border: "1px solid #ccc", padding: "1rem" }}>
            <div style={{ marginBottom: "0.5rem" }}>
                <input
                    type="text"
                    placeholder="Buscar motor..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                />

                <select
                    value={searchField}
                    onChange={e => setSearchField(e.target.value)}
                >
                    <option value="desc">Descripción</option>
                    <option value="id">ID</option>
                </select>

                <button
                    type="button"
                    onClick={() => setSearchQuery(searchInput)}
                >
                    Buscar
                </button>
            </div>

            <table style={{ width: "100%" }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Descripción</th>
                        <th>Acción</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredAccounts.map(motor => (
                        <tr key={motor.id}>
                            <td>{motor.id}</td>
                            <td>{motor.desc}</td>

                            <td>
                                <button
                                    type="button"
                                    onClick={() => onConfirm(motor)}
                                >
                                    Seleccionar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button
                type="button"
                onClick={onCancel}
            >
                Cancelar
            </button>
        </div>
    );
};

export default MotorSelector;