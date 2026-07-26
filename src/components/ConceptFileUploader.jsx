import { useRef, useState } from "react";
import { useData } from "../context/Context";

const ConceptFileUploader = () => {
    const {
        uploadTempArticles,
        processTempConcepts
    } = useData();

    const [parsedConcepts, setParsedConcepts] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploaded, setIsUploaded] = useState(false);

    const fileInputRef = useRef(null);

    const isBusy = isUploading || isProcessing;

    const handleFile = async e => {
        if (isBusy) return;

        const file = e.target.files?.[0];

        if (!file) return;

        const text = await file.text();

        const allLines = text.split(/\r?\n/);

        const headerIndex = allLines.findIndex(
            line => line.startsWith("ITEMS;")
        );

        if (headerIndex === -1) {
            alert("No se encontró la cabecera del archivo CSV.");
            return;
        }

        const lines = allLines.slice(headerIndex + 1);

        const concepts = lines
            .map(line => {
                const cols = line.split(";");

                if (cols.length < 15) return null;

                const code = cols[0].trim();
                const desc = cols[1].trim();

                if (!/^\d+$/.test(code)) return null;

                const listPrices = {};

                for (let listId = 1; listId <= 13; listId++) {
                    const rawPrice = cols[listId + 1]?.trim();

                    if (!rawPrice) continue;

                    listPrices[listId] = Number(
                        rawPrice
                            .replace(/\./g, "")
                            .replace(",", ".")
                    );
                }

                return {
                    code,
                    desc,
                    list_prices: listPrices
                };
            })
            .filter(Boolean);
        
        setIsUploaded(false);
        setParsedConcepts(concepts);
    };

    const handleUpload = async () => {
        if (!parsedConcepts.length || isBusy) return;

        setIsUploading(true);

        try {
            const ok = await uploadTempArticles(parsedConcepts);

            if (ok) {
                setIsUploaded(true);
                alert(`${parsedConcepts.length} conceptos cargados`);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleProcess = async () => {
        if (!parsedConcepts.length || isBusy) return;

        setIsProcessing(true);

        try {
            const result = await processTempConcepts();

            if (!result) return;

            alert(
                `Leídos: ${result.total}\n` +
                `Nuevos: ${result.inserted}\n` +
                `Actualizados: ${result.updated}`
            );

            setParsedConcepts([]);
            setIsUploaded(false);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ border: "1px solid #ccc", padding: "1rem" }}>
            <h3>Importar Mano de Obra F.A.C.R.A.</h3>

            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFile}
                disabled={isBusy}
            />

            <div style={{ marginTop: "1rem" }}>
                <button
                    onClick={handleUpload}
                    disabled={
                        !parsedConcepts.length ||
                        isBusy ||
                        isUploaded
                    }
                >
                    {
                        isUploading
                            ? "⏳ Subiendo..."
                            : isUploaded
                                ? "✅ Subido"
                                : `⬆ Subir (${parsedConcepts.length})`
                    }
                </button>

                <button
                    onClick={handleProcess}
                    disabled={
                        !isUploaded ||
                        isBusy
                    }
                    style={{ marginLeft: "0.5rem" }}
                >
                    {
                        isProcessing
                            ? "⏳ Procesando..."
                            : isUploaded
                                ? `⚙️ Procesar (${parsedConcepts.length})`
                                : "⚙️ Procesar"
                    }
                </button>
            </div>
        </div>
    );
};

export default ConceptFileUploader;