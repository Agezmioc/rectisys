import { useEffect, useState } from "react";
import { useData } from "../context/Context";
import "./DataAccountManager.css";
import { isValidNumberInput } from "../utils/numberInput";

const DataAccountManager = ({
    initialAccount = null,
    onCancel,
    onSaved
}) => {

    const {
        createDataAccount,
        updateDataAccount,

        dataTaxPositions,
        getDataTaxPositions
    } = useData();


    /*
     * ESTADO
     */

    const emptyAccount = {
        code: "",
        name: "",
        email: "",
        address: "",
        district: "",
        localy: "",
        phone_num: "",

        tax_position_id: "",
        discount: "",
        tax_num: "",
        balance: "",
        tax_num_2: "",

        is_client: false,
        is_provider: false,
        is_disabled: false
    };


    const [account, setAccount] = useState(() => {

        if (!initialAccount) {
            return emptyAccount;
        }

        return {
            ...emptyAccount,
            ...initialAccount,

            code: initialAccount.code ?? "",
            name: initialAccount.name ?? "",
            email: initialAccount.email ?? "",
            address: initialAccount.address ?? "",
            district: initialAccount.district ?? "",
            localy: initialAccount.localy ?? "",
            phone_num: initialAccount.phone_num ?? "",

            tax_position_id:
                initialAccount.tax_position_id ?? "",

            discount:
                initialAccount.discount ?? "",

            tax_num: initialAccount.tax_num ?? "",
            balance: initialAccount.balance ?? "",
            tax_num_2: initialAccount.tax_num_2 ?? "",

            is_client:
                initialAccount.is_client === true ||
                initialAccount.is_client === 1 ||
                initialAccount.is_client === "1",

            is_provider:
                initialAccount.is_provider === true ||
                initialAccount.is_provider === 1 ||
                initialAccount.is_provider === "1",

            is_disabled:
                initialAccount.is_disabled === true ||
                initialAccount.is_disabled === 1 ||
                initialAccount.is_disabled === "1"
        };
    });


    /*
     * CARGAR DATOS
     */

    useEffect(() => {

        if (!dataTaxPositions?.length) {
            getDataTaxPositions();
        }

    }, []);


    /*
     * CAMBIO DE CUENTA
     */

    const handleAccountChange = (e) => {

        const {
            name,
            value,
            type,
            checked
        } = e.target;


        if (type === "checkbox") {

            setAccount(prev => ({
                ...prev,
                [name]: checked
            }));

            return;
        }


        if (name === "discount") {

            if (
                !isValidNumberInput(
                    value,
                    { decimals: 2 }
                )
            ) {
                return;
            }
        }


        setAccount(prev => ({
            ...prev,
            [name]: value
        }));
    };


    /*
     * GUARDAR
     */

    const handleSubmit = async (e) => {

        e.preventDefault();


        const accountData = {

            code:
                account.code?.trim() || null,

            name:
                account.name?.trim() || null,

            email:
                account.email?.trim() || null,

            address:
                account.address?.trim() || null,

            district:
                account.district?.trim() || null,

            localy:
                account.localy?.trim() || null,

            phone_num:
                account.phone_num?.trim() || null,

            tax_position_id:
                account.tax_position_id
                    ? Number(account.tax_position_id)
                    : null,

            discount:
                account.discount !== "" &&
                account.discount != null
                    ? Number(account.discount)
                    : null,

            tax_num:
                account.tax_num?.trim() || null,

            balance:
                account.balance?.trim() || null,

            tax_num_2:
                account.tax_num_2?.trim() || null,

            is_client:
                account.is_client,

            is_provider:
                account.is_provider,

            is_disabled:
                account.is_disabled
        };


        const saved = initialAccount

            ? await updateDataAccount(
                initialAccount.id,
                accountData
            )

            : await createDataAccount(
                accountData
            );


        if (!saved) {
            return;
        }


        console.log(
            "SAVED ACCOUNT:",
            saved
        );


        onSaved?.(saved);
    };


    /*
     * RENDER
     */

    return (

        <div className="data-account-manager">


            {/* HEADER */}

            <header className="data-account-manager-header">

                <div className="data-account-manager-topbar">

                    <h2>

                        {initialAccount
                            ? `Editar Cuenta #${initialAccount.id}`
                            : "Nueva Cuenta"
                        }

                    </h2>


                    <div className="data-account-manager-actions">

                        <button
                            type="submit"
                            form="account-form"
                        >
                            {initialAccount
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

            <div className="data-account-manager-body">

                <form
                    id="account-form"
                    onSubmit={handleSubmit}
                >


                    {/* INFORMACIÓN GENERAL */}

                    <section className="data-account-card-grid">


                        <div className="data-account-card">

                            <h3>
                                Información general
                            </h3>


                            <div className="data-account-card-content">

                                <div>

                                    <label>
                                        Nombre
                                    </label>

                                    <input
                                        name="name"
                                        value={
                                            account.name
                                        }
                                        onChange={
                                            handleAccountChange
                                        }
                                    />

                                </div>

                                <div>

                                    <label>
                                        Código Auxiliar
                                    </label>

                                    <input
                                        name="code"
                                        value={
                                            account.code
                                        }
                                        onChange={
                                            handleAccountChange
                                        }
                                    />

                                </div>

                                <div>

                                    <label>
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={
                                            account.email
                                        }
                                        onChange={
                                            handleAccountChange
                                        }
                                    />

                                </div>


                                <div>

                                    <label>
                                        Teléfono
                                    </label>

                                    <input
                                        name="phone_num"
                                        value={
                                            account.phone_num
                                        }
                                        onChange={
                                            handleAccountChange
                                        }
                                    />

                                </div>

                            </div>

                        </div>


                        {/* DOMICILIO */}

                        <div className="data-account-card">

                            <h3>
                                Domicilio
                            </h3>


                            <div className="data-account-card-content">


                                <div>

                                    <label>
                                        Dirección
                                    </label>

                                    <input
                                        name="address"
                                        value={
                                            account.address
                                        }
                                        onChange={
                                            handleAccountChange
                                        }
                                    />

                                </div>


                                <div>

                                    <label>
                                        Distrito
                                    </label>

                                    <input
                                        name="district"
                                        value={
                                            account.district
                                        }
                                        onChange={
                                            handleAccountChange
                                        }
                                    />

                                </div>


                                <div>

                                    <label>
                                        Localidad
                                    </label>

                                    <input
                                        name="localy"
                                        value={
                                            account.localy
                                        }
                                        onChange={
                                            handleAccountChange
                                        }
                                    />

                                </div>

                            </div>

                        </div>


                        {/* INFORMACIÓN FISCAL */}

                        <div className="data-account-card">

                            <h3>
                                Información fiscal
                            </h3>


                            <div className="data-account-card-content">


                                <div>

                                    <label>
                                        Posición impositiva
                                    </label>

                                    <select
                                        name="tax_position_id"
                                        value={
                                            account.tax_position_id
                                        }
                                        onChange={
                                            handleAccountChange
                                        }
                                    >

                                        <option value="">
                                            Seleccionar...
                                        </option>

                                        {(dataTaxPositions || []).map(
                                            position => (

                                                <option
                                                    key={position.id}
                                                    value={position.id}
                                                >
                                                    {position.desc}
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>


                                <div>

                                    <label>
                                        Nº fiscal
                                    </label>

                                    <input
                                        name="tax_num"
                                        value={
                                            account.tax_num
                                        }
                                        onChange={
                                            handleAccountChange
                                        }
                                    />

                                </div>


                                <div>

                                    <label>
                                        Nº fiscal 2
                                    </label>

                                    <input
                                        name="tax_num_2"
                                        maxLength={50}
                                        value={
                                            account.tax_num_2
                                        }
                                        onChange={
                                            handleAccountChange
                                        }
                                    />

                                </div>


                                <div>

                                    <label>
                                        Ingresos brutos
                                    </label>

                                    <input
                                        name="balance"
                                        value={
                                            account.balance
                                        }
                                        onChange={
                                            handleAccountChange
                                        }
                                    />

                                </div>


                                <div>

                                    <label>
                                        Descuento (%)
                                    </label>

                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        name="discount"
                                        value={account.discount}
                                        onChange={handleAccountChange}
                                    />

                                </div>

                            </div>

                        </div>


                        {/* TIPO Y ESTADO */}

                        <div className="data-account-card">

                            <h3>
                                Tipo y estado
                            </h3>


                            <div className="data-account-card-content">


                                <div className="data-account-checkbox">

                                    <label>

                                        Cliente

                                        <input
                                            type="checkbox"
                                            name="is_client"
                                            checked={
                                                account.is_client
                                            }
                                            onChange={
                                                handleAccountChange
                                            }
                                        />

                                    </label>

                                </div>


                                <div className="data-account-checkbox">

                                    <label>

                                        Proveedor

                                        <input
                                            type="checkbox"
                                            name="is_provider"
                                            checked={
                                                account.is_provider
                                            }
                                            onChange={
                                                handleAccountChange
                                            }
                                        />

                                    </label>

                                </div>


                                <div className="data-account-checkbox">

                                    <label>

                                        Deshabilitado

                                        <input
                                            type="checkbox"
                                            name="is_disabled"
                                            checked={
                                                account.is_disabled
                                            }
                                            onChange={
                                                handleAccountChange
                                            }
                                        />

                                    </label>

                                </div>

                            </div>

                        </div>

                    </section>

                </form>

            </div>

        </div>
    );
};

export default DataAccountManager;
