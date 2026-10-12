
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

/*
 * Agrupa los items por sección.
 *
 * Se utiliza sales_sections.order para determinar
 * el orden de las secciones.
 *
 * Dentro de cada sección se conserva el orden
 * original de los items.
 */
const groupItemsBySection = (items) => {
    const groups = new Map();

    items.forEach((item, index) => {
        const sectionId =
            item.sales_section_id ??
            item.sales_sections?.id ??
            null;

        const sectionName =
            item.sales_sections?.name ||
            "Sin sección";

        const sectionOrder =
            Number(item.sales_sections?.order) || 0;

        if (!groups.has(sectionId)) {
            groups.set(sectionId, {
                id: sectionId,
                name: sectionName,
                order: sectionOrder,
                items: []
            });
        }

        groups.get(sectionId).items.push({
            ...item,
            originalIndex: index
        });
    });

    return Array.from(groups.values())
        .sort((a, b) => {
            if (a.order !== b.order) {
                return a.order - b.order;
            }

            return a.items[0].originalIndex -
                b.items[0].originalIndex;
        });
};

export const buildSalesOrderPdf = ({
    order,
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

    const quantityWidth =
        getQuantityColumnWidth(items);

    const priceWidth =
        getMoneyColumnWidth(items, "price");

    const totalWidth =
        getMoneyColumnWidth(items, "total");

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
     * AGRUPACIÓN POR SECCIÓN
     * -----------------------------------------
     */

    const sections = groupItemsBySection(items);

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

    /*
     * Número global de ítem.
     */
    let itemNumber = 1;

    sections.forEach(section => {

        /*
         * -----------------------------------------
         * FILA DE SECCIÓN
         * -----------------------------------------
         *
         * La fila ocupa toda la tabla mediante
         * colSpan.
         */

        const sectionRow = [
            {
                text: section.name,
                bold: true,
                fontSize: 9,
                color: "#333333",
                colSpan: showPrices ? 7 : 4,
                margin: [4, 3, 4, 3]
            }
        ];

        /*
         * pdfMake necesita una celda vacía para
         * cada columna cubierta por colSpan.
         */
        for (
            let i = 1;
            i < (showPrices ? 7 : 4);
            i++
        ) {
            sectionRow.push({});
        }

        tableBody.push(sectionRow);

        /*
         * -----------------------------------------
         * ITEMS DE LA SECCIÓN
         * -----------------------------------------
         */

        section.items.forEach(item => {

            const quantity = item.quantity ?? 0;

            const row = [
                {
                    text: String(itemNumber),
                    alignment: "center",
                    fontSize: 9
                },
                {
                    text:
                        item.stock_articles?.code || "-",
                    fontSize: 9
                },
                {
                    text:
                        item.stock_articles?.desc || "-",
                    fontSize: 9
                },
                {
                    text: String(quantity),
                    alignment: "right",
                    fontSize: 9
                }
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

            itemNumber++;
        });
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
                            `Orden de Trabajo ${order.letter}-${String(order.point).padStart(4, "0")}-${String(order.number).padStart(8, "0")}`,
                        bold: true,
                        fontSize: 18
                    },

                    {
                        text:
                            `Fecha: ${new Date(order.date).toLocaleDateString("es-AR")}`,
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
                                        text:
                                            account?.name || "-"
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
                                        text:
                                            taxPosition?.desc || "-"
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
                                        text:
                                            order.tax_num || "-"
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
                                        text:
                                            condition?.desc || "-"
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
                                        text:
                                            motor?.desc || "-"
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
                                        text:
                                            order.reference || "-"
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
                                        text:
                                            order.purchace_order_num || "-"
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

                    /*
                     * Solamente la primera fila es el
                     * encabezado real.
                     *
                     * pdfMake lo repetirá automáticamente
                     * cuando la tabla pase a otra página.
                     */
                    headerRows: 1,

                    widths: tableWidths,

                    body: tableBody
                },

                layout: {

                    fillColor: function (rowIndex) {

                        /*
                         * Encabezado.
                         */
                        if (rowIndex === 0) {
                            return "#eeeeee";
                        }

                        /*
                         * Filas de sección.
                         *
                         * Detectamos la fila por el hecho
                         * de que la primera celda tiene
                         * colSpan.
                         */
                        const row = tableBody[rowIndex];

                        if (
                            row?.[0]?.colSpan
                        ) {
                            return "#f5f5f5";
                        }

                        return null;
                    },

                    hLineWidth: function (
                        i,
                        node
                    ) {

                        /*
                         * Línea ligeramente más marcada
                         * antes de cada sección.
                         */
                        if (i > 1) {

                            const previousRow =
                                node.table.body[i - 1];

                            if (
                                previousRow?.[0]?.colSpan
                            ) {
                                return 0.8;
                            }
                        }

                        return 0.5;
                    },

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
                                        order.concept_subtotal
                                    ),

                                    summaryRow(
                                        `Desc. conceptos (${order.concept_discount || 0}%)`,
                                        -(order.concept_subtotal || 0) *
                                        (order.concept_discount || 0) /
                                        100
                                    ),

                                    summaryRow(
                                        "Subtotal artículos",
                                        order.article_subtotal
                                    ),

                                    summaryRow(
                                        `Desc. artículos (${order.article_discount || 0}%)`,
                                        -(order.article_subtotal || 0) *
                                        (order.article_discount || 0) /
                                        100
                                    ),

                                    summaryRow(
                                        `Desc. general (${order.general_discount || 0}%)`,
                                        -(
                                            (
                                                (order.article_subtotal || 0) +
                                                (order.article_subtotal || 0) *
                                                (order.article_discount || 0) /
                                                100 +
                                                (order.concept_subtotal || 0) +
                                                (order.concept_subtotal || 0) *
                                                (order.concept_discount || 0) /
                                                100
                                            ) *
                                            (order.general_discount || 0) /
                                            100
                                        )
                                    ),

                                    summaryRow(
                                        `Recargo general (${order.general_recharge || 0}%)`,
                                        (
                                            (
                                                (order.article_subtotal || 0) *
                                                (order.article_discount || 0) /
                                                100 +
                                                (order.concept_subtotal || 0) *
                                                (order.concept_discount || 0) /
                                                100
                                            ) *
                                            (order.general_recharge || 0) /
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
                                        order.general_subtotal
                                    ),

                                    order.general_vat > 0
                                        ? summaryRow(
                                            "IVA",
                                            order.general_vat
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
                                                    formatMoney(
                                                        order.total
                                                    ),
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
        `ordenDeTrabajo-${order.id}.pdf`
    );
};
