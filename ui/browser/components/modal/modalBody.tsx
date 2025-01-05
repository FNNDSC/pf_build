import React from "react";
import Asciidoctor from "@asciidoctor/core";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow as theme } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ValidationOptions {
    onEdit: () => void;
    canContinue: boolean;
}

interface ModalBodyProps {
    content: string | null;
    contentType: "json" | "asciidoc" | "dialog" | "validation";
    onConfirm?: () => void;
    onCancel?: () => void;
    validationOptions?: ValidationOptions;
}

const ModalBody: React.FC<ModalBodyProps> = ({
    content,
    contentType,
    onConfirm,
    onCancel,
    validationOptions,
}) => {
    const asciidoctor = Asciidoctor();
    const renderedAsciiDoc =
        contentType === "asciidoc" && content
            ? asciidoctor.convert(content, { safe: "safe" })
            : null;

    return (
        <div className={`modal-body ${contentType}`}>
            {contentType === "asciidoc" && renderedAsciiDoc && (
                <div
                    dangerouslySetInnerHTML={{
                        __html: renderedAsciiDoc,
                    }}
                />
            )}
            {contentType === "json" && (
                <SyntaxHighlighter
                    language="json"
                    style={theme}
                    wrapLongLines={true}
                >
                    {content || ""}
                </SyntaxHighlighter>
            )}
            {contentType === "dialog" && (
                <div className="dialog-box">
                    <p className="dialog-text">{content}</p>
                    <div className="dialog-buttons">
                        <button
                            className="dialog-button dialog-yes"
                            onClick={onConfirm}
                        >
                            Yes
                        </button>
                        <button
                            className="dialog-button dialog-no"
                            onClick={onCancel}
                        >
                            No
                        </button>
                    </div>
                </div>
            )}
            {contentType === "validation" && (
                <div className="dialog-box">
                    <p className="dialog-text">{content}</p>
                    <div className="dialog-buttons">
                        <button
                            className="dialog-button dialog-yes"
                            onClick={validationOptions?.onEdit}
                        >
                            Edit
                        </button>
                        <button
                            className="dialog-button dialog-no"
                            onClick={onConfirm}
                            disabled={!validationOptions?.canContinue}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModalBody;
