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

export const buildSalesQuotePdf = ({
    quote,
    items,
    account,
    motor,
    condition,
    taxPosition,
    showPrices,
}) => {
    const tableBody = [
        showPrices
            ? [
                { text: "#", alignment: "center", bold: true },
                { text: "Código", bold: true },
                { text: "Descripción", bold: true },
                { text: "Cant.", alignment: "right", bold: true },
                { text: "Precio", alignment: "right", bold: true },
                { text: "IVA", alignment: "right", bold: true },
                { text: "Total", alignment: "right", bold: true }
            ]
            : [
                { text: "#", alignment: "center", bold: true },
                { text: "Código", bold: true },
                { text: "Descripción", bold: true },
                { text: "Cant.", alignment: "right", bold: true }
            ]
    ];

    items.forEach((item, index) => {

        const row = [
            {
                text: String(index + 1),
                alignment: "center"
            },
            {
                text: item.stock_articles?.code || "-"
            },
            {
                text: item.stock_articles?.desc || "-"
            },
            {
                text: item.quantity.toString(),
                alignment: "right"
            },
        ];

        if (showPrices) {
            row.push(
                {
                    text: formatMoney(item.price),
                    alignment: "right"
                },
                {
                    text: `${item.vat_value}%`,
                    alignment: "center"
                },
                {
                    text: formatMoney(item.total),
                    alignment: "right",
                    bold: true
                }
            );
        }

        tableBody.push(row);
    });

    const docDefinition = {

        pageSize: "A4",

        pageMargins: [30,30,30,30],

        content: [
            {
                text: "¡ESTE COMPROBANTE NO ES VÁLIDO COMO FACTURA!",
                bold: true,
                fontSize: 13
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
                text: "RECTISUR S.R.L.",
                bold: true,
                fontSize: 18,
                alignment: 'center'
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
                            `Presupuesto ${quote.letter}-${String(quote.point).padStart(4,"0")}-${String(quote.number).padStart(8,"0")}`,
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

            // acá irán las tarjetas del cliente
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

            // acá irá la tabla
            {
                table: {
                    headerRows: 1,
                    widths: showPrices
                        ? [20, 95, "*", 35, 65, 35, 70]
                        : [20, 95, "*", 35],
                    body: tableBody
                },

                layout: {
                    fillColor: function (rowIndex) {
                        return rowIndex === 0 ? "#eeeeee" : null;
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

            // acá el resumen
            {
                margin: [0, 15, 0, 0],

                stack: [

                    {
                        columns: [
                            {},
                            {
                                width: 300,

                                stack: [

                                    summaryRow("Subtotal conceptos", quote.concept_subtotal),

                                    summaryRow(
                                        `Desc. conceptos (${quote.concept_discount || 0}%)`,
                                        -(quote.concept_subtotal || 0) * (quote.concept_discount || 0) / 100
                                    ),

                                    summaryRow("Subtotal artículos", quote.article_subtotal),

                                    summaryRow(
                                        `Desc. artículos (${quote.article_discount || 0}%)`,
                                        -(quote.article_subtotal || 0) * (quote.article_discount || 0) / 100
                                    ),

                                    summaryRow(
                                        `Desc. general (${quote.general_discount || 0}%)`,
                                        -(
                                            (
                                                (quote.article_subtotal || 0) * (quote.article_discount || 0) / 100 +
                                                (quote.concept_subtotal || 0) * (quote.concept_discount || 0) / 100
                                            ) *
                                            (quote.general_discount || 0) / 100
                                        )
                                    ),

                                    summaryRow(
                                        `Recargo general (${quote.general_recharge || 0}%)`,
                                        (
                                            (
                                                (quote.article_subtotal || 0) * (quote.article_discount || 0) / 100 +
                                                (quote.concept_subtotal || 0) * (quote.concept_discount || 0) / 100
                                            ) *
                                            (quote.general_recharge || 0) / 100
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

                                    summaryRow("Subtotal General", quote.general_subtotal),

                                    quote.general_vat > 0
                                        ? summaryRow("IVA", quote.general_vat)
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
                                                text: "$ " + formatMoney(quote.total),
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
                text: "LOS PRECIOS ESTÁN SUJETOS A VARIACIÓN SIN PREVIO AVISO.",
                bold: true,
                fontSize: 13
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
                text: "TODO REPUESTO A COLOCAR O TRABAJO A REALIZAR QUE NO FIGURE EN EL PRESENTE PRESUPUESTO, SE COBRARA POR SEPARADO.",
                bold: true,
                fontSize: 13
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

        ]

    };

    pdfMake.createPdf(docDefinition).download(
        `presupuesto-${quote.id}.pdf`
    );
};