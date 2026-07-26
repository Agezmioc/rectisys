import { useRef, useState } from "react";
import { useData } from "../context/Context";

const ArticleFileUploader = () => {

    const {
        uploadTempArticles,
        processTempArticles
    } = useData();

    const [parsedArticles, setParsedArticles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploaded, setIsUploaded] = useState(false);

    const fileInputRef = useRef(null);
    const isBusy = isUploading || isProcessing;

    const handleFile = (e) => {
        if (isBusy) return;

        const file = e.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = event => {
            parseFile(event.target.result);
        };

        reader.readAsText(file);
    };

    const parseFile = (text) => {

        const lines = text.split(/\r?\n/);

        const records = lines
            .map(line => {

                if (!line.trim()) return null;

                const code =
                    line.substring(0, 15).trim();

                const measure =
                    line.substring(11, 15).trim();

                const desc =
                    line.substring(15, 56).trim();

                const rawPrice =
                    line.substring(56).trim();

                const normalizedPrice =
                    Number(
                        rawPrice
                            .replace(/\./g, "")
                            .replace(",", ".")
                    );

                return {
                    code,
                    measure,
                    desc,
                    price: normalizedPrice
                };
            })
            .filter(Boolean);
        
        setIsUploaded(false);
        setParsedArticles(records);

        console.log(records);
    };

    const handleUpload = async () => {

        if (
            !parsedArticles.length ||
            isBusy ||
            isUploaded
        ) {
            return;
        }

        setIsUploading(true);

        try {

            const ok =
                await uploadTempArticles(
                    parsedArticles
                );

            if (ok) {

                setIsUploaded(true);

                alert(
                    `${parsedArticles.length} registros cargados`
                );
            }

        } finally {

            setIsUploading(false);
        }
    };

    const handleProcess = async () => {

        if (!isUploaded || isBusy) {
            return;
        }

        setIsProcessing(true);

        try {

            const result =
                await processTempArticles();

            if (!result) return;

            alert(
`Total leídos: ${result.total}

Nuevos: ${result.inserted}

Actualizados: ${result.updated}`
            );

            resetUploader();

        } finally {

            setIsProcessing(false);
        }
    };

    const resetUploader = () => {

        setParsedArticles([]);
        setIsUploaded(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div
            style={{
                border: "1px solid #ccc",
                padding: "1rem"
            }}
        >
            <h3>Importar artículos MST</h3>

            <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.mst"
                onChange={handleFile}
                disabled={isBusy}
            />

            <div style={{ marginTop: "1rem" }}>

                <button
                    onClick={handleUpload}
                    disabled={
                        !parsedArticles.length ||
                        isBusy ||
                        isUploaded
                    }
                >
                    {
                        isUploading
                            ? "⏳ Subiendo..."
                            : isUploaded
                                ? "✅ Subido"
                                : `⬆ Subir (${parsedArticles.length})`
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
                                ? `⚙ Process (${parsedArticles.length})`
                                : "⚙ Process"
                    }
                </button>

            </div>
        </div>
    );
};

export default ArticleFileUploader;