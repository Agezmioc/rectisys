import { useState } from "react";
import { useData } from "../context/Context";

const AccountSelector = ({ onConfirm, onCancel }) => {
    const { dataAccounts } = useData();

    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchField, setSearchField] = useState("name");

    const filteredAccounts = dataAccounts.filter(account => {
        const query = searchQuery.toLowerCase();

        if (searchField === "name") {
            return account.name?.toLowerCase().includes(query);
        }

        if (searchField === "id") {
            return String(account.id).includes(query);
        }

        return true;
    });

    return (
        <div style={{ border: "1px solid #ccc", padding: "1rem" }}>
            <div style={{ marginBottom: "0.5rem" }}>
                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                />

                <select
                    value={searchField}
                    onChange={e => setSearchField(e.target.value)}
                >
                    <option value="name">Nombre</option>
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
                        <th>Nombre</th>
                        <th>Acción</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredAccounts.map(account => (
                        <tr key={account.id}>
                            <td>{account.id}</td>
                            <td>{account.name}</td>

                            <td>
                                <button
                                    type="button"
                                    onClick={() => onConfirm(account)}
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

export default AccountSelector;