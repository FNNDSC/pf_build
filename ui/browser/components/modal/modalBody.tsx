import React from "react";
import Asciidoctor from "@asciidoctor/core";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow as theme } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ModalBodyProps {
    content: string | null;
    contentType: "json" | "asciidoc" | "dialog";
}

const ModalBody: React.FC<ModalBodyProps> = ({ content, contentType }) => {
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
                        <button className="dialog-button dialog-yes">
                            Yes
                        </button>
                        <button className="dialog-button dialog-no">No</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModalBody;
