
import { useState } from "react";
import { useData } from "../context/Context";
import "./AccountSelector.css";

const AccountSelector = ({ onConfirm, onCancel }) => {
    const { getDataAccounts, dataTaxPositions } = useData();

    const [searchInput, setSearchInput] = useState("");
    const [searchField, setSearchField] = useState("name");
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        const query = searchInput.trim();

        if (!query) {
            setAccounts([]);
            return;
        }

        setLoading(true);

        try {
            const results = await getDataAccounts({
                searchField,
                searchQuery: query
            });

            setAccounts(results);
        } catch (error) {
            console.error("Error buscando cuentas:", error);
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="account-selector">
            <div className="account-selector-header">
                <h3>Seleccionar cliente</h3>
            </div>

            <div className="account-selector-toolbar">
                <input
                    className="account-selector-input"
                    type="text"
                    placeholder="Buscar cliente..."
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
                    className="account-selector-select"
                    value={searchField}
                    onChange={e => setSearchField(e.target.value)}
                >
                    <option value="name">Nombre</option>
                    <option value="id">ID</option>
                </select>

                <button
                    type="button"
                    className="account-selector-btn primary"
                    onClick={handleSearch}
                    disabled={loading}
                >
                    {loading ? "Buscando..." : "Buscar"}
                </button>
            </div>

            <div className="account-selector-table-container">
                <table className="account-selector-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Situación fiscal</th>
                            <th>CUIT</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5}>Buscando cuentas...</td>
                            </tr>
                        ) : accounts.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    No se encontraron resultados.
                                </td>
                            </tr>
                        ) : (
                            accounts.map(account => {
                                const taxPosition = dataTaxPositions.find(
                                    tp => tp.id === Number(account.tax_position_id)
                                );

                                return (
                                    <tr key={account.id}>
                                        <td>{account.id}</td>
                                        <td>{account.name}</td>
                                        <td>{taxPosition?.desc || "-"}</td>
                                        <td>{account.tax_num || "-"}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="account-selector-btn"
                                                onClick={() => onConfirm(account)}
                                            >
                                                Seleccionar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="account-selector-footer">
                <button
                    type="button"
                    className="account-selector-btn danger"
                    onClick={onCancel}
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};

export default AccountSelector;