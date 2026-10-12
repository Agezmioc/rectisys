import { useEffect } from "react";
import { useData } from "../context/Context";
import "./DataAccountDetail.css";

const DataAccountDetail = ({
    account,
    onBack,
    onEdit,
    onNew
}) => {

    const {
        dataTaxPositions,
        getDataTaxPositions,
        deleteDataAccount
    } = useData();


    /*
     * CARGAR POSICIONES IMPOSITIVAS
     */

    useEffect(() => {

        if (!dataTaxPositions?.length) {
            getDataTaxPositions();
        }

    }, []);


    /*
     * DATOS RELACIONADOS
     */

    const getTaxPositionDescription = (taxPositionId) => {

        const position = dataTaxPositions?.find(
            position =>
                Number(position.id) ===
                Number(taxPositionId)
        );

        return position?.desc || "-";
    };


    /*
     * ACCIONES
     */

    const handleDelete = async () => {

        if (!account?.id) {
            return;
        }


        const confirmed = window.confirm(
            `¿Está seguro de eliminar la cuenta "${account.name || account.id}"?`
        );


        if (!confirmed) {
            return;
        }


        const deleted = await deleteDataAccount(account.id);

        if (!deleted) {
            window.alert(
                "No se puede eliminar esta cuenta porque está siendo utilizada en otro registro."
            );
            return;
        }

        onBack?.();
    };


    if (!account) {

        return (
            <div className="data-account-detail">

                <p>
                    No se encontró la cuenta.
                </p>

                <button onClick={onBack}>
                    ← Volver
                </button>

            </div>
        );
    }


    return (
        <div className="data-account-detail">

            {/* HEADER */}

            <header className="data-account-detail-header">

                <div className="data-account-detail-topbar">

                    <button onClick={onBack}>
                        ← Volver
                    </button>

                    <div className="data-account-detail-actions">

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


                <h2 className="data-account-detail-title">
                    {account.name || "Cuenta"}
                </h2>

            </header>


            {/* BODY */}

            <section className="data-account-detail-body">

                <div className="data-account-detail-grid">


                    {/* INFORMACIÓN GENERAL */}

                    <div className="data-account-card">

                        <h3>
                            Información general
                        </h3>

                        <div className="data-account-fields-grid">

                            <div className="data-account-field">

                                <b>ID:</b>

                                <span>
                                    {account.id}
                                </span>

                            </div>


                            <div className="data-account-field">

                                <b>Código:</b>

                                <span>
                                    {account.code || "-"}
                                </span>

                            </div>


                            <div className="data-account-field">

                                <b>Nombre:</b>

                                <span>
                                    {account.name || "-"}
                                </span>

                            </div>

                        </div>

                    </div>


                    {/* CONTACTO Y DOMICILIO */}

                    <div className="data-account-card">

                        <h3>
                            Contacto y domicilio
                        </h3>

                        <div className="data-account-fields-grid">

                            <div className="data-account-field">

                                <b>Dirección:</b>

                                <span>
                                    {account.address || "-"}
                                </span>

                            </div>


                            <div className="data-account-field">

                                <b>Distrito:</b>

                                <span>
                                    {account.district || "-"}
                                </span>

                            </div>


                            <div className="data-account-field">

                                <b>Localidad:</b>

                                <span>
                                    {account.localy || "-"}
                                </span>

                            </div>


                            <div className="data-account-field">

                                <b>Teléfono:</b>

                                <span>
                                    {account.phone_num || "-"}
                                </span>

                            </div>

                            <div className="data-account-field">

                                <b>Email:</b>

                                <span>
                                    {account.email || "-"}
                                </span>

                            </div>

                        </div>

                    </div>


                    {/* INFORMACIÓN FISCAL */}

                    <div className="data-account-card">

                        <h3>
                            Información fiscal
                        </h3>

                        <div className="data-account-fields-grid">

                            <div className="data-account-field">

                                <b>Posición impositiva:</b>

                                <span>
                                    {getTaxPositionDescription(
                                        account.tax_position_id
                                    )}
                                </span>

                            </div>


                            <div className="data-account-field">

                                <b>Nº fiscal:</b>

                                <span>
                                    {account.tax_num || "-"}
                                </span>

                            </div>


                            <div className="data-account-field">

                                <b>Nº fiscal 2:</b>

                                <span>
                                    {account.tax_num_2 || "-"}
                                </span>

                            </div>


                            <div className="data-account-field">

                                <b>Ingresos brutos:</b>

                                <span>
                                    {account.balance || "-"}
                                </span>

                            </div>


                            <div className="data-account-field">

                                <b>Descuento:</b>

                                <span>
                                    {account.discount != null
                                        ? `${Number(account.discount).toLocaleString(
                                            "es-AR",
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            }
                                        )}%`
                                        : "-"
                                    }
                                </span>

                            </div>

                        </div>

                    </div>


                    {/* ESTADO */}

                    <div className="data-account-card">

                        <h3>
                            Estado y tipo
                        </h3>

                        <div className="data-account-fields-grid">

                            <div className="data-account-field">

                                <b>Cliente:</b>

                                <span>
                                    {account.is_client
                                        ? "Sí"
                                        : "No"
                                    }
                                </span>

                            </div>


                            <div className="data-account-field">

                                <b>Proveedor:</b>

                                <span>
                                    {account.is_provider
                                        ? "Sí"
                                        : "No"
                                    }
                                </span>

                            </div>


                            <div className="data-account-field">

                                <b>Deshabilitado:</b>

                                <span>
                                    {account.is_disabled
                                        ? "Sí"
                                        : "No"
                                    }
                                </span>

                            </div>

                        </div>

                    </div>


                    {/* INFORMACIÓN DEL SISTEMA */}

                    <div className="data-account-card">

                        <h3>
                            Información del sistema
                        </h3>

                        <div className="data-account-fields-grid">

                            <div className="data-account-field">

                                <b>Creado:</b>

                                <span>
                                    {account.created_at
                                        ? new Date(
                                            account.created_at
                                        ).toLocaleString("es-AR")
                                        : "-"
                                    }
                                </span>

                            </div>


                            <div className="data-account-field">

                                <b>Actualizado:</b>

                                <span>
                                    {account.updated_at
                                        ? new Date(
                                            account.updated_at
                                        ).toLocaleString("es-AR")
                                        : "-"
                                    }
                                </span>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

        </div>
    );
};

export default DataAccountDetail;