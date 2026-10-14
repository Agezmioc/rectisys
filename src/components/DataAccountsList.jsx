import { useState } from "react";
import { useData } from "../context/Context";
import DataAccountDetail from "./DataAccountDetail";
import DataAccountManager from "./DataAccountManager";
import "./DataAccountsList.css";
import { normalizeSearch } from "../utils/normalizeSearch";

const DataAccountsList = () => {

    const {
        getDataAccounts,
        dataTaxPositions,
        loading
    } = useData();

    const [accounts, setAccounts] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

    const [searchInput, setSearchInput] = useState("");
    const [searchField, setSearchField] = useState("id");

    const [accountType, setAccountType] = useState("all");

    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);

    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);


    /*
     * BÚSQUEDA
     */

    const handleSearch = async () => {
        const query = searchInput.trim();

        if (!query) {
            setHasSearched(false);
            setAccounts([]);
            return;
        }

        const data = await getDataAccounts();

        let filteredData = data || [];

        if (accountType === "client") {
            filteredData = filteredData.filter(
                account => account.is_client
            );
        }

        if (accountType === "provider") {
            filteredData = filteredData.filter(
                account => account.is_provider
            );
        }

        const normalizedQuery = normalizeSearch(query);

        filteredData = filteredData.filter(account => {
            if (searchField === "id") {
                return normalizeSearch(account.id).includes(normalizedQuery);
            }

            if (searchField === "name") {
                return normalizeSearch(account.name).includes(normalizedQuery);
            }

            return false;
        });

        setAccounts(filteredData);
        setHasSearched(true);
    };



    /*
     * ORDEN Y LÍMITE
     */

    const displayedAccounts = [...accounts]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .slice(0, 100);


    /*
     * CAMPOS DE BÚSQUEDA
     */

    const searchFields = {
        id: "ID",
        name: "Nombre"
    };


    /*
     * CARGANDO
     */

    if (loading) {
        return <p>Cargando clientes y proveedores...</p>;
    }


    /*
     * NUEVO
     */

    if (isCreating) {

        return (
            <DataAccountManager
                initialAccount={null}

                onCancel={() =>
                    setIsCreating(false)
                }

                onSaved={async (saved) => {

                    setIsCreating(false);
                    setIsEditing(false);

                    const data =
                        await getDataAccounts();

                    setAccounts(data || []);

                    setSelectedAccount(saved);
                    setSelectedAccountId(saved.id);
                }}
            />
        );
    }


    /*
     * EDICIÓN
     */

    if (isEditing && selectedAccount) {

        return (
            <>
                <button
                    onClick={() =>
                        setIsEditing(false)
                    }
                >
                    ← Volver
                </button>

                <DataAccountManager
                    initialAccount={selectedAccount}

                    onCancel={() =>
                        setIsEditing(false)
                    }

                    onSaved={async (saved) => {

                        setIsEditing(false);
                        setIsCreating(false);

                        const data =
                            await getDataAccounts();

                        setAccounts(data || []);

                        setSelectedAccount(saved);
                        setSelectedAccountId(saved.id);
                    }}
                />
            </>
        );
    }


    /*
     * DETALLE
     */

    if (selectedAccountId) {

        return (
            <DataAccountDetail
                account={selectedAccount}

                onBack={async () => {
                    const data = await getDataAccounts();

                    setAccounts(data || []);
                    setSelectedAccountId(null);
                    setSelectedAccount(null);
                }}

                onNew={() => {
                    setSelectedAccountId(null);
                    setIsCreating(true);
                }}

                onEdit={() => {
                    setIsEditing(true);
                }}
            />
        );
    }


    /*
     * LISTA
     */

    return (
        <div className="data-accounts-list">

            {/* ACCIONES */}

            <div className="data-accounts-actions">

                <button
                    onClick={() => {
                        setSelectedAccountId(null);
                        setIsEditing(false);
                        setIsCreating(true);
                    }}
                >
                    + Nueva cuenta
                </button>

            </div>


            {/* FILTROS */}

            <div className="data-accounts-filters">

                <input
                    className="data-accounts-input"
                    type="text"
                    placeholder="Buscar..."
                    value={searchInput}
                    onChange={e =>
                        setSearchInput(e.target.value)
                    }
                />


                <select
                    value={searchField}
                    onChange={e =>
                        setSearchField(e.target.value)
                    }
                >
                    {Object.keys(searchFields).map(field => (

                        <option
                            key={field}
                            value={field}
                        >
                            {searchFields[field]}
                        </option>

                    ))}
                </select>


                <select
                    value={accountType}
                    onChange={e =>
                        setAccountType(e.target.value)
                    }
                >
                    <option value="all">
                        Todos
                    </option>

                    <option value="client">
                        Clientes
                    </option>

                    <option value="provider">
                        Proveedores
                    </option>
                </select>


                <button
                    onClick={handleSearch}
                >
                    Buscar
                </button>

            </div>


            {/* RESULTADOS */}

            {!hasSearched ? (

                <p>Ingresá un criterio de búsqueda.</p>

            ) : displayedAccounts.length === 0 ? (

                <p>No hay resultados</p>

            ) : (

                <div className="data-accounts-table-container">

                    <table className="data-accounts-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Nº fiscal</th>
                                <th>Posición impositiva</th>
                                <th>Cliente</th>
                                <th>Proveedor</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {displayedAccounts.map(account => (
                                <tr key={account.id}>
                                    <td>{account.id || "-"}</td>
                                    <td>{account.name || "-"}</td>
                                    <td>{account.tax_num || "-"}</td>
                                    <td>
                                        {dataTaxPositions?.find(
                                            position =>
                                                Number(position.id) ===
                                                Number(account.tax_position_id)
                                        )?.desc || "-"}
                                    </td>
                                    <td>{account.is_client ? "Sí" : "No"}</td>
                                    <td>{account.is_provider ? "Sí" : "No"}</td>
                                    <td>
                                        <button
                                            onClick={() => {
                                                setSelectedAccount(account);
                                                setSelectedAccountId(account.id);
                                            }}
                                        >
                                            Ver detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>

            )}

        </div>
    );
};

export default DataAccountsList;