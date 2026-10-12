import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs;

const formatMoney = (value) =>
    Number(value || 0).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const summaryRow = (label, value) => ({
    columns: [
        {
            text: label,
            color: "#444444"
        },
        {
            text: "$ " + formatMoney(value),
            width: 95,
            alignment: "right"
        }
    ],
    margin: [0, 2, 0, 2]
});

/*
 * Calcula un ancho apropiado para una columna numérica
 * según el valor más grande que aparezca en la tabla.
 *
 * Los límites evitan que una columna numérica crezca
 * indefinidamente y destruya el espacio de Descripción.
 */
const getMoneyColumnWidth = (items, field) => {
    const maxLength = Math.max(
        0,
        ...items.map(item =>
            formatMoney(item[field]).length
        )
    );

    const calculatedWidth = 32 + maxLength * 4.5;

    return Math.min(
        100,
        Math.max(70, calculatedWidth)
    );
};

const getQuantityColumnWidth = (items) => {
    const maxLength = Math.max(
        0,
        ...items.map(item =>
            String(item.quantity ?? "").length
        )
    );

    const calculatedWidth = 25 + maxLength * 5;

    return Math.min(
        55,
        Math.max(40, calculatedWidth)
    );
};

export const buildSalesQuotePdf = ({
    quote,
    items,
    account,
    motor,
    condition,
    taxPosition,
    showPrices,
}) => {

    /*
     * -----------------------------------------
     * ANCHOS DINÁMICOS DE LA TABLA
     * -----------------------------------------
     */

    const quantityWidth = getQuantityColumnWidth(items);

    const priceWidth = getMoneyColumnWidth(
        items,
        "price"
    );

    const totalWidth = getMoneyColumnWidth(
        items,
        "total"
    );

    /*
     * Código mantiene un ancho razonable.
     * Descripción utiliza "*" para ocupar
     * automáticamente todo el espacio restante.
     */
    const tableWidths = showPrices
        ? [
            20,             // #
            80,             // Código
            "*",            // Descripción
            quantityWidth,  // Cant.
            priceWidth,     // Precio
            40,             // IVA
            totalWidth      // Total
        ]
        : [
            20,             // #
            80,             // Código
            "*",            // Descripción
            quantityWidth   // Cant.
        ];

    /*
     * -----------------------------------------
     * CUERPO DE LA TABLA
     * -----------------------------------------
     */

    const tableBody = [
        showPrices
            ? [
                {
                    text: "#",
                    alignment: "center",
                    bold: true,
                    fontSize: 9
                },
                {
                    text: "Código",
                    bold: true,
                    fontSize: 9
                },
                {
                    text: "Descripción",
                    bold: true,
                    fontSize: 9
                },
                {
                    text: "Cant.",
                    alignment: "right",
                    bold: true,
                    fontSize: 9
                },
                {
                    text: "Precio",
                    alignment: "right",
                    bold: true,
                    fontSize: 9
                },
                {
                    text: "IVA",
                    alignment: "right",
                    bold: true,
                    fontSize: 9
                },
                {
                    text: "Total",
                    alignment: "right",
                    bold: true,
                    fontSize: 9
                }
            ]
            : [
                {
                    text: "#",
                    alignment: "center",
                    bold: true,
                    fontSize: 9
                },
                {
                    text: "Código",
                    bold: true,
                    fontSize: 9
                },
                {
                    text: "Descripción",
                    bold: true,
                    fontSize: 9
                },
                {
                    text: "Cant.",
                    alignment: "right",
                    bold: true,
                    fontSize: 9
                }
            ]
    ];

    items.forEach((item, index) => {

        const quantity = item.quantity ?? 0;

        const row = [
            {
                text: String(index + 1),
                alignment: "center",
                fontSize: 9
            },
            {
                text: item.stock_articles?.code || "-",
                fontSize: 9
            },
            {
                text: item.stock_articles?.desc || "-",
                fontSize: 9
            },
            {
                text: String(quantity),
                alignment: "right",
                fontSize: 9
            },
        ];

        if (showPrices) {
            row.push(
                {
                    text: formatMoney(item.price),
                    alignment: "right",
                    fontSize: 9
                },
                {
                    text: `${item.vat_value}%`,
                    alignment: "center",
                    fontSize: 9
                },
                {
                    text: formatMoney(item.total),
                    alignment: "right",
                    bold: true,
                    fontSize: 9
                }
            );
        }

        tableBody.push(row);
    });

    /*
     * -----------------------------------------
     * DEFINICIÓN DEL PDF
     * -----------------------------------------
     */

    const docDefinition = {

        pageSize: "A4",

        pageMargins: [30, 60, 30, 60],

        header: (currentPage, pageCount) => ({
            columns: [
                {
                    width: "85%",
                    text: "¡ESTE COMPROBANTE NO ES VÁLIDO COMO FACTURA!",
                    bold: true,
                    fontSize: 16
                },
                {
                    width: "15%",
                    text: `Página ${currentPage} de ${pageCount}`,
                    alignment: "right",
                    fontSize: 9
                }
            ],
            margin: [30, 20, 30, 0]
        }),

        footer: {
            text: "LOS PRECIOS ESTÁN SUJETOS A VARIACIÓN SIN PREVIO AVISO.",
            bold: true,
            fontSize: 16,
            margin: [30, 0, 30, 20]
        },

        content: [

            {
                text: "RECTISUR S.R.L.",
                bold: true,
                fontSize: 18,
                alignment: "center"
            },

            {
                canvas: [
                    {
                        type: "line",
                        x1: 0,
                        y1: 0,
                        x2: 535,
                        y2: 0,
                        lineWidth: 0.8,
                        lineColor: "#999999"
                    }
                ],
                margin: [0, 15, 0, 15]
            },

            {
                columns: [

                    {
                        text:
                            `Presupuesto ${quote.letter}-${String(quote.point).padStart(4, "0")}-${String(quote.number).padStart(8, "0")}`,
                        bold: true,
                        fontSize: 18
                    },

                    {
                        text:
                            `Fecha: ${new Date(quote.date).toLocaleDateString("es-AR")}`,
                        alignment: "right"
                    }

                ]
            },

            /*
             * -----------------------------------------
             * DATOS DEL CLIENTE
             * -----------------------------------------
             */

            {
                margin: [0, 15, 0, 15],

                columns: [

                    {
                        width: "*",

                        stack: [

                            {
                                columns: [
                                    {
                                        width: "auto",
                                        text: "Cliente:",
                                        bold: true
                                    },
                                    {
                                        text: account?.name || "-"
                                    }
                                ],
                                margin: [0, 0, 0, 8]
                            },

                            {
                                columns: [
                                    {
                                        width: "auto",
                                        text: "Condición Fiscal:",
                                        bold: true
                                    },
                                    {
                                        text: taxPosition?.desc || "-"
                                    }
                                ],
                                margin: [0, 0, 0, 3]
                            },

                            {
                                columns: [
                                    {
                                        width: "auto",
                                        text: "CUIT:",
                                        bold: true
                                    },
                                    {
                                        text: quote.tax_num || "-"
                                    }
                                ]
                            }

                        ]
                    },

                    {
                        width: 20,
                        text: ""
                    },

                    {
                        width: "*",

                        stack: [

                            {
                                columns: [
                                    {
                                        width: "auto",
                                        text: "Condición:",
                                        bold: true
                                    },
                                    {
                                        text: condition?.desc || "-"
                                    }
                                ],
                                margin: [0, 0, 0, 3]
                            },

                            {
                                columns: [
                                    {
                                        width: "auto",
                                        text: "Motor:",
                                        bold: true
                                    },
                                    {
                                        text: motor?.desc || "-"
                                    }
                                ],
                                margin: [0, 0, 0, 3]
                            },

                            {
                                columns: [
                                    {
                                        width: "auto",
                                        text: "Referencia:",
                                        bold: true
                                    },
                                    {
                                        text: quote.reference || "-"
                                    }
                                ],
                                margin: [0, 0, 0, 3]
                            },

                            {
                                columns: [
                                    {
                                        width: "auto",
                                        text: "Orden Compra:",
                                        bold: true
                                    },
                                    {
                                        text: quote.purchace_order_num || "-"
                                    }
                                ]
                            }

                        ]
                    }

                ],

                columnGap: 20
            },

            /*
             * -----------------------------------------
             * TABLA
             * -----------------------------------------
             */

            {
                table: {
                    headerRows: 1,

                    /*
                     * Los anchos de Precio, Total y Cantidad
                     * se calculan según los valores reales.
                     *
                     * Descripción sigue siendo flexible.
                     */
                    widths: tableWidths,

                    body: tableBody
                },

                layout: {

                    fillColor: function (rowIndex) {
                        return rowIndex === 0
                            ? "#eeeeee"
                            : null;
                    },

                    hLineWidth: () => 0.5,

                    vLineWidth: () => 0.5,

                    hLineColor: () => "#cccccc",

                    vLineColor: () => "#cccccc",

                    paddingLeft: () => 4,

                    paddingRight: () => 4,

                    paddingTop: () => 3,

                    paddingBottom: () => 3
                }
            },

            /*
             * -----------------------------------------
             * RESUMEN
             * -----------------------------------------
             */

            {
                unbreakable: true,

                margin: [0, 15, 0, 0],

                stack: [

                    {
                        columns: [
                            {},

                            {
                                width: 300,

                                stack: [

                                    summaryRow(
                                        "Subtotal conceptos",
                                        quote.concept_subtotal
                                    ),

                                    summaryRow(
                                        `Desc. conceptos (${quote.concept_discount || 0}%)`,
                                        -(quote.concept_subtotal || 0) *
                                        (quote.concept_discount || 0) /
                                        100
                                    ),

                                    summaryRow(
                                        "Subtotal artículos",
                                        quote.article_subtotal
                                    ),

                                    summaryRow(
                                        `Desc. artículos (${quote.article_discount || 0}%)`,
                                        -(quote.article_subtotal || 0) *
                                        (quote.article_discount || 0) /
                                        100
                                    ),

                                    summaryRow(
                                        `Desc. general (${quote.general_discount || 0}%)`,
                                        -(
                                            (
                                                (quote.article_subtotal || 0) +
                                                (quote.article_subtotal || 0) *
                                                (quote.article_discount || 0) /
                                                100 +
                                                (quote.concept_subtotal || 0) +
                                                (quote.concept_subtotal || 0) *
                                                (quote.concept_discount || 0) /
                                                100
                                            ) *
                                            (quote.general_discount || 0) /
                                            100
                                        )
                                    ),

                                    summaryRow(
                                        `Recargo general (${quote.general_recharge || 0}%)`,
                                        (
                                            (
                                                (quote.article_subtotal || 0) *
                                                (quote.article_discount || 0) /
                                                100 +
                                                (quote.concept_subtotal || 0) *
                                                (quote.concept_discount || 0) /
                                                100
                                            ) *
                                            (quote.general_recharge || 0) /
                                            100
                                        )
                                    ),

                                    {
                                        canvas: [
                                            {
                                                type: "line",
                                                x1: 0,
                                                y1: 0,
                                                x2: 300,
                                                y2: 0,
                                                lineWidth: 0.5,
                                                color: "#BBBBBB"
                                            }
                                        ],
                                        margin: [0, 8, 0, 8]
                                    },

                                    summaryRow(
                                        "Subtotal General",
                                        quote.general_subtotal
                                    ),

                                    quote.general_vat > 0
                                        ? summaryRow(
                                            "IVA",
                                            quote.general_vat
                                        )
                                        : {},

                                    {
                                        canvas: [
                                            {
                                                type: "line",
                                                x1: 0,
                                                y1: 0,
                                                x2: 300,
                                                y2: 0,
                                                lineWidth: 1,
                                                color: "#444444"
                                            }
                                        ],
                                        margin: [0, 8, 0, 8]
                                    },

                                    {
                                        columns: [

                                            {
                                                text: "TOTAL",
                                                bold: true,
                                                fontSize: 14
                                            },

                                            {
                                                text:
                                                    "$ " +
                                                    formatMoney(quote.total),
                                                bold: true,
                                                fontSize: 14,
                                                alignment: "right"
                                            }

                                        ]
                                    }

                                ]
                            }
                        ]
                    }

                ]
            },

            /*
             * -----------------------------------------
             * OBSERVACIONES / LEYENDAS
             * -----------------------------------------
             */

            {
                unbreakable: true,

                stack: [
                    {
                        canvas: [
                            {
                                type: "line",
                                x1: 0,
                                y1: 0,
                                x2: 535,
                                y2: 0,
                                lineWidth: 0.8,
                                lineColor: "#999999"
                            }
                        ],
                        margin: [0, 15, 0, 15]
                    },
                    {
                        text:
                            "TODO REPUESTO A COLOCAR O TRABAJO A REALIZAR QUE NO FIGURE EN EL PRESENTE PRESUPUESTO, SE COBRARA POR SEPARADO.",
                        bold: true,
                        fontSize: 13
                    }
                ]
            }

        ]
    };

    pdfMake.createPdf(docDefinition).download(
        `presupuesto-${quote.id}.pdf`
    );
};
